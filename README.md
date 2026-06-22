# stack-overslept 💤

_Your serverless stack slept in. Your bill thanked it._ Scale-to-zero rules for Next.js on Vercel + Neon.

> You pay for the time your stack is awake, not for traffic. A few code patterns keep Vercel functions and the Neon database from ever sleeping. Fix those and the same app costs a fraction, often without changing plans.

## 🟢 Not technical? Do this.

You vibe-coded an app (Cursor, Claude Code, v0, Lovable, Bolt) and got a scary Vercel or Neon bill?

1. Copy the [`agent-rules/`](agent-rules) folder into your project. It has the rules in `neon.md` and `vercel.md`, plus `AGENTS.md` and `CLAUDE.md` that point your tool at them.
2. Tell your AI editor: "Apply the cost rules in AGENTS.md to this codebase."
3. Redeploy.

Your agent will switch the database driver, cache the routes bots hammer, remove the pointless cron, and stop building on every push. The rest of this repo explains why it works.

## What was keeping the stack awake (the 4 levers)

| # | Lever | The fix |
|---|---|---|
| 1 | A long-lived `pg` Pool in a warm function held a DB connection open, so Neon never slept | Use the stateless HTTP `neon()` driver ([`examples/02-http-driver`](examples/02-http-driver)) |
| 2 | A cron polling the DB every 5 min against a 5-min auto-suspend stayed awake | Do event-driven work at request time with `after()`, and delete the poll |
| 3 | `force-dynamic` DB-backed routes hit the DB on every request | Cache them (ISR plus on-demand `generateStaticParams`); match `revalidate` to the data's cadence |
| 4 | AI crawlers (invisible to Google Analytics) hammered the stack, plus a per-bot DB write | Cache crawler routes, and stop writing to the DB on every bot hit ([`measure/ga-blindspot.md`](measure/ga-blindspot.md)) |

There's a bonus on the Vercel side too: build locally and `vercel deploy --prebuilt` to skip remote build minutes ([`examples/03-prebuilt-deploy`](examples/03-prebuilt-deploy)).

## Repo contents

- [`agent-rules/`](agent-rules): the drop-in rules. Start here.
  - `neon.md`, `vercel.md`: the rules, one file per platform. This is where every rule actually lives.
  - `AGENTS.md`: entry point that tells any agent to apply `neon.md` and `vercel.md` (it reads them).
  - `CLAUDE.md`: entry point for Claude Code; `@import`s the two so they load up front.
- [`examples/01-pool-antipattern`](examples/01-pool-antipattern): the pool that keeps Neon awake.
- [`examples/02-http-driver`](examples/02-http-driver): the HTTP-driver fix that lets it sleep.
- [`examples/03-prebuilt-deploy`](examples/03-prebuilt-deploy): skip Vercel build minutes.
- [`measure/`](measure): prove it, with Neon endpoint state, an `active_time` delta, and why GA lies to you.

## Measure it yourself

```bash
# Real-time: is the DB actually idle or suspended?
NEON_API_KEY=napi_xxx NEON_PROJECT_ID=your-project node measure/endpoint-state.mjs

# Cumulative: how much did compute run? (baseline now, re-run after a few hours)
NEON_API_KEY=napi_xxx node measure/active-time-delta.mjs > baseline.json
# ...wait...
NEON_API_KEY=napi_xxx node measure/active-time-delta.mjs baseline.json
```

## Before you upgrade your plan

A surprise bill usually means the stack never sleeps, so fix the patterns above first. You often don't need Neon Launch or Vercel Pro. You need scale-to-zero. One honest caveat: free tiers have real limits (Vercel Hobby is non-commercial, and Neon Free has compute and storage caps), so upgrade when those limits, not idle waste, are the actual constraint.

## Read the full story

The full write-up walks through the whole diagnosis: [read it on Medium](https://medium.com/@keqiangli/you-dont-need-vercel-pro-you-need-your-stack-to-sleep-f3cd37f81d13).

## Editing the rules

Every rule lives once, in `agent-rules/neon.md` or `agent-rules/vercel.md`. `AGENTS.md` and `CLAUDE.md` only point at those two, so there's nothing to regenerate. Edit a source file and you're done.

MIT licensed. PRs welcome, especially more `agent-rules` for other stacks.
