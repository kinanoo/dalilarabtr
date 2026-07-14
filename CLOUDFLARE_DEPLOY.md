# Deploying dalilarabtr.com to Cloudflare Workers

> ## ✅ تمّ النقل — الموقع حيّ على Cloudflare Workers
>
> **الحالة (يوليو 2026):** `dalilarabtr.com` منشور ويعمل على **Cloudflare
> Workers** منذ حوالي يونيو 2026. لم يعد على Vercel. الخطوات أدناه **مرجع
> تاريخي** لعملية النقل الأصلية — وليست مهمّة معلّقة عليك تنفيذها.
>
> **ملاحظة عن التكلفة:** حجم حزمة الـ Worker (~3.9MB) يتجاوز سقف الخطة
> المجانية (3MB مضغوطة)، لذا **الأرجح** أن المشروع على خطة **Workers Paid
> (~5$/شهر، سقف 10MB)**، لا على الخطة المجانية. هذا استنتاج من حجم الحزمة —
> راجِع فاتورة Cloudflare الفعلية للتأكيد. (النص القديم أدناه يقول "مجاني بدون
> بطاقة" — تجاهله، فهو غير دقيق لهذا الإعداد.)

Step-by-step guide for the Vercel → Cloudflare migration cutover. Written
for the project owner; assumes no prior Cloudflare experience.

**Historical note:** this file was written *before* the cutover to describe
the plan. The migration has since been completed — the site runs on
Cloudflare Workers. Kept for reference and for the troubleshooting section
at the bottom, which still applies to the live Worker.

---

## What you have when you arrive at this step

- All migration code is on `main` (Phases 1-5). Last commit: see `git log`.
- `wrangler.toml` + `open-next.config.ts` live at the repo root, ready.
- `npm run cf:build` script is wired up in `package.json`.
- The Vercel deployment is paused/suspended. Ignore it — we replace it
  end-to-end, then point the domain at Cloudflare and forget Vercel.

---

## Step 1 — Create a Cloudflare account (3 min)

1. Open https://dash.cloudflare.com/sign-up
2. Use your Gmail (`abdalmajeed718@gmail.com`) — Cloudflare supports email +
   password signup, no credit card required for the Free tier.
3. Verify your email when the confirmation lands.
4. Skip the "add a domain" prompt for now — we add the domain in Step 4.

You're on the Free tier. For the dashboard limits relevant to us:
- 100,000 Worker requests per day → ~3M/month (3× what Vercel Hobby gave you)
- Unlimited bandwidth
- Unlimited Workers
- Unlimited static assets

---

## Step 2 — Create the Worker via "Workers Builds" (Git integration)

This is Cloudflare's Vercel-equivalent: connect a GitHub repo, every push
triggers a build, every successful build deploys.

1. In the Cloudflare dashboard sidebar: **Workers & Pages** → **Create**.
2. Pick the **"Workers"** tab (not Pages — OpenNext outputs a Worker bundle).
3. Click **Connect to Git** → **GitHub** → authorize Cloudflare to read your
   repo list → select **`kinanoo/dalilarabtr`**.
4. Worker name: leave as `dalilarabtr` (matches `name` in wrangler.toml).
5. Production branch: **`main`**.

Build settings (CRITICAL — wrong settings = failed build):
- **Build command:** `npm install && npm run cf:build`
- **Deploy command:** `npx wrangler deploy --no-bundle`
- **Root directory:** leave empty

Click **Save and Deploy**. The first build runs for ~3-5 minutes.

---

## Step 3 — Add environment variables

Cloudflare doesn't auto-import these — you set them once.

Copy the values from `.env.pulled` in the repo (locally — never committed,
per .gitignore). They are NOT listed here — GitHub's secret scanning will
block any commit that pastes them into a tracked file.

In Worker settings → **Variables and Secrets**, add these as **Secrets**
(encrypted at rest, not visible in logs after you save):

```
SUPABASE_SERVICE_ROLE_KEY     = <from .env.pulled — line starting SUPABASE_SERVICE_ROLE_KEY>
VAPID_PRIVATE_KEY              = <from .env.pulled — line starting VAPID_PRIVATE_KEY>
GOOGLE_GEMINI_API_KEY          = <from .env.pulled — line starting GOOGLE_GEMINI_API_KEY>
GOOGLE_CLIENT_ID               = <from .env.pulled — line starting GOOGLE_CLIENT_ID>
GOOGLE_CLIENT_SECRET           = <from .env.pulled — line starting GOOGLE_CLIENT_SECRET>
ADMIN_EMAIL                    = <your admin email>
```

Add these as plain text **Variables** (these are intentionally public — the
`NEXT_PUBLIC_` prefix means Next.js inlines them into the browser bundle,
so any visitor can see them in DevTools anyway):

```
NEXT_PUBLIC_SUPABASE_URL       = <from .env.pulled>
NEXT_PUBLIC_SUPABASE_ANON_KEY  = <from .env.pulled — anon JWT>
NEXT_PUBLIC_SITE_URL           = https://dalilarabtr.com
NEXT_PUBLIC_GA_ID              = <from .env.pulled — GA tracking id>
NEXT_PUBLIC_GSC_VERIFICATION   = <from .env.pulled — Search Console token>
NEXT_PUBLIC_VAPID_PUBLIC_KEY   = <from .env.pulled — VAPID public key>
```

The full list of env-var names is what matters here — Cloudflare needs the
exact same names as the Vercel deployment had. Open `.env.pulled` in your
editor side-by-side and copy each value into the matching Cloudflare field.

Re-deploy after adding (Worker dashboard → Deployments → re-run latest).

---

## Step 4 — Verify on the auto-generated subdomain

Cloudflare gives you a free `*.workers.dev` URL (or similar). After deploy
succeeds, open it and click around:

- [ ] Homepage loads, hero + carousel render
- [ ] An article page (`/article/turkey-work-visa-guide`) — full body shows
- [ ] An admin page (sign in works — `/admin`)
- [ ] AI assistant — sends a message, gets a reply
- [ ] Push notification (admin → push broadcast — sends to your phone)
- [ ] Image rendering — check article hero photos load directly from Supabase

If any of these fail, capture the error from the browser console and
the Worker's Logs tab (dashboard → Worker → Logs). The most likely
issues are env-var typos or missing secrets.

---

## Step 5 — Point dalilarabtr.com at Cloudflare

This is the DNS cutover. Done once everything in Step 4 passes.

1. In Cloudflare dashboard sidebar: **Workers & Pages** → your Worker →
   **Settings** → **Domains & Routes**.
2. **Add Custom Domain** → enter `dalilarabtr.com`.
3. Cloudflare prompts you to add the domain to your account first if
   it's not already. Follow the wizard — it'll show you nameservers to
   set at your registrar.
4. Go to your domain registrar (where you bought `dalilarabtr.com` —
   GoDaddy / Namecheap / wherever). Find the DNS settings for the
   domain. Replace the existing nameservers with the two Cloudflare
   gave you.
5. Wait. Nameserver propagation takes 1-24 hours typically.
6. Once Cloudflare shows the domain as "Active", attach `dalilarabtr.com`
   to the Worker. Also add `www.dalilarabtr.com` if you want both to work.

Cloudflare auto-issues a TLS certificate within minutes of nameserver
propagation. No manual cert renewal — Cloudflare handles it forever.

---

## Step 6 — Verify dalilarabtr.com is now on Cloudflare

```
curl -sI https://dalilarabtr.com | grep -i "server\|cf-ray"
```

Expected output includes a `cf-ray` header — that proves the request hit
Cloudflare, not Vercel. If `cf-ray` is missing, the DNS hasn't propagated
yet to wherever you ran the command from — try again in an hour.

---

## Step 7 — Disconnect Vercel

Once dalilarabtr.com serves from Cloudflare for ~24 hours with no errors:

1. In Vercel: project → Settings → General → **Delete Project** (the
   site is already paused; deleting just removes the deployment record).
2. Cancel any remaining Vercel subscription (Account → Billing →
   Cancel Plan → confirm).

You now pay $0/month and Cloudflare serves all traffic.

---

## What to do if something breaks

- **Build fails in Cloudflare CI** — read the build log (Worker → Deployments
  → click failed deploy → View build logs). Most common cause is a missing
  env var that the build needs at compile time.
- **Worker deploys but pages return 500** — check the Worker's Logs tab
  for the runtime error. Pull the offending route open and check whether
  it uses Node APIs not covered by `nodejs_compat`.
- **Push notifications stop working** — verify `runtime = 'nodejs'` is
  still on `src/app/api/admin/push/route.ts` and that `nodejs_compat`
  is in `wrangler.toml`'s `compatibility_flags`.
- **Site looks fine but auth doesn't persist** — Cloudflare's Workers
  send cookies on a different domain than Vercel did during the testing
  period (`*.workers.dev` vs `dalilarabtr.com`). Once Step 5 is done
  and the domain matches, cookies work.

Roll-back path: if Cloudflare is broken and Vercel is back online, just
change the DNS nameservers at your registrar back to whatever they were
before Step 5 — propagation undoes within an hour or two. Nothing in
the code or DB has to change.
