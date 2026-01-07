'use client';

import type { ReactNode } from 'react';
import { motion, useReducedMotion, Variants } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { useState, useEffect, useMemo } from 'react';

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
// 🎨 Pattern Variants (All based on curves style)
// ============================================

type PatternVariant = 'variant1' | 'variant2' | 'variant3' | 'variant4' | 'variant5' | 'variant6' | 'variant7';

function getPatternVariant(pathname: string): PatternVariant {
  if (pathname.includes('/directory')) return 'variant1';
  if (pathname.includes('/tools')) return 'variant2';
  if (pathname.includes('/consultant')) return 'variant3';
  if (pathname.includes('/codes')) return 'variant4';
  if (pathname.includes('/zones')) return 'variant5';
  if (pathname.includes('/faq')) return 'variant6';
  if (pathname.includes('/forms')) return 'variant7';
  if (pathname.includes('/e-devlet')) return 'variant2';
  if (pathname.includes('/calculator')) return 'variant5';
  if (pathname === '/') return 'variant1';

  // Use hash for other pages
  const hash = pathname.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const variants: PatternVariant[] = ['variant1', 'variant2', 'variant3', 'variant4', 'variant5', 'variant6', 'variant7'];
  return variants[hash % variants.length];
}

// ============================================
// 🎨 Pattern Component (Curves-based variations)
// ============================================

