import { requireRole } from "@/lib/auth";
import { CATEGORIES, FORMATS } from "@/lib/constants";
import { uploadAsset } from "../../actions";

export default async function NewAsset({ searchParams }: { searchParams: { error?: string } }) {
  await requireRole("SELLER", "ADMIN");
  const accept = Object.keys(FORMATS).map((e) => "." + e).join(",");
  return (
    <section className="panel">
      <h1 style={{ fontSize: 28 }}>رفع بلوك جديد</h1>
      {searchParams.error && <p className="err">تحقق من العنوان والسعر، وارفع ملفاً واحداً على الأقل بصيغة مدعومة.</p>}
      <form action={uploadAsset} className="form" encType="multipart/form-data">
        <label>العنوان<input className="in" name="title" required maxLength={80} /></label>
        <label>التصنيف<select name="category">{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select></label>
        <label>السعر بالدولار<input className="in" name="price" type="number" min="1" step="0.5" required /></label>
        <label>الوسوم، افصل بينها بفاصلة<input className="in" name="tags" placeholder="مودرن، خشب" /></label>
        <label className="full">الوصف<textarea name="description" rows={4} maxLength={1000} /></label>
        <label className="full">ملفات البلوك ({Object.values(FORMATS).join("، ")})<input className="in" name="files" type="file" multiple required accept={accept} /></label>
        <label className="full">صورة المعاينة (PNG أو JPG أو WebP)<input className="in" name="preview" type="file" accept="image/png,image/jpeg,image/webp" /></label>
        <div className="full"><button className="btn">أرسل للمراجعة</button> <span className="mut">يظهر البلوك للمشترين بعد موافقة الأدمن.</span></div>
      </form>
    </section>
  );
}
