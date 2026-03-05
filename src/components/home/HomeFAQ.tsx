'use client';

import { useState } from 'react';
import { ChevronDown, HelpCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface FAQItem {
    id: string;
    question: string;
    answer: string;
}

// أكثر 10 أسئلة شيوعاً بين العرب في تركيا
const TOP_FAQS: FAQItem[] = [
    {
        id: 'faq-1',
        question: 'كيف أجدد إقامتي في تركيا وما الأوراق المطلوبة؟',
        answer: 'يجب التقديم قبل انتهاء الإقامة بـ 60 يوماً عبر e-İkamet. الأوراق: جواز سفر ساري، تأمين صحي، عقد إيجار مصدّق (نوتر)، صور شخصية، وإثبات كفاية مادية. يمكنك حجز موعد من موقع إدارة الهجرة. الرسوم تختلف حسب نوع الإقامة ومدتها.',
    },
    {
        id: 'faq-2',
        question: 'ما هي الأكواد الأمنية (V-87, G-87) وماذا أفعل إذا حصلت على كود؟',
        answer: 'الأكواد الأمنية هي تصنيفات تضعها إدارة الهجرة على ملفك. V-87 يعني منع دخول لتركيا، G-87 يعني ترحيل. يمكنك الاعتراض عبر محامٍ أمام المحكمة الإدارية خلال 7 أيام من التبليغ، أو عبر تقديم طلب لإدارة الهجرة. راجع صفحة الأكواد الأمنية لمعرفة كل كود وطريقة التعامل معه.',
    },
    {
        id: 'faq-3',
        question: 'كيف أحصل على إذن عمل في تركيا؟',
        answer: 'يتقدم صاحب العمل التركي بالطلب عبر نظام e-İzin الإلكتروني. الشروط: عقد عمل، جواز سفر ساري، إقامة سارية (أو كملك للسوريين)، وأن يكون لكل 5 أتراك أجنبي واحد. المدة 30-90 يوماً للبت. الرسوم تشمل رسم الإذن + التأمين الصحي SGK.',
    },
    {
        id: 'faq-4',
        question: 'كيف أجدد الكملك (بطاقة الحماية المؤقتة) للسوريين؟',
        answer: 'راجع إدارة الهجرة في ولايتك المسجل بها مع: الكملك الحالي، صور شخصية بيومترية، إثبات عنوان (فاتورة أو عقد إيجار). يجب تحديث بياناتك كل سنة حتى لو الكملك لم ينتهِ. التنقل بين الولايات يتطلب إذن سفر مسبق.',
    },
    {
        id: 'faq-5',
        question: 'هل أستطيع فتح حساب بنكي في تركيا بدون إقامة؟',
        answer: 'نعم، بعض البنوك تفتح حسابات برقم ضريبي (Vergi Numarası) وجواز سفر فقط، مثل Ziraat وVakıfBank. لحاملي الكملك، يمكن فتح حساب بالكملك مع صورة شخصية. الحسابات قد تكون محدودة بدون إقامة. يُنصح بالتوجه لأقرب فرع مع جواز السفر والرقم الضريبي.',
    },
    {
        id: 'faq-6',
        question: 'ما شروط الحصول على الجنسية التركية؟',
        answer: 'الطرق الأساسية: 1) إقامة 5 سنوات متواصلة + دخل ثابت + لغة تركية. 2) شراء عقار بقيمة 400 ألف دولار. 3) إيداع 500 ألف دولار في بنك تركي. 4) تجنيس استثنائي (للسوريين وحالات خاصة). المدة تتراوح بين 3-18 شهراً حسب النوع.',
    },
    {
        id: 'faq-7',
        question: 'كيف أسجّل أطفالي في المدارس التركية؟',
        answer: 'التسجيل مجاني في المدارس الحكومية. المطلوب: إقامة أو كملك ساري، شهادة آخر صف (مترجمة ومصدقة)، صور شخصية، وإثبات عنوان. إذا لم تتوفر شهادة، يُمكن إجراء اختبار تحديد مستوى. يبدأ التسجيل عادةً في يونيو-سبتمبر.',
    },
    {
        id: 'faq-8',
        question: 'ما هي تكاليف التأمين الصحي وأنواعه في تركيا؟',
        answer: 'هناك 3 أنواع: 1) SGK (التأمين الحكومي) — إلزامي للعاملين، يغطي كل شيء تقريباً. 2) التأمين الخاص — مطلوب لتجديد الإقامة، يبدأ من 3000 ليرة سنوياً. 3) بطاقة الهلال الأحمر للسوريين تشمل تأمين صحي مجاني في المشافي الحكومية.',
    },
    {
        id: 'faq-9',
        question: 'كيف أحصل على رخصة قيادة في تركيا؟',
        answer: 'إذا كان لديك رخصة من بلدك: ترجمها وصدّقها ثم حوّلها عبر النفوس. إذا لم يكن لديك: سجّل في مدرسة قيادة (Sürücü Kursu)، واجتز الامتحان النظري والعملي. المطلوب: إقامة سارية، تقرير صحي، صور شخصية. التكلفة: 8,000-15,000 ليرة تقريباً.',
    },
    {
        id: 'faq-10',
        question: 'ما حقوقي كمستأجر في تركيا وكيف أحمي نفسي؟',
        answer: 'حقوقك: لا يجوز رفع الإيجار أكثر من نسبة التضخم المحددة (حالياً %25 كحد أقصى). لا يمكن إخلاؤك بدون حكم محكمة. يجب تصديق العقد في النوتر. سجّل عنوانك في النفوس (e-Devlet). احتفظ بنسخة من العقد وإيصالات الدفع. في حال نزاع، توجه لمحكمة الصلح (Sulh Hukuk Mahkemesi).',
    },
];

export default function HomeFAQ() {
    const [openId, setOpenId] = useState<string | null>(null);

    const toggle = (id: string) => {
        setOpenId(prev => prev === id ? null : id);
    };

    return (
        <section className="px-4 py-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-5">
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                        <HelpCircle className="text-emerald-500" size={24} />
                        أكثر الأسئلة شيوعاً
                    </h2>
                    <Link
                        href="/faq"
                        className="text-sm font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 flex items-center gap-1"
                    >
                        كل الأسئلة
                        <ArrowLeft size={14} />
                    </Link>
                </div>

                {/* FAQ List */}
                <div className="space-y-2">
                    {TOP_FAQS.map((faq, index) => {
                        const isOpen = openId === faq.id;
                        return (
                            <div
                                key={faq.id}
                                className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden transition-all duration-300 hover:shadow-lg hover:border-emerald-400 dark:hover:border-emerald-600 hover:-translate-y-0.5"
                            >
                                <button
                                    onClick={() => toggle(faq.id)}
                                    className="w-full flex items-start gap-3 p-4 text-right"
                                    aria-expanded={isOpen}
                                >
                                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center justify-center mt-0.5">
                                        {index + 1}
                                    </span>
                                    <span className="flex-1 text-sm font-bold text-slate-800 dark:text-slate-100 leading-relaxed">
                                        {faq.question}
                                    </span>
                                    <ChevronDown
                                        size={18}
                                        className={`flex-shrink-0 text-slate-400 mt-0.5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                                    />
                                </button>
                                {isOpen && (
                                    <div className="px-4 pb-4 pr-13">
                                        <p className="text-sm text-slate-600 dark:text-slate-300 leading-loose">
                                            {faq.answer}
                                        </p>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
