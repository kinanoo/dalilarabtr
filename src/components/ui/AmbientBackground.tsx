'use client';

import { useEffect, useRef, useState } from 'react';

export default function AmbientBackground() {
  const spotlightRef = useRef<HTMLDivElement>(null);
  const [isDesktop, setIsDesktop] = useState(false);

  // Skip rendering entirely on mobile — saves GPU resources
  useEffect(() => {
    setIsDesktop(window.innerWidth >= 768);
  }, []);

  useEffect(() => {
    // Only track mouse on devices that have a mouse
    if (!isDesktop || !window.matchMedia('(hover: hover)').matches) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (spotlightRef.current) {
        // Use standard CSS variables or direct transform for performance
        // Using fixed position, so clientX/Y works directly
        const x = e.clientX;
        const y = e.clientY;

        // Update the spotlight position smoothly
        spotlightRef.current.style.transform = `translate(${x}px, ${y}px)`;
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [isDesktop]);

  // Don't render anything on mobile — no GPU cost
  if (!isDesktop) return null;

  return (
    <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none">
      {/* 1. Base Darker Tint */}
      <div className="absolute inset-0 bg-slate-100 dark:bg-[#020617] transition-colors duration-300" />

      {/* 2. Interactive Mouse Spotlight 
          - Centered on mouse
          - "Middle Ground" -> ~8% opacity
          - HIDDEN ON MOBILE for performance
      */}
      <div
        ref={spotlightRef}
        className="hidden md:block absolute top-0 left-0 w-[600px] h-[600px] bg-emerald-400/[0.08] dark:bg-emerald-500/[0.08] rounded-full blur-[100px] mix-blend-multiply dark:mix-blend-screen transition-transform duration-75 ease-out will-change-transform"
        style={{
          transform: 'translate(-50%, -50%)',
          marginTop: '-300px',
          marginLeft: '-300px'
        }}
      />

      {/* 3. Ambient Animated Waves (Soft & Slow) — GPU-composited */}
      {/* Emerald Wave - Top Right */}
      <div className="absolute -top-[20%] -right-[10%] w-[80vw] h-[80vw] bg-emerald-200/[0.2] dark:bg-emerald-900/[0.15] rounded-full blur-[100px] animate-wave-slow md:mix-blend-multiply md:dark:mix-blend-screen opacity-60 will-change-transform" />

      {/* Teal Wave - Bottom Left */}
      <div className="absolute -bottom-[20%] -left-[10%] w-[70vw] h-[70vw] bg-teal-200/[0.2] dark:bg-teal-900/[0.15] rounded-full blur-[100px] animate-wave-slower md:mix-blend-multiply md:dark:mix-blend-screen opacity-60 will-change-transform" />

      {/* Indigo Pulse - Center */}
      <div className="absolute top-[30%] left-[20%] w-[50vw] h-[50vw] bg-indigo-200/[0.15] dark:bg-indigo-900/[0.1] rounded-full blur-[120px] animate-pulse-slow md:mix-blend-multiply md:dark:mix-blend-screen opacity-50 will-change-transform" />

      {/* 4. Noise Texture (Matte Finish) */}
      <div className="absolute inset-0 opacity-[0.25]" style={{ backgroundImage: 'url("https://grainy-gradients.vercel.app/noise.svg")' }} />

      {/* 5. Keyframes Styles */}
      <style jsx global>{`
        @keyframes wave-slow {
          0% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0, 0) scale(1); }
        }
        @keyframes wave-slower {
          0% { transform: translate(0, 0) rotate(0deg); }
          50% { transform: translate(-30px, 30px) rotate(10deg); }
          100% { transform: translate(0, 0) rotate(0deg); }
        }
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.8; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.05); }
        }
        .animate-wave-slow { animation: wave-slow 25s infinite ease-in-out; }
        .animate-wave-slower { animation: wave-slower 35s infinite ease-in-out; }
        .animate-pulse-slow { animation: pulse-slow 20s infinite ease-in-out; }
      `}</style>
    </div>
  );
}
