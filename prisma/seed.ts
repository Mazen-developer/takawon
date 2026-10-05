import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import fs from "node:fs";
import path from "node:path";

const db = new PrismaClient();
const hash = (p: string) => bcrypt.hashSync(p, 10);

async function main() {
  await db.setting.upsert({ where: { key: "commissionBps" }, update: {}, create: { key: "commissionBps", value: "2000" } });
  const mk = (email: string, name: string, role: "ADMIN" | "SELLER" | "BUYER") =>
    db.user.upsert({ where: { email }, update: {}, create: { email, name, role, passwordHash: hash("password123") } });
  await mk("admin@blok.test", "مدير المنصة", "ADMIN");
  await mk("buyer@blok.test", "مشتري تجريبي", "BUYER");
  const salma = await mk("salma@blok.test", "سلمى", "SELLER");
  const yousef = await mk("yousef@blok.test", "يوسف", "SELLER");

  if ((await db.asset.count()) > 0) return;
  const demo = [
    { t: "أريكة ثلاثية مودرن", c: "أثاث", p: 1800, f: "rvt", s: salma.id, tags: ["غرفة معيشة", "مودرن"] },
    { t: "ثريا معلقة دائرية", c: "إضاءة", p: 1200, f: "max", s: yousef.id, tags: ["إضاءة", "ديكور"] },
    { t: "خامة رخام كرارا", c: "خامات", p: 600, f: "blend", s: salma.id, tags: ["رخام", "pbr"] },
    { t: "نبتة فيكس في أصيص", c: "نباتات وديكور", p: 500, f: "glb", s: yousef.id, tags: ["نباتات"] },
  ];
  for (const d of demo) {
    const a = await db.asset.create({ data: { title: d.t, description: "ملف تجريبي لاختبار تدفق الشراء والتحميل.", category: d.c, tags: d.tags, priceCents: d.p, status: "APPROVED", sellerId: d.s } });
    const rel = path.join(a.id, `demo.${d.f}`);
    fs.mkdirSync(path.join(process.cwd(), "storage/private", a.id), { recursive: true });
    fs.writeFileSync(path.join(process.cwd(), "storage/private", rel), "placeholder file for demo");
    await db.assetFile.create({ data: { assetId: a.id, format: d.f.toUpperCase(), originalName: `${d.t}.${d.f}`, path: rel, sizeBytes: 25 } });
  }
}
main().finally(() => db.$disconnect());
