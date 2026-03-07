'use client';

import { useState } from 'react';
import { type LucideIcon, Sparkles, ChevronDown, Plane, GraduationCap, Briefcase, Users, HeartPulse, PlaneTakeoff, FileText, UserCheck, BookOpen, Home, Scale, Smartphone, Stamp, HeartHandshake, Map, MapPin, LifeBuoy, Crown, Car, FileSearch, ShieldCheck, CreditCard, Building2, Baby, Globe, AlertTriangle, Landmark } from 'lucide-react';
import Link from 'next/link';

// ============================================
// Types
// ============================================

interface JourneyCard {
    id: string;
    title: string;
    desc: string;
    icon: LucideIcon;
    color: string;
    href: string;
}

interface JourneyGroup {
    id: string;
    title: string;
    icon: LucideIcon;
    headerBg: string;
    headerText: string;
    cards: JourneyCard[];
}

// ============================================
// Data
// ============================================

const JOURNEY_GROUPS: JourneyGroup[] = [
    {
        id: 'before-turkey',
        title: 'قبل الوصول لتركيا',
        icon: Plane,
        headerBg: 'bg-sky-100 dark:bg-sky-900/20',
        headerText: 'text-sky-600 dark:text-sky-400',
        cards: [
            { id: 'visa-seeker', title: 'أخطط للسفر لتركيا', desc: 'فيزا، شروط الدخول، والأوراق المطلوبة', icon: Plane, color: 'from-sky-500 to-blue-500', href: '/category/visa' },
            { id: 'student-abroad', title: 'أريد الدراسة في تركيا', desc: 'منح دراسية، تسجيل جامعات، ومعادلة شهادات', icon: GraduationCap, color: 'from-violet-500 to-purple-500', href: '/category/education' },
            { id: 'worker-investor', title: 'أريد العمل أو الاستثمار', desc: 'إذن عمل، تأسيس شركة، وشروط الاستثمار', icon: Briefcase, color: 'from-amber-500 to-orange-500', href: '/category/work' },
            { id: 'family-reunion', title: 'لمّ شمل عائلي', desc: 'الشروط والأوراق اللازمة لجمع الشمل', icon: Users, color: 'from-pink-500 to-rose-500', href: '/category/residence?tag=family-reunion' },
            { id: 'health-travel', title: 'علاج طبي في تركيا', desc: 'السياحة العلاجية، التأمين، والمستشفيات', icon: HeartPulse, color: 'from-red-500 to-pink-500', href: '/category/health?tag=medical-tourism' },
        ],
    },
    {
        id: 'syrian-services',
        title: 'خدمات خاصة للسوريين',
        icon: ShieldCheck,
        headerBg: 'bg-violet-100 dark:bg-violet-900/20',
        headerText: 'text-violet-600 dark:text-violet-400',
        cards: [
            { id: 'syrian-kimlik-renew', title: 'تجديد الكملك وتحديث البيانات', desc: 'الأوراق المطلوبة، المواعيد، تغيير العنوان، والبصمة', icon: UserCheck, color: 'from-violet-500 to-purple-600', href: '/category/kimlik?tag=renewal' },
            { id: 'syrian-travel', title: 'تصاريح السفر والتنقل', desc: 'إذن السفر بين الولايات، وثيقة السفر، والعودة الطوعية', icon: Globe, color: 'from-blue-500 to-indigo-500', href: '/category/syrians?tag=travel-permit' },
            { id: 'syrian-citizenship', title: 'الجنسية الاستثنائية للسوريين', desc: 'شروط التجنيس، الملف المطلوب، والمراحل والمدة', icon: Crown, color: 'from-yellow-500 to-amber-500', href: '/category/syrians?tag=citizenship' },
            { id: 'syrian-codes', title: 'الأكواد الأمنية والترحيل', desc: 'فهم أكواد V-87, G-87, Ç-113 وكيفية الاعتراض', icon: AlertTriangle, color: 'from-red-500 to-rose-600', href: '/codes' },
            { id: 'syrian-work-insurance', title: 'العمل والتأمين للسوريين', desc: 'إذن العمل بالكملك، حقوق العامل، والتأمين الصحي SGK', icon: Briefcase, color: 'from-emerald-500 to-teal-500', href: '/category/work?tag=work-permit' },
            { id: 'syrian-kizilay', title: 'بطاقة الهلال الأحمر (SUY)', desc: 'شروط الأهلية، التسجيل، الرصيد، وتحديث البيانات', icon: CreditCard, color: 'from-red-500 to-pink-500', href: '/category/syrians?tag=kizilay' },
            { id: 'syrian-education', title: 'تعليم أبناء السوريين', desc: 'التسجيل بالمدارس، معادلة الشهادات، والمنح الدراسية', icon: GraduationCap, color: 'from-indigo-500 to-blue-500', href: '/category/education?tag=schools' },
            { id: 'syrian-children', title: 'تسجيل المواليد والأطفال', desc: 'تسجيل مولود جديد، إضافة طفل للكملك، ووثائق الأطفال', icon: Baby, color: 'from-pink-400 to-rose-500', href: '/category/syrians?tag=children' },
            { id: 'syrian-consulate', title: 'خدمات القنصلية السورية', desc: 'جواز السفر، تصديق وثائق، وكالات، وأحوال شخصية', icon: Landmark, color: 'from-slate-500 to-gray-600', href: '/category/syrians?tag=consulate' },
            { id: 'syrian-all-services', title: 'جميع خدمات السوريين', desc: 'دليل شامل لكل ما يحتاجه السوري في تركيا', icon: Building2, color: 'from-purple-500 to-violet-600', href: '/category/syrians' },
        ],
    },
    {
        id: 'in-turkey',
        title: 'أنا في تركيا الآن',
        icon: MapPin,
        headerBg: 'bg-emerald-100 dark:bg-emerald-900/20',
        headerText: 'text-emerald-600 dark:text-emerald-400',
        cards: [
            { id: 'new-arrival', title: 'وصلت حديثاً لتركيا', desc: 'الخطوات الأولى: إقامة، سكن، فواتير، قوانين', icon: PlaneTakeoff, color: 'from-blue-500 to-cyan-500', href: '/directory' },
            { id: 'residence-holder', title: 'إقامة أو تجديد إقامة', desc: 'الأوراق المطلوبة، المواعيد، والتأمين', icon: FileText, color: 'from-emerald-500 to-teal-500', href: '/category/residence' },
            { id: 'student-turkey', title: 'طالب في جامعة تركية', desc: 'إقامة طلاب، تسجيل، ومعادلة الشهادات', icon: BookOpen, color: 'from-indigo-500 to-blue-500', href: '/category/education' },
            { id: 'housing-seeker', title: 'أبحث عن سكن', desc: 'عقود إيجار، حقوق المستأجر، وتسجيل العنوان', icon: Home, color: 'from-lime-500 to-green-500', href: '/category/housing' },
            { id: 'citizenship', title: 'أريد الجنسية التركية', desc: 'شروط التجنيس، الأوراق، المدة، والاستثناءات', icon: Crown, color: 'from-yellow-500 to-amber-500', href: '/category/official?tag=citizenship' },
            { id: 'traffic-driving', title: 'المرور ورخصة القيادة', desc: 'رخصة قيادة، تسجيل سيارة، ومخالفات مرورية', icon: Car, color: 'from-gray-500 to-slate-600', href: '/category/traffic' },
        ],
    },
    {
        id: 'need-help',
        title: 'أحتاج مساعدة محددة',
        icon: LifeBuoy,
        headerBg: 'bg-rose-100 dark:bg-rose-900/20',
        headerText: 'text-rose-600 dark:text-rose-400',
        cards: [
            { id: 'legal-trouble', title: 'عندي مشكلة قانونية', desc: 'ترحيل، أكواد أمنية، منع دخول، أو مخالفات', icon: Scale, color: 'from-red-500 to-rose-600', href: '/category/official?tag=legal-trouble' },
            { id: 'edevlet', title: 'خدمات e-Devlet', desc: 'رابط مباشر لأهم الخدمات: نفوس، محكمة، طابو', icon: Smartphone, color: 'from-amber-500 to-orange-500', href: '/e-devlet-services' },
            { id: 'official-docs', title: 'معاملات رسمية ووثائق', desc: 'ترجمة، تصديق، نوتر، واستخراج وثائق', icon: Stamp, color: 'from-slate-500 to-gray-600', href: '/category/official' },
            { id: 'pro-services', title: 'أبحث عن مقدم خدمة', desc: 'محامي، مترجم، مكتب عقاري، أو طبيب', icon: HeartHandshake, color: 'from-teal-500 to-cyan-500', href: '/services' },
            { id: 'tourist', title: 'سائح وأبحث عن أماكن', desc: 'معلومات للسياح: تنقل، أماكن، صيدليات', icon: Map, color: 'from-cyan-500 to-sky-500', href: '/directory' },
            { id: 'lost-docs', title: 'فقدان أو سرقة وثائق', desc: 'إجراءات استبدال الهوية، الجواز، أو الإقامة', icon: FileSearch, color: 'from-orange-500 to-red-500', href: '/category/official?tag=lost-docs' },
        ],
    },
];

