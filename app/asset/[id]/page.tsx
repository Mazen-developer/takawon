import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { usd } from "@/lib/money";
import { buyAsset } from "../../actions";

export const dynamic = "force-dynamic";

export default async function AssetPage({ params, searchParams }: { params: { id: string }; searchParams: { error?: string } }) {
  const s = await getSession();
  const a = await db.asset.findUnique({ where: { id: params.id }, include: { files: true, seller: { select: { name: true } } } });
  if (!a || (a.status !== "APPROVED" && s?.role !== "ADMIN" && s?.uid !== a.sellerId)) notFound();
  const owned = s ? !!(await db.orderItem.findFirst({ where: { assetId: a.id, order: { buyerId: s.uid } } })) : false;
  const mine = s?.uid === a.sellerId;
  return (
    <div className="two">
      <div className="pv card" style={{ aspectRatio: "4/3" }}>{a.previewPath ? <img src={a.previewPath} alt={a.title} /> : <span>بدون معاينة</span>}</div>
      <div>
        <h1>{a.title}</h1>
        <p className="mut">{a.seller.name} · {a.category}</p>
        <p>{a.description}</p>
        <div className="fm">{a.files.map((f) => <span key={f.id}>{f.format} · {(f.sizeBytes / 1048576).toFixed(1)}MB</span>)}</div>
        <p>{a.tags.map((t) => <span key={t} className="chip" style={{ marginInlineEnd: 6 }}>{t}</span>)}</p>
        <p className="price" style={{ fontSize: 30 }}>{usd(a.priceCents)}</p>
        {searchParams.error && <p className="err">تعذر إتمام الدفع. حاول مرة أخرى.</p>}
        {a.status !== "APPROVED" ? <p className="mut">هذا البلوك لم يُنشر بعد.</p>
          : owned ? <Link className="btn" href="/library">اذهب إلى تحميل الملفات</Link>
          : mine ? <p className="mut">هذا بلوكك.</p>
          : s ? <form action={buyAsset}><input type="hidden" name="assetId" value={a.id} /><button className="btn">اشترِ الآن</button></form>
          : <><Link className="btn" href={`/login?next=${encodeURIComponent(`/asset/${a.id}`)}`}>سجّل الدخول للشراء</Link><p className="mut">التصفح مفتوح للجميع، والشراء يحتاج حساباً.</p></>}
      </div>
    </div>
  );
}
