import type { NextConfig } from "next";

// Shared CSP directives (reused for global + admin)
const cspBase = [
  "default-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://bcgwbffwzdlzlyjvlyhr.supabase.co https://lh3.googleusercontent.com https://www.google-analytics.com https://www.google.com https://www.transparenttextures.com https://googleads.g.doubleclick.net https://www.googleadservices.com",
  "font-src 'self' data:",
  "connect-src 'self' https://bcgwbffwzdlzlyjvlyhr.supabase.co https://*.supabase.co wss://*.supabase.co https://www.google-analytics.com https://www.googletagmanager.com https://static.cloudflareinsights.com https://cloudflareinsights.com wss://*.pusher.com https://www.google.com https://googleads.g.doubleclick.net https://www.googleadservices.com",
  "frame-src 'self' https://tckimlik.nvi.gov.tr",
  "frame-ancestors 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  // Block legacy plug-ins (Flash, Java) outright — closes a class of XSS
  // pivots that 'unsafe-inline' can't.
  "object-src 'none'",
  // Web workers and the service worker only ever come from our own origin
  // (or a blob created by us). Keeps an attacker from registering a hostile
  // worker via an injected script string.
  "worker-src 'self' blob:",
  "manifest-src 'self'",
];

// In DEV ONLY, React Fast Refresh / dev tooling needs eval(); production never
// does. Gate 'unsafe-eval' on NODE_ENV so it's present only under `next dev`,
// keeping the DEPLOYED CSP strict. (next build sets NODE_ENV=production, so the
// shipped CSP has no unsafe-eval — verified post-deploy.) Without this, the dev
// CSP blocked eval and broke the local preview renderer (screenshots timed out).
const DEV_EVAL = process.env.NODE_ENV !== 'production' ? " 'unsafe-eval'" : '';

// Global: unsafe-eval ONLY in dev (see DEV_EVAL); public prod pages don't need it.
const cspGlobal = [
  ...cspBase,
  // Cloudflare may inject its Web Analytics beacon at the edge; allow it so
  // production pages do not emit CSP console errors.
  `script-src 'self' 'unsafe-inline'${DEV_EVAL} https://www.googletagmanager.com https://www.google-analytics.com https://static.cloudflareinsights.com https://googleads.g.doubleclick.net https://www.googleadservices.com`,
].join('; ');

// Admin: same strict script-src as the public site — 'unsafe-eval' in PROD is
// gone. Its only stated reason was Monaco Editor in StaticPageEditor, and that
// component was dead code (nothing imported it, it was in no built bundle);
// both it and the @monaco-editor/react dependency are now deleted. No remaining
// dependency evals: TipTap/ProseMirror, Leaflet, framer-motion, date-fns don't,
// and our own src has no eval()/new Function(). unsafe-eval is a serious XSS
// amplifier, so keeping it for a deleted component would be a hole for nothing.
// DEV_EVAL still grants it under `next dev` for React Fast Refresh only.
// If a future admin feature genuinely needs eval, prefer a nonce/hash over
// re-opening unsafe-eval site-wide for /admin.
const cspAdmin = [
  ...cspBase,
  `script-src 'self' 'unsafe-inline'${DEV_EVAL} https://www.googletagmanager.com https://www.google-analytics.com https://static.cloudflareinsights.com https://googleads.g.doubleclick.net https://www.googleadservices.com`,
].join('; ');

