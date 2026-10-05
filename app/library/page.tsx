import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { usd } from "@/lib/money";

export const dynamic = "force-dynamic";

export default async function Library() {
  const s = await requireRole();
  const items = await db.orderItem.findMany({
    where: { order: { buyerId: s.uid } }, orderBy: { order: { createdAt: "desc" } },
    include: { asset: { include: { files: true } } },
  });
  return (
    <>
      <h1>مشترياتي</h1>
      {items.length ? items.map((i) => (
        <section className="panel" key={i.id}>
          <h2>{i.asset.title} <span className="mut">{usd(i.priceCents)}</span></h2>
          {i.asset.files.map((f) => (
            <p key={f.id}><a className="btn" href={`/api/download/${f.id}`}>تحميل {f.format}</a> <span className="mut">{f.originalName}</span></p>
          ))}
        </section>
      )) : <div className="empty">لم تشترِ أي بلوك بعد. تصفح السوق وابدأ.</div>}
    </>
  );
}
