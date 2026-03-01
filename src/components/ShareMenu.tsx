'use client';

import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Share2, Copy, X, Check, Facebook, Linkedin, Send } from 'lucide-react';

// =====================================================
// أيقونة X (تويتر سابقاً)
// =====================================================
function XIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

// =====================================================
// أيقونة تيليجرام
// =====================================================
function TelegramIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
    </svg>
  );
}

// =====================================================
// أيقونة واتساب
// =====================================================
function WhatsAppIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

interface ShareMenuProps {
  title: string;
  text?: string;
  url?: string;
  mini?: boolean;
  variant?: 'default' | 'glass' | 'subtle';
  customClass?: string;
}

// =====================================================
// روابط المشاركة
// =====================================================
function getShareLinks(url: string, title: string, text?: string) {
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  const encodedText = encodeURIComponent(text ? `${title}\n\n${text}` : title);

  return {
    whatsapp: `https://wa.me/?text=${encodedText}%0A%0A${encodedUrl}`,
    telegram: `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`,
    x: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
  };
}

export default function ShareMenu({ title, text, url, mini = false, variant = 'default', customClass = "" }: ShareMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [canNativeShare, setCanNativeShare] = useState(false);
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(() => {
    if (typeof document === 'undefined') return null;
    return document.body;
  });

  useEffect(() => {
    if (!portalTarget) setPortalTarget(document.body);
  }, [portalTarget]);

  // التحقق من دعم Native Share API
  useEffect(() => {
    setCanNativeShare(typeof navigator !== 'undefined' && typeof navigator.share === 'function');
  }, []);

  const shareUrl = useMemo(() => {
    if (typeof window === 'undefined') return '';
    return url || window.location.href;
  }, [url]);

  const shareText = useMemo(() => (text ? `${title}\n\n${text}` : title), [title, text]);

  const shareLinks = useMemo(() => getShareLinks(shareUrl, title, text), [shareUrl, title, text]);

  // ... (handleCopy, handleNativeShare, openShareLink, useEffect handleKeyDown remain unchanged) ...
  // =====================================================
  // نسخ الرابط
  // =====================================================
  const handleCopy = async () => {
    const payload = `${shareText}\n${shareUrl}`.trim();
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(payload);
      } else {
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
      // ignore
    }
  };

  // =====================================================
  // مشاركة أصلية (Native Share API)
  // =====================================================
  const handleNativeShare = async () => {
    if (canNativeShare && navigator.share) {
      try {
        await navigator.share({
          title: title,
          text: text || title,
          url: shareUrl,
        });
        setIsOpen(false);
      } catch {
        // المستخدم ألغى المشاركة
      }
    }
  };

  // =====================================================
  // فتح رابط المشاركة
  // =====================================================
  const openShareLink = (link: string) => {
    window.open(link, '_blank', 'noopener,noreferrer,width=600,height=400');
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

  // =====================================================
  // أزرار المشاركة
  // =====================================================
  const shareButtons = [
    {
      name: 'واتساب',
      icon: WhatsAppIcon,
      link: shareLinks.whatsapp,
      color: 'bg-green-500 hover:bg-green-600',
    },
    {
      name: 'تيليجرام',
      icon: TelegramIcon,
      link: shareLinks.telegram,
      color: 'bg-sky-500 hover:bg-sky-600',
    },
    {
      name: 'X',
      icon: XIcon,
      link: shareLinks.x,
      color: 'bg-slate-900 hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600',
    },
    {
      name: 'فيسبوك',
      icon: Facebook,
      link: shareLinks.facebook,
      color: 'bg-blue-600 hover:bg-blue-700',
    },
    {
      name: 'لينكدإن',
      icon: Linkedin,
      link: shareLinks.linkedin,
      color: 'bg-blue-700 hover:bg-blue-800',
    },
  ];

  if (variant === 'glass') {
    return (
      <>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (canNativeShare) {
              handleNativeShare();
            } else {
              setIsOpen(true);
            }
          }}
          className={`bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 backdrop-blur-md border border-white/10 text-white ${customClass}`}
        >
          <Share2 size={14} /> <span>مشاركة</span>
        </button>
        {isOpen && portalTarget
          ? createPortal(
            <div
              className="fixed inset-0 z-[1020] flex items-end md:items-center justify-center bg-black/60 backdrop-blur-sm p-4"
              onClick={() => setIsOpen(false)}
            >
              <div
                className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[2rem] p-6 relative shadow-2xl border border-slate-100 dark:border-slate-700 animate-in slide-in-from-bottom-4 duration-300"
                onClick={(e) => e.stopPropagation()}
              >
                {/* الرأس */}
                <div className="flex justify-between items-center mb-6">
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

                {/* أزرار المشاركة */}
                <div className="grid grid-cols-5 gap-3 mb-6">
                  {shareButtons.map((btn) => (
                    <button
                      key={btn.name}
                      type="button"
                      onClick={() => openShareLink(btn.link)}
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-xl ${btn.color} text-white transition-all hover:scale-105 shadow-lg`}
                      title={btn.name}
                    >
                      <btn.icon size={22} />
                      <span className="text-[10px] font-bold">{btn.name}</span>
                    </button>
                  ))}
                </div>

                {/* مشاركة أصلية (للموبايل) */}
                {canNativeShare && (
                  <button
                    type="button"
                    onClick={handleNativeShare}
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-3 px-4 rounded-xl mb-4 transition shadow-lg"
                  >
                    <Send size={18} />
                    المزيد من خيارات المشاركة
                  </button>
                )}

                {/* فاصل */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700"></div>
                  <span className="text-xs text-slate-400 font-bold">أو انسخ الرابط</span>
                  <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700"></div>
                </div>

                {/* نسخ الرابط */}
                <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl flex items-center gap-3 border border-slate-200 dark:border-slate-700">
                  <div className="truncate text-xs text-slate-500 dark:text-slate-400 flex-1 font-mono bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-100 dark:border-slate-700 overflow-hidden">
                    {shareUrl}
                  </div>
                  <button
                    type="button"
                    onClick={handleCopy}
                    className={`px-4 py-2.5 rounded-xl text-sm font-bold transition flex items-center gap-2 shrink-0 ${copied
                      ? 'bg-green-500 text-white'
                      : 'bg-primary-600 text-white hover:bg-primary-700'
                      }`}
                  >
                    {copied ? (
                      <>
                        <Check size={16} />
                        تم!
                      </>
                    ) : (
                      <>
                        <Copy size={16} />
                        نسخ
                      </>
                    )}
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

  // Subtle Variant (Adaptive)
  if (variant === 'subtle') {
    return (
      <>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (canNativeShare) {
              handleNativeShare();
            } else {
              setIsOpen(true);
            }
          }}
          className={mini
            ? `p-1.5 rounded-full bg-slate-900/5 hover:bg-slate-900/10 dark:bg-white/10 dark:hover:bg-white/20 text-slate-500 dark:text-slate-300 hover:text-blue-600 transition ${customClass}`
            : `bg-slate-900/5 hover:bg-slate-900/10 dark:bg-white/10 dark:hover:bg-white/20 px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 backdrop-blur-md border border-slate-900/5 dark:border-white/10 text-slate-600 dark:text-slate-200 ${customClass}`}
          title="مشاركة"
        >
          <Share2 size={mini ? 14 : 14} />
          {!mini && <span>مشاركة</span>}
        </button>
        {isOpen && portalTarget
          ? createPortal(
            <div
              className="fixed inset-0 z-[1020] flex items-end md:items-center justify-center bg-black/60 backdrop-blur-sm p-4"
              onClick={() => setIsOpen(false)}
            >
              <div
                className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[2rem] p-6 relative shadow-2xl border border-slate-100 dark:border-slate-700 animate-in slide-in-from-bottom-4 duration-300"
                onClick={(e) => e.stopPropagation()}
              >
                {/* الرأس */}
                <div className="flex justify-between items-center mb-6">
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

                {/* أزرار المشاركة */}
                <div className="grid grid-cols-5 gap-3 mb-6">
                  {shareButtons.map((btn) => (
                    <button
                      key={btn.name}
                      type="button"
                      onClick={() => openShareLink(btn.link)}
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-xl ${btn.color} text-white transition-all hover:scale-105 shadow-lg`}
                      title={btn.name}
                    >
                      <btn.icon size={22} />
                      <span className="text-[10px] font-bold">{btn.name}</span>
                    </button>
                  ))}
                </div>

                {/* مشاركة أصلية (للموبايل) */}
                {canNativeShare && (
                  <button
                    type="button"
                    onClick={handleNativeShare}
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-3 px-4 rounded-xl mb-4 transition shadow-lg"
                  >
                    <Send size={18} />
                    المزيد من خيارات المشاركة
                  </button>
                )}

                {/* فاصل */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700"></div>
                  <span className="text-xs text-slate-400 font-bold">أو انسخ الرابط</span>
                  <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700"></div>
                </div>

                {/* نسخ الرابط */}
                <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl flex items-center gap-3 border border-slate-200 dark:border-slate-700">
                  <div className="truncate text-xs text-slate-500 dark:text-slate-400 flex-1 font-mono bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-100 dark:border-slate-700 overflow-hidden">
                    {shareUrl}
                  </div>
                  <button
                    type="button"
                    onClick={handleCopy}
                    className={`px-4 py-2.5 rounded-xl text-sm font-bold transition flex items-center gap-2 shrink-0 ${copied
                      ? 'bg-green-500 text-white'
                      : 'bg-primary-600 text-white hover:bg-primary-700'
                      }`}
                  >
                    {copied ? (
                      <>
                        <Check size={16} />
                        تم!
                      </>
                    ) : (
                      <>
                        <Copy size={16} />
                        نسخ
                      </>
                    )}
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

  return (
    <>
      {mini ? (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (canNativeShare) {
              handleNativeShare();
            } else {
              setIsOpen(true);
            }
          }}
          className={`p-2 rounded-full bg-white/50 hover:bg-white dark:bg-slate-900/40 dark:hover:bg-slate-900 text-slate-500 dark:text-slate-300 hover:text-blue-600 transition shadow-sm ${customClass}`}
          title="مشاركة"
        >
          <Share2 size={18} />
        </button>
      ) : (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (canNativeShare) {
              handleNativeShare();
            } else {
              setIsOpen(true);
            }
          }}
          className={`flex items-center justify-start gap-2 text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 font-medium transition-colors ${customClass}`}
        >
          <Share2 size={20} /> <span className="text-sm">مشاركة</span>
        </button>
      )}

      {isOpen && portalTarget
        ? createPortal(
          <div
            className="fixed inset-0 z-[1020] flex items-end md:items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setIsOpen(false)}
          >
            <div
              className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[2rem] p-6 relative shadow-2xl border border-slate-100 dark:border-slate-700 animate-in slide-in-from-bottom-4 duration-300"
              onClick={(e) => e.stopPropagation()}
            >
              {/* الرأس */}
              <div className="flex justify-between items-center mb-6">
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

              {/* أزرار المشاركة */}
              <div className="grid grid-cols-5 gap-3 mb-6">
                {shareButtons.map((btn) => (
                  <button
                    key={btn.name}
                    type="button"
                    onClick={() => openShareLink(btn.link)}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl ${btn.color} text-white transition-all hover:scale-105 shadow-lg`}
                    title={btn.name}
                  >
                    <btn.icon size={22} />
                    <span className="text-[10px] font-bold">{btn.name}</span>
                  </button>
                ))}
              </div>

              {/* مشاركة أصلية (للموبايل) */}
              {canNativeShare && (
                <button
                  type="button"
                  onClick={handleNativeShare}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-3 px-4 rounded-xl mb-4 transition shadow-lg"
                >
                  <Send size={18} />
                  المزيد من خيارات المشاركة
                </button>
              )}

              {/* فاصل */}
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700"></div>
                <span className="text-xs text-slate-400 font-bold">أو انسخ الرابط</span>
                <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700"></div>
              </div>

              {/* نسخ الرابط */}
              <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl flex items-center gap-3 border border-slate-200 dark:border-slate-700">
                <div className="truncate text-xs text-slate-500 dark:text-slate-400 flex-1 font-mono bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-100 dark:border-slate-700 overflow-hidden">
                  {shareUrl}
                </div>
                <button
                  type="button"
                  onClick={handleCopy}
                  className={`px-4 py-2.5 rounded-xl text-sm font-bold transition flex items-center gap-2 shrink-0 ${copied
                    ? 'bg-green-500 text-white'
                    : 'bg-primary-600 text-white hover:bg-primary-700'
                    }`}
                >
                  {copied ? (
                    <>
                      <Check size={16} />
                      تم!
                    </>
                  ) : (
                    <>
                      <Copy size={16} />
                      نسخ
                    </>
                  )}
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
