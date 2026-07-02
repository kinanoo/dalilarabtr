import Link from 'next/link';
import type { Lang } from '@/lib/codesI18n';

/**
 * AR/TR segmented toggle for the security-codes pages. Link-based (no client
 * JS) so it works server-rendered and each language is a real, crawlable URL.
 */
export default function CodesLangToggle({
    arHref,
    trHref,
    lang,
}: {
    arHref: string;
    trHref: string;
    lang: Lang;
}) {
    const base =
        'px-3.5 py-1.5 rounded-full text-xs font-black transition-all';
    const active = 'bg-emerald-600 text-white shadow-sm';
    const idle = 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200';
    return (
        <div
            className="inline-flex items-center gap-1 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-1 shadow-sm"
            role="group"
            aria-label="اللغة / Dil"
        >
            <Link href={arHref} className={`${base} ${lang === 'ar' ? active : idle}`} hrefLang="ar" aria-current={lang === 'ar'}>
                عربي
            </Link>
            <Link href={trHref} className={`${base} ${lang === 'tr' ? active : idle}`} hrefLang="tr" aria-current={lang === 'tr'} dir="ltr">
                Türkçe
            </Link>
        </div>
    );
}
