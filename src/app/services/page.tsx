'use client';

import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import PageHero from '@/components/PageHero';
import HeroSearchInput from '@/components/HeroSearchInput';
import { SERVICES_LIST, SITE_CONFIG } from '@/lib/data';
import Link from 'next/link';
import { Briefcase, ArrowLeft } from 'lucide-react';
import ShareMenu from '@/components/ShareMenu'; // 👈 استيراد
import { useEffect, useMemo, useState } from 'react';
import { fetchRemoteServices, mergeServices, subscribeDemoDataUpdated, type RuntimeService } from '@/lib/remoteData';
import { buildWhatsAppHref } from '@/lib/whatsapp';
import { normalizeArabic } from '@/lib/arabicSearch';

export default function ServicesPage() {
  const [services, setServices] = useState<RuntimeService[]>(SERVICES_LIST);
  const [query, setQuery] = useState('');

  useEffect(() => {
    let cancelled = false;
    const reload = async () => {
      const [remoteServices] = await Promise.all([fetchRemoteServices()]);
      if (cancelled) return;
      setServices(mergeServices(remoteServices));
    };

    void reload();
    const unsubscribe = subscribeDemoDataUpdated(() => void reload());

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  const filteredServices = useMemo(() => {
    const normalizedQuery = normalizeArabic(query);
    if (!normalizedQuery) return services;

    return services.filter((service) => {
      const haystack = normalizeArabic(`${service.title} ${service.desc}`);
      return haystack.includes(normalizedQuery);
    });
  }, [query, services]);

  return (
    <main className="flex flex-col min-h-screen">
      <Navbar />

      <PageHero
        title="مكتب الخدمات الخاصة"
        description="ننجز معاملاتك الصعبة والمعقدة بخبرة وموثوقية. راسلنا وسنتواصل معك فوراً."
        icon={<Briefcase className="w-10 h-10 md:w-12 md:h-12 text-accent-500" />}
      >
        <HeroSearchInput
          value={query}
          onChange={setQuery}
          placeholder="ابحث عن خدمة (مثال: ترجمة، تصديق، تأمين)..."
          dir="rtl"
          lang="ar"
        />
      </PageHero>

      <div className="max-w-screen-2xl mx-auto px-4 py-16">
        {query && filteredServices.length === 0 ? (
          <p className="text-center text-sm text-slate-600 dark:text-slate-300 mb-6">
            لا توجد خدمات مطابقة لكلمة البحث.
          </p>
        ) : null}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServices.map((service, idx) => (
            <div key={idx} className="group bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden hover:shadow-xl hover:border-primary-500 transition-all duration-300 flex flex-col relative">
              
              {/* Header Image/Icon Area */}
              <div className={`h-32 ${service.color} relative flex items-center justify-center`}>
                <div className="bg-white/20 p-4 rounded-full backdrop-blur-sm">
                  <service.icon size={40} className="text-white" />
                </div>
                <div className="absolute bottom-0 inset-x-0 w-full h-1/2 bg-gradient-to-t from-black/20 to-transparent"></div>
                
                {/* زر المشاركة داخل الكرت */}
                 <div className="absolute top-4 end-4">
                   <ShareMenu title={`خدمة ${service.title}`} text={service.desc} url={`${SITE_CONFIG.siteUrl}/request?service=${service.id}`} mini={true} customClass="!bg-white/20 !text-white hover:!bg-white hover:!text-slate-800 backdrop-blur-md" />
                </div>
              </div>

              <div className="p-6 flex-grow flex flex-col">
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2 group-hover:text-primary-700 transition-colors">
                  {service.title}
                </h3>
                <p className="text-slate-500 dark:text-slate-300 text-sm leading-relaxed mb-6 flex-grow">
                  {service.desc}
                </p>
                
                {(() => {
                  const phone = service.whatsapp || SITE_CONFIG.whatsapp;
                  const text = `السلام عليكم، أريد طلب خدمة: ${service.title}`;
                  const href = buildWhatsAppHref(phone, text);
                  if (href) {
                    return (
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 group-hover:bg-primary-600 group-hover:text-white transition-all"
                        aria-label={`اطلب خدمة ${service.title} عبر واتساب`}
                      >
                        طلب الخدمة <ArrowLeft size={18} />
                      </a>
                    );
                  }
                  return (
                    <Link
                      href={`/request?service=${service.id}`}
                      className="w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 group-hover:bg-primary-600 group-hover:text-white transition-all"
                    >
                      طلب الخدمة <ArrowLeft size={18} />
                    </Link>
                  );
                })()}
              </div>
            </div>
          ))}
        </div>

        {/* ترويج للواتساب المباشر */}
        <div className="mt-16 bg-green-50 dark:bg-green-950/25 border border-green-200 dark:border-green-900/40 rounded-2xl p-8 text-center relative overflow-hidden">
          <div className="relative z-10">
            <h3 className="text-2xl font-bold text-green-900 dark:text-green-100 mb-4">لديك طلب خاص غير موجود؟</h3>
            <p className="text-green-800 dark:text-green-200 mb-6">راسلنا مباشرة عبر واتساب وسنرد عليك بأسرع وقت.</p>
            <div className="flex justify-center">
              {(() => {
                const href = buildWhatsAppHref(SITE_CONFIG.whatsapp, 'السلام عليكم، لدي طلب خاص غير موجود في القائمة.');
                if (href) {
                  return (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-3 bg-green-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-green-700 transition shadow-lg shadow-green-600/20"
                      aria-label="اطلب خدمة عبر واتساب"
                    >
                      طلب خدمة <ArrowLeft size={18} />
                    </a>
                  );
                }
                return (
                  <Link
                    href="/request"
                    className="inline-flex items-center gap-3 bg-green-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-green-700 transition shadow-lg shadow-green-600/20"
                  >
                    طلب خدمة <ArrowLeft size={18} />
                  </Link>
                );
              })()}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
}