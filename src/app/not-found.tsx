import Link from 'next/link';
import { FileQuestion, Home, BookOpen, MessageCircleQuestion, Search, MapPin, Shield, BrainCircuit } from 'lucide-react';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: '404 - الصفحة غير موجودة | دليل العرب في تركيا',
    description: 'الصفحة التي تبحث عنها غير موجودة أو تم حذفها.',
    robots: { index: false, follow: false },
};

const quickLinks = [
    { name: 'المستشار الذكي', href: '/consultant', icon: BrainCircuit, desc: 'اسأل أي سؤال قانوني' },
    { name: 'الدليل الشامل', href: '/directory', icon: BookOpen, desc: 'كل المواضيع والأقسام' },
    { name: 'الأسئلة الشائعة', href: '/faq', icon: MessageCircleQuestion, desc: 'أكثر من 600 سؤال وجواب' },
    { name: 'دليل الأكواد', href: '/codes', icon: Shield, desc: 'أكواد الأمنيات التركية' },
    { name: 'المناطق المحظورة', href: '/zones', icon: MapPin, desc: 'ابحث عن منطقتك' },
    { name: 'خدمات e-Devlet', href: '/e-devlet-services', icon: Search, desc: 'الخدمات الإلكترونية' },
];

export default function NotFound() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 py-12">
            <div className="bg-slate-100 dark:bg-slate-800 p-6 rounded-full mb-6">
                <FileQuestion size={56} className="text-slate-400 dark:text-slate-500" />
            </div>

            <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mb-2">
                عذراً، الصفحة غير موجودة
            </h2>

            <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-md text-center">
                يبدو أنك وصلت إلى رابط خاطئ أو تم حذف الصفحة. جرّب أحد الروابط أدناه:
            </p>

            {/* Quick Links Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-2xl w-full mb-8">
                {quickLinks.map((link) => (
                    <Link
                        key={link.href}
                        href={link.href}
                        className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 hover:shadow-lg transition-all text-center group"
                    >
                        <link.icon size={24} className="text-emerald-600 group-hover:scale-110 transition-transform" />
                        <span className="font-bold text-sm text-slate-800 dark:text-slate-100">{link.name}</span>
                        <span className="text-xs text-slate-500 dark:text-slate-400 leading-tight">{link.desc}</span>
                    </Link>
                ))}
            </div>

            <Link
                href="/"
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg"
            >
                <Home size={20} />
                عودة للرئيسية
            </Link>
        </div>
    );
}
