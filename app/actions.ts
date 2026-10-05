"use server";
import bcrypt from "bcryptjs";
import path from "node:path";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { createSession, getSession, requireRole, safeNext } from "@/lib/auth";
import { charge } from "@/lib/payments";
import { commissionBps, sellerBalance } from "@/lib/stats";
import { FORMATS, MAX_FILE_BYTES } from "@/lib/constants";
import { savePrivate, savePreview } from "@/lib/storage";

const str = (v: FormDataEntryValue | null) => String(v ?? "").trim();

export async function register(fd: FormData) {
  const email = str(fd.get("email")).toLowerCase(), name = str(fd.get("name")), pw = str(fd.get("password"));
  const role = fd.get("role") === "SELLER" ? "SELLER" : "BUYER";
  const next = safeNext(fd.get("next")), q = next ? `&next=${encodeURIComponent(next)}` : "";
  if (!email.includes("@") || !name || pw.length < 8) redirect(`/register?error=data${q}`);
  if (await db.user.findUnique({ where: { email } })) redirect(`/register?error=exists${q}`);
  const u = await db.user.create({ data: { email, name, role, passwordHash: await bcrypt.hash(pw, 10) } });
  await createSession({ uid: u.id, role: u.role, name: u.name }, true);
  redirect(next ?? (role === "SELLER" ? "/seller" : "/"));
}

export async function login(fd: FormData) {
  const next = safeNext(fd.get("next"));
  const u = await db.user.findUnique({ where: { email: str(fd.get("email")).toLowerCase() } });
  if (!u || !(await bcrypt.compare(str(fd.get("password")), u.passwordHash)))
    redirect(`/login?error=1${next ? `&next=${encodeURIComponent(next)}` : ""}`);
  await createSession({ uid: u.id, role: u.role, name: u.name }, fd.get("remember") === "on");
  redirect(next ?? (u.role === "ADMIN" ? "/admin" : u.role === "SELLER" ? "/seller" : "/"));
}

export async function logout() {
  cookies().delete("session");
  redirect("/");
}

export async function buyAsset(fd: FormData) {
  const id = str(fd.get("assetId"));
  const s = await getSession();
  if (!s) redirect(`/login?next=${encodeURIComponent(`/asset/${id}`)}`);
  const asset = await db.asset.findFirst({ where: { id, status: "APPROVED" } });
  if (!asset || asset.sellerId === s.uid) redirect(`/asset/${id}`);
  const owned = await db.orderItem.findFirst({ where: { assetId: id, order: { buyerId: s.uid } } });
  if (owned) redirect("/library");
  const pay = await charge({ userId: s.uid, amountCents: asset.priceCents });
  if (!pay.ok) redirect(`/asset/${id}?error=payment`);
  const bps = await commissionBps();
  const fee = Math.round((asset.priceCents * bps) / 10000);
  await db.order.create({
    data: {
      buyerId: s.uid, totalCents: asset.priceCents,
      items: { create: { assetId: id, sellerId: asset.sellerId, priceCents: asset.priceCents, commissionBps: bps, sellerCents: asset.priceCents - fee } },
    },
  });
  redirect("/library");
}

export async function uploadAsset(fd: FormData) {
  const s = await requireRole("SELLER", "ADMIN");
  const title = str(fd.get("title")), description = str(fd.get("description")), category = str(fd.get("category"));
  const priceCents = Math.round(Number(fd.get("price")) * 100);
  const tags = str(fd.get("tags")).split(/[,،]/).map((t) => t.trim().toLowerCase()).filter(Boolean).slice(0, 10);
  const files = (fd.getAll("files") as File[]).filter((f) => f && f.size > 0);
  const valid = files.filter((f) => FORMATS[path.extname(f.name).slice(1).toLowerCase()] && f.size <= MAX_FILE_BYTES);
  if (!title || !(priceCents > 0) || !valid.length) redirect("/seller/new?error=data");

  const asset = await db.asset.create({ data: { title, description, category, tags, priceCents, sellerId: s.uid } });
  for (const f of valid) {
    const ext = path.extname(f.name).slice(1).toLowerCase();
    const rel = await savePrivate(asset.id, f, ext);
    await db.assetFile.create({ data: { assetId: asset.id, format: FORMATS[ext], originalName: f.name.slice(0, 120), path: rel, sizeBytes: f.size } });
  }
  const preview = fd.get("preview") as File | null;
  if (preview && preview.size > 0 && preview.size < 8 * 1024 * 1024) {
    const p = await savePreview(asset.id, preview);
    if (p) await db.asset.update({ where: { id: asset.id }, data: { previewPath: p } });
  }
  redirect("/seller");
}

export async function reviewAsset(fd: FormData) {
  await requireRole("ADMIN");
  const status = fd.get("decision") === "approve" ? "APPROVED" : "REJECTED";
  await db.asset.update({ where: { id: str(fd.get("id")) }, data: { status } });
  revalidatePath("/admin");
}

export async function setCommission(fd: FormData) {
  await requireRole("ADMIN");
  const pct = Number(fd.get("percent"));
  if (!(pct >= 0 && pct <= 60)) redirect("/admin?error=rate");
  const value = String(Math.round(pct * 100));
  await db.setting.upsert({ where: { key: "commissionBps" }, update: { value }, create: { key: "commissionBps", value } });
  revalidatePath("/admin");
}

export async function payoutSeller(fd: FormData) {
  await requireRole("ADMIN");
  const sellerId = str(fd.get("sellerId"));
  const { due } = await sellerBalance(sellerId);
  if (due > 0) await db.payout.create({ data: { sellerId, amountCents: due } });
  revalidatePath("/admin");
}
