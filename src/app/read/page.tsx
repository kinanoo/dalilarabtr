import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Suspense } from 'react';
import ReadArticleClient from './ReadArticleClient';

export default function ReadArticlePage() {
  return (
    <main className="min-h-screen flex flex-col">
      <Navbar />
      <Suspense
        fallback={
          <div className="flex-grow flex items-center justify-center p-6 text-slate-600 dark:text-slate-300">
            جارٍ التحميل…
          </div>
        }
      >
        <ReadArticleClient />
      </Suspense>
      <Footer />
    </main>
  );
}
