'use client';

import type { ReactNode } from 'react';
import { motion, useReducedMotion, Variants } from 'framer-motion';
import { usePathname } from 'next/navigation';

// ============================================
// 🎬 أنواع الحركات المختلفة
// ============================================

type AnimationType = 
  | 'fadeUp'
  | 'fadeDown'
  | 'slideRight'
  | 'slideLeft'
  | 'scale'
  | 'rotate'
  | 'bounce'
  | 'flip'
  | 'zoom'
  | 'swing'
  | 'elastic'
  | 'blur';

const animations: Record<AnimationType, Variants> = {
  fadeUp: {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: 'easeOut' },
    },
  },
  fadeDown: {
    hidden: { opacity: 0, y: -30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: 'easeOut' },
    },
  },
  slideRight: {
    hidden: { opacity: 0, x: 100 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] },
    },
  },
  slideLeft: {
    hidden: { opacity: 0, x: -100 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] },
    },
  },
  scale: {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.5, ease: [0.34, 1.56, 0.64, 1] },
    },
  },
  rotate: {
    hidden: { opacity: 0, rotate: -10, y: 20 },
    visible: {
      opacity: 1,
      rotate: 0,
      y: 0,
      transition: { duration: 0.6, ease: 'easeOut' },
    },
  },
  bounce: {
    hidden: { opacity: 0, y: -50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { 
        duration: 0.6, 
        type: 'spring',
        stiffness: 300,
        damping: 15
      },
    },
  },
  flip: {
    hidden: { opacity: 0, rotateX: 90 },
    visible: {
      opacity: 1,
      rotateX: 0,
      transition: { duration: 0.7, ease: 'easeOut' },
    },
  },
  zoom: {
    hidden: { opacity: 0, scale: 0.3 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.5, ease: [0.175, 0.885, 0.32, 1.275] },
    },
  },
  swing: {
    hidden: { opacity: 0, rotate: 15, x: -50 },
    visible: {
      opacity: 1,
      rotate: 0,
      x: 0,
      transition: { duration: 0.8, ease: 'easeOut' },
    },
  },
  elastic: {
    hidden: { opacity: 0, scale: 0.5, y: -100 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: { 
        duration: 0.8, 
        type: 'spring',
        stiffness: 200,
        damping: 10
      },
    },
  },
  blur: {
    hidden: { opacity: 0, filter: 'blur(20px)', scale: 1.1 },
    visible: {
      opacity: 1,
      filter: 'blur(0px)',
      scale: 1,
      transition: { duration: 0.6, ease: 'easeOut' },
    },
  },
};

const reducedMotionVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
};

// ============================================
// 🎯 تحديد الحركة حسب المسار تلقائياً
// ============================================

function getAnimationByPath(pathname: string): AnimationType {
  // الدليل وخدمات e-Devlet
  if (pathname.includes('/directory')) return 'rotate';
  if (pathname.includes('/e-devlet')) return 'blur';
  
  // الأدوات
  if (pathname.includes('/tools')) return 'scale';
  if (pathname.includes('/consultant')) return 'elastic';
  if (pathname.includes('/codes')) return 'slideRight';
  if (pathname.includes('/zones')) return 'slideLeft';
  if (pathname.includes('/ban-calculator')) return 'zoom';
  
  // الأخبار والتحديثات
  if (pathname.includes('/updates') || pathname.includes('/news')) return 'fadeDown';
  
  // المقالات والأقسام
  if (pathname.includes('/articles') || pathname.includes('/guide')) return 'swing';
  if (pathname.includes('/residency') || pathname.includes('/الإقامة')) return 'slideRight';
  if (pathname.includes('/work') || pathname.includes('/العمل')) return 'slideLeft';
  if (pathname.includes('/health') || pathname.includes('/الصحة')) return 'scale';
  
  // الخدمات
  if (pathname.includes('/services')) return 'flip';
  
  // صفحات أخرى
  if (pathname.includes('/faq') || pathname.includes('/questions')) return 'bounce';
  if (pathname.includes('/forms')) return 'swing';
  if (pathname.includes('/sources')) return 'fadeDown';
  if (pathname.includes('/dictionary')) return 'elastic';
  if (pathname.includes('/contact')) return 'slideLeft';
  if (pathname.includes('/about')) return 'rotate';
  
  // الرئيسية أو أي صفحة أخرى
  if (pathname === '/') return 'scale';
  
  // افتراضي
  return 'fadeUp';
}

// ============================================
// 🎨 المكون
// ============================================

type PageHeroProps = {
  title: ReactNode;
  description?: string;
  icon?: ReactNode;
  children?: ReactNode;
  className?: string;
  titleClassName?: string;
  descriptionClassName?: string;
  /** نوع حركة الدخول (اختياري - يُحدد تلقائياً حسب الصفحة) */
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
  
  // استخدم الحركة المحددة أو اختر تلقائياً حسب المسار
  const selectedAnimation = animation || getAnimationByPath(pathname);
  
  const variants: Variants = reduceMotion ? reducedMotionVariants : animations[selectedAnimation];

  return (
    <section className={`bg-primary-900 text-white py-16 px-4 relative overflow-hidden ${className || ''}`.trim()}>
      <div className="max-w-4xl mx-auto text-center relative z-10">
        <motion.div 
          initial="hidden" 
          animate="visible" 
          variants={variants}
          style={{ perspective: selectedAnimation === 'flip' ? 1000 : undefined }}
        >
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
