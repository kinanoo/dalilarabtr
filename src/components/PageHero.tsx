'use client';

import type { ReactNode } from 'react';
import { motion, useReducedMotion, Variants } from 'framer-motion';
import { usePathname } from 'next/navigation';

// ============================================
// 🎬 Entrance animations (one-shot, per route)
// ============================================

type AnimationType =
  | 'fadeUp' | 'fadeDown' | 'slideRight' | 'slideLeft' | 'scale'
  | 'rotate' | 'bounce' | 'flip' | 'zoom' | 'swing' | 'elastic' | 'blur';

const animations: Record<AnimationType, Variants> = {
  fadeUp: { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } } },
  fadeDown: { hidden: { opacity: 0, y: -30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } } },
  slideRight: { hidden: { opacity: 0, x: 100 }, visible: { opacity: 1, x: 0, transition: { duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] } } },
  slideLeft: { hidden: { opacity: 0, x: -100 }, visible: { opacity: 1, x: 0, transition: { duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] } } },
  scale: { hidden: { opacity: 0, scale: 0.8 }, visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: [0.34, 1.56, 0.64, 1] } } },
  rotate: { hidden: { opacity: 0, rotate: -10, y: 20 }, visible: { opacity: 1, rotate: 0, y: 0, transition: { duration: 0.6, ease: 'easeOut' } } },
  bounce: { hidden: { opacity: 0, y: -50 }, visible: { opacity: 1, y: 0, transition: { duration: 0.6, type: 'spring', stiffness: 300, damping: 15 } } },
  flip: { hidden: { opacity: 0, rotateX: 90 }, visible: { opacity: 1, rotateX: 0, transition: { duration: 0.7, ease: 'easeOut' } } },
  zoom: { hidden: { opacity: 0, scale: 0.3 }, visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: [0.175, 0.885, 0.32, 1.275] } } },
  swing: { hidden: { opacity: 0, rotate: 15, x: -50 }, visible: { opacity: 1, rotate: 0, x: 0, transition: { duration: 0.8, ease: 'easeOut' } } },
  elastic: { hidden: { opacity: 0, scale: 0.5, y: -100 }, visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.8, type: 'spring', stiffness: 200, damping: 10 } } },
  blur: { hidden: { opacity: 0, filter: 'blur(20px)', scale: 1.1 }, visible: { opacity: 1, filter: 'blur(0px)', scale: 1, transition: { duration: 0.6, ease: 'easeOut' } } },
};

const reducedMotionVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
};

function getAnimationByPath(pathname: string): AnimationType {
  if (pathname.includes('/directory')) return 'rotate';
  if (pathname.includes('/e-devlet')) return 'blur';
  if (pathname.includes('/tools')) return 'scale';
  if (pathname.includes('/consultant')) return 'elastic';
  if (pathname.includes('/codes')) return 'slideRight';
  if (pathname.includes('/zones')) return 'slideLeft';
  if (pathname.includes('/ban-calculator')) return 'zoom';
  if (pathname.includes('/updates') || pathname.includes('/news')) return 'fadeDown';
  if (pathname.includes('/articles') || pathname.includes('/guide')) return 'swing';
  if (pathname.includes('/work')) return 'slideLeft';
  if (pathname.includes('/health')) return 'scale';
  if (pathname.includes('/services')) return 'flip';
  if (pathname.includes('/faq') || pathname.includes('/questions')) return 'bounce';
  if (pathname.includes('/contact')) return 'slideLeft';
  if (pathname.includes('/about')) return 'rotate';
  if (pathname === '/') return 'scale';
  return 'fadeUp';
}

// ============================================
// 🎨 PageHero — light, airy, government-portal styling (matches the homepage
//    hero). LIGHT MODE: soft brand-tinted gradient + dark text + the official
//    colour stripe (a hint of government red). DARK MODE: deep emerald gradient.
//    The old dark slab + mouse-tracked SVG curve canvas were removed (heavy,
//    dark-only); soft blurred blobs give depth.
// ============================================

type PageHeroProps = {
  title: ReactNode;
  description?: string;
  icon?: ReactNode;
  children?: ReactNode;
  className?: string;
  titleClassName?: string;
  descriptionClassName?: string;
  animation?: AnimationType;
};

export default function PageHero({
  title,
  description,
  icon,
  children,
  className,
  titleClassName,
  descriptionClassName,
  animation,
}: PageHeroProps) {
  const reduceMotion = useReducedMotion();
  const pathname = usePathname();
  const selectedAnimation = animation || getAnimationByPath(pathname);
  const variants: Variants = reduceMotion ? reducedMotionVariants : animations[selectedAnimation];

  return (
    <section
      className={`relative overflow-hidden bg-gradient-to-b from-emerald-50 via-surface-light to-sky-50 dark:from-slate-900 dark:via-emerald-950 dark:to-slate-950 text-slate-900 dark:text-white py-14 px-4 ${className || ''}`.trim()}
    >
      {/* Official colour stripe — a hint of government red */}
      <div aria-hidden="true" className="absolute top-0 inset-x-0 h-1 bg-gradient-to-l from-gov-red via-brand-orange to-brand-blue z-20" />

      {/* Soft brand blobs (no animation) */}
      <div aria-hidden="true" className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-24 w-72 h-72 bg-emerald-300/25 dark:bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-24 w-72 h-72 bg-sky-300/25 dark:bg-cyan-500/10 rounded-full blur-3xl" />
      </div>

      <div className="max-w-4xl mx-auto text-center relative z-10">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={variants}
          style={{ perspective: selectedAnimation === 'flip' ? 1000 : undefined }}
        >
          {icon ? (
            <div className="flex items-center justify-center gap-3 mb-3 text-emerald-600 dark:text-emerald-300">
              {icon}
              <h1 className={`text-3xl md:text-4xl font-black text-slate-900 dark:text-white ${titleClassName || ''}`.trim()}>{title}</h1>
            </div>
          ) : (
            <h1 className={`text-3xl md:text-4xl font-black text-slate-900 dark:text-white mb-3 ${titleClassName || ''}`.trim()}>{title}</h1>
          )}

          {description ? (
            <p className={`text-base md:text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto ${descriptionClassName || ''}`.trim()}>
              {description}
            </p>
          ) : null}
        </motion.div>

        {children ? <div className="mt-8 max-w-2xl mx-auto">{children}</div> : null}
      </div>
    </section>
  );
}
