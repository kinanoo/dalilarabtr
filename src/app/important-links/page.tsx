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

import PageHero from '@/components/PageHero';
import { OFFICIAL_SOURCES } from '@/lib/constants';
import { ExternalLink, Link2, ShieldCheck, Users, Globe, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import ShareMenu from '@/components/ShareMenu';
import { SITE_CONFIG } from '@/lib/config';

type ImportantLink = {
  name: string;
  url: string;
  desc: string;
};

const TRUSTED_RESOURCES: ImportantLink[] = [
  {
    name: 'UNHCR Help – Türkiye',
    url: 'https://help.unhcr.org/turkiye/ar/',
    desc: 'إرشادات رسمية من مفوضية الأمم المتحدة للاجئين حول الحقوق والخدمات في تركيا.',
  },
  {
    name: 'RefuPortal (Turkey)',
    url: 'https://www.refuportal.com/',
    desc: 'منصة معلومات شاملة وخدمات مخصصة للاجئين والأجانب المقيمين.',
  },
  {
    name: 'الهلال الأحمر التركي',
    url: 'https://www.kizilay.org.tr/',
    desc: 'خدمات وبرامج المساعدات الإنسانية والاجتماعية في مختلف الولايات.',
  },
  {
    name: 'ASAM (جمعية التضامن)',
    url: 'https://asam.org.tr/',
    desc: 'جمعية التضامن مع طالبين اللجوء والمهاجرين (دعم قانوني واجتماعي).',
  },
  {
    name: 'Refugee Rights (حقوق اللاجئين)',
    url: 'https://www.mhd.org.tr/',
    desc: 'مركز حقوق اللاجئين بتركيا يوفر المساعدة القانونية المجانية.',
  },
  {
    name: 'IOM Turkey (المنظمة الدولية للهجرة)',
    url: 'https://turkiye.iom.int/',
    desc: 'خدمات الهجرة والعودة الطوعية والبرامج الإنسانية التابعة للأمم المتحدة.',
  },
  {
    name: 'فريق ملهم التطوعي',
    url: 'https://molhamteam.com/',
    desc: 'مؤسسة خيرية لدعم السوريين في حالات الطوارئ والتعليم والطبابة.',
  },
  {
    name: 'Hayata Destek (دعم الحياة)',
    url: 'https://www.hayatadestek.org/',
    desc: 'منظمة إنسانية تعمل على توفير المساعدات الأساسية والحماية في تركيا.',
  },
  {
    name: 'Syrian American Medical Society (SAMS)',
    url: 'https://www.sams-usa.net/',
    desc: 'جمعية طبية توفر خدمات صحية متخصصة ومجانية للسوريين.',
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
          <div className="p-2.5 sm:p-3 bg-blue-50 dark:bg-blue-950/40 rounded-xl group-hover:bg-blue-600 transition-colors flex-shrink-0">
            <Globe size={20} className="text-blue-600 dark:text-blue-400 group-hover:text-white transition-colors" />
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
        <div className="p-2 bg-emerald-100 dark:bg-emerald-900/50 rounded-lg flex-shrink-0">
          <Globe size={18} className="text-emerald-600 dark:text-emerald-400" />
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

import HeroSearchInput from '@/components/HeroSearchInput';
import { useAdminSources } from '@/lib/useAdminData';
import { Loader2, Building2 } from 'lucide-react';

export default function ImportantLinksPage() {
  const { sources, loading } = useAdminSources();
  const [query, setQuery] = useState('');

  const normalizedQuery = query.toLowerCase().trim();

  const filteredSources = sources.filter(s =>
    s.name.toLowerCase().includes(normalizedQuery) ||
    s.desc.toLowerCase().includes(normalizedQuery)
  );

  const filteredResources = TRUSTED_RESOURCES.filter(r =>
    r.name.toLowerCase().includes(normalizedQuery) ||
    r.desc.toLowerCase().includes(normalizedQuery)
  );

  return (
    <main className="flex flex-col min-h-screen">
      <PageHero
        title="روابط هامة"
        description="دليلك الشامل للمواقع الحكومية والمنظمات الإنسانية الموثوقة في تركيا."
        icon={<Link2 className="w-10 h-10 md:w-12 md:h-12 text-accent-500" />}
      >
        <HeroSearchInput
          value={query}
          onChange={setQuery}
          placeholder="ابحث عن رابط، جهة حكومية، أو منظمة..."
        />
      </PageHero>

      <div className="flex justify-center -mt-4 mb-4">
        <ShareMenu
          title="روابط هامة — دليل العرب في تركيا"
          text="دليلك الشامل للمواقع الحكومية والمنظمات الإنسانية الموثوقة في تركيا."
          url={`${SITE_CONFIG.siteUrl}/important-links`}
          variant="subtle"
        />
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8 sm:py-12 w-full space-y-16">

        {/* القسم 1: المصادر الحكومية */}
        {filteredSources.length > 0 && (
          <section>
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2.5 bg-blue-100 dark:bg-blue-900/50 rounded-xl">
                <Building2 className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
                  المصادر الحكومية الرسمية
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  روابط مباشرة وآمنة لجميع البوابات الخدمية والوزارات التركية
                </p>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 size={32} className="animate-spin text-blue-600" />
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                {filteredSources.map((source, idx) => (
                  <LinkCard key={source.id} source={source} index={idx} />
                ))}
              </div>
            )}
          </section>
        )}

        {/* القسم 2: منظمات وموارد */}
        {filteredResources.length > 0 && (
          <section>
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2.5 bg-emerald-100 dark:bg-emerald-900/50 rounded-xl">
                <Users className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
                  منظمات وموارد مفيدة
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  منظمات ومنصات دولية ومحلية معتمدة للمساعدة القانونية والإنسانية
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {filteredResources.map((resource, idx) => (
                <TrustedResourceCard key={idx} resource={resource} />
              ))}
            </div>
          </section>
        )}

        {filteredSources.length === 0 && filteredResources.length === 0 && (
          <div className="text-center py-12">
            <p className="text-slate-500 dark:text-slate-400 font-bold">لا يوجد نتائج تطابق بحثك.</p>
          </div>
        )}

        {/* ملاحظة أسفل الصفحة */}
        <div className="mt-12 text-center pt-8 border-t border-slate-100 dark:border-slate-800 space-y-1">
          <p className="text-xs text-slate-400 dark:text-slate-500 flex items-center justify-center gap-2">
            <ShieldCheck size={12} className="text-green-500" />
            يتم تحديث هذه الروابط بشكل دوري لضمان الدقة والموثوقية
          </p>
          <p className="text-[11px] text-slate-400 dark:text-slate-600">
            آخر تحقق من صلاحية الروابط: مارس 2026
          </p>
        </div>
      </div>
    </main>
  );
}

