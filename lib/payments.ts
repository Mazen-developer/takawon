// Payment provider boundary. The mock provider approves instantly so the flow can be
// developed end to end. Replace `charge` with a real provider (Stripe Checkout / Paymob / Paddle):
// create a checkout session here, then finalize the order in the provider's webhook instead.
export async function charge(_: { userId: string; amountCents: number }): Promise<{ ok: boolean }> {
  return { ok: true };
}
