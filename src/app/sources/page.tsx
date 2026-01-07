'use client';

import Footer from '@/components/Footer';
import PageHero from '@/components/PageHero';
import { useAdminSources } from '@/lib/useAdminData';
import { Building2, ExternalLink, ShieldCheck, Globe, Copy, Check, Loader2 } from 'lucide-react';
import { useState } from 'react';

function SourceCard({ source }: { source: { id: string; name: string; url: string; desc: string } }) {
  const [copied, setCopied] = useState(false);

  const shortUrl = (() => {
    try {
      const url = new URL(source.url);
      return url.hostname.replace('www.', '');
    } catch {
      return source.url.slice(0, 25) + '...';
    }
  })();

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(source.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <a
      href={source.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col h-full"
    >
      <div className="h-1 bg-gradient-to-r from-blue-500 to-cyan-500 group-hover:h-1.5 transition-all" />

      <div className="p-4 sm:p-5 flex-grow flex flex-col">
        <div className="flex items-start gap-3 mb-3">
          <div className="p-2.5 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-colors flex-shrink-0">
            <ShieldCheck size={20} />
          </div>
          <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base leading-snug line-clamp-2 group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors flex-1 min-w-0">
            {source.name}
          </h3>
        </div>

        <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm leading-relaxed line-clamp-2 flex-grow">
          {source.desc}
        </p>
      </div>

      <div className="px-4 sm:px-5 pb-4 sm:pb-5">
        <div className="flex items-center justify-between gap-2 bg-slate-50 dark:bg-slate-800/60 rounded-xl px-3 py-2.5 border border-slate-100 dark:border-slate-700/50">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <Globe size={14} className="text-blue-500 flex-shrink-0" />
            <span className="text-xs font-mono text-blue-600 dark:text-blue-400 truncate">
              {shortUrl}
            </span>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              onClick={handleCopy}
              className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-colors"
              title="نسخ الرابط"
            >
              {copied ? (
                <Check size={14} className="text-green-500" />
              ) : (
                <Copy size={14} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300" />
              )}
            </button>
            <ExternalLink size={14} className="text-slate-400 group-hover:text-blue-500 transition-colors" />
          </div>
        </div>
      </div>
    </a>
  );
}

export default function SourcesPage() {
  const { sources, loading } = useAdminSources();

  return (
    <main className="flex flex-col min-h-screen">
      <PageHero
        title="المصادر الحكومية الرسمية"
        description="روابط مباشرة وآمنة من المواقع الحكومية التركية."
        icon={<Building2 className="w-10 h-10 md:w-12 md:h-12 text-accent-500" />}
      />

      <div className="max-w-6xl mx-auto px-4 py-8 sm:py-12 w-full">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={40} className="animate-spin text-emerald-600" />
          </div>
        ) : (
          <>
            {/* إحصائية */}
            <div className="flex items-center justify-center gap-2 mb-8 text-sm text-slate-500 dark:text-slate-400">
              <ShieldCheck size={16} className="text-green-500" />
              <span>{sources.length} رابط حكومي موثوق</span>
            </div>

            {/* شبكة البطاقات */}
            {sources.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                {sources.map((source) => (
                  <SourceCard key={source.id} source={source} />
                ))}
              </div>
            ) : (
              <div className="text-center py-20 text-slate-500">
                <Building2 size={48} className="mx-auto mb-4 opacity-50" />
                <p>لا توجد مصادر متاحة حالياً</p>
              </div>
            )}

            {/* ملاحظة */}
            <div className="mt-10 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-2xl border border-blue-100 dark:border-blue-900/50 text-center">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                💡 <strong>نصيحة:</strong> احفظ هذه الصفحة في المفضلة للوصول السريع للروابط الرسمية
              </p>
            </div>
          </>
        )}
      </div>

      <Footer />
    </main>
  );
}
