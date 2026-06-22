# Why Google Analytics can't see what's costing you money

Here's a confusing moment a lot of people hit. Google Analytics shows roughly 0 users, but your serverless bill says the backend never sleeps. Both are true at once.

## The reason

GA4 (and most product analytics) is client-side JavaScript. It only fires when a real browser loads your page and runs the script. The traffic that actually hits your functions and database is mostly not that:

- **AI and LLM crawlers** like GPTBot, ClaudeBot, OAI-SearchBot, PerplexityBot, Google-Extended, CCBot, and Bytespider fetch your HTML server-side and never run your JavaScript. They are invisible to GA.
- **Search and SEO crawlers, uptime monitors, RSS readers, link unfurlers, and scrapers** are the same story.

So GA measures humans with browsers, while your bill is driven by every request that reaches the origin. In 2026, bots are a large share of web traffic, and AI crawlers are a fast-growing slice of that. Some of them crawl thousands of pages for every referral they send back. On a fresh `llms.txt`, sitemap, or SEO surface, they can keep a "0-user" app's functions and database busy around the clock.

## What to look at instead

1. **Vercel usage and observability dashboards.** Function invocations, bandwidth (Fast Data Transfer), and a per-bot breakdown. This is your real demand curve.
2. **Server logs.** Grep request user-agents for `GPTBot|ClaudeBot|PerplexityBot|CCBot|Bytespider|bot|crawler`. This is who's actually hitting you.
3. **Neon endpoint state and `active_time`.** See `endpoint-state.mjs` and `active-time-delta.mjs` in this folder.

## The fix (so bots stop waking the stack)

- **Cache** crawler-facing, DB-backed routes (ISR or static) so a bot hit serves from the CDN, not a function plus a DB query.
- **Never write to the database on every bot hit.** A crawler-logging INSERT in middleware will wake the compute on every request. Log to stdout or sample instead.
- Optionally add **bot management or firewall** rules for crawlers you don't want.

See the repo's [`agent-rules`](../agent-rules) for the full set, and the blog post for the full story.
