'use client';

import { useEffect, useState } from 'react';
import type { ArticleData } from '@/lib/articles';
import ArticleView from '@/components/ArticleView';
import { fetchRemoteArticleDataById } from '@/lib/remoteData';

export default function ArticleHydratedView({
  slug,
  initialArticle,
}: {
  slug: string;
  initialArticle: ArticleData;
}) {
  const [article, setArticle] = useState<ArticleData>(initialArticle);

  useEffect(() => {
    let mounted = true;
    fetchRemoteArticleDataById(slug)
      .then((remote) => {
        if (!mounted) return;
        if (remote) setArticle(remote);
      })
      .catch(() => {
        // ignore
      });

    return () => {
      mounted = false;
    };
  }, [slug]);

  return <ArticleView article={article} slug={slug} />;
}
