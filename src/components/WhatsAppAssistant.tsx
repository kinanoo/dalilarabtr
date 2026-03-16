'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Scale, Mail, MessageCircle } from 'lucide-react';
import { SITE_CONFIG } from '@/lib/config';

const ALLOWED_PATHS = ['/', '/services'];

export default function WhatsAppAssistant() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const isVisible = ALLOWED_PATHS.includes(pathname || '');

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent | TouchEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('touchstart', handleClick, { passive: true });
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('touchstart', handleClick);
    };
  }, [open]);

  if (!isVisible) return null;

  return (
    <div ref={wrapperRef} className="fixed bottom-1 left-2 md:bottom-2 md:left-4 z-[90] flex flex-col items-center gap-1.5">
      {/* Options */}
      <div className="flex flex-col items-center gap-1">
        {/* Consultant */}
        <div
          className="flex items-center gap-1.5 transition-all duration-300 ease-out"
          style={{
            opacity: open ? 1 : 0,
            transform: open ? 'translateY(0) scale(1)' : 'translateY(10px) scale(0.8)',
            transitionDelay: open ? '60ms' : '0ms',
            pointerEvents: open ? 'auto' : 'none',
          }}
        >
          <span className="text-[9px] font-bold bg-slate-900/80 dark:bg-slate-100/90 text-white dark:text-slate-900 px-1.5 py-0.5 rounded shadow-lg backdrop-blur-sm whitespace-nowrap">المستشار</span>
          <Link
            href="/consultant"
            onClick={() => setOpen(false)}
            className="w-8 h-8 rounded-full bg-sky-500 hover:bg-sky-600 text-white shadow-md flex items-center justify-center transition-all duration-200"
            aria-label="المستشار"
          >
            <Scale size={14} />
          </Link>
        </div>
        {/* Email contact */}
        <div
          className="flex items-center gap-1.5 transition-all duration-300 ease-out"
          style={{
            opacity: open ? 1 : 0,
            transform: open ? 'translateY(0) scale(1)' : 'translateY(10px) scale(0.8)',
            transitionDelay: open ? '0ms' : '0ms',
            pointerEvents: open ? 'auto' : 'none',
          }}
        >
          <span className="text-[9px] font-bold bg-slate-900/80 dark:bg-slate-100/90 text-white dark:text-slate-900 px-1.5 py-0.5 rounded shadow-lg backdrop-blur-sm whitespace-nowrap">تواصل</span>
          <a
            href={`mailto:${SITE_CONFIG.email}`}
            onClick={() => setOpen(false)}
            className="w-8 h-8 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white shadow-md flex items-center justify-center transition-all duration-200"
            aria-label="تواصل عبر البريد"
          >
            <Mail size={14} />
          </a>
        </div>
      </div>

      {/* Main button — Contact style */}
      <button
        type="button"
        onClick={() => setOpen(prev => !prev)}
        className={`w-12 h-12 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white shadow-md shadow-emerald-600/20 flex items-center justify-center transition-all duration-300 active:scale-90${!open ? ' animate-pulse' : ''}`}
        aria-label={open ? 'إغلاق القائمة' : 'تواصل معنا'}
        aria-expanded={open ? 'true' : 'false'}
      >
        {open ? (
          <span className="text-lg font-bold leading-none transition-transform duration-300 rotate-45">+</span>
        ) : (
          <MessageCircle size={22} />
        )}
      </button>
    </div>
  );
}
