import Link from "next/link";
import { db } from "@/lib/db";
import { usd } from "@/lib/money";
import { CATEGORIES, FORMATS } from "@/lib/constants";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";
type SP = { q?: string; cat?: string; fmt?: string };

export default async function Home({ searchParams }: { searchParams: SP }) {
  const { q, cat, fmt } = searchParams;
  const session = await getSession();
  const assets = await db.asset.findMany({
    where: {
      status: "APPROVED",
      ...(cat && { category: cat }),
      ...(fmt && { files: { some: { format: fmt } } }),
      ...(q && { OR: [
        { title: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
        { tags: { has: q.toLowerCase() } },
      ] }),
    },
    include: { files: { select: { format: true } }, seller: { select: { name: true } } },
    orderBy: { createdAt: "desc" }, take: 60,
  });
  const href = (o: Partial<SP>) => {
    const p = new URLSearchParams(Object.entries({ ...searchParams, ...o }).filter(([, v]) => v) as [string, string][]);
    return `/?${p}`;
  };
  return (
    <>
      <h1 style={{ fontSize: "clamp(28px,5vw,46px)", margin: "12px 0" }}>بلوكات ونماذج جاهزة لمشروعك القادم</h1>
      {!session && <p className="mut">تصفح البلوكات بحرية. عند الشراء سنطلب منك تسجيل الدخول أو إنشاء حساب.</p>}
      <form action="/" style={{ display: "flex", gap: 8, margin: "16px 0" }}>
        {cat && <input type="hidden" name="cat" value={cat} />}{fmt && <input type="hidden" name="fmt" value={fmt} />}
        <input className="in" name="q" defaultValue={q} placeholder="ابحث بالاسم أو الوسم" aria-label="بحث" />
        <button className="btn">بحث</button>
      </form>
      <div className="chips">
        <Link className={`chip ${!cat ? "on" : ""}`} href={href({ cat: "" })}>كل التصنيفات</Link>
        {CATEGORIES.map((c) => <Link key={c} className={`chip ${cat === c ? "on" : ""}`} href={href({ cat: c })}>{c}</Link>)}
      </div>
      <div className="chips">
        <Link className={`chip ${!fmt ? "on" : ""}`} href={href({ fmt: "" })}>كل الصيغ</Link>
        {[...new Set(Object.values(FORMATS))].map((f) => <Link key={f} className={`chip ${fmt === f ? "on" : ""}`} href={href({ fmt: f })}>{f}</Link>)}
      </div>
      {assets.length ? (
        <div className="grid">{assets.map((a) => (
          <Link key={a.id} href={`/asset/${a.id}`} className="card">
            <div className="pv">{a.previewPath ? <img src={a.previewPath} alt={a.title} /> : <span>بدون معاينة</span>}</div>
            <div className="cb">
              <h3>{a.title}</h3><div className="mut">{a.seller.name} · {a.category}</div>
              <div className="fm">{[...new Set(a.files.map((f) => f.format))].map((f) => <span key={f}>{f}</span>)}</div>
              <span className="price">{usd(a.priceCents)}</span>
            </div>
          </Link>))}
        </div>
      ) : <div className="empty" style={{ marginTop: 16 }}>لا توجد نتائج. جرّب كلمة أخرى أو أزل الفلتر.</div>}
    </>
  );
}
