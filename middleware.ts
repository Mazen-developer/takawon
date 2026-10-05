import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

export async function middleware(req: NextRequest) {
  const p = req.nextUrl.pathname;
  let role: string | null = null;
  try {
    const t = req.cookies.get("session")?.value;
    if (t) role = (await jwtVerify(t, new TextEncoder().encode(process.env.AUTH_SECRET!))).payload.role as string;
  } catch {}
  const deny = (to: string) => NextResponse.redirect(new URL(to, req.url));
  if (!role) return deny(`/login?next=${encodeURIComponent(p)}`);
  if (p.startsWith("/admin") && role !== "ADMIN") return deny("/");
  if (p.startsWith("/seller") && role !== "SELLER" && role !== "ADMIN") return deny("/");
  return NextResponse.next();
}
export const config = { matcher: ["/admin/:path*", "/seller/:path*", "/library/:path*"] };
