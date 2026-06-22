# Vercel serverless cost rules
# Goal: minimize build, function, and bandwidth spend; keep functions able to idle.

- Build locally or in CI and deploy prebuilt: `vercel build` then `vercel deploy --prebuilt --prod`. This skips Vercel's remote build, so no build minutes are billed. Do not cloud-build on every push.
- To keep preview URLs and CI, run the prebuilt step from GitHub Actions instead of Vercel Git auto-build.
- If you need a DB pool inside functions, use Fluid Compute (default) with `attachDatabasePool()` from `@vercel/functions` so idle clients are released before the instance suspends.
- Cache DB-backed and crawler-facing routes (ISR or static) so bot and repeat hits serve from the CDN, not a function invocation plus bandwidth. `llms.txt`, `llm.txt`, sitemap, and public API routes must be cached, never `force-dynamic`.
- Reduce image optimization cost: long `images.minimumCacheTTL`, minimal `images.formats`, a `remotePatterns` allow-list, and `unoptimized` for tiny, SVG, or animated images.
- Assume AI crawlers (GPTBot, ClaudeBot, PerplexityBot, CCBot, Bytespider) hit constantly and are invisible to Google Analytics. They drive invocations and bandwidth. Cache first; add bot management or firewall rules as needed.
- Measure invocations and bandwidth in the Vercel usage and observability dashboards, and read server logs for bot user-agents. Do not rely on Google Analytics.
- Before upgrading (Hobby to Pro), apply these first. Hobby is non-commercial.
