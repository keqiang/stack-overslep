# 01. The pool anti-pattern (keeps Neon awake)

A module-level `pg` `Pool` in a serverless app holds a TCP connection open across warm invocations, so Neon's compute never scales to zero. The result is that you pay for roughly 24/7 active compute even at zero traffic.

```ts
// db.ts: the problem is the long-lived, module-scoped pool
const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 10 });
```

## See it

1. `export DATABASE_URL="postgres://...your Neon pooled URL..."` (use a throwaway Neon project).
2. Wire `query()` into a route handler (for example `app/api/now/route.ts` running `SELECT now()`), then deploy or run it.
3. Hit it once, then poll the endpoint state:
   ```bash
   NEON_API_KEY=... NEON_PROJECT_ID=... node ../../measure/endpoint-state.mjs
   ```
   The endpoint stays `active` for far longer than your 5-minute idle window, because the held connection keeps re-arming it.

## Fix

Use the stateless HTTP driver. See [`../02-http-driver`](../02-http-driver). If you do need a pool, use Vercel Fluid Compute with `attachDatabasePool()` from `@vercel/functions`, which releases idle clients before the instance suspends.
