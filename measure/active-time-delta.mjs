#!/usr/bin/env node
/**
 * Forward `active_time` delta: the cumulative proof of how much your compute ran.
 *
 * `active_time` is cumulative per billing period and lags ~hourly, so a single
 * read is dominated by history. The signal is the DELTA over a window, ideally
 * compared against an UNCHANGED control project (so you know the drop is your
 * fix, not a quiet traffic hour).
 *
 * Pass 1 (baseline):   node active-time-delta.mjs > baseline.json
 * ...wait a few hours (overnight is ideal)...
 * Pass 2 (delta):      node active-time-delta.mjs baseline.json
 *
 * Usage:
 *   NEON_API_KEY=napi_xxx NEON_ORG_ID=org-xxx node active-time-delta.mjs [baseline.json]
 *   (NEON_ORG_ID optional; without it, lists all projects you can see.)
 */
import { readFileSync } from "node:fs";

const API = "https://console.neon.tech/api/v2";
const KEY = process.env.NEON_API_KEY;
const ORG = process.env.NEON_ORG_ID;
if (!KEY) {
  console.error("Set NEON_API_KEY.");
  process.exit(1);
}

async function snapshot() {
  const url = ORG ? `${API}/projects?org_id=${ORG}` : `${API}/projects`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${KEY}` } });
  if (!res.ok) throw new Error(`Neon API ${res.status}: ${await res.text()}`);
  const { projects } = await res.json();
  const at = new Date().toISOString();
  return Object.fromEntries(
    projects.map((p) => [p.name, { at, active_time: p.active_time, cpu_used_sec: p.cpu_used_sec }]),
  );
}

const now = await snapshot();
const baselinePath = process.argv[2];

if (!baselinePath) {
  // Baseline pass: print JSON to save.
  console.log(JSON.stringify(now, null, 2));
  process.exit(0);
}

const base = JSON.parse(readFileSync(baselinePath, "utf8"));
const fmtH = (s) => (s / 3600).toFixed(2);
console.log(`name                | Δactive_time | window | duty%`);
for (const [name, cur] of Object.entries(now)) {
  const b = base[name];
  if (!b) continue;
  const dSec = cur.active_time - b.active_time;
  const windowSec = (new Date(cur.at) - new Date(b.at)) / 1000;
  const duty = windowSec > 0 ? ((dSec / windowSec) * 100).toFixed(1) : "?";
  console.log(`${name.padEnd(19)} | ${fmtH(dSec)}h     | ${fmtH(windowSec)}h | ${duty}%`);
}
console.log(`\nLower duty% = more sleeping. Compare your app to an unchanged control project.`);
