import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export type Role = "BUYER" | "SELLER" | "ADMIN";
export type Session = { uid: string; role: Role; name: string };
const key = () => new TextEncoder().encode(process.env.AUTH_SECRET!);

// remember=true: the browser keeps the login for 30 days. remember=false: cleared when the browser closes.
export async function createSession(s: Session, remember = true) {
  const token = await new SignJWT({ ...s }).setProtectedHeader({ alg: "HS256" }).setExpirationTime(remember ? "30d" : "1d").sign(key());
  cookies().set("session", token, {
    httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/",
    ...(remember ? { maxAge: 60 * 60 * 24 * 30 } : {}),
  });
}
// Only allow same-site relative paths to avoid open redirects.
export const safeNext = (v: unknown) => {
  const s = String(v ?? "");
  return s.startsWith("/") && !s.startsWith("//") && !s.includes("\\") ? s : null;
};
export async function getSession(): Promise<Session | null> {
  const t = cookies().get("session")?.value;
  if (!t) return null;
  try { return (await jwtVerify(t, key())).payload as unknown as Session; } catch { return null; }
}
export async function requireRole(...roles: Role[]) {
  const s = await getSession();
  if (!s) redirect("/login");
  if (roles.length && !roles.includes(s.role)) redirect("/");
  return s;
}
