'use client';

import ArticleView from '@/components/ArticleViewPremium';
import type { Article } from '@/lib/types';

export default function ArticleHydratedView({
  articleData,
  slug,
  initialComments
}: {
  articleData?: Article | null,
  slug: string,
  initialComments?: any[]
}) {
  if (!articleData) return null;

  return (
    <ArticleView
      article={articleData}
      slug={slug}
      initialComments={initialComments}
    />
  );
}
