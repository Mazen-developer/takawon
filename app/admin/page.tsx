import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { commissionBps, sellerBalance } from "@/lib/stats";
import { usd } from "@/lib/money";
import { reviewAsset, setCommission, payoutSeller } from "../actions";

export const dynamic = "force-dynamic";

export default async function Admin({ searchParams }: { searchParams: { error?: string } }) {
  await requireRole("ADMIN");
  const [bps, pending, totals, sellers] = await Promise.all([
    commissionBps(),
    db.asset.findMany({ where: { status: "PENDING" }, include: { seller: { select: { name: true } }, files: true }, orderBy: { createdAt: "asc" } }),
    db.orderItem.findMany({ select: { priceCents: true, commissionBps: true } }),
    db.user.findMany({ where: { OR: [{ role: "SELLER" }, { assets: { some: {} } }] }, select: { id: true, name: true } }),
  ]);
  const gross = totals.reduce((t, i) => t + i.priceCents, 0);
  const fees = totals.reduce((t, i) => t + Math.round((i.priceCents * i.commissionBps) / 10000), 0);
  const balances = await Promise.all(sellers.map(async (u) => ({ ...u, ...(await sellerBalance(u.id)) })));
  return (
    <>
      <h1>لوحة الأدمن</h1>
      <div className="stats">
        <div className="stat"><span className="mut">إجمالي المبيعات</span><b>{usd(gross)}</b></div>
        <div className="stat"><span className="mut">عمولة المنصة</span><b>{usd(fees)}</b></div>
        <div className="stat"><span className="mut">عدد العمليات</span><b>{totals.length}</b></div>
        <div className="stat"><span className="mut">بانتظار المراجعة</span><b>{pending.length}</b></div>
      </div>
      <section className="panel"><h2>مراجعة البلوكات</h2>
        {pending.length ? <div className="tw"><table><tbody>{pending.map((a) => (
          <tr key={a.id}>
            <td><b>{a.title}</b><div className="mut">{a.seller.name} · {a.category} · {a.files.map((f) => f.format).join(" ")}</div></td>
            <td>{usd(a.priceCents)}</td>
            <td>
              <form action={reviewAsset} style={{ display: "flex", gap: 6 }}>
                <input type="hidden" name="id" value={a.id} />
                <button className="btn" name="decision" value="approve">وافق</button>
                <button className="btn bad" name="decision" value="reject">ارفض</button>
              </form>
            </td>
          </tr>))}</tbody></table></div> : <div className="empty">لا توجد بلوكات بانتظار المراجعة.</div>}
      </section>
      <section className="panel"><h2>نسبة العمولة</h2>
        {searchParams.error && <p className="err">أدخل نسبة بين 0 و60.</p>}
        <form action={setCommission} className="form">
          <label>النسبة من كل عملية بيع (%)<input className="in" name="percent" type="number" min="0" max="60" step="0.5" defaultValue={bps / 100} /></label>
          <div style={{ alignSelf: "end" }}><button className="btn">احفظ النسبة</button></div>
        </form>
        <p className="mut">النسبة الجديدة تسري على المبيعات القادمة فقط، والمبيعات السابقة تحتفظ بنسبتها.</p>
      </section>
      <section className="panel"><h2>أرباح المصممين</h2>
        <div className="tw"><table>
          <thead><tr><th>البائع</th><th>الأرباح</th><th>تم تحويله</th><th>المستحق</th><th></th></tr></thead>
          <tbody>{balances.map((b) => (
            <tr key={b.id}><td>{b.name}</td><td>{usd(b.earned)}</td><td>{usd(b.paid)}</td><td><b>{usd(b.due)}</b></td>
              <td><form action={payoutSeller}><input type="hidden" name="sellerId" value={b.id} /><button className="btn ghost" disabled={b.due <= 0}>سجّل التحويل</button></form></td></tr>))}</tbody>
        </table></div>
      </section>
    </>
  );
}
