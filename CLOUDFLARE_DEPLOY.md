# Cloudflare deployment runbook

dalilarabtr.com is deployed on Cloudflare Workers through OpenNext.

Current production flow:

1. Commit code to the repository.
2. Push to `main`.
3. Cloudflare Workers Builds runs the production build automatically.
4. After the build succeeds, the change is live on `https://dalilarabtr.com`.

Build settings expected in Cloudflare:

- Build command: `npm install && npm run cf:build`
- Deploy command: `npx wrangler deploy --no-bundle`
- Root directory: repository root
- Production branch: `main`

Local commands:

```bash
npm run cf:build
npm run cf:preview
npm run cf:deploy
```

Runtime notes:

- `wrangler.toml` is the source of truth for the Worker entry, compatibility flags, assets, and observability.
- Secrets must live in Cloudflare Worker secrets, not in committed files.
- Public values such as `NEXT_PUBLIC_SITE_URL` may be regular Cloudflare variables.
- The site expects `NEXT_PUBLIC_SITE_URL=https://dalilarabtr.com`.
- `nodejs_compat` must remain enabled because some API routes depend on Node-compatible APIs.

Verification after deploy:

```bash
curl -sI https://dalilarabtr.com
curl -s https://dalilarabtr.com/server-sitemap-index.xml
curl -s https://dalilarabtr.com/robots.txt
```

Expected production headers include:

- `Server: cloudflare`
- `CF-RAY: ...`

If a deploy fails, inspect the Cloudflare Workers build log first, then the Worker runtime logs.
