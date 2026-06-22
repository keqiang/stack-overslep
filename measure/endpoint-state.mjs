#!/usr/bin/env node
/**
 * Real-time Neon endpoint state: the trustworthy signal for "is my DB asleep?"
 *
 * The cumulative `active_time` field on the projects API lags ~an hour, so it's
 * useless for a quick check. The endpoint `current_state` (active | idle) is
 * real-time. This polls it so you can watch the compute go idle → suspended
 * after your idle window.
 *
 * Usage:
 *   NEON_API_KEY=napi_xxx NEON_PROJECT_ID=your-project-id node endpoint-state.mjs [intervalSeconds] [count]
 *
 * Get your key at https://console.neon.tech/app/settings/api-keys and the
 * project id from the project URL or `GET /projects`.
 */
const API = "https://console.neon.tech/api/v2";
const KEY = process.env.NEON_API_KEY;
const PROJECT = process.env.NEON_PROJECT_ID;
const interval = Number(process.argv[2] ?? 60);
const count = Number(process.argv[3] ?? 15);

if (!KEY || !PROJECT) {
  console.error("Set NEON_API_KEY and NEON_PROJECT_ID env vars.");
  process.exit(1);
}

async function getStates() {
  const res = await fetch(`${API}/projects/${PROJECT}/endpoints`, {
    headers: { Authorization: `Bearer ${KEY}` },
  });
  if (!res.ok) throw new Error(`Neon API ${res.status}: ${await res.text()}`);
  const { endpoints } = await res.json();
  return endpoints.map((e) => ({ id: e.id, state: e.current_state, lastActive: e.last_active }));
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

for (let i = 0; i < count; i++) {
  const ts = new Date().toISOString().slice(11, 19);
  try {
    const states = await getStates();
    for (const s of states) {
      console.log(`${ts}  ${s.id}  state=${s.state}  last_active=${s.lastActive ?? "?"}`);
    }
  } catch (err) {
    console.error(`${ts}  error: ${err.message}`);
  }
  if (i < count - 1) await sleep(interval * 1000);
}
