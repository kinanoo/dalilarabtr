import { ReactNode } from 'react';

/**
 * Homepage introduction. It names the audience and the practical value in the
 * first viewport so a new visitor immediately knows this site is for them.
 */
export default function HeroSection({ children }: { children?: ReactNode }) {
    return (
        <section
            className="relative z-[15] bg-gradient-to-b from-emerald-50 via-surface-light to-sky-50 dark:from-slate-900 dark:via-emerald-950 dark:to-slate-950 text-slate-900 dark:text-white pt-4 sm:pt-6 pb-5 sm:pb-6 px-4"
            style={{ overflowX: 'clip' }}
        >
            {/* Top accent stripe — the official-site colour quartet */}
            <div
                aria-hidden="true"
                className="absolute top-0 inset-x-0 h-1 bg-gradient-to-l from-brand-magenta via-brand-orange to-brand-blue z-30"
            />

            <div className="max-w-4xl mx-auto text-center relative z-[25]">
                <div>
                    <h1 className="text-3xl sm:text-4xl md:text-6xl font-black mb-0 leading-[1.4] text-slate-900 dark:text-white pt-2">
                        دليلك{' '}
                        <span
                            className="text-transparent bg-clip-text bg-gradient-to-l from-emerald-600 via-teal-500 to-cyan-600 dark:from-emerald-300 dark:via-teal-300 dark:to-cyan-300"
                            style={{ fontSize: 'calc(1em + 2px)' }}
                        >
                            الشامل والموثوق
                        </span>
                    </h1>

                    <div className="mt-2" />

                    <p className="text-base md:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto mb-2 leading-relaxed font-medium">
                        معلومات عملية ومصادر رسمية حول{' '}
                        <span className="text-emerald-700 dark:text-emerald-300 font-bold">الإقامة والكملك</span>،{' '}
                        <span className="text-sky-700 dark:text-cyan-300 font-bold">العمل والتعليم</span>،{' '}
                        <span className="text-orange-700 dark:text-amber-300 font-bold">القانون والخدمات</span>.
                    </p>

                    <div className="mt-5 max-w-xl mx-auto relative z-[25]">
                        {children}
                    </div>
                </div>
            </div>
        </section>
    );
}
