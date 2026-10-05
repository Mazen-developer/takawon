import fs from "node:fs";
import { Readable } from "node:stream";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { privatePath } from "@/lib/storage";

export const runtime = "nodejs";

export async function GET(_: Request, { params }: { params: { fileId: string } }) {
  const s = await getSession();
  if (!s) return new NextResponse("Unauthorized", { status: 401 });
  const file = await db.assetFile.findUnique({ where: { id: params.fileId }, include: { asset: true } });
  if (!file) return new NextResponse("Not found", { status: 404 });
  const allowed =
    s.role === "ADMIN" || file.asset.sellerId === s.uid ||
    !!(await db.orderItem.findFirst({ where: { assetId: file.assetId, order: { buyerId: s.uid } } }));
  if (!allowed) return new NextResponse("Forbidden", { status: 403 });
  const full = privatePath(file.path);
  if (!fs.existsSync(full)) return new NextResponse("File missing", { status: 404 });
  await db.asset.update({ where: { id: file.assetId }, data: { downloads: { increment: 1 } } });
  const stream = Readable.toWeb(fs.createReadStream(full)) as ReadableStream;
  return new NextResponse(stream, {
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Length": String(file.sizeBytes),
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(file.originalName)}`,
    },
  });
}
