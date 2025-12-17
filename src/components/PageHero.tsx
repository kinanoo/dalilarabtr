'use client';

import type { ReactNode } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

const fadeInUp = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.75, ease: 'easeOut' },
  },
} as const;

type PageHeroProps = {
  title: ReactNode;
  description?: string;
  icon?: ReactNode;
  children?: ReactNode;
  className?: string;
  titleClassName?: string;
  descriptionClassName?: string;
};

export default function PageHero({
  title,
  description,
  icon,
  children,
  className,
  titleClassName,
  descriptionClassName,
}: PageHeroProps) {
  const reduceMotion = useReducedMotion();
  const variants = reduceMotion
    ? {
        hidden: { opacity: 0, y: 0 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.2 } },
      }
    : fadeInUp;

  return (
    <section className={`bg-primary-900 text-white py-16 px-4 relative overflow-hidden ${className || ''}`.trim()}>
      <div className="max-w-4xl mx-auto text-center relative z-10">
        <motion.div initial="hidden" animate="visible" variants={variants}>
          {icon ? (
            <div className="flex items-center justify-center gap-3 mb-3">
              {icon}
              <h1 className={`text-4xl font-bold ${titleClassName || ''}`.trim()}>{title}</h1>
            </div>
          ) : (
            <h1 className={`text-4xl font-bold mb-3 ${titleClassName || ''}`.trim()}>{title}</h1>
          )}

          {description ? (
            <p className={`text-base md:text-xl text-slate-300 max-w-2xl mx-auto ${descriptionClassName || ''}`.trim()}>
              {description}
            </p>
          ) : null}
        </motion.div>

        {children ? <div className="mt-8 max-w-2xl mx-auto">{children}</div> : null}
      </div>
    </section>
  );
}