const ArtisticPattern = ({ variant, mouseX, mouseY }: { variant: PatternVariant; mouseX: number; mouseY: number }) => {
  // All variants share the same gradients and style
  const commonDefs = (
    <defs>
      <linearGradient id={`goldFlow-${variant}`} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.9" />
        <stop offset="50%" stopColor="#f59e0b" stopOpacity="0.7" />
        <stop offset="100%" stopColor="#d97706" stopOpacity="0.5" />
      </linearGradient>
      <linearGradient id={`cyanFlow-${variant}`} x1="100%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.6" />
        <stop offset="100%" stopColor="#0891b2" stopOpacity="0.4" />
      </linearGradient>
      <filter id={`softGlow-${variant}`}>
        <feGaussianBlur stdDeviation="3" result="coloredBlur" />
        <feMerge>
          <feMergeNode in="coloredBlur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
  );

  // Variant 1: Original (directory)
  if (variant === 'variant1') {
    return (
      <svg className="absolute inset-0 w-full h-full opacity-40 pointer-events-none transition-transform duration-500 ease-out"
        xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 300" preserveAspectRatio="xMidYMid slice"
        style={{ transform: `translate(${mouseX}px, ${mouseY}px)` }}>
        {commonDefs}
        <path d="M 0 150 Q 150 80, 300 150 T 600 150 T 900 150 T 1200 150" stroke={`url(#goldFlow-${variant})`} strokeWidth="2" fill="none" filter={`url(#softGlow-${variant})`} />
        <path d="M 0 180 Q 200 120, 400 180 T 800 180 T 1200 180" stroke={`url(#goldFlow-${variant})`} strokeWidth="1.5" fill="none" opacity="0.7" />
        <path d="M 100 100 Q 300 50, 500 100" stroke={`url(#cyanFlow-${variant})`} strokeWidth="2" fill="none" filter={`url(#softGlow-${variant})`} />
        <path d="M 700 200 Q 900 150, 1100 200" stroke={`url(#goldFlow-${variant})`} strokeWidth="2" fill="none" filter={`url(#softGlow-${variant})`} />
        <circle cx="250" cy="150" r="40" stroke={`url(#goldFlow-${variant})`} strokeWidth="2" fill="none" opacity="0.7" filter={`url(#softGlow-${variant})`} />
        <circle cx="600" cy="120" r="30" stroke={`url(#cyanFlow-${variant})`} strokeWidth="1.5" fill="none" opacity="0.6" />
        <circle cx="950" cy="170" r="35" stroke={`url(#goldFlow-${variant})`} strokeWidth="2" fill="none" opacity="0.7" filter={`url(#softGlow-${variant})`} />
        <circle cx="400" cy="140" r="4" fill="#fbbf24" opacity="0.8" filter={`url(#softGlow-${variant})`} />
        <circle cx="750" cy="160" r="5" fill="#f59e0b" opacity="0.9" filter={`url(#softGlow-${variant})`} />
        <line x1="250" y1="110" x2="400" y2="140" stroke={`url(#goldFlow-${variant})`} strokeWidth="0.5" opacity="0.4" />
      </svg>
    );
  }

  // Variant 2: Mirrored curves
  if (variant === 'variant2') {
    return (
      <svg className="absolute inset-0 w-full h-full opacity-40 pointer-events-none transition-transform duration-500 ease-out"
        xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 300" preserveAspectRatio="xMidYMid slice"
        style={{ transform: `translate(${mouseX}px, ${mouseY}px)` }}>
        {commonDefs}
        <path d="M 1200 150 Q 1050 220, 900 150 T 600 150 T 300 150 T 0 150" stroke={`url(#goldFlow-${variant})`} strokeWidth="2" fill="none" filter={`url(#softGlow-${variant})`} />
        <path d="M 1200 120 Q 1000 60, 800 120 T 400 120 T 0 120" stroke={`url(#cyanFlow-${variant})`} strokeWidth="2" fill="none" filter={`url(#softGlow-${variant})`} />
        <circle cx="300" cy="150" r="45" stroke={`url(#goldFlow-${variant})`} strokeWidth="2" fill="none" opacity="0.7" filter={`url(#softGlow-${variant})`} />
        <circle cx="900" cy="150" r="35" stroke={`url(#cyanFlow-${variant})`} strokeWidth="1.5" fill="none" opacity="0.6" />
        <circle cx="600" cy="180" r="25" stroke={`url(#goldFlow-${variant})`} strokeWidth="1.5" fill="none" opacity="0.6" />
        <circle cx="200" cy="130" r="3" fill="#06b6d4" opacity="0.8" />
        <circle cx="500" cy="150" r="4" fill="#fbbf24" opacity="0.9" />
        <circle cx="1000" cy="140" r="3" fill="#f59e0b" opacity="0.8" />
      </svg>
    );
  }

  // Variant 3: Vertical emphasis
  if (variant === 'variant3') {
    return (
      <svg className="absolute inset-0 w-full h-full opacity-40 pointer-events-none transition-transform duration-500 ease-out"
        xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 300" preserveAspectRatio="xMidYMid slice"
        style={{ transform: `translate(${mouseX}px, ${mouseY}px)` }}>
        {commonDefs}
        <path d="M 200 0 Q 150 100, 200 200 T 200 400" stroke={`url(#goldFlow-${variant})`} strokeWidth="2" fill="none" filter={`url(#softGlow-${variant})`} />
        <path d="M 600 0 Q 650 80, 600 160 T 600 320" stroke={`url(#cyanFlow-${variant})`} strokeWidth="2" fill="none" filter={`url(#softGlow-${variant})`} />
        <path d="M 1000 0 Q 950 100, 1000 200 T 1000 400" stroke={`url(#goldFlow-${variant})`} strokeWidth="2" fill="none" filter={`url(#softGlow-${variant})`} />
        <path d="M 0 150 Q 300 140, 600 150 T 1200 150" stroke={`url(#goldFlow-${variant})`} strokeWidth="1.5" fill="none" opacity="0.6" />
        <circle cx="400" cy="120" r="30" stroke={`url(#goldFlow-${variant})`} strokeWidth="2" fill="none" opacity="0.7" />
        <circle cx="800" cy="180" r="35" stroke={`url(#cyanFlow-${variant})`} strokeWidth="1.5" fill="none" opacity="0.6" />
        <circle cx="200" cy="100" r="4" fill="#fbbf24" opacity="0.8" />
        <circle cx="600" cy="150" r="5" fill="#06b6d4" opacity="0.9" />
      </svg>
    );
  }

  // Variant 4: Diagonal flow
  if (variant === 'variant4') {
    return (
      <svg className="absolute inset-0 w-full h-full opacity-40 pointer-events-none transition-transform duration-500 ease-out"
        xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 300" preserveAspectRatio="xMidYMid slice"
        style={{ transform: `translate(${mouseX}px, ${mouseY}px)` }}>
        {commonDefs}
        <path d="M 0 50 Q 300 120, 600 180 T 1200 250" stroke={`url(#goldFlow-${variant})`} strokeWidth="2" fill="none" filter={`url(#softGlow-${variant})`} />
        <path d="M 0 120 Q 400 180, 800 220" stroke={`url(#cyanFlow-${variant})`} strokeWidth="2" fill="none" filter={`url(#softGlow-${variant})`} />
        <circle cx="300" cy="100" r="40" stroke={`url(#goldFlow-${variant})`} strokeWidth="2" fill="none" opacity="0.7" filter={`url(#softGlow-${variant})`} />
        <circle cx="700" cy="180" r="35" stroke={`url(#cyanFlow-${variant})`} strokeWidth="1.5" fill="none" opacity="0.6" />
        <circle cx="1000" cy="220" r="30" stroke={`url(#goldFlow-${variant})`} strokeWidth="1.5" fill="none" opacity="0.6" />
        <circle cx="150" cy="80" r="3" fill="#fbbf24" opacity="0.8" />
        <circle cx="500" cy="150" r="4" fill="#06b6d4" opacity="0.9" />
        <circle cx="900" cy="200" r="3" fill="#f59e0b" opacity="0.8" />
        <line x1="300" y1="60" x2="700" y2="145" stroke={`url(#goldFlow-${variant})`} strokeWidth="0.5" opacity="0.4" />
      </svg>
    );
  }

  // Variant 5: Centered radial
  if (variant === 'variant5') {
    return (
      <svg className="absolute inset-0 w-full h-full opacity-40 pointer-events-none transition-transform duration-500 ease-out"
        xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 300" preserveAspectRatio="xMidYMid slice"
        style={{ transform: `translate(${mouseX}px, ${mouseY}px)` }}>
        {commonDefs}
        <circle cx="600" cy="150" r="80" stroke={`url(#goldFlow-${variant})`} strokeWidth="2" fill="none" filter={`url(#softGlow-${variant})`} />
        <circle cx="600" cy="150" r="50" stroke={`url(#cyanFlow-${variant})`} strokeWidth="1.5" fill="none" opacity="0.7" />
        <path d="M 520 150 Q 520 100, 600 100 T 680 150" stroke={`url(#goldFlow-${variant})`} strokeWidth="1.5" fill="none" opacity="0.6" />
        <path d="M 680 150 Q 680 200, 600 200 T 520 150" stroke={`url(#cyanFlow-${variant})`} strokeWidth="1.5" fill="none" opacity="0.6" />
        <circle cx="200" cy="150" r="40" stroke={`url(#goldFlow-${variant})`} strokeWidth="1.5" fill="none" opacity="0.6" />
        <circle cx="1000" cy="150" r="45" stroke={`url(#goldFlow-${variant})`} strokeWidth="1.5" fill="none" opacity="0.6" />
        <line x1="240" y1="150" x2="520" y2="150" stroke={`url(#goldFlow-${variant})`} strokeWidth="0.5" opacity="0.4" />
        <line x1="680" y1="150" x2="960" y2="150" stroke={`url(#cyanFlow-${variant})`} strokeWidth="0.5" opacity="0.4" />
        <circle cx="600" cy="150" r="5" fill="#fbbf24" opacity="0.9" />
      </svg>
    );
  }

  // Variant 6: Scattered curves
  if (variant === 'variant6') {
    return (
      <svg className="absolute inset-0 w-full h-full opacity-40 pointer-events-none transition-transform duration-500 ease-out"
        xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 300" preserveAspectRatio="xMidYMid slice"
        style={{ transform: `translate(${mouseX}px, ${mouseY}px)` }}>
        {commonDefs}
        <path d="M 100 100 Q 200 60, 300 100" stroke={`url(#goldFlow-${variant})`} strokeWidth="2" fill="none" filter={`url(#softGlow-${variant})`} />
        <path d="M 500 80 Q 600 40, 700 80" stroke={`url(#cyanFlow-${variant})`} strokeWidth="2" fill="none" filter={`url(#softGlow-${variant})`} />
        <path d="M 900 120 Q 1000 80, 1100 120" stroke={`url(#goldFlow-${variant})`} strokeWidth="2" fill="none" filter={`url(#softGlow-${variant})`} />
        <path d="M 200 220 Q 300 180, 400 220" stroke={`url(#cyanFlow-${variant})`} strokeWidth="1.5" fill="none" opacity="0.7" />
        <path d="M 700 200 Q 800 160, 900 200" stroke={`url(#goldFlow-${variant})`} strokeWidth="1.5" fill="none" opacity="0.7" />
        <circle cx="200" cy="100" r="25" stroke={`url(#goldFlow-${variant})`} strokeWidth="1.5" fill="none" opacity="0.6" />
        <circle cx="600" cy="80" r="20" stroke={`url(#cyanFlow-${variant})`} strokeWidth="1" fill="none" opacity="0.5" />
        <circle cx="1000" cy="120" r="25" stroke={`url(#goldFlow-${variant})`} strokeWidth="1.5" fill="none" opacity="0.6" />
        <circle cx="300" cy="220" r="20" stroke={`url(#cyanFlow-${variant})`} strokeWidth="1" fill="none" opacity="0.5" />
        <circle cx="800" cy="200" r="25" stroke={`url(#goldFlow-${variant})`} strokeWidth="1.5" fill="none" opacity="0.6" />
        <circle cx="150" cy="80" r="3" fill="#fbbf24" opacity="0.8" />
        <circle cx="550" cy="60" r="3" fill="#06b6d4" opacity="0.8" />
        <circle cx="950" cy="100" r="3" fill="#f59e0b" opacity="0.8" />
      </svg>
    );
  }

  // Variant 7: Layered waves
  if (variant === 'variant7') {
    return (
      <svg className="absolute inset-0 w-full h-full opacity-40 pointer-events-none transition-transform duration-500 ease-out"
        xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 300" preserveAspectRatio="xMidYMid slice"
        style={{ transform: `translate(${mouseX}px, ${mouseY}px)` }}>
        {commonDefs}
        <path d="M 0 100 Q 300 60, 600 100 T 1200 100" stroke={`url(#goldFlow-${variant})`} strokeWidth="2" fill="none" filter={`url(#softGlow-${variant})`} />
        <path d="M 0 150 Q 300 110, 600 150 T 1200 150" stroke={`url(#cyanFlow-${variant})`} strokeWidth="2" fill="none" filter={`url(#softGlow-${variant})`} />
        <path d="M 0 200 Q 300 160, 600 200 T 1200 200" stroke={`url(#goldFlow-${variant})`} strokeWidth="2" fill="none" filter={`url(#softGlow-${variant})`} />
        <circle cx="400" cy="100" r="30" stroke={`url(#goldFlow-${variant})`} strokeWidth="1.5" fill="none" opacity="0.6" />
        <circle cx="800" cy="150" r="35" stroke={`url(#cyanFlow-${variant})`} strokeWidth="1.5" fill="none" opacity="0.6" />
        <circle cx="600" cy="200" r="30" stroke={`url(#goldFlow-${variant})`} strokeWidth="1.5" fill="none" opacity="0.6" />
        <circle cx="200" cy="80" r="3" fill="#fbbf24" opacity="0.8" />
        <circle cx="600" cy="130" r="4" fill="#06b6d4" opacity="0.9" />
        <circle cx="1000" cy="180" r="3" fill="#f59e0b" opacity="0.8" />
      </svg>
    );
  }

  // Default fallback
  return null;
};

