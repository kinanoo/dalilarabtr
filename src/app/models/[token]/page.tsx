import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { LockKeyhole } from 'lucide-react';
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
    <main dir="rtl" className="flex min-h-dvh items-center justify-center bg-black px-4 py-10 text-white">
      <div className="max-w-lg rounded-3xl border border-white/10 bg-white/10 p-8 text-center shadow-2xl backdrop-blur">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 text-amber-300">
          <LockKeyhole size={30} />
        </div>
        <h1 className="text-2xl font-black">الرابط غير متاح</h1>
        <p className="mt-3 text-sm leading-7 text-white/70">
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

  return (
    <main dir="rtl" className="min-h-dvh bg-black text-white">
      <PublicModelViewer token={token} bundle={result.bundle} initialAssetId={requestedAssetId} />
    </main>
  );
}
