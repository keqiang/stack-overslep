# 02. The HTTP-driver fix (lets Neon sleep)

The stateless Neon HTTP driver (`neon()` from `@neondatabase/serverless`) makes each query a single HTTPS round-trip with no persistent connection. Nothing keeps the compute awake, so after the idle window it scales to zero and the compute bill drops.

```ts
// db.ts: HTTP driver in the request path; pg Pool kept only for CLI and migrations
import { neon } from "@neondatabase/serverless";
const sql = neon(process.env.DATABASE_URL, { fullResults: true });
const { rows } = await sql.query("SELECT now()");
```

## See it

Same setup as [`../01-pool-antipattern`](../01-pool-antipattern), but with this `db.ts`. Hit your route once, then poll:

```bash
NEON_API_KEY=... NEON_PROJECT_ID=... node ../../measure/endpoint-state.mjs
```

This time the endpoint goes `idle` and then suspends within the idle window, which is exactly what you want.

## Notes

- Use the pooled (`-pooler`) Neon connection string.
- Need interactive transactions or a pool inside functions? Use Vercel Fluid Compute with `attachDatabasePool()` (`@vercel/functions`) instead of a bare module-level pool.
- The driver also has a `transaction([...])` API for multi-statement one-shot transactions (for example a `SET LOCAL` plus a query) without a session.
