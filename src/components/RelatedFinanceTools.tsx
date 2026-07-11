import Link from 'next/link';
import { Banknote, Wallet, Coins, Home, ChevronLeft } from 'lucide-react';

/**
 * RelatedFinanceTools — a small, server-rendered cross-link cluster shown at the
 * bottom of each money tool. It ties the finance tools (currency, salary,
 * severance, rent) together so internal link equity flows across the cluster
 * (SEO) and a visitor on one calculator discovers the neighbours (engagement).
 * Rendered from the server component so the links are crawlable, not JS-gated.
 * Pass `current` to drop the page's own tool from the list.
 */

type FinanceTool = {
    id: string;
    title: string;
    desc: string;
    href: string;
    icon: typeof Wallet;
    color: string;
};

const FINANCE_TOOLS: FinanceTool[] = [
    { id: 'currency', title: 'أسعار الصرف والعملات', desc: 'الدولار واليورو والذهب مقابل الليرة + محوّل فوري', href: '/tools/currency', icon: Banknote, color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20' },
    { id: 'salary', title: 'حاسبة الراتب الصافي', desc: 'تحويل الراتب بين الإجمالي والصافي (Net ⇄ Brüt) 2026', href: '/tools/salary-calculator', icon: Wallet, color: 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20' },
    { id: 'severance', title: 'تعويض نهاية الخدمة', desc: 'احسب Kıdem و İhbar حسب راتبك ومدة عملك', href: '/tools/severance-calculator', icon: Coins, color: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20' },
    { id: 'rent', title: 'زيادة الإيجار القانونية', desc: 'الحد الأقصى القانوني لزيادة إيجارك حسب TÜFE', href: '/tools/rent-increase-calculator', icon: Home, color: 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20' },
];

export default function RelatedFinanceTools({ current }: { current: string }) {
    const items = FINANCE_TOOLS.filter((t) => t.id !== current);
    if (!items.length) return null;

    return (
        <section className="px-4 pb-12 font-cairo">
            <div className="max-w-3xl mx-auto">
                <h2 className="text-sm font-black text-slate-700 dark:text-slate-200 mb-3 flex items-center gap-2">
                    <Banknote size={16} className="text-emerald-600" />
                    أدوات مالية ذات صلة
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {items.map((t) => {
                        const Icon = t.icon;
                        return (
                            <Link
                                key={t.id}
                                href={t.href}
                                className="group flex flex-col gap-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 shadow-sm hover:shadow-md hover:border-emerald-300 dark:hover:border-emerald-700 hover:-translate-y-0.5 transition-all"
                            >
                                <span className={`w-9 h-9 rounded-xl flex items-center justify-center ${t.color}`}>
                                    <Icon size={18} />
                                </span>
                                <span className="font-black text-sm text-slate-800 dark:text-slate-100 leading-tight group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                                    {t.title}
                                </span>
                                <span className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">
                                    {t.desc}
                                </span>
                                <span className="mt-auto inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                                    افتح الأداة <ChevronLeft size={13} />
                                </span>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
