'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import ArticleView from '@/components/ArticleView';
import type { ArticleData } from '@/lib/articles';
import { fetchRemoteArticleDataById } from '@/lib/remoteData';
import Link from 'next/link';

export default function ReadArticleClient() {
  const searchParams = useSearchParams();
  const id = useMemo(() => {
    const raw = searchParams?.get('id') || searchParams?.get('article') || '';
    return raw.trim();
  }, [searchParams]);

  const [loading, setLoading] = useState(false);
  const [article, setArticle] = useState<ArticleData | null>(null);

  useEffect(() => {
    if (!id) {
      setArticle(null);
      return;
    }

    let mounted = true;
    setLoading(true);
    fetchRemoteArticleDataById(id)
      .then((a) => {
        if (!mounted) return;
        setArticle(a);
      })
      .finally(() => {
        if (!mounted) return;
        setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [id]);

  if (!id) {
    return (
      <div className="flex-grow flex flex-col items-center justify-center text-center p-4">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-3">اختر مقالة لعرضها</h1>
        <p className="text-slate-600 dark:text-slate-300 mb-6">استخدم رابط المقالة مثل: /read?id=ARTICLE_ID</p>
        <Link href="/directory" className="bg-primary-600 text-white px-6 py-3 rounded-lg font-bold">
          الذهاب إلى الدليل
        </Link>
      </div>
    );
  }

  if (loading && !article) {
    return (
      <div className="flex-grow flex items-center justify-center p-6 text-slate-600 dark:text-slate-300">
        جارٍ التحميل…
      </div>
    );
  }

  if (!article) {
    return (
      <div className="flex-grow flex flex-col items-center justify-center text-center p-4">
        <h1 className="text-4xl font-bold text-slate-300 mb-4">404</h1>
        <p className="text-xl text-slate-600 mb-8">عذراً، هذه المقالة غير منشورة أو غير موجودة.</p>
        <Link href="/directory" className="bg-primary-600 text-white px-6 py-3 rounded-lg font-bold">
          العودة للدليل
        </Link>
      </div>
    );
  }

  return <ArticleView article={article} slug={id} />;
}
