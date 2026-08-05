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
      {
        source: '/articles',
        has: [{ type: 'query', key: 'page', value: '(?<n>\\d+)' }],
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
      { source: '/article/travel-permit-medical', destination: '/article/travel-permit', permanent: true },
      { source: '/article/travel-permit-visit', destination: '/article/travel-permit', permanent: true },
      { source: '/article/consumer-rights-complaint', destination: '/article/edevlet-tuketici-sikayet', permanent: true },
      { source: '/article/newborn-registration', destination: '/article/birth-registration-turkey', permanent: true },
      { source: '/article/mobile-lines-check', destination: '/article/edevlet-mobil-hat-sorgulama', permanent: true },
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
