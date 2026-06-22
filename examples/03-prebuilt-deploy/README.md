# 03. Prebuilt deploy (skip Vercel build minutes)

Vercel's Git integration runs a cloud build on every push to a connected branch, plus a build per PR preview, and those builds are metered (about $0.0035 per CPU-minute, more on Turbo and Enhanced machines). If you build it yourself and upload the result, Vercel skips the build and you don't pay for it.

## The pattern

```bash
# Build locally (or in CI), then deploy the prebuilt output. No remote build.
vercel pull --yes --environment=production   # get project settings + prod env
vercel build --prod                          # builds into .vercel/output on YOUR machine
vercel deploy --prebuilt --prod              # uploads output; Vercel does NOT rebuild
```

## Three ways to ship, and what they cost

| Approach | Build runs on | Vercel build minutes | Preview URLs and auto-deploy |
|---|---|---|---|
| Git integration (default) | Vercel cloud | billed every push and PR | yes, automatic |
| Local `--prebuilt` (this dir) | your machine | $0 | no, you deploy manually |
| `--prebuilt` from GitHub Actions ([`deploy.yml`](.github/workflows/deploy.yml)) | CI runner | $0 | yes, kept via CI |

## Trade-offs (the honest version)

Going prebuilt-only means you lose Vercel's automatic preview URLs, push-to-deploy, PR comments, and Git-based instant rollback. The GitHub Actions variant is the middle path: keep CI and previews, and still skip Vercel's remote build. Use it when builds are frequent or expensive, which usually means big apps, monorepos, or many preview branches.
