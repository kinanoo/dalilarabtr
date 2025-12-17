'use client';

import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Share2, Copy, X } from 'lucide-react';

interface ShareMenuProps {
  title: string;
  text?: string;
  url?: string;
  mini?: boolean;
  customClass?: string;
}

export default function ShareMenu({ title, text, url, mini = false, customClass = "" }: ShareMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(() => {
    if (typeof document === 'undefined') return null;
    return document.body;
  });

  useEffect(() => {
    if (!portalTarget) setPortalTarget(document.body);
  }, []);

  const shareUrl = useMemo(() => {
    if (typeof window === 'undefined') return '';
    return url || window.location.href;
  }, [url]);

  const shareText = useMemo(() => (text ? `${title}\n\n${text}` : title), [title, text]);

  const handleCopy = async () => {
    const payload = `${shareText}\n${shareUrl}`.trim();
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(payload);
      } else {
        // Fallback for older/blocked clipboard APIs
        const textarea = document.createElement('textarea');
        textarea.value = payload;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'fixed';
        textarea.style.top = '-9999px';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore (some browsers block clipboard without HTTPS/user gesture)
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <>
      {mini ? (
        <button 
          type="button"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsOpen(true); }} 
          className={`p-2 rounded-full bg-white/50 hover:bg-white dark:bg-slate-900/40 dark:hover:bg-slate-900 text-slate-500 dark:text-slate-300 hover:text-blue-600 transition shadow-sm ${customClass}`}
          title="مشاركة"
        >
          <Share2 size={18} />
        </button>
      ) : (
        <button 
          type="button"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsOpen(true); }} 
          // 👇 هنا التعديل: أصبح لونه غامقاً وواضحاً (slate-800) بدلاً من الفاتح
          className={`flex items-center justify-center gap-2 bg-primary-700 hover:bg-primary-600 text-white font-bold py-3 px-6 rounded-xl transition w-full shadow-md hover:shadow-lg ${customClass}`}
        >
          <Share2 size={18} /> مشاركة
        </button>
      )}

      {isOpen && portalTarget
        ? createPortal(
            <div
              className="fixed inset-0 z-[1020] flex items-end md:items-center justify-center bg-black/60 backdrop-blur-sm p-4"
              onClick={() => setIsOpen(false)}
            >
              <div
                className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[2rem] p-6 relative shadow-2xl border border-slate-100 dark:border-slate-700"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <Share2 size={24} className="text-blue-600" />
                    مشاركة المحتوى
                  </h3>
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                  >
                    <X size={20} className="text-slate-500 dark:text-slate-300" />
                  </button>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl flex items-center justify-between border border-slate-200 dark:border-slate-700">
                  <div className="truncate text-xs text-slate-500 dark:text-slate-300 flex-1 mr-4 font-mono bg-white dark:bg-slate-950 p-2 rounded-lg border border-slate-100 dark:border-slate-700">
                    {shareUrl}
                  </div>
                  <button
                    type="button"
                    onClick={handleCopy}
                    className={`px-5 py-2.5 rounded-xl text-sm font-bold transition flex items-center gap-2 ${copied ? 'bg-green-600 text-white' : 'bg-primary-700 text-white hover:bg-primary-600'}`}
                  >
                    {copied ? 'تم النسخ' : 'نسخ'} <Copy size={16} />
                  </button>
                </div>
              </div>
            </div>,
            portalTarget
          )
        : null}
    </>
  );
}