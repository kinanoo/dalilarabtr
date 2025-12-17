import React from 'react';
import Link from 'next/link';
import { SITE_CONFIG } from '@/lib/data';

export default function Footer() {
  return (
    <footer className="bg-primary-900 dark:bg-primary-950 text-slate-300 dark:text-slate-300 py-12 mt-auto">
      <div className="max-w-screen-2xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-right">
        
        <div>
          <h3 className="text-white dark:text-white font-bold text-base md:text-lg mb-4">
            <Link href="/directory" className="hover:text-accent-500 transition-colors" aria-label="الدليل الشامل">
              {SITE_CONFIG.name}
            </Link>
          </h3>
          <p className="text-xs md:text-sm leading-relaxed max-w-xs mx-auto md:mx-0">
            {SITE_CONFIG.slogan}. موقع غير حكومي يهدف لتبسيط الإجراءات للجالية العربية.
          </p>
        </div>

        <div>
          <h3 className="text-white dark:text-white font-bold text-base md:text-lg mb-4">
            <Link href="/important-links" className="hover:text-accent-500 transition-colors" aria-label="روابط هامة">
              روابط هامة
            </Link>
          </h3>
          <ul className="space-y-2 text-xs md:text-sm">
            <li><Link href="/privacy" className="hover:text-accent-500 transition-colors" aria-label="سياسة الخصوصية">سياسة الخصوصية</Link></li>
            <li><Link href="/disclaimer" className="hover:text-accent-500 transition-colors" aria-label="إخلاء المسؤولية">إخلاء المسؤولية</Link></li>
            <li><Link href="/contact" className="hover:text-accent-500 transition-colors" aria-label="اتصل بنا">اتصل بنا</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="text-white dark:text-white font-bold text-base md:text-lg mb-4">تنويه قانوني</h3>
          <p className="text-xs md:text-sm text-slate-400 dark:text-slate-400">
            المعلومات الواردة هنا للأغراض التعريفية فقط ولا تغني عن الاستشارة القانونية الرسمية.
          </p>
        </div>
      </div>
      <div className="text-center text-xs text-slate-500 dark:text-slate-500 mt-12 border-t border-slate-200 dark:border-slate-800 pt-6">
        &copy; 2026 جميع الحقوق محفوظة لـ {SITE_CONFIG.name}.
      </div>
    </footer>
  );
}