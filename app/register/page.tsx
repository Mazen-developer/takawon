import Link from "next/link";
import { safeNext } from "@/lib/auth";
import { register } from "../actions";

export default function Register({ searchParams }: { searchParams: { error?: string; next?: string } }) {
  const next = safeNext(searchParams.next);
  const q = next ? `?next=${encodeURIComponent(next)}` : "";
  const msg = searchParams.error === "exists" ? "هذا البريد مسجل بالفعل." : searchParams.error ? "تحقق من البيانات. كلمة المرور 8 أحرف على الأقل." : "";
  return (
    <section className="panel" style={{ maxWidth: 420, margin: "32px auto" }}>
      <h2>حساب جديد</h2>
      {msg && <p className="err">{msg}</p>}
      <form action={register} className="form" style={{ gridTemplateColumns: "1fr" }}>
        {next && <input type="hidden" name="next" value={next} />}
        <label>الاسم<input className="in" name="name" required /></label>
        <label>البريد الإلكتروني<input className="in" name="email" type="email" required dir="ltr" /></label>
        <label>كلمة المرور<input className="in" name="password" type="password" minLength={8} required dir="ltr" /></label>
        <label>أريد أن<select name="role"><option value="BUYER">أشتري بلوكات</option><option value="SELLER">أبيع بلوكاتي</option></select></label>
        <button className="btn">إنشاء الحساب</button>
      </form>
      <p className="mut">لديك حساب؟ <Link href={`/login${q}`}>سجّل الدخول</Link></p>
    </section>
  );
}
