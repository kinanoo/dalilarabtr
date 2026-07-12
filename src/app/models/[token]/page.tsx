import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { AlertCircle, Clock3, Images, LockKeyhole } from 'lucide-react';
import PublicModelViewer from '@/components/models/PublicModelViewer';
import {
  getPublicModelContext,
  getPublicModelBundle,
  hashVisitIp,
  recordModelLinkView,
  type PublicModelFailure,
} from '@/lib/models/server';
import { SITE_CONFIG } from '@/lib/config';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type Props = {
  params: Promise<{ token: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getRequestedAssetId(searchParams?: Record<string, string | string[] | undefined>): string | null {
  const raw = searchParams?.asset || searchParams?.image || searchParams?.photo;
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (!value) return null;
  const clean = value.trim().replace(/[^A-Za-z0-9-]/g, '');
  return clean || null;
}

function buildModelPageUrl(token: string, assetId?: string | null) {
  const url = new URL(`/models/${encodeURIComponent(token)}`, SITE_CONFIG.siteUrl);
  if (assetId) url.searchParams.set('asset', assetId);
  return url.toString();
}

function buildModelPreviewImageUrl(token: string, assetId: string) {
  const url = new URL(`/api/models/${encodeURIComponent(token)}/preview-image`, SITE_CONFIG.siteUrl);
  url.searchParams.set('asset', assetId);
  return url.toString();
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { token } = await params;
  const search = searchParams ? await searchParams : undefined;
  const requestedAssetId = getRequestedAssetId(search);
  const pageUrl = buildModelPageUrl(token, requestedAssetId);
  const fallbackTitle = 'موديلس - رابط خاص';
  const fallbackDescription = 'صفحة نماذج خاصة مؤقتة.';
  const fallbackImage = `${SITE_CONFIG.siteUrl}/og-banner.jpg`;

  const context = await getPublicModelContext(token);
  if (!context.ok) {
    return {
      title: fallbackTitle,
      description: fallbackDescription,
      robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
      openGraph: {
        title: fallbackTitle,
        description: fallbackDescription,
        url: pageUrl,
        type: 'website',
        images: [{ url: fallbackImage, width: 1200, height: 630, alt: fallbackTitle }],
      },
      twitter: {
        card: 'summary_large_image',
        title: fallbackTitle,
        description: fallbackDescription,
        images: [fallbackImage],
      },
    };
  }

  const { collection, assets } = context;
  const title = `${collection.title} - موديلس`;
  const description = collection.description || 'نماذج خاصة مؤقتة للمعاينة.';
  const previewAsset = collection.access_pin_hash
    ? null
    : requestedAssetId
      ? assets.find((asset) => asset.id === requestedAssetId && !asset.access_pin_hash) || null
      : assets.find((asset) => !asset.access_pin_hash);
  const previewImage = previewAsset
    ? buildModelPreviewImageUrl(token, previewAsset.id)
    : fallbackImage;

  return {
    title,
    description,
    robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
    openGraph: {
      title,
      description,
      url: pageUrl,
      type: 'website',
      images: [{ url: previewImage, width: 1200, height: 630, alt: collection.title }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [previewImage],
    },
  };
}

function getVisitorIp(headerList: Headers): string | null {
  const cf = headerList.get('cf-connecting-ip');
  if (cf) return cf;
  const forwarded = headerList.get('x-forwarded-for')?.split(',')[0]?.trim();
  if (forwarded) return forwarded;
  return headerList.get('x-real-ip');
}

function failureText(reason: PublicModelFailure) {
  if (reason === 'empty') return 'الرابط صحيح، لكن لا توجد صور متاحة حالياً. اطلب رابطاً جديداً من المصدر.';
  return 'انتهت صلاحية الرابط أو لم يعد متاحاً. اطلب رابطاً جديداً من المصدر.';
}

function UnavailableState({ reason }: { reason: PublicModelFailure }) {
  return (
    <main dir="rtl" className="min-h-[72vh] flex items-center justify-center px-4 py-16">
      <div className="max-w-lg rounded-3xl border border-amber-200 bg-white p-8 text-center shadow-2xl shadow-amber-900/5 dark:border-amber-900/50 dark:bg-slate-900">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 dark:bg-amber-900/25 dark:text-amber-300">
          <LockKeyhole size={30} />
        </div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white">الرابط غير متاح</h1>
        <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
          {failureText(reason)}
        </p>
      </div>
    </main>
  );
}

export default async function ModelSharePage({ params, searchParams }: Props) {
  const { token } = await params;
  const search = searchParams ? await searchParams : undefined;
  const requestedAssetId = getRequestedAssetId(search);
  const result = await getPublicModelBundle(token);

  if (!result.ok) return <UnavailableState reason={result.reason} />;

  const headerList = await headers();
  const ipHash = await hashVisitIp(getVisitorIp(headerList));
  await recordModelLinkView({
    linkId: result.bundle.link.id,
    ipHash,
    userAgent: headerList.get('user-agent'),
    referrer: headerList.get('referer'),
  });

  const expiresAt = new Date(result.bundle.link.expires_at);

  return (
    <main dir="rtl" className="min-h-screen bg-slate-50/80 px-4 py-8 dark:bg-slate-950">
      <section className="mx-auto max-w-6xl">
        <div className="mb-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="h-1 bg-gradient-to-l from-emerald-500 via-teal-500 to-cyan-500" />
          <div className="p-5 sm:p-7">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700 dark:bg-emerald-900/25 dark:text-emerald-300">
                  <Images size={14} />
                  موديلس
                </div>
                <h1 className="text-2xl font-black text-slate-950 dark:text-white sm:text-4xl">
                  {result.bundle.collection.title}
                </h1>
                {result.bundle.collection.description && (
                  <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-300">
                    {result.bundle.collection.description}
                  </p>
                )}
              </div>
              <div className="rounded-2xl bg-slate-50 p-3 text-xs font-bold text-slate-500 dark:bg-slate-800/60 dark:text-slate-300">
                <div className="flex items-center gap-2">
                  <Clock3 size={15} className="text-emerald-500" />
                  متاح حتى
                </div>
                <div dir="ltr" className="mt-1 tabular-nums text-slate-900 dark:text-white">
                  {expiresAt.toLocaleString('tr-TR')}
                </div>
              </div>
            </div>
            <div className="mt-4 flex items-start gap-2 rounded-2xl bg-amber-50 px-4 py-3 text-xs leading-6 text-amber-800 dark:bg-amber-900/20 dark:text-amber-200">
              <AlertCircle size={16} className="mt-1 shrink-0" />
              عند انتهاء صلاحية الرابط لن تظهر هذه النماذج. اطلب رابطاً جديداً من المصدر عند الحاجة.
            </div>
          </div>
        </div>

        <PublicModelViewer token={token} bundle={result.bundle} initialAssetId={requestedAssetId} />
      </section>
    </main>
  );
}
