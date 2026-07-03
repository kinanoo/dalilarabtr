'use client';

import PageHero from '@/components/PageHero';
import Link from 'next/link';
import { useState } from 'react';
import { User, MessageCircle, Copy, AlertCircle, Scale, HelpCircle, FileText, Send } from 'lucide-react';
import { SITE_CONFIG } from '@/lib/config';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { contactSchema, type ContactInputs } from '@/lib/schemas';

const MESSAGE_TYPES = [
  { value: 'general', label: 'استفسار عام' },
  { value: 'suggestion', label: 'اقتراح تحسين' },
  { value: 'bug', label: 'مشكلة تقنية' },
  { value: 'service', label: 'طلب خدمة' },
  { value: 'other', label: 'أخرى' },
];

export default function ContactPage() {
  const [copied, setCopied] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid }
  } = useForm<ContactInputs>({
    resolver: zodResolver(contactSchema),
    defaultValues: { name: '', messageType: 'general', message: '' },
    mode: 'onChange'
  });

  const onSubmit = (data: ContactInputs) => {
    const typeLabel = MESSAGE_TYPES.find(t => t.value === data.messageType)?.label || data.messageType;
    const subject = encodeURIComponent(`[${typeLabel}] رسالة من الموقع`);
    const body = encodeURIComponent(
      `الاسم: ${data.name || 'غير محدد'}\nنوع الرسالة: ${typeLabel}\n\n${data.message}`
    );

    // Copy to clipboard as backup
    const msg = `الاسم: ${data.name || 'غير محدد'}\nنوع الرسالة: ${typeLabel}\n\n${data.message}`;
    const copyToClipboard = async () => {
      try {
        if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(msg);
        } else {
          const ta = document.createElement('textarea');
          ta.value = msg;
          ta.style.position = 'fixed';
          ta.style.opacity = '0';
          document.body.appendChild(ta);
          ta.select();
          document.execCommand('copy');
          document.body.removeChild(ta);
        }
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2500);
      } catch { /* ignore */ }
    };

    void copyToClipboard();

    // Open WhatsApp with the message pre-filled — in a NEW tab so the page
    // (and the visitor's place on it) isn't lost to the wa.me interstitial.
    const num = (SITE_CONFIG.whatsapp || '').replace(/\D/g, '');
    window.open(`https://wa.me/${num}?text=${subject}%0A%0A${body}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <main className="flex flex-col min-h-screen">
      <PageHero title="اتصل بنا" description="تواصل معنا مباشرة — نردّ عادةً خلال 24 ساعة." />

      <div className="w-full max-w-4xl mx-auto px-3 sm:px-4 py-8 sm:py-12 -mt-4 relative z-10 space-y-8">

        {/* Quick Action Cards — family treatment with accent stripes */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <a
            href={`https://wa.me/${(SITE_CONFIG.whatsapp || '').replace(/\D/g, '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative overflow-hidden bg-gradient-to-br from-white to-emerald-50/50 dark:from-slate-900 dark:to-emerald-950/20 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 text-center hover:border-emerald-400 hover:shadow-xl hover:shadow-emerald-500/10 hover:-translate-y-1 transition-all duration-300"
          >
            <span className="absolute top-0 end-0 w-1 h-full bg-emerald-500 opacity-70 group-hover:opacity-100 transition-opacity" />
            <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-transform shadow-sm">
              <MessageCircle className="w-7 h-7" />
            </div>
            <h3 className="font-black text-slate-800 dark:text-slate-100 mb-1 group-hover:text-emerald-600 transition-colors">واتساب</h3>
            <p className="text-xs text-slate-400">راسلنا مباشرةً على واتساب</p>
          </a>

          <Link
            href="/consultant"
            className="group relative overflow-hidden bg-gradient-to-br from-white to-blue-50/50 dark:from-slate-900 dark:to-blue-950/20 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 text-center hover:border-blue-400 hover:shadow-xl hover:shadow-blue-500/10 hover:-translate-y-1 transition-all duration-300"
          >
            <span className="absolute top-0 end-0 w-1 h-full bg-blue-500 opacity-70 group-hover:opacity-100 transition-opacity" />
            <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-transform shadow-sm">
              <Scale className="w-7 h-7" />
            </div>
            <h3 className="font-black text-slate-800 dark:text-slate-100 mb-1 group-hover:text-blue-600 transition-colors">المستشار القانوني</h3>
            <p className="text-xs text-slate-400">78 سيناريو جاهز للتشخيص</p>
          </Link>

          <Link
            href="/faq"
            className="group relative overflow-hidden bg-gradient-to-br from-white to-cyan-50/50 dark:from-slate-900 dark:to-cyan-950/20 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 text-center hover:border-cyan-400 hover:shadow-xl hover:shadow-cyan-500/10 hover:-translate-y-1 transition-all duration-300"
          >
            <span className="absolute top-0 end-0 w-1 h-full bg-cyan-500 opacity-70 group-hover:opacity-100 transition-opacity" />
            <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400 flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-transform shadow-sm">
              <HelpCircle className="w-7 h-7" />
            </div>
            <h3 className="font-black text-slate-800 dark:text-slate-100 mb-1 group-hover:text-cyan-600 transition-colors">الأسئلة الشائعة</h3>
            <p className="text-xs text-slate-400">إجابات سريعة على أكثر الأسئلة</p>
          </Link>
        </div>

        {/* Contact Form */}
        <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
          <div className="text-center mb-6 sm:mb-8">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-100">أرسل رسالتك</h2>
            <p className="text-slate-500 dark:text-slate-300 mt-2 text-sm">سيتم فتح واتساب لإرسال رسالتك مباشرةً.</p>
          </div>

          <form method="post" onSubmit={handleSubmit(onSubmit)} className="space-y-5">

            {/* Name */}
            <div>
              <label htmlFor="contact-name" className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-2 flex items-center gap-2">
                <User size={18} className="text-primary-500" /> الاسم (اختياري)
              </label>
              <input
                id="contact-name"
                type="text"
                {...register('name')}
                className="w-full p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl outline-none transition text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:ring-2 focus:ring-primary-500"
                placeholder="مثال: أحمد"
              />
            </div>

            {/* Message Type */}
            <div>
              <label htmlFor="contact-type" className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-2 flex items-center gap-2">
                <FileText size={18} className="text-primary-500" /> نوع الرسالة
              </label>
              <select
                id="contact-type"
                {...register('messageType')}
                className="w-full p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition cursor-pointer text-slate-900 dark:text-slate-100"
              >
                {MESSAGE_TYPES.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            {/* Message */}
            <div>
              <label htmlFor="contact-message" className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-2 flex items-center gap-2">
                <MessageCircle size={18} className="text-primary-500" /> الرسالة
              </label>
              <div className="relative">
                <textarea
                  id="contact-message"
                  {...register('message')}
                  rows={5}
                  className={`w-full p-3.5 bg-slate-50 dark:bg-slate-950 border rounded-xl outline-none transition text-slate-900 dark:text-slate-100 placeholder:text-slate-400
                    ${errors.message ? 'border-red-500 focus:ring-red-500' : 'border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary-500'}
                  `}
                  placeholder="اكتب رسالتك هنا..."
                />
                {errors.message && <AlertCircle size={18} className="absolute end-3 top-3.5 text-red-500" />}
              </div>
              {errors.message && <p className="text-red-500 text-xs mt-1">{errors.message.message}</p>}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={!isValid}
              className={`w-full py-3.5 rounded-xl font-bold text-base transition shadow-lg flex items-center justify-center gap-2
                ${isValid
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
                  : 'bg-slate-300 dark:bg-slate-700 text-slate-500 cursor-not-allowed'}
              `}
            >
              <span>{copied ? 'تم النسخ — جارٍ فتح واتساب' : 'إرسال عبر واتساب'}</span>
              {copied ? <Copy size={18} /> : <Send size={18} />}
            </button>

          </form>
        </div>

        {/* Response Note */}
        <p className="text-center text-xs text-slate-400 dark:text-slate-500">
          نردّ عادةً خلال 24 ساعة عبر واتساب. إذا كان طلبك متعلقاً بخدمة محددة، استخدم صفحة{' '}
          <Link href="/request" className="underline hover:text-slate-600 dark:hover:text-slate-300 transition-colors">طلب خدمة</Link>.
        </p>

      </div>
    </main>
  );
}