// ============================================
// Component
// ============================================

export default function GuidedJourney() {
    const [openId, setOpenId] = useState<string | null>(null);

    const toggle = (id: string) => {
        setOpenId(prev => prev === id ? null : id);
    };

    return (
        <section className="pt-2 pb-6 px-4">
            <div className="max-w-7xl mx-auto">
                {/* Section heading */}
                <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center justify-center gap-2">
                        <Sparkles className="text-amber-500" size={24} />
                        كيف يمكننا مساعدتك اليوم؟
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                        اختر حالتك لنقودك إلى المعلومات الصحيحة مباشرة
                    </p>
                </div>

                {/* Accordion Groups */}
                <div className="space-y-3">
                    {JOURNEY_GROUPS.map((group) => {
                        const isOpen = openId === group.id;
                        return (
                            <div key={group.id} className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900 shadow-sm">
                                {/* Header — clickable */}
                                <button
                                    type="button"
                                    onClick={() => toggle(group.id)}
                                    className={`w-full flex items-center gap-3 px-5 py-4 transition-colors ${isOpen ? group.headerBg : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
                                >
                                    <div className={`w-9 h-9 rounded-xl ${group.headerBg} flex items-center justify-center shrink-0`}>
                                        <group.icon size={18} className={group.headerText} />
                                    </div>
                                    <div className="text-right flex-1">
                                        <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                                            {group.title}
                                        </h3>
                                        <p className="text-xs text-slate-400 dark:text-slate-500">{group.cards.length} خدمة</p>
                                    </div>
                                    <ChevronDown
                                        size={20}
                                        className={`text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                                    />
                                </button>

                                {/* Collapsible content — only render cards when open to reduce DOM size */}
                                {isOpen && (
                                    <div className="px-4 pb-4 pt-2 animate-in fade-in duration-200">
                                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                                            {group.cards.map((card) => (
                                                <CardItem key={card.id} card={card} />
                                            ))}
                                        </div>
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

function CardItem({ card }: { card: JourneyCard }) {
    const Icon = card.icon;

    return (
        <Link
            href={card.href}
            className="card-stagger group relative flex flex-col items-center text-center bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3.5 border border-slate-100 dark:border-slate-700/50 hover:shadow-md hover:-translate-y-0.5 hover:border-emerald-400 dark:hover:border-emerald-500 transition-all duration-300 overflow-hidden"
        >
            {/* Top gradient bar */}
            <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${card.color} opacity-60 group-hover:opacity-100 transition-opacity`} />

            {/* Icon */}
            <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${card.color} text-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform mb-2`}>
                <Icon size={18} />
            </div>

            {/* Title */}
            <h4 className="text-[13px] font-bold text-slate-800 dark:text-slate-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors mb-0.5 leading-snug">
                {card.title}
            </h4>

            {/* Description */}
            <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">
                {card.desc}
            </p>
        </Link>
    );
}
