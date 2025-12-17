# Copilot instructions (daleel-arab-turkiye)

## Architecture & runtime
- **Next.js App Router** under `src/app/*` (React 19, Next 16).
- **Static export build**: `next.config.ts` sets `output: 'export'` and `images.unoptimized = true`.
  - Assume **no server runtime** (no server actions / no DB calls in server components). Prefer client-side fetch or build-time static data.
- Site is **Arabic RTL**: `src/app/layout.tsx` uses `<html lang="ar" dir="rtl">` and Cairo font.

## Data model (where content lives)
- Primary content is **local, typed TS data**:
  - Articles: `src/lib/articles.ts` (`ARTICLES: Record<string, ArticleData>`)
  - Navigation/config/services: `src/lib/data.ts`
  - Knowledge/search index: `src/lib/knowledgeBase.ts`, `src/components/GlobalSearch.tsx`
- Article routes:
  - Static article page: `src/app/article/[id]/page.tsx` reads `ARTICLES[id]` and uses `generateStaticParams()`.
  - If you add/edit an article, keep the **slug key stable** and update `lastUpdate` (YYYY-MM-DD).

## Supabase + demo mode (optional remote data)
- Supabase is **optional** and created only if env vars exist: `src/lib/supabaseClient.ts`.
- Remote fetch helpers live in `src/lib/remoteData.ts`.
- Admin UI is a **client page**: `src/app/admin/page.tsx`.
  - If Supabase is not configured, it can run in **demo mode** (localStorage) when `NEXT_PUBLIC_ADMIN_DEMO=1`.
  - Demo storage keys and update event are in `src/lib/remoteData.ts` (e.g. `DEMO_ARTICLES_KEY`, `DEMO_DATA_UPDATED_EVENT`).

## Client vs server conventions
- When using `localStorage`, always read/write in `useEffect` to avoid hydration mismatch.
  - Example pattern: `src/app/page.tsx` and `src/components/ArticleView.tsx`.
- For “remote overrides” of static content, prefer the existing pattern:
  - `src/components/ArticleHydratedView.tsx` starts with a static article, then hydrates with `fetchRemoteArticleDataById()`.

## Search (Arabic)
- Global search builds an index from `ARTICLES` and other sources.
  - See `src/components/GlobalSearch.tsx` and Arabic normalization helpers in `src/lib/arabicSearch.ts`.
- If you change how text is stored, keep it compatible with `normalizeArabic()` and token matching.

## Workflows (commands used in this repo)
- Dev: `npm run dev`
- Build (static export): `npm run build` (outputs to `out/`)
- Lint: `npm run lint`
- Tests: `npm test`, `npm run test:watch`, `npm run test:coverage` (Jest + React Testing Library)
- Content/link audits:
  - `npm run audit:content`, `npm run audit:quality` (writes reports under `reports/`)
  - `npm run check:links` (expects `http://localhost:3000`)

## Editing guidelines (project-specific)
- Keep UI Tailwind-first; dark mode is `class`-based (`tailwind.config.ts`) and theme state is via `next-themes`.
- Don’t add hard server dependencies; this project is designed to work as a static export.
- Prefer small, localized changes: update the relevant `src/lib/*` data and the single route/component that consumes it.
