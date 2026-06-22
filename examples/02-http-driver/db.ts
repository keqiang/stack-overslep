/**
 * ✅ FIX: stateless Neon HTTP driver for the serverless request path.
 *
 * `neon()` issues one HTTPS request per query and holds NO persistent
 * connection, so nothing keeps the compute awake between requests. After the
 * idle window the Neon compute scales to zero and you stop paying for it.
 *
 * Keep a `pg` Pool ONLY for CLI scripts / migrations / long-running servers
 * (selected here by the absence of NEXT_RUNTIME). The HTTP driver only talks to
 * Neon's *.neon.tech endpoint, so local non-Neon Postgres also falls back to pg.
 *
 * Compare with ../01-pool-antipattern/db.ts. Same query API, very different bill.
 */
import { neon } from "@neondatabase/serverless";
import { Pool } from "pg";

function getUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  return url;
}

// HTTP driver inside the Next.js runtime against a Neon host; pg elsewhere.
function useHttp(): boolean {
  return !!process.env.NEXT_RUNTIME && /\.neon\.tech/.test(getUrl());
}

let _sql: ReturnType<typeof neon> | null = null;
let _pool: Pool | null = null;

export async function query<T = Record<string, unknown>>(
  sql: string,
  params: unknown[] = [],
): Promise<T[]> {
  if (useHttp()) {
    _sql ??= neon(getUrl(), { fullResults: true });
    const res = await _sql.query(sql, params); // one HTTPS round-trip, no held connection
    return res.rows as T[];
  }
  _pool ??= new Pool({ connectionString: getUrl() }); // CLI/migrations only
  const res = await _pool.query(sql, params);
  return res.rows as T[];
}

/** Close the pool in CLI scripts; no-op under the HTTP driver. */
export async function close(): Promise<void> {
  if (_pool) {
    await _pool.end();
    _pool = null;
  }
}
