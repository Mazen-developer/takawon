import { db } from "./db";
import { DEFAULT_COMMISSION_BPS } from "./constants";

export async function commissionBps() {
  const s = await db.setting.findUnique({ where: { key: "commissionBps" } });
  return s ? Number(s.value) : DEFAULT_COMMISSION_BPS;
}
export async function sellerBalance(sellerId: string) {
  const [e, p] = await Promise.all([
    db.orderItem.aggregate({ where: { sellerId }, _sum: { sellerCents: true }, _count: true }),
    db.payout.aggregate({ where: { sellerId }, _sum: { amountCents: true } }),
  ]);
  const earned = e._sum.sellerCents ?? 0, paid = p._sum.amountCents ?? 0;
  return { earned, paid, due: earned - paid, sales: e._count };
}
