import Link from "next/link";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { sellerBalance } from "@/lib/stats";
import { usd } from "@/lib/money";

export const dynamic = "force-dynamic";
const ST = { PENDING: "بانتظار المراجعة", APPROVED: "منشور", REJECTED: "مرفوض" } as const;

export default async function Seller() {
  const s = await requireRole("SELLER", "ADMIN");
  const [bal, assets, sold] = await Promise.all([
    sellerBalance(s.uid),
    db.asset.findMany({ where: { sellerId: s.uid }, orderBy: { createdAt: "desc" } }),
    db.orderItem.groupBy({ by: ["assetId"], where: { sellerId: s.uid }, _count: true }),
  ]);
  const soldBy = Object.fromEntries(sold.map((x) => [x.assetId, x._count]));
  const dls = assets.reduce((t, a) => t + a.downloads, 0);
  return (
    <>
      <h1>لوحة البائع</h1>
      <div className="stats">
        <div className="stat"><span className="mut">المبيعات</span><b>{bal.sales}</b></div>
        <div className="stat"><span className="mut">التحميلات</span><b>{dls}</b></div>
        <div className="stat"><span className="mut">إجمالي الأرباح</span><b>{usd(bal.earned)}</b></div>
        <div className="stat"><span className="mut">مستحق للتحويل</span><b>{usd(bal.due)}</b></div>
      </div>
      <p><Link className="btn" href="/seller/new">ارفع بلوكاً جديداً</Link></p>
      <section className="panel"><h2>بلوكاتي</h2>
        {assets.length ? <div className="tw"><table>
          <thead><tr><th>البلوك</th><th>السعر</th><th>المبيعات</th><th>التحميلات</th><th>الحالة</th></tr></thead>
          <tbody>{assets.map((a) => (
            <tr key={a.id}><td><Link href={`/asset/${a.id}`}>{a.title}</Link></td><td>{usd(a.priceCents)}</td>
              <td>{soldBy[a.id] ?? 0}</td><td>{a.downloads}</td><td>{ST[a.status]}</td></tr>))}</tbody>
        </table></div> : <div className="empty">لم ترفع أي بلوك بعد.</div>}
      </section>
    </>
  );
}
