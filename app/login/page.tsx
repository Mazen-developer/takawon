import Link from "next/link";
import { safeNext } from "@/lib/auth";
import { login } from "../actions";

export default function Login({ searchParams }: { searchParams: { error?: string; next?: string } }) {
  const next = safeNext(searchParams.next);
  const q = next ? `?next=${encodeURIComponent(next)}` : "";
  return (
    <section className="panel" style={{ maxWidth: 420, margin: "32px auto" }}>
      <h2>تسجيل الدخول</h2>
      {next && !searchParams.error && <p className="mut">سجّل الدخول لإكمال طلبك.</p>}
      {searchParams.error && <p className="err">البريد أو كلمة المرور غير صحيحة.</p>}
      <form action={login} className="form" style={{ gridTemplateColumns: "1fr" }}>
        {next && <input type="hidden" name="next" value={next} />}
        <label>البريد الإلكتروني<input className="in" name="email" type="email" required dir="ltr" /></label>
        <label>كلمة المرور<input className="in" name="password" type="password" required dir="ltr" /></label>
        <label style={{ flexDirection: "row", alignItems: "center", gap: 8, fontWeight: 400 }}>
          <input name="remember" type="checkbox" defaultChecked style={{ width: "auto" }} /> ابقَ مسجلاً على هذا الجهاز
        </label>
        <button className="btn">دخول</button>
      </form>
      <p className="mut">ليس لديك حساب؟ <Link href={`/register${q}`}>أنشئ حساباً</Link></p>
    </section>
  );
}
