'use client';

import PageHero from '@/components/PageHero';
import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState, Suspense } from 'react';
import { Copy, User, Phone, FileText, CheckCircle, MessageCircle, AlertCircle } from 'lucide-react';
import { SITE_CONFIG } from '@/lib/config';
import { SERVICES_LIST } from '@/lib/constants';
import { fetchRemoteServices, mergeServices, subscribeDemoDataUpdated, type RuntimeService } from '@/lib/remoteData';
import { buildWhatsAppHref } from '@/lib/whatsapp';

// Validation
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { requestServiceSchema, type RequestServiceInputs } from '@/lib/schemas';

// مكون النموذج (مفصول ليعمل داخل Suspense)
function RequestForm() {
  const searchParams = useSearchParams();
  const initialServiceId = searchParams.get('service') || 'other';

  const [services, setServices] = useState<RuntimeService[]>(SERVICES_LIST);
  const [copied, setCopied] = useState(false);

  // 1. Zod Form Setup
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid }
  } = useForm<RequestServiceInputs>({
    resolver: zodResolver(requestServiceSchema),
    defaultValues: {
      name: '',
      serviceId: initialServiceId,
      details: ''
    },
    mode: 'onChange' // Validate as user types for better feedback
  });

  const selectedServiceId = watch('serviceId');

  useEffect(() => {
    let cancelled = false;
    const reload = async () => {
      const [remoteServices] = await Promise.all([fetchRemoteServices()]);
      if (cancelled) return;

      const merged = mergeServices(remoteServices);
      setServices(merged);

      // If current selected ID is invalid, reset to 'other' (unless it is 'other')
      if (selectedServiceId && selectedServiceId !== 'other' && !merged.find(s => s.id === selectedServiceId)) {
        setValue('serviceId', 'other');
      } else if (!selectedServiceId) {
        setValue('serviceId', 'other');
      }
    };

    void reload();
    const unsubscribe = subscribeDemoDataUpdated(() => void reload());
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  const selectedService = useMemo(
    () => services.find((s) => s.id === selectedServiceId) || services[0],
    [services, selectedServiceId]
  );


  const onSubmit = (data: RequestServiceInputs) => {
    // تجهيز رسالة الواتساب
    const message = `
*طلب خدمة جديدة من الموقع* 🚀
------------------------
👤 *الاسم:* ${data.name || 'غير محدد'}
💼 *الخدمة المطلوبة:* ${services.find((s) => s.id === data.serviceId)?.title || 'غير محددة'}
📝 *التفاصيل:* ${data.details || 'لا يوجد'}
------------------------
يرجى الرد وتزويدي بالتكلفة والإجراءات.
    `.trim();

    const copyToClipboard = async () => {
      try {
        if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(message);
        } else {
          // Fallback
          const textarea = document.createElement('textarea');
          textarea.value = message;
          textarea.style.position = 'fixed';
          textarea.style.opacity = '0';
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

    void copyToClipboard();

    const recipientPhone = (selectedService as RuntimeService | undefined)?.whatsapp || SITE_CONFIG.whatsapp;
    const whatsAppHref = buildWhatsAppHref(recipientPhone, message) || buildWhatsAppHref(SITE_CONFIG.whatsapp, message);
    if (whatsAppHref && typeof window !== 'undefined') {
      window.open(whatsAppHref, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-800">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">نموذج طلب خدمة</h2>
        <p className="text-slate-500 dark:text-slate-300 mt-2 text-sm">عند الإرسال سيفتح واتساب مباشرة وسيتم أيضاً نسخ نص الطلب.</p>
      </div>

      <form method="post" onSubmit={handleSubmit(onSubmit)} className="space-y-6">

        {/* Name Field */}
        <div className="group">
          <label className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-2 flex items-center gap-2">
            <User size={18} className="text-primary-500" /> الاسم الكامل (اختياري)
          </label>
          <div className="relative">
            <input
              type="text"
              {...register('name')}
              className={`w-full p-4 bg-slate-50 dark:bg-slate-950 border rounded-xl outline-none transition text-slate-900 dark:text-slate-100 placeholder:text-slate-400
                    ${errors.name ? 'border-red-500 focus:ring-red-500' : 'border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary-500'}
                `}
              placeholder="مثال: محمد أحمد"
            />
            {errors.name && <AlertCircle size={20} className="absolute left-4 top-4 text-red-500" />}
          </div>
          {errors.name && <p className="text-red-500 text-xs mt-1 animate-in slide-in-from-top-1">{errors.name.message}</p>}
        </div>

        {/* Service Type */}
        <div>
          <label className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-2 flex items-center gap-2">
            <CheckCircle size={18} className="text-primary-500" /> نوع الخدمة
          </label>
          <select
            {...register('serviceId')}
            className="w-full p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition cursor-pointer text-slate-900 dark:text-slate-100"
          >
            {services.map((s) => (
              <option key={s.id} value={s.id}>{s.title}</option>
            ))}
            <option value="other">خدمة أخرى (غير موجودة بالقائمة)</option>
          </select>
          {errors.serviceId && <p className="text-red-500 text-xs mt-1">{errors.serviceId.message}</p>}
        </div>

        {/* Details */}
        <div>
          <label className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-2 flex items-center gap-2">
            <FileText size={18} className="text-primary-500" /> تفاصيل إضافية (اختياري)
          </label>
          <textarea
            {...register('details')}
            rows={4}
            className={`w-full p-4 bg-slate-50 dark:bg-slate-950 border rounded-xl outline-none transition text-slate-900 dark:text-slate-100 placeholder:text-slate-400
                  ${errors.details ? 'border-red-500 focus:ring-red-500' : 'border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary-500'}
            `}
            placeholder="اكتب تفاصيل طلبك هنا... (مثال: أريد حجز موعد قنصلية لجواز مستعجل لعائلة مكونة من 3 أشخاص)"
          ></textarea>
          {errors.details && <p className="text-red-500 text-xs mt-1">{errors.details.message}</p>}
        </div>

        <button
          type="submit"
          disabled={!isValid}
          className={`w-full py-4 rounded-xl font-bold text-lg transition shadow-lg flex items-center justify-center gap-2
            ${isValid
              ? 'bg-green-600 hover:bg-green-700 text-white shadow-green-600/20'
              : 'bg-slate-300 dark:bg-slate-700 text-slate-500 cursor-not-allowed'}
          `}
        >
          <span>{copied ? 'تم النسخ وفتح واتساب' : 'إرسال الطلب عبر واتساب'}</span>
          {copied ? <Copy size={20} /> : <MessageCircle size={20} />}
        </button>

        <p className="text-xs text-center text-slate-400 dark:text-slate-500 mt-4">
          * قد يتم تطبيق رسوم خدمة رمزية حسب نوع المعاملة، ويتم الاتفاق عليها قبل البدء.
        </p>

      </form>
    </div>
  );
}

// الصفحة الرئيسية (تغلف النموذج بـ Suspense لتجنب أخطاء Next.js)
export default function RequestPage() {
  return (
    <main className="flex flex-col min-h-screen">
      <PageHero title="تقديم طلب جديد" />
      <div className="w-full md:max-w-2xl mx-auto px-4 py-12 -mt-8 relative z-10">
        <Suspense fallback={<div className="text-center p-10 font-bold text-slate-500">جاري تحميل النموذج...</div>}>
          <RequestForm />
        </Suspense>
      </div>
    </main>
  );
}