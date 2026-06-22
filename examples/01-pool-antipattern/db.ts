/**
 * ❌ ANTI-PATTERN: a module-level node-postgres Pool inside a serverless app.
 *
 * Why this costs money on Vercel + Neon:
 * A warm Vercel function reuses module scope across invocations, so this `pool`
 * persists. node-postgres keeps idle TCP connections open (its idle-close timer
 * doesn't reliably fire in a suspended-then-reused function), so a connection
 * stays open to Neon. Neon treats reuse/held connections as activity, so the
 * compute never scales to zero, so you pay for ~24/7 active compute even with
 * zero real traffic.
 *
 * Run the app, hit `/api/now` once, then watch the Neon endpoint state with
 * `../../measure/endpoint-state.mjs`: it stays `active` long after the request.
 *
 * See ../02-http-driver/db.ts for the fix.
 */
import { Pool } from "pg";

// Persists across warm invocations → holds a connection → blocks scale-to-zero.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL, // use the -pooler host in prod
  max: 10,
});

export async function query<T = Record<string, unknown>>(
  sql: string,
  params: unknown[] = [],
): Promise<T[]> {
  const res = await pool.query(sql, params);
  return res.rows as T[];
}
