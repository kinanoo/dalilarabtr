/**
 * 🔗 صفحة الروابط الهامة - تصميم جديد متناسق
 * ==========================================
 * 
 * 📁 انسخ هذا الملف إلى: src/app/important-links/page.tsx
 *    (استبدل الملف القديم)
 * 
 * التحسينات:
 * - بطاقات متساوية الارتفاع
 * - روابط مختصرة ومنظمة
 * - تصميم أفضل على الجوال
 */

'use client';

import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import PageHero from '@/components/PageHero';
import { OFFICIAL_SOURCES } from '@/lib/data';
import { ExternalLink, Link2, ShieldCheck, Users, Globe, Copy, Check } from 'lucide-react';
import { useState } from 'react';

type ImportantLink = {
  name: string;
  url: string;
  desc: string;
};

const TRUSTED_RESOURCES: ImportantLink[] = [
  {
    name: 'RefuPortal (Turkey)',
    url: 'https://www.refuportal.com/',
    desc: 'منصة معلومات وخدمات للاجئين/الأجانب.',
  },
  {
    name: 'UNHCR Help – Türkiye',
    url: 'https://help.unhcr.org/turkiye/ar/',
    desc: 'إرشادات من مفوضية الأمم المتحدة للاجئين.',
  },
  {
    name: 'الهلال الأحمر التركي',
    url: 'https://www.kizilay.org.tr/',
    desc: 'خدمات وبرامج إنسانية.',
  },
];

// ============================================
// 🎨 مكون البطاقة المُحسّن
// ============================================

function LinkCard({ source, index }: { source: ImportantLink; index: number }) {
  const [copied, setCopied] = useState(false);

  // اختصار الرابط للعرض
  const shortUrl = (() => {
    try {
      const url = new URL(source.url);
      return url.hostname.replace('www.', '');
    } catch {
      return source.url.slice(0, 30) + '...';
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
      className="group relative bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-lg transition-all duration-200 overflow-hidden flex flex-col h-full"
    >
      {/* الجزء العلوي - الأيقونة والعنوان */}
      <div className="p-4 sm:p-5 flex-grow">
        <div className="flex items-start gap-3 mb-3">
          <div className="p-2.5 sm:p-3 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-colors flex-shrink-0">
            <ShieldCheck size={20} />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base leading-tight line-clamp-2 group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors">
              {source.name}
            </h3>
          </div>
        </div>
        
        <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm leading-relaxed line-clamp-2">
          {source.desc}
        </p>
      </div>

      {/* الجزء السفلي - الرابط */}
      <div className="px-4 sm:px-5 pb-4 sm:pb-5 mt-auto">
        <div className="flex items-center justify-between gap-2 bg-slate-50 dark:bg-slate-800/50 rounded-xl px-3 py-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <Globe size={14} className="text-blue-500 flex-shrink-0" />
            <span className="text-xs font-mono text-blue-600 dark:text-blue-400 truncate">
              {shortUrl}
            </span>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={handleCopy}
              className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
              title="نسخ الرابط"
            >
              {copied ? (
                <Check size={14} className="text-green-500" />
              ) : (
                <Copy size={14} className="text-slate-400" />
              )}
            </button>
            <ExternalLink size={14} className="text-slate-400 group-hover:text-blue-500" />
          </div>
        </div>
      </div>
    </a>
  );
}

// ============================================
// 🎨 مكون بطاقة الموارد الموثوقة
// ============================================

function TrustedResourceCard({ resource }: { resource: ImportantLink }) {
  return (
    <a
      href={resource.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 rounded-2xl border border-emerald-200 dark:border-emerald-900/50 p-4 sm:p-5 hover:shadow-lg transition-all flex flex-col h-full"
    >
      <div className="flex items-start gap-3 mb-2">
        <div className="p-2 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 rounded-lg flex-shrink-0">
          <Users size={18} />
        </div>
        <h3 className="font-bold text-emerald-900 dark:text-emerald-100 text-sm sm:text-base leading-tight">
          {resource.name}
        </h3>
      </div>
      <p className="text-emerald-700 dark:text-emerald-300 text-xs sm:text-sm flex-grow">
        {resource.desc}
      </p>
      <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-xs font-bold mt-3">
        زيارة الموقع
        <ExternalLink size={12} className="group-hover:translate-x-1 transition-transform" />
      </div>
    </a>
  );
}

// ============================================
// 🏠 الصفحة الرئيسية
// ============================================

export default function ImportantLinksPage() {
  return (
    <main className="flex flex-col min-h-screen">
      <Navbar />

      <PageHero
        title="روابط هامة"
        description="روابط مباشرة وموثوقة للخدمات الحكومية والمنظمات."
        icon={<Link2 className="w-10 h-10 md:w-12 md:h-12 text-accent-500" />}
      />

      <div className="max-w-6xl mx-auto px-4 py-8 sm:py-12 w-full">
        
        {/* القسم 1: الروابط الحكومية */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-xl">
              <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
                روابط حكومية رسمية
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                مواقع موثوقة 100% من الحكومة التركية
              </p>
            </div>
          </div>

          {/* شبكة البطاقات - متجاوبة */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {OFFICIAL_SOURCES.map((source, idx) => (
              <LinkCard key={idx} source={source} index={idx} />
            ))}
          </div>
        </section>

        {/* القسم 2: موارد موثوقة */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/50 rounded-xl">
              <Users className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
                موارد موثوقة أخرى
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                منظمات ومنصات معتمدة للمساعدة
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {TRUSTED_RESOURCES.map((resource, idx) => (
              <TrustedResourceCard key={idx} resource={resource} />
            ))}
          </div>
        </section>

        {/* ملاحظة أسفل الصفحة */}
        <div className="mt-12 text-center">
          <p className="text-xs text-slate-400 dark:text-slate-500">
            💡 انقر على أي بطاقة للانتقال للموقع مباشرة، أو انقر على أيقونة النسخ لنسخ الرابط
          </p>
        </div>
      </div>

      <Footer />
    </main>
  );
}
