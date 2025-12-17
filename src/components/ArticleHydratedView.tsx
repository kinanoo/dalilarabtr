'use client';

import { useEffect, useState } from 'react';
import type { ArticleData } from '@/lib/articles';
import ArticleView from '@/components/ArticleView';
import { useAdminArticle } from '@/lib/useAdminData';

export default function ArticleHydratedView({
  slug,
  initialArticle,
}: {
  slug: string;
  initialArticle: ArticleData;
}) {
  // 🆕 جلب المقال من لوحة التحكم
  const { articleData, loading } = useAdminArticle(slug);
  
  // استخدم بيانات لوحة التحكم إذا وجدت، وإلا استخدم البيانات الأولية
  const article = articleData || initialArticle;

  return <ArticleView article={article} slug={slug} />;
}
