'use client';

import ArticleView from '@/components/ArticleViewPremium';
import type { Article } from '@/lib/types';

export default function ArticleHydratedView({
  articleData,
  slug,
  initialComments,
  children
}: {
  articleData?: Article | null,
  slug: string,
  initialComments?: any[],
  children?: React.ReactNode
}) {
  if (!articleData) return null;

  return (
    <ArticleView
      article={articleData}
      slug={slug}
      initialComments={initialComments}
    >
      {children}
    </ArticleView>
  );
}
