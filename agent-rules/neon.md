# Neon serverless cost rules
# Goal: keep Neon compute able to scale to zero. Billed by active time, not traffic.

- Query Neon with the HTTP driver `neon()` from `@neondatabase/serverless` in request handlers, RSC, and route handlers. One HTTPS round-trip, no persistent connection.
- Use `pg`/node-postgres `Pool` or `Client` only in CLI scripts, migrations, or long-running servers. Never a module-level pool in a serverless function; warm reuse holds a connection open and blocks scale-to-zero.
- Use the pooled connection string (the `-pooler` host).
- Do not add a cron that queries the DB more often than the suspend window (default 300s). For event-driven work, run it at request time via `after()` from `next/server`, not a poll.
- Scheduled crons must early-return without a query when there is nothing to do.
- Never INSERT or UPDATE on every bot or analytics hit (e.g. crawler logging in middleware). Log to stdout or sample.
- Cache DB-backed public routes so they do not query per request: remove `export const dynamic = "force-dynamic"`; set `export const revalidate = <data-cadence-seconds>`; for `[id]`/`[slug]` routes add `export async function generateStaticParams() { return [] }` for on-demand ISR. Under Next.js 16 Cache Components use `export const dynamic = "force-static"` or return >=1 param instead.
- For routes that must stay dynamic, wrap DB queries in `"use cache"` (Next 15+) or `unstable_cache` so the data is cached.
- Set `revalidate` to the data's real change cadence, not a default 60s.
- Verify scale-to-zero with the endpoint `current_state` (real-time) and a forward `active_time` delta versus an unchanged control project. The cumulative `active_time` field lags ~1h.
- Before upgrading the plan (Free to Launch), apply these first; a persistent bill usually means the DB never sleeps. Launch only enables or disables scale-to-zero (fixed 300s); sub-5-minute timeouts need Scale.
