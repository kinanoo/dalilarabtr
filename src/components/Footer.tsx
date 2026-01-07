'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import InstallPrompt from './InstallPrompt';
import SocialLinks from './SocialLinks';
import NewsletterForm from './NewsletterForm';
import { SITE_CONFIG } from '@/lib/data';
import { supabase } from '@/lib/supabaseClient';

export default function Footer() {
  const [footerMenus, setFooterMenus] = useState<any[]>([]);

  useEffect(() => {
    async function fetchMenus() {
      if (!supabase) return;
      const { data } = await supabase
        .from('site_menus')
        .select('*')
        .eq('location', 'footer')
        .eq('is_active', true)
        .order('sort_order');
      if (data) setFooterMenus(data);
    }
    fetchMenus();
  }, []);

  const handleNewsletterSubmit = async (email: string) => {
    // يمكن إضافة integration مع newsletter service
    console.log('Newsletter signup:', email);
  };

  return (
    <>
      <footer className="bg-slate-900 dark:bg-slate-950 text-slate-300 py-12 mt-auto border-t border-slate-800">
        <div className="max-w-screen-2xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">

            {/* القسم 1: عن الموقع */}
            <div>
              <h3 className="text-white font-bold text-lg mb-4">
                <Link href="/" className="hover:text-emerald-400 transition-colors">
                  {SITE_CONFIG.name}
                </Link>
              </h3>
              <p className="text-sm leading-relaxed mb-4 text-slate-400">
                {SITE_CONFIG.slogan}. موقع غير حكومي يهدف لتبسيط الإجراءات للجالية العربية.
              </p>

              {/* Social Links */}
              <div className="mb-4">
                <h4 className="text-white font-bold text-sm mb-3">تابعنا</h4>
                <SocialLinks />
              </div>
            </div>

            {/* القسم 2: روابط سريعة */}
            <div>
              <h3 className="text-white font-bold text-lg mb-4">روابط سريعة</h3>
              <ul className="space-y-2 text-sm">
                {footerMenus.length > 0 ? footerMenus.slice(0, 6).map((item) => (
                  <li key={item.id}>
                    <Link
                      href={item.url || item.href || '#'}
                      className="hover:text-emerald-400 transition-colors flex items-center gap-2"
                    >
                      <span className="text-emerald-500">←</span>
                      {item.label}
                    </Link>
                  </li>
                )) : (
                  <>
                    <li><Link href="/services" className="hover:text-emerald-400 transition-colors flex items-center gap-2"><span className="text-emerald-500">←</span>الخدمات</Link></li>
                    <li><Link href="/faq" className="hover:text-emerald-400 transition-colors flex items-center gap-2"><span className="text-emerald-500">←</span>الأسئلة الشائعة</Link></li>
                    <li><Link href="/consultant" className="hover:text-emerald-400 transition-colors flex items-center gap-2"><span className="text-emerald-500">←</span>استشارة محام</Link></li>
                    <li><Link href="/contact" className="hover:text-emerald-400 transition-colors flex items-center gap-2"><span className="text-emerald-500">←</span>اتصل بنا</Link></li>
                  </>
                )}
              </ul>
            </div>

            {/* القسم 3: أدوات مفيدة */}
            <div>
              <h3 className="text-white font-bold text-lg mb-4">أدوات مفيدة</h3>
              <ul className="space-y-2 text-sm">
                <li><Link href="/ban-calculator" className="hover:text-emerald-400 transition-colors flex items-center gap-2"><span className="text-emerald-500">←</span>حاسبة المنع</Link></li>
                <li><Link href="/calculator" className="hover:text-emerald-400 transition-colors flex items-center gap-2"><span className="text-emerald-500">←</span>حاسبة تكاليف الإقامة</Link></li>
                <li><Link href="/directory" className="hover:text-emerald-400 transition-colors flex items-center gap-2"><span className="text-emerald-500">←</span>الدليل الشامل</Link></li>
                <li><Link href="/map" className="hover:text-emerald-400 transition-colors flex items-center gap-2"><span className="text-emerald-500">←</span>خريطة الموقع</Link></li>
                <li><Link href="/contact" className="hover:text-emerald-400 transition-colors flex items-center gap-2"><span className="text-emerald-500">←</span>اتصل بنا</Link></li>
              </ul>
            </div>

            {/* القسم 4: النشرة البريدية */}
            <div>
              <h3 className="text-white font-bold text-lg mb-4">النشرة البريدية</h3>
              <p className="text-sm text-slate-400 mb-4">
                اشترك للحصول على آخر التحديثات والأخبار
              </p>
              <NewsletterForm onSubmit={handleNewsletterSubmit} />
            </div>
          </div>

          {/* الحقوق - Bottom */}
          <div className="border-t border-slate-800 pt-8 mt-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-slate-400">
              <p>
                © {new Date().getFullYear()} {SITE_CONFIG.name}. جميع الحقوق محفوظة.
              </p>

              <div className="flex gap-4">
                <Link href="/privacy" className="hover:text-emerald-400 transition-colors">
                  سياسة الخصوصية
                </Link>
                <Link href="/disclaimer" className="hover:text-emerald-400 transition-colors">
                  إخلاء المسؤولية
                </Link>
              </div>
            </div>
          </div>
        </div>
      </footer>

      <InstallPrompt />
    </>
  );
}