import { ReactNode } from 'react';
import AnimatedHeroTitle from '@/components/home/AnimatedHeroTitle';
import HeroDiscoveryLinks from '@/components/home/HeroDiscoveryLinks';

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
                    <AnimatedHeroTitle />

                    <div className="mt-2" />

                    <p className="text-base md:text-lg text-slate-700 dark:text-slate-200 max-w-2xl mx-auto mb-2 leading-relaxed font-semibold">
                        معلومات عملية ومصادر رسمية حول{' '}
                        <span className="font-black">الإقامة والكملك</span>،{' '}
                        <span className="font-black">العمل والتعليم</span>،{' '}
                        <span className="font-black">القانون والخدمات</span>.
                    </p>

                    <div className="mt-4 max-w-4xl mx-auto relative z-[25]">
                        <HeroDiscoveryLinks />
                    </div>

                    <div className="mt-3 max-w-3xl mx-auto relative z-[25]">
                        {children}
                    </div>
                </div>
            </div>
        </section>
    );
}
