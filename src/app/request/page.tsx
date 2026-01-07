'use client';

import Footer from '@/components/Footer';
import PageHero from '@/components/PageHero';
import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState, Suspense } from 'react';
import { Copy, User, Phone, FileText, CheckCircle, MessageCircle } from 'lucide-react';
import { SERVICES_LIST, SITE_CONFIG } from '@/lib/data';
import { fetchRemoteServices, mergeServices, subscribeDemoDataUpdated, type RuntimeService } from '@/lib/remoteData';
import { buildWhatsAppHref } from '@/lib/whatsapp';

// مكون النموذج (مفصول ليعمل داخل Suspense)
function RequestForm() {
  const searchParams = useSearchParams();
  const initialServiceId = searchParams.get('service') || SERVICES_LIST[0]?.id;

  const [services, setServices] = useState<RuntimeService[]>(SERVICES_LIST);
  const [serviceId, setServiceId] = useState<string>(initialServiceId || '');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const reload = async () => {
      const [remoteServices] = await Promise.all([fetchRemoteServices()]);
      if (cancelled) return;
      setServices(mergeServices(remoteServices));
    };

    void reload();
    const unsubscribe = subscribeDemoDataUpdated(() => void reload());
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  const selectedService = useMemo(
    () => services.find((s) => s.id === serviceId) || services[0],
    [services, serviceId]
  );

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    details: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // تجهيز رسالة الواتساب
    const message = `
*طلب خدمة جديدة من الموقع* 🚀
------------------------
👤 *الاسم:* ${formData.name}
📱 *رقم الهاتف:* ${formData.phone}
  💼 *الخدمة المطلوبة:* ${services.find((s) => s.id === serviceId)?.title || 'غير محددة'}
📝 *التفاصيل:* ${formData.details}
------------------------
يرجى الرد وتزويدي بالتكلفة والإجراءات.
    `.trim();

    const copyToClipboard = async () => {
      try {
        if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(message);
        } else {
          const textarea = document.createElement('textarea');
          textarea.value = message;
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

    void copyToClipboard();

    const phone = (selectedService as RuntimeService | undefined)?.whatsapp || SITE_CONFIG.whatsapp;
    const whatsAppHref = buildWhatsAppHref(phone, message) || buildWhatsAppHref(SITE_CONFIG.whatsapp, message);
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

      <form onSubmit={handleSubmit} className="space-y-6">

        <div>
          <label className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-2 flex items-center gap-2">
            <User size={18} className="text-primary-500" /> الاسم الكامل
          </label>
          <input
            required
            type="text"
            className="w-full p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
            placeholder="مثال: محمد أحمد"
            value={formData.name}
            onChange={e => setFormData({ ...formData, name: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-2 flex items-center gap-2">
            <Phone size={18} className="text-primary-500" /> رقم الهاتف (مع النداء الدولي)
          </label>
          <input
            required
            type="tel"
            className="w-full p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition text-left text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
            placeholder="+90 5XX XXX XX XX"
            value={formData.phone}
            onChange={e => setFormData({ ...formData, phone: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-2 flex items-center gap-2">
            <CheckCircle size={18} className="text-primary-500" /> نوع الخدمة
          </label>
          <select
            className="w-full p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition cursor-pointer text-slate-900 dark:text-slate-100"
            value={serviceId}
            onChange={e => setServiceId(e.target.value)}
          >
            {services.map((s) => (
              <option key={s.id} value={s.id}>{s.title}</option>
            ))}
            <option value="other">خدمة أخرى (غير موجودة بالقائمة)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-2 flex items-center gap-2">
            <FileText size={18} className="text-primary-500" /> تفاصيل إضافية (اختياري)
          </label>
          <textarea
            rows={4}
            className="w-full p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
            placeholder="اكتب تفاصيل طلبك هنا... (مثال: أريد حجز موعد قنصلية لجواز مستعجل لعائلة مكونة من 3 أشخاص)"
            value={formData.details}
            onChange={e => setFormData({ ...formData, details: e.target.value })}
          ></textarea>
        </div>

        <button
          type="submit"
          className="w-full bg-green-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-green-700 transition shadow-lg shadow-green-600/20 flex items-center justify-center gap-2"
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
        <Suspense fallback={<div className="text-center p-10">جاري تحميل النموذج...</div>}>
          <RequestForm />
        </Suspense>
      </div>
      <Footer />
    </main>
  );
}