# بلوك | Blok Marketplace

Multi-vendor marketplace for architectural blocks and 3D models. Next.js 14 (App Router) + PostgreSQL + Prisma.

## Run locally
```bash
docker compose up -d          # Postgres on :5432
cp .env.example .env          # set AUTH_SECRET to a long random string
npm install
npx prisma db push
npm run db:seed
npm run dev                   # http://localhost:3000
```
Seed accounts (password `password123`): `admin@blok.test`, `salma@blok.test` (seller), `yousef@blok.test` (seller), `buyer@blok.test`.

## What is implemented
- Roles: buyer / seller / admin, JWT cookie session, route protection in `middleware.ts` and again in every server action.
- Seller: upload files (format detected from extension, allowlist in `lib/constants.ts`) + preview image, price, tags, description; dashboard with sales, downloads, earnings, amount due.
- Admin: approve/reject queue, global commission rate, sales and commission totals, payout recording.
- Buyer: search + category/format filters, asset page, buy, library, authenticated downloads (only buyer, owning seller, or admin).
- Commission is frozen on each `OrderItem` at purchase time, so changing the rate never rewrites history.

## Before going to production
1. **Payments**: `lib/payments.ts` is a mock that always approves. Integrate a real provider (Stripe Connect, Paymob, Paddle...) and create the order from its webhook, not from the browser redirect. Check which providers support your country and your sellers' countries.
2. **Storage**: `lib/storage.ts` writes to local disk. Move to S3/R2 with a private bucket and short-lived signed URLs.
3. **Payouts** are recorded manually by the admin; wire them to a provider payout API when ready.
4. Add email verification, password reset, rate limiting on login/upload, antivirus scanning of uploads, and a report/takedown flow for stolen assets.

## No Docker?
Use any PostgreSQL: install it locally, or create a free hosted database (Neon, Supabase) and put its connection string in `DATABASE_URL` in `.env`. Then run `npx prisma db push` and `npm run db:seed`.
