import { HelpCircle } from 'lucide-react';

/**
 * ToolFaq — the VISIBLE "أسئلة شائعة" section for a tool page, rendered from the
 * SAME faqs array that feeds the FAQPage JSON-LD (via getToolFaqs). Server
 * component, so the Q&A are in the initial HTML and crawlable; <details> keeps
 * the answer in the DOM even when collapsed. Keeping the visible copy and the
 * structured data in sync is a Google requirement for FAQ markup and adds
 * keyword-rich Arabic content that previously lived only inside the JSON-LD.
 */
export default function ToolFaq({
    faqs,
    title = 'أسئلة شائعة',
}: {
    faqs: Array<{ question: string; answer: string }>;
    title?: string;
}) {
    if (!faqs?.length) return null;

    return (
        <section className="px-4 pb-10 font-cairo" aria-label="أسئلة شائعة">
            <div className="max-w-3xl mx-auto">
                <h2 className="text-base font-black text-slate-800 dark:text-slate-100 mb-3 flex items-center gap-2">
                    <HelpCircle size={18} className="text-emerald-600" />
                    {title}
                </h2>
                <div className="space-y-2.5">
                    {faqs.map((f, i) => (
                        <details
                            key={i}
                            className="group rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden"
                        >
                            <summary className="cursor-pointer list-none flex items-center justify-between gap-3 p-4 font-bold text-sm text-slate-800 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                                <span className="leading-relaxed">{f.question}</span>
                                <span className="text-emerald-600 dark:text-emerald-400 shrink-0 text-xl leading-none transition-transform duration-200 group-open:rotate-45">
                                    +
                                </span>
                            </summary>
                            <div className="px-4 pb-4 -mt-1 text-[13px] leading-relaxed text-slate-600 dark:text-slate-300">
                                {f.answer}
                            </div>
                        </details>
                    ))}
                </div>
            </div>
        </section>
    );
}
