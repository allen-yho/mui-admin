# CF Admin API (Worker + Hono + D1 + JWT)


# Install
1. brew install cloudflare-wrangler(Mac)

Run locally:

1. Install dependencies:
   yarn
2. Create D1 local DB:
   wrangler d1 create admin-db
3. Apply migrations:
   wrangler d1 migrations apply admin-db --local
4. Run dev server:
   npm run dev

# doc