// ============================================
// 🎨 المكون الرئيسي
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
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const selectedAnimation = animation || getAnimationByPath(pathname);
  const patternVariant = useMemo(() => getPatternVariant(pathname), [pathname]);

  const variants: Variants = reduceMotion ? reducedMotionVariants : animations[selectedAnimation];

  // Mouse tracking (disabled on mobile for performance)
  useEffect(() => {
    if (reduceMotion || typeof window === 'undefined') return;

    // Detect mobile
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || window.innerWidth < 768;
    if (isMobile) return; // Skip mouse tracking on mobile

    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 30;
      const y = (e.clientY / window.innerHeight - 0.5) * 30;
      setMousePosition({ x, y });
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [reduceMotion]);

  return (
    <section className={`bg-primary-900 text-white py-16 px-4 relative overflow-hidden ${className || ''}`.trim()}>
      {/* 🎨 Dynamic Artistic Pattern */}
      {!reduceMotion && <ArtisticPattern variant={patternVariant} mouseX={mousePosition.x} mouseY={mousePosition.y} />}

      {/* 🌟 Ambient glow */}
      <div className="absolute top-20 right-32 w-80 h-80 bg-amber-500/15 rounded-full filter blur-3xl pointer-events-none" />
      <div className="absolute bottom-20 left-32 w-96 h-96 bg-cyan-400/10 rounded-full filter blur-3xl pointer-events-none" />

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
