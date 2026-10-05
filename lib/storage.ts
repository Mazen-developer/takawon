import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

// Local-disk storage for development. In production swap these two functions
// for S3/R2 (private bucket for files + signed URLs, public bucket for previews).
const PRIVATE = path.join(process.cwd(), "storage", "private");
const PUBLIC = path.join(process.cwd(), "public", "uploads");

export async function savePrivate(assetId: string, file: File, ext: string) {
  const dir = path.join(PRIVATE, assetId);
  await fs.mkdir(dir, { recursive: true });
  const rel = path.join(assetId, `${randomUUID()}.${ext}`);
  await fs.writeFile(path.join(PRIVATE, rel), Buffer.from(await file.arrayBuffer()));
  return rel;
}
export const privatePath = (rel: string) => path.join(PRIVATE, path.normalize(rel).replace(/^(\.\.(\/|\\|$))+/, ""));

export async function savePreview(assetId: string, file: File) {
  const ext = (file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : file.type === "image/jpeg" ? "jpg" : "");
  if (!ext) return null;
  await fs.mkdir(PUBLIC, { recursive: true });
  const name = `${assetId}.${ext}`;
  await fs.writeFile(path.join(PUBLIC, name), Buffer.from(await file.arrayBuffer()));
  return `/uploads/${name}`;
}
