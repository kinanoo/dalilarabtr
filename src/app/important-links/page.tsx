'use client';

import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import PageHero from '@/components/PageHero';
import { OFFICIAL_SOURCES } from '@/lib/data';
import { ExternalLink, Link2, ShieldCheck, Users } from 'lucide-react';

type ImportantLink = {
  name: string;
  url: string;
  desc: string;
};

const TRUSTED_RESOURCES: ImportantLink[] = [
  {
    name: 'RefuPortal (Turkey)',
    url: 'https://www.refuportal.com/',
    desc: 'منصة معلومات وخدمات للاجئين/الأجانب (روابط وإرشادات حسب المدينة والخدمة).',
  },
  {
    name: 'UNHCR Help – Türkiye (Arabic)',
    url: 'https://help.unhcr.org/turkiye/ar/',
    desc: 'معلومات وإرشادات من مفوضية الأمم المتحدة لشؤون اللاجئين في تركيا (واجهة عربية).',
  },
  {
    name: 'الهلال الأحمر التركي (Kızılay)',
    url: 'https://www.kizilay.org.tr/',
    desc: 'موقع الهلال الأحمر التركي للخدمات والمعلومات والبرامج الإنسانية.',
  },
];

export default function ImportantLinksPage() {
  return (
    <main className="flex flex-col min-h-screen">
      <Navbar />

      <PageHero
        title="روابط هامة"
        description="روابط مباشرة مفيدة للأجانب والجالية العربية في تركيا."
        icon={<Link2 className="w-10 h-10 md:w-12 md:h-12 text-accent-500" />}
      />

      <div className="max-w-5xl mx-auto px-4 py-16">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-6 flex items-center gap-2 justify-center md:justify-start">
          <ShieldCheck className="w-6 h-6 text-accent-500" />
          روابط حكومية رسمية
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-14">
          {OFFICIAL_SOURCES.map((source, idx) => (
            <a
              key={idx}
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 hover:shadow-lg transition-all flex items-start gap-4"
            >
              <div className="p-4 bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-300 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <ShieldCheck size={28} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-2">
                  {source.name}
                  <ExternalLink
                    size={14}
                    className="text-slate-400 dark:text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  />
                </h3>
                <p className="text-slate-500 dark:text-slate-300 text-sm leading-relaxed">
                  {source.desc}
                </p>
                <span className="text-xs text-blue-500 mt-3 block font-mono bg-blue-50 dark:bg-blue-950/30 w-fit px-2 py-1 rounded">
                  {source.url}
                </span>
              </div>
            </a>
          ))}
        </div>

        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-6 flex items-center gap-2 justify-center md:justify-start">
          <Users className="w-6 h-6 text-accent-500" />
          روابط دعم ومعلومات موثوقة
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {TRUSTED_RESOURCES.map((item, idx) => (
            <a
              key={idx}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 hover:shadow-lg transition-all flex items-start gap-4"
            >
              <div className="p-4 bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-300 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <Users size={28} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-2">
                  {item.name}
                  <ExternalLink
                    size={14}
                    className="text-slate-400 dark:text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  />
                </h3>
                <p className="text-slate-500 dark:text-slate-300 text-sm leading-relaxed">
                  {item.desc}
                </p>
                <span className="text-xs text-blue-500 mt-3 block font-mono bg-blue-50 dark:bg-blue-950/30 w-fit px-2 py-1 rounded">
                  {item.url}
                </span>
              </div>
            </a>
          ))}
        </div>
      </div>

      <Footer />
    </main>
  );
}
