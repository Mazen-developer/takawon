import type { Metadata } from "next";
import Link from "next/link";
import { IBM_Plex_Sans_Arabic, Reem_Kufi } from "next/font/google";
import { getSession } from "@/lib/auth";
import { logout } from "./actions";
import "./globals.css";

const body = IBM_Plex_Sans_Arabic({ subsets: ["arabic", "latin"], weight: ["400", "500", "600"], variable: "--font-body" });
const display = Reem_Kufi({ subsets: ["arabic", "latin"], weight: ["500", "700"], variable: "--font-display" });
export const metadata: Metadata = { title: "بلوك | سوق البلوكات والنماذج المعمارية" };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const s = await getSession();
  return (
    <html lang="ar" dir="rtl" className={`${body.variable} ${display.variable}`}>
      <body>
        <header><div className="wrap top">
          <Link href="/" className="logo">takawon</Link>
          <nav>
            <Link href="/">تصفح</Link>
            {s ? (<>
              <Link href="/library">مشترياتي</Link>
              {(s.role === "SELLER" || s.role === "ADMIN") && <Link href="/seller">لوحة البائع</Link>}
              {s.role === "ADMIN" && <Link href="/admin">الأدمن</Link>}
              <form action={logout}><button className="linkbtn">خروج ({s.name})</button></form>
            </>) : (<><Link href="/login">دخول</Link><Link href="/register" className="btn">حساب جديد</Link></>)}
          </nav>
        </div></header>
        <main className="wrap">{children}</main>
      </body>
    </html>
  );
}