// Shared security headers (applied to all routes)
const securityHeaders = [
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(self), interest-cohort=()' },
  { key: 'X-XSS-Protection', value: '1; mode=block' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
  { key: 'Cross-Origin-Resource-Policy', value: 'same-origin' },
];

const nextConfig: NextConfig = {
  //   output: 'export',

  // 🛡️ Security Headers
  async headers() {
    return [
      {
        // Global security headers (catch-all — applied first, overridden by specific rules below)
        source: '/(.*)',
        headers: [
          ...securityHeaders,
          { key: 'Content-Security-Policy', value: cspGlobal },
        ],
      },
      {
        // Static OG fallback image
        source: '/og-image.jpg',
        headers: [
          { key: 'Cross-Origin-Resource-Policy', value: 'cross-origin' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        // Admin pages: override CSP + prevent browser caching sensitive data,
        // and tell search engines to stay out (admin URLs should never
        // appear in Google results even if a link leaks).
        source: '/admin/:path*',
        headers: [
          { key: 'Content-Security-Policy', value: cspAdmin },
          { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate, proxy-revalidate' },
          { key: 'Pragma', value: 'no-cache' },
          { key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive' },
        ],
      },
      {
        // Admin API endpoints: same no-cache + no-index discipline
        source: '/api/admin/:path*',
        headers: [
          { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate, proxy-revalidate' },
          { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
        ],
      },
    ];
  },

  // 🔀 301 Redirects (old Arabic slugs → English)
  async redirects() {
    return [
      // Archive pagination moved from ?page=N to real paths (/articles/page/N)
      // so the route can be prerendered — reading searchParams forces dynamic
      // rendering and cost a Supabase query per visit. These keep every old
      // link and any already-indexed ?page= URL pointing at one canonical
      // address. Declared here rather than with redirect() in the page: an
      // in-render redirect returns 200 on this deployment, config redirects
      // correctly return 308.
      //
      // ⚠ `1` IS EXCLUDED ON PURPOSE — this pair used to be an infinite 308 loop.
      //
      // Next appends any query string the destination did not consume, so with
      // `\d+` matching page=1 the chain ran:
      //     /articles?page=1        → /articles/page/1?page=1
      //     /articles/page/1?page=1 → /articles?page=1        → …forever
      // Verified live on 6 Aug 2026: two hops, then back to the start. The
      // browser gives up with ERR_TOO_MANY_REDIRECTS and the page just hangs.
      //
      // The obvious fix — a separate page=1 rule pointing at `/articles?` to
      // drop the query — was tried and is WRONG on this Next version: the
      // trailing `?` is not honoured, the query is re-appended anyway, and
      // `/articles?page=1` then redirected to itself in a single hop. Measured
      // against a real `next start`, not assumed.
      //
      // So page 1 simply does not match. `/articles?page=1` renders the archive
      // root with an ignored query parameter, `/articles/page/1` still 308s to
      // `/articles`, and every chain terminates.
      {
        source: '/articles',
        has: [{ type: 'query', key: 'page', value: '(?<n>[2-9]\\d*|[1-9]\\d+)' }],
        destination: '/articles/page/:n',
        permanent: true,
      },
      // …and page 1 has exactly one home: /articles.
      { source: '/articles/page/1', destination: '/articles', permanent: true },
      // Duplicate consolidation, wave 1. Selected by MEASURED body overlap
      // (distinct-word intersection between each pair), not by title
      // similarity: 88%, 80%, 79%, 74% and 73% respectively. Same-topic pairs
      // that measured 32-36% overlap — family-reunion-syrians, travel-permit-2026,
      // birth-registration-turkey — were deliberately left alone; they read like
      // duplicates by title but are separate procedures.
      // The unique content of the three lm-alshaml fragments (the sworn
      // translation → notary → apostille chain, passport and bank-statement
      // windows, where to apply, who is excluded) was merged into the parent
      // article first, so nothing is lost behind these redirects.
      { source: '/article/family-reunion-conditions', destination: '/article/family-reunion', permanent: true },
      { source: '/article/family-reunion-documents', destination: '/article/family-reunion', permanent: true },
      { source: '/article/family-reunion-application', destination: '/article/family-reunion', permanent: true },
      // Education — three pillars with 20-to-131-word cards orbiting them. The
      // decision worth recording is the one NOT to merge: four scholarship pages
      // (1,077 / 645 / 581 / 413 words, 24% measured overlap between two) look
      // like a classic pile, and folding three into one would have destroyed
      // 1,639 words of real writing. Overlap at that level across substantial
      // guides is topical proximity, not duplication. They stay.
      // See sql/2026-08-06_merge_education_cluster.sql.
      { source: '/article/enroll-child-turkish-public-school', destination: '/article/school-registration-turkey', permanent: true },
      { source: '/article/school-transfer', destination: '/article/school-registration-turkey', permanent: true },
      { source: '/article/school-types-turkey', destination: '/article/school-registration-turkey', permanent: true },
      { source: '/article/kimlik-school-enrollment', destination: '/article/school-registration-turkey', permanent: true },
      { source: '/article/highschool-denklik', destination: '/article/diploma-denklik-syrians-arabs-2026', permanent: true },
      { source: '/article/school-equivalency', destination: '/article/diploma-denklik-syrians-arabs-2026', permanent: true },
      { source: '/article/education-universities', destination: '/article/study-in-turkey-universities-2026', permanent: true },
      { source: '/article/yos-exam-guide', destination: '/article/yks-vs-yos-placement-by-schooling-2026', permanent: true },
      { source: '/article/student-residence', destination: '/article/tourist-vs-student-residence-2025', permanent: true },
      // Leaving for Syria — the highest-consequence cluster on the site: a wrong
      // answer here costs a reader their temporary protection, not a wasted
      // trip. Two pages attached the WRONG security code to a consequence, and
      // the site own audited 125-code table is what disproved them: V-160 is an
      // address freeze, not a kimlik cancellation, and G-87 is a public-security
      // code, not the result of an irregular crossing. Neither label is carried.
      // One page was a broker route — apply through an unnamed organisation,
      // cross on verbal approval — and is deleted with nothing carried, the only
      // page in eleven passes handled that way.
      // See sql/2026-08-06_merge_return_cluster.sql.
      { source: '/article/travel-permit-2026', destination: '/article/travel-permit', permanent: true },
      { source: '/article/syria-visit-official', destination: '/article/syria-turkey-border-crossings-2026', permanent: true },
      { source: '/article/syria-travel-permits-kimlik-holders-2026', destination: '/article/syria-turkey-border-crossings-2026', permanent: true },
      { source: '/article/kimlik-leaving-turkey', destination: '/article/voluntary-return-syria-procedure-2026', permanent: true },
      { source: '/article/leaving-turkey-final', destination: '/article/voluntary-return-syria-procedure-2026', permanent: true },
      { source: '/article/exit-cancel-residence-return-card', destination: '/article/voluntary-return-syria-procedure-2026', permanent: true },
      { source: '/article/exit-close-bank-accounts', destination: '/article/voluntary-return-syria-procedure-2026', permanent: true },
      { source: '/article/article-%D8%B9%D9%86%D8%AF%D9%8A-%D9%83%D9%85%D9%84%D9%83-%D8%AD%D9%85%D8%A7%D9%8A%D8%A9-%D9%85%D8%A4%D9%82%D8%AA%D8%A9-%D9%88-%D9%86%D8%B2%D9%84%D8%AA-%D8%B9%D9%88%D8%AF%D8%A9-%D8%B7%D9%88%D8%B9%D8%A8%D8%A9-%D8%A5%D9%84%D9%89-%D8%B3%D9%88%D8%B1%D9%8A%D8%A7-%D9%88-%D8%A3%D8%B1%D8%BA%D8%A8-%D8%A8%D8%A7%D9%84%D8%B9%D9%88%D8%AF%D8%A9-%D8%A5%D9%84%D9%89-%D8%AA%D8%B1%D9%83%D9%8A%D8%A7', destination: '/article/voluntary-return-syria-procedure-2026', permanent: true },
      // Traffic and cars — the e-Devlet pattern again: seventeen of twenty-five
      // pages were December-2025 cards of 18-51 words, folded into the six real
      // guides written since. The page worth the trip was app-plate-turkey: 241
      // reads on seventy words, no source, and the cluster largest numbers
      // (140,000 lira for a fake plate, thirty days off the road). Every figure
      // checks out against Law 7574 — right and uncheckable at once. It also
      // omitted the early-payment discount, which costs its reader 35,000 lira.
      // See sql/2026-08-06_merge_traffic_cluster.sql.
      { source: '/article/auto-ehliyet-new-from-zero', destination: '/article/theory-exam-arabic-2026', permanent: true },
      { source: '/article/driver-theory-prep', destination: '/article/theory-exam-arabic-2026', permanent: true },
      { source: '/article/auto-ehliyet-conversion', destination: '/article/license-conversion-arab-countries-2026', permanent: true },
      { source: '/article/driving-license', destination: '/article/license-conversion-arab-countries-2026', permanent: true },
      { source: '/article/lost-driving-license', destination: '/article/driving-license-fees-2026', permanent: true },
      { source: '/article/buying-car-foreigner', destination: '/article/car-registration', permanent: true },
      { source: '/article/auto-noter-satis-transfer', destination: '/article/car-registration', permanent: true },
      { source: '/article/auto-plates-foreigner-m-plaka', destination: '/article/car-registration', permanent: true },
      { source: '/article/auto-mtv-payment', destination: '/article/car-registration', permanent: true },
      { source: '/article/auto-ekspertiz-guide', destination: '/article/tramer-hasar-kaydi-kilometre-kontrol-turkiye-2026', permanent: true },
      { source: '/article/tuvturk-appointment', destination: '/article/auto-tuvturk-inspection', permanent: true },
      { source: '/article/auto-license-suspension-points-alcohol', destination: '/article/traffic-fines', permanent: true },
      // Health and insurance. No dramatic finding — this is where the site
      // wrote the same page twice and then wrote a long good version without
      // deleting the short ones. Three pages on compulsory earthquake cover,
      // two on car insurance (neither of them the 1,025-word tariff page), two
      // on e-Nabiz (one of 24 words), two on booking a hospital appointment,
      // four restating the SGK/GSS pillar. Two boundaries were checked rather
      // than assumed: the private residence-insurance price page is a different
      // product from state GSS and is NOT merged into it, and the SGK-and-work
      // stub is about working without a permit so it goes to the permit pillar.
      // See sql/2026-08-06_merge_health_cluster.sql.
      { source: '/article/earthquake-insurance', destination: '/article/dask-earthquake-insurance', permanent: true },
      { source: '/article/housing-advanced-dask', destination: '/article/dask-earthquake-insurance', permanent: true },
      { source: '/article/car-insurance', destination: '/article/zorunlu-trafik-sigortasi-tavan-basamak-2026', permanent: true },
      { source: '/article/auto-insurance-trafik-vs-kasko', destination: '/article/zorunlu-trafik-sigortasi-tavan-basamak-2026', permanent: true },
      { source: '/article/e-nabiz-guide', destination: '/article/e-nabiz-electronic-health-record-2026', permanent: true },
      { source: '/article/hospital-appointment', destination: '/article/mhrs-guide-syrians-arabs-2026', permanent: true },
      { source: '/article/health-insurance-types', destination: '/article/sgk-gss-health-insurance-turkey-2026', permanent: true },
      { source: '/article/edevlet-sgk-dokumu', destination: '/article/sgk-gss-health-insurance-turkey-2026', permanent: true },
      { source: '/article/kimlik-health-services', destination: '/article/syria-temporary-protection-health-2026', permanent: true },
      { source: '/article/kimlik-work-and-sgk', destination: '/article/work-permit-turkey-2026', permanent: true },
      // Citizenship cluster. Almost no duplicate prose here — the problem was
      // correct claims with nothing behind them: six pages had an empty source
      // field, including the 228-read tracking hub and an 88-read page stating
      // a three-year legal condition (which is real — law 5901 article 16 — and
      // is now cited). The merges are small and follow one rule this cluster
      // made explicit: the survivor is always the page with more PROSE, because
      // the generator carries list items and deletes the page, so merging a long
      // page into a short one destroys writing. The generator now asserts it.
      // See sql/2026-08-06_merge_citizenship_cluster.sql.
      { source: '/article/citizenship-track-status', destination: '/article/citizenship-track-general', permanent: true },
      { source: '/article/citizenship-general', destination: '/article/turkish-citizenship-all-paths-2026', permanent: true },
      { source: '/article/citizenship-by-residence-2025', destination: '/article/turkish-citizenship-all-paths-2026', permanent: true },
      { source: '/article/citizenship-syrian-conditions', destination: '/article/citizenship-syrians', permanent: true },
      { source: '/article/citizenship-investment', destination: '/article/real-estate-citizenship', permanent: true },
      // Phone-line verification. BTK decision 2026/İK-THD/125 gives foreign
      // subscribers until 25 December 2026, with graded restriction starting 5
      // September. Three pages answered that one question and the traffic sat
      // on the two that answered it worst: one (418 reads) opened with «عاجل
      // ومهلة محدّدة» and never stated the deadline, and one (405 reads) had no
      // source at all and advised waiting a week, on the strength of a phone
      // call with an unnamed employee, five weeks before enforcement begins.
      // The page that cites the decision and every date correctly absorbs both.
      // See sql/2026-08-06_merge_phoneline_cluster.sql.
      { source: '/article/turkcell-yabanci-hat-kimlik-dogrulama-2026-06', destination: '/article/gecici-koruma-hat-guncelleme-2026', permanent: true },
      { source: '/article/tryqa-thdyth-byanat-kht-alhatf-shrka', destination: '/article/gecici-koruma-hat-guncelleme-2026', permanent: true },
      // Visa cluster. Two pillars measured as genuinely separate survive —
      // what a visa costs by nationality, and the seven types open to Syrians —
      // and they now cross-link, which they never did. Under them: five
      // 130-190-word type stubs overlapping each other 18-39% while the parent
      // already tabulates all seven, four December-2025 pages restating "which
      // visa do I need", and a treatment stub duplicating the medical page.
      // The reason this mattered beyond its size: eight of these pages sourced
      // their fees to a Facebook post, which CLAUDE.md forbids outright. See
      // sql/2026-08-06_merge_visa_cluster.sql.
      { source: '/article/turkey-transit-visa-syrians-2026', destination: '/article/syria-turkey-visa-types-2026', permanent: true },
      { source: '/article/turkey-business-visa-syrians-2026', destination: '/article/syria-turkey-visa-types-2026', permanent: true },
      { source: '/article/turkey-meeting-conference-visa-syrians-2026', destination: '/article/syria-turkey-visa-types-2026', permanent: true },
      { source: '/article/turkey-sailor-visa-syrians-2026', destination: '/article/syria-turkey-visa-types-2026', permanent: true },
      { source: '/article/turkey-truck-driver-visa-syrians-2026', destination: '/article/syria-turkey-visa-types-2026', permanent: true },
      { source: '/article/turkey-visa-from-syria', destination: '/article/syria-turkey-visa-types-2026', permanent: true },
      { source: '/article/turkey-treatment-visa-syrians-2026', destination: '/article/turkey-medical-visa', permanent: true },
      { source: '/article/turkey-visa-overview', destination: '/article/turkey-visa-types-2026', permanent: true },
      { source: '/article/turkey-evisa-guide', destination: '/article/turkey-visa-types-2026', permanent: true },
      { source: '/article/turkey-visa-europe-foreigners', destination: '/article/turkey-visa-types-2026', permanent: true },
      { source: '/article/turkey-visa-arab-countries', destination: '/article/turkey-visa-types-2026', permanent: true },
      // Address registration and closed neighbourhoods. The finding was not
      // duplication but wiring: /zones is a searchable checker over 1,166
      // neighbourhoods in 63 provinces, and twelve of the fifteen pages a
      // reader lands on when searching «حيّي مغلق» never linked to it — they
      // said "call 157, ask the muhtar". Two pillars survive because there are
      // two questions (is my neighbourhood open / must I declare my address);
      // five December-2025 pages restating one of them are folded in, and the
      // December-2025 Istanbul page gives way to the June-2026 sourced list.
      // See sql/2026-08-06_merge_address_cluster.sql.
      { source: '/article/address-registration-problems', destination: '/article/address-registration-closed', permanent: true },
      { source: '/article/identity-closed-address-reset', destination: '/article/address-registration-closed', permanent: true },
      { source: '/article/identity-adres-beyani-20-days-uavt', destination: '/article/syrian-address-update-mandate-turkey', permanent: true },
      { source: '/article/kimlik-address-proof', destination: '/article/syrian-address-update-mandate-turkey', permanent: true },
      { source: '/article/edevlet-adres-belgesi', destination: '/article/syrian-address-update-mandate-turkey', permanent: true },
      { source: '/article/istanbul-closed-areas', destination: '/article/istanbul-closed-neighborhoods-lift-2026', permanent: true },
      // e-Devlet directory: 33 pages that were one template published 33
      // times. Measured, not guessed — on a 331-article site the 28 most
      // textually similar PAIRS were all from this group, overlapping 50-65%,
      // while outside it only two pairs anywhere passed 30%. Identical
      // prerequisites, tips, fee line, warning and first step; ~38 words each
      // of their own. A directory entry is not an article, so each now lands on
      // its card on the hub — see src/lib/edevletServices.ts and
      // sql/2026-08-05_retire_edevlet_template_pages.sql.
      { source: '/article/edevlet-adima-tescilli-arac', destination: '/e-devlet-services#adima-tescilli-arac', permanent: true },
      { source: '/article/edevlet-adli-sicil-kaydi', destination: '/e-devlet-services#adli-sicil-kaydi', permanent: true },
      { source: '/article/edevlet-adres-degisikligi-bildirimi', destination: '/e-devlet-services#adres-degisikligi-bildirimi', permanent: true },
      { source: '/article/edevlet-aile-hekim-bilgisi-sorgulama', destination: '/e-devlet-services#aile-hekim-bilgisi-sorgulama', permanent: true },
      { source: '/article/edevlet-aracimin-cekildigi-otopark-bilgisi-sorgulama', destination: '/e-devlet-services#aracimin-cekildigi-otopark-bilgisi-sorgulama', permanent: true },
      { source: '/article/edevlet-borc-durumu-sorgulama', destination: '/e-devlet-services#borc-durumu-sorgulama', permanent: true },
      { source: '/article/edevlet-cimer-basvuru', destination: '/e-devlet-services#cimer-basvuru', permanent: true },
      { source: '/article/edevlet-ck-bogazici-elektrik', destination: '/e-devlet-services#ck-bogazici-elektrik', permanent: true },
      { source: '/article/edevlet-dava-dosyasi-sorgulama', destination: '/e-devlet-services#dava-dosyasi-sorgulama', permanent: true },
      { source: '/article/edevlet-dogum-raporu', destination: '/e-devlet-services#dogum-raporu', permanent: true },
      { source: '/article/edevlet-doviz', destination: '/e-devlet-services#doviz', permanent: true },
      { source: '/article/edevlet-e-nabiz', destination: '/e-devlet-services#e-nabiz', permanent: true },
      { source: '/article/edevlet-evlenme-ehliyet', destination: '/e-devlet-services#evlenme-ehliyet', permanent: true },
      { source: '/article/edevlet-ikamet-kisisel-bilgi', destination: '/e-devlet-services#ikamet-kisisel-bilgi', permanent: true },
      { source: '/article/edevlet-imei-sorgulama', destination: '/e-devlet-services#imei-sorgulama', permanent: true },
      { source: '/article/edevlet-iski-su', destination: '/e-devlet-services#iski-su', permanent: true },
      { source: '/article/edevlet-mhrs', destination: '/e-devlet-services#mhrs', permanent: true },
      { source: '/article/edevlet-mobil-hat-sorgulama', destination: '/e-devlet-services#mobil-hat-sorgulama', permanent: true },
      { source: '/article/edevlet-nvi-nufus-kayit-ornegi', destination: '/e-devlet-services#nvi-nufus-kayit-ornegi', permanent: true },
      { source: '/article/edevlet-nvi-yerlesim-yeri', destination: '/e-devlet-services#nvi-yerlesim-yeri', permanent: true },
      { source: '/article/edevlet-operator-debt', destination: '/e-devlet-services#operator-debt', permanent: true },
      { source: '/article/edevlet-plaka-ceza', destination: '/e-devlet-services#plaka-ceza', permanent: true },
      { source: '/article/edevlet-sgk-hizmet-dokumu', destination: '/e-devlet-services#sgk-hizmet-dokumu', permanent: true },
      { source: '/article/edevlet-sgk-kayit-belgesi', destination: '/e-devlet-services#sgk-kayit-belgesi', permanent: true },
      { source: '/article/edevlet-sirketlerim', destination: '/e-devlet-services#sirketlerim', permanent: true },
      { source: '/article/edevlet-surucu-basvuru-durum', destination: '/e-devlet-services#surucu-basvuru-durum', permanent: true },
      { source: '/article/edevlet-surucu-ceza-nokta-belgesi', destination: '/e-devlet-services#surucu-ceza-nokta-belgesi', permanent: true },
      { source: '/article/edevlet-tapu-harc', destination: '/e-devlet-services#tapu-harc', permanent: true },
      { source: '/article/edevlet-tapu-telefon-beyan', destination: '/e-devlet-services#tapu-telefon-beyan', permanent: true },
      { source: '/article/edevlet-tuketici-sikayet', destination: '/e-devlet-services#tuketici-sikayet', permanent: true },
      { source: '/article/edevlet-vergi-borcu', destination: '/e-devlet-services#vergi-borcu', permanent: true },
      { source: '/article/edevlet-webtapu', destination: '/e-devlet-services#webtapu', permanent: true },
      { source: '/article/edevlet-yol-izin', destination: '/e-devlet-services#yol-izin', permanent: true },
      // Syrian-consulate cluster — the site's highest-demand one, and the one
      // that was least accurate. Three URLs competed for «القنصلية السورية في
      // غازي عنتاب» (2,451 reads between them), and the most-read of the three
      // told readers to wait for a booking system the ministry's own page says
      // is already live. Booking, attestation and passport renewal each had a
      // second thin page restating them. Facts moved into the survivors and the
      // contradictions fixed first — see
      // sql/2026-08-05_merge_consulate_cluster.sql.
      { source: '/article/gaziantep-syrian-consulate-opens-2026-06-11', destination: '/article/syrian-consulate-gaziantep-guide', permanent: true },
      { source: '/article/alqnslya-alswrya-fy-ghazy-antab-mttlbat', destination: '/article/syrian-consulate-gaziantep-guide', permanent: true },
      { source: '/article/syrian-consular-appointments-app', destination: '/article/syrian-consulate-appointment', permanent: true },
      // Deleted rather than merged: it routed passport bookings through
      // syrian-embassy.com, which is not a government domain. Nothing on it was
      // worth carrying to the page that describes the real system.
      { source: '/article/passport-booking-system-legacy', destination: '/article/syrian-consulate-appointment', permanent: true },
      { source: '/article/agency-attestation-legacy', destination: '/article/syrian-document-attestation', permanent: true },
      { source: '/article/identity-passport-renewal-update', destination: '/article/syrian-passport-renewal', permanent: true },
      // Work-permit cluster: fourteen pages on one topic, six of them between
      // 102 and 189 words asking the same question a different way (how do I
      // apply / renew / what papers / what fees). Competitors publish ONE
      // comprehensive page each, which is most of why they outrank us here.
      // Facts moved into the two survivors first — see
      // sql/2026-08-05_merge_work_permit_cluster.sql.
      { source: '/article/work-permit-application', destination: '/article/work-permit-turkey-2026', permanent: true },
      { source: '/article/work-permit-documents', destination: '/article/work-permit-turkey-2026', permanent: true },
      { source: '/article/work-permit-renewal', destination: '/article/work-permit-turkey-2026', permanent: true },
      { source: '/article/work-permit-fees-2026', destination: '/article/work-permit-turkey-2026', permanent: true },
      { source: '/article/work-permit-residence', destination: '/article/work-permit-turkey-2026', permanent: true },
      { source: '/article/employment-work-permit-kimlik-vs-tourist', destination: '/article/work-permit-turkey-2026', permanent: true },
      { source: '/article/exemption-work-permit-full-guide-2026-06', destination: '/article/muafiyet-bilgi-formu-kimlik-work-permit-exemption-sgk-2026', permanent: true },
      // NOTE: work-permit-exemption-2026, trader-leave-work-permit-turkey and
      // work-permit-students are NOT here. They look like members of the cluster
      // by slug and are not: the first is about law 6735's profession-based
      // exemptions, the second is about a kimlik holder entering Syria and
      // coming back (385 reads, nothing to do with permits despite the name),
      // the third serves students on part-time work.
      // Lost-kimlik consolidation: three URLs competed for «ضاع الكملك، شو
      // بعمل؟». Their unique facts were folded into the 1,942-word canonical
      // (body AND card columns) before the rows were deleted — see
      // sql/2026-08-04_merge_lost_kimlik.sql.
      { source: '/article/kimlik-lost-damaged', destination: '/article/lost-kimlik-replacement', permanent: true },
      { source: '/article/identity-lost-card-replacement', destination: '/article/lost-kimlik-replacement', permanent: true },
      { source: '/article/turkish-citizenship-syrians', destination: '/article/citizenship-syrians', permanent: true },
      // NOTE: this redirect predates the row deletion. The article kept
      // existing in the database behind it, so it stayed in category listings
      // and the sitemap while its URL bounced elsewhere — merged for real in
      // sql/2026-08-05_merge_duplicate_clusters.sql.
      { source: '/article/school-registration', destination: '/article/school-registration-turkey', permanent: true },
      // Duplicate clusters found by comparing the titles of all 355 live
      // articles within related categories, then reading each candidate. Their
      // facts were moved into the survivors VERBATIM — list items and field
      // values copied across, nothing re-written, anything the survivor already
      // said dropped. See sql/2026-08-05_merge_duplicate_clusters.sql.
      //
      // Deliberately NOT merged, because a title-similarity signal flags them
      // but they are not duplicates: the Adana/Hatay/Mersin city guides (three
      // cities, one template), CK electricity vs İSKİ water, and cars-in-your-
      // name vs phone-lines-in-your-name.
      //
      // Two of these are also targets of the consultant routing table
      // (src/lib/consultant-routing.ts), which links to /article/<slug>
      // directly — the redirects below are what keeps that flow off a 404.
      // Kızılay/SUY was one topic spread over four URLs — the 2,406-character
      // guide plus three stubs of 722, 516 and 491 characters holding 65 views
      // between them. Two of the three had already been reduced to
      // «للتفاصيل الكاملة: <link>» pointers and left live, so they kept being
      // indexed and kept costing a reader a second click. Their unique content
      // is merged into the guide; these send the URLs there.
      // Bank-account cluster: two stubs (174 and 325 chars) merged into the
      // rebuilt bank-account-opening guide — same consolidation pattern as
      // Kızılay below.
      // Personal-finance batch: Findeks + the answered KKM question fold into
      // the bank guide; KEP folds into the e-İmza page.
      { source: '/article/finance-findeks-credit-score', destination: '/article/bank-account-opening', permanent: true },
      { source: '/article/finance-kkm-status', destination: '/article/bank-account-opening', permanent: true },
      { source: '/article/digital-kep', destination: '/article/digital-e-imza', permanent: true },
      // Housing batch: five rent stubs fold into the rebuilt renting guide;
      // the two utility stubs fold into the existing 21K-char subscriptions guide.
      { source: '/article/rent-increase-limit', destination: '/article/renting-house', permanent: true },
      { source: '/article/deposit-return', destination: '/article/renting-house', permanent: true },
      { source: '/article/digital-lease-contract', destination: '/article/renting-house', permanent: true },
      { source: '/article/housing-advanced-aidat-dispute', destination: '/article/renting-house', permanent: true },
      { source: '/article/housing-advanced-neighbor-noise', destination: '/article/renting-house', permanent: true },
      { source: '/article/utilities-registration', destination: '/article/home-subscriptions-turkey-2026', permanent: true },
      { source: '/article/exit-utility-deposit-refund', destination: '/article/home-subscriptions-turkey-2026', permanent: true },
      // Consumer cluster: the 14-day-return, frauds and cybercrime stubs fold
      // into the arbitration-committee guide (the remedy is the spine).
      { source: '/article/consumer-14-day-return', destination: '/article/consumer-arbitration-hakem-heyeti', permanent: true },
      { source: '/article/consumer-common-frauds', destination: '/article/consumer-arbitration-hakem-heyeti', permanent: true },
      { source: '/article/consumer-cybercrime-report', destination: '/article/consumer-arbitration-hakem-heyeti', permanent: true },
      // Medical tourism: the three per-treatment stubs (unsourced dollar price
      // tables) fold into the authorization-framework guide.
      { source: '/article/medical-tourism-dental', destination: '/article/medical-tourism-guide', permanent: true },
      { source: '/article/medical-tourism-eyes', destination: '/article/medical-tourism-guide', permanent: true },
      { source: '/article/hair-transplant-guide', destination: '/article/medical-tourism-guide', permanent: true },
      // HGS cluster: the OGS-titled stub (OGS was discontinued 31/03/2022) and
      // the plate-query stub fold into the rebuilt HGS guide.
      { source: '/article/auto-hgs-ogs', destination: '/article/hgs-highway-toll-system', permanent: true },
      { source: '/article/toll-violation-check', destination: '/article/hgs-highway-toll-system', permanent: true },
      // Marriage cluster: two civil-marriage stubs fold into the arts-12/13
      // canonical (the sheikh-marriage warning migrated there first).
      { source: '/article/marriage-registration', destination: '/article/civil-marriage-registration-turkey', permanent: true },
      { source: '/article/family-civil-marriage-municipality', destination: '/article/civil-marriage-registration-turkey', permanent: true },
      // Birth cluster: two stubs merged into the rebuilt birth-registration guide.
      { source: '/article/kimlik-newborn-addition', destination: '/article/birth-registration-turkey', permanent: true },
      { source: '/article/family-birth-registration-flow', destination: '/article/birth-registration-turkey', permanent: true },
      { source: '/article/bank-account-documents', destination: '/article/bank-account-opening', permanent: true },
      { source: '/article/kimlik-bank-sim', destination: '/article/bank-account-opening', permanent: true },
      { source: '/article/red-crescent-card', destination: '/article/kizilay-card-application', permanent: true },
      { source: '/article/kizilay-card-problems', destination: '/article/kizilay-card-application', permanent: true },
      { source: '/article/kizilay-card-apply', destination: '/article/kizilay-card-application', permanent: true },
      { source: '/article/travel-permit-medical', destination: '/article/travel-permit', permanent: true },
      { source: '/article/travel-permit-visit', destination: '/article/travel-permit', permanent: true },
      // These two pointed at e-Devlet pages that the directory pass later
      // retired, which turned them into two-hop redirects. They now land on the
      // card directly. A redirect whose destination is itself redirected is not
      // broken, but it leaks link equity and it is invisible in review — the
      // ghost-row guard now fails on it.
      { source: '/article/consumer-rights-complaint', destination: '/e-devlet-services#tuketici-sikayet', permanent: true },
      { source: '/article/newborn-registration', destination: '/article/birth-registration-turkey', permanent: true },
      { source: '/article/mobile-lines-check', destination: '/e-devlet-services#mobil-hat-sorgulama', permanent: true },
      // Duplicate pair with reversed slugs, both thin, both competing for the
      // same query. kimlik-update-data was the weaker of the two AND stated the
      // address-change deadline as "45 days" — the law (5490, md. 50-51, and
      // md. 8 for foreigners) says twenty WORKING days, so a reader trusting it
      // would miss the window and be fined. It is retired into the surviving
      // article, which now carries the corrected figure with its source.
      {
        source: '/article/kimlik-update-data',
        destination: '/article/kimlik-data-update',
        permanent: true,
      },
      // Codes index: Turkish edition moved from ?lang=tr to /codes/tr, same
      // reason. hreflang on both pages now points at these paths.
      {
        source: '/codes',
        has: [{ type: 'query', key: 'lang', value: 'tr' }],
        destination: '/codes/tr',
        permanent: true,
      },
      {
        source: '/article/%D8%AF%D9%84%D9%8A%D9%84-%D8%A7%D9%84%D8%AA%D9%82%D8%AF%D9%8A%D9%85-%D8%B9%D9%84%D9%89-%D8%A7%D9%84%D8%AC%D9%86%D8%B3%D9%8A%D8%A9-%D8%A7%D9%84%D8%AA%D8%B1%D9%83%D9%8A%D8%A9-%D8%B9%D8%A8%D8%B1-%D8%A7%D9%84%D8%B2%D9%88%D8%A7%D8%AC-%D9%84%D9%84%D8%B3%D9%88%D8%B1%D9%8A%D9%8A%D9%86-%D9%81%D9%8A-%D8%BA%D8%A7%D8%B2%D9%8A-%D8%B9%D9%86%D8%AA%D8%A7%D8%A8',
        destination: '/article/turkish-citizenship-marriage-syrians-gaziantep',
        permanent: true,
      },
      // Work visa article — Arabic ID → English slug
      {
        source: '/article/%D8%AA%D8%A3%D8%B4%D9%8A%D8%B1%D8%A9-%D8%A7%D9%84%D8%B9%D9%85%D9%84-%D9%81%D9%8A-%D8%AA%D8%B1%D9%83%D9%8A%D8%A7-%D8%AF%D9%84%D9%8A%D9%84-%D8%B4%D8%A7%D9%85%D9%84-%D9%84%D9%84%D8%AD%D8%B5%D9%88%D9%84-%D8%B9%D9%84%D9%89-%D9%81%D9%8A%D8%B2%D8%A7-%D8%A7%D9%84%D8%B9%D9%85%D9%84-%D8%A7%D9%84%D8%AA%D8%B1%D9%83%D9%8A%D8%A9-mmculitg',
        destination: '/article/turkey-work-visa-guide',
        permanent: true,
      },
      // Work visa article — old Arabic slug → English slug
      {
        source: '/article/%D8%AA%D8%A3%D8%B4%D9%8A%D8%B1%D8%A9-%D8%A7%D9%84%D8%B9%D9%85%D9%84-%D9%81%D9%8A-%D8%AA%D8%B1%D9%83%D9%8A%D8%A7-%D8%AF%D9%84%D9%8A%D9%84-%D8%B4%D8%A7%D9%85%D9%84-%D9%84%D9%84%D8%AD%D8%B5%D9%88%D9%84-%D8%B9%D9%84%D9%89-%D9%81%D9%8A%D8%B2%D8%A7-%D8%A7%D9%84%D8%B9%D9%85%D9%84-%D8%A7%D9%84%D8%AA%D8%B1%D9%83%D9%8A%D8%A9',
        destination: '/article/turkey-work-visa-guide',
        permanent: true,
      },
      // Per-service request landing pages were removed — send any old
      // /request/<serviceId> URL to the main request page (no 404s).
      {
        source: '/request/:service',
        destination: '/request',
        permanent: true,
      },
      // /dictionary was a page whose whole body was `redirect('/directory')`.
      // On this deployment an in-render redirect() answers 200 with a meta
      // refresh and no canonical — a soft-404 shape, not a redirect. Config
      // level redirects DO emit a real 308 here, so the page was deleted and
      // the mapping lives here instead.
      {
        source: '/dictionary',
        destination: '/directory',
        permanent: true,
      },
    ];
  },

  // 🖼️ Image optimization
  //
  // unoptimized: true - required for the Cloudflare Workers/OpenNext runtime.
  // This deployment does not run a compatible Next image optimizer; if we leave
  // optimization on, every <Image> renders a /_next/image URL that 404s.
  //
  // What changes for users:
  //   - Images load directly from Supabase Storage at their original
  //     dimensions. No on-the-fly WebP/AVIF conversion or resize.
  //   - This is fine for us because Supabase Storage already serves
  //     reasonably-sized images uploaded by admin (we watermark + size
  //     them at upload time — see lib/watermark.ts).
  //   - `priority`, `fill`, `sizes`, `onError`, and `placeholder` still
  //     work. Only the URL rewriting through /_next/image is disabled.
  //   - No `placeholder="blur"` is used anywhere in src/ (grep confirms),
  //     so we don't need to ship a static blurDataURL fallback.
  //
  // remotePatterns + formats + deviceSizes + imageSizes are retained as
  // documentation of what URLs we expect and what sizes Supabase serves —
  // they're ignored when unoptimized=true but document the only external image
  // host the site should load from.
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'bcgwbffwzdlzlyjvlyhr.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'bcgwbffwzdlzlyjvlyhr.supabase.co',
        port: '',
        pathname: '/storage/v1/render/image/public/**',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        port: '',
        pathname: '/**',
      },
    ],
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // 🛡️ Hide X-Powered-By header
  poweredByHeader: false,

  // ⚡ Performance
  compress: true,

  // 📦 Tree-shake large icon/animation libraries
  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion', 'date-fns'],
  },

  // 🔕 Strip console.* (except error/warn) from the PRODUCTION bundle. The site
  // has many logger/console calls; dropping them shrinks client JS a touch and
  // stops debug noise/info leaking to visitors' consoles. error+warn are kept
  // so genuine problems still surface.
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error', 'warn'] } : false,
  },

  // 🔄 React Strict Mode — enabled for better performance and bug detection
  reactStrictMode: true,

  // 🔕 Hide dev indicator
  devIndicators: ({ buildActivity: false } as unknown) as NextConfig['devIndicators'],

  allowedDevOrigins: ['http://192.168.18.3:3000', '192.168.18.3:3000'],
};

export default nextConfig;
