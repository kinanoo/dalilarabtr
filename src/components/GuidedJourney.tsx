'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plane, FileText, ShieldAlert, Sparkles, ArrowLeft, Smartphone, BrainCircuit, FolderOpen, UserCheck, MapPin, Calculator, HeartPulse, Link as LinkIcon } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';

const ICONS: Record<string, any> = {
    Plane, FileText, ShieldAlert, Smartphone, BrainCircuit, FolderOpen, UserCheck, MapPin, Calculator, HeartPulse, LinkIcon, Sparkles
};

// Fallback Data
const FALLBACK_JOURNEYS = [
    {
        id: 'new-arrival',
        title: 'وصلت حديثاً لتركيا؟',
        desc: 'إقامات، قوانين، سكن، فواتير، وتجنب الاحتيال',
        icon: Plane,
        icon_name: 'Plane',
        color_class: 'from-blue-500 to-cyan-500',
        href: '/directory'
    },
    {
        id: 'residence',
        title: 'تجديد الإقامة',
        desc: 'الأوراق المطلوبة، المواعيد، والتأمين',
        icon: FileText,
        icon_name: 'FileText',
        color_class: 'from-emerald-500 to-teal-500',
        href: '/category/residence'
    },
    {
        id: 'kimlik-syrians',
        title: 'سوري وعندي كملك',
        desc: 'الحماية المؤقتة، تجديد الكملك، حقوقك، الترحيل، والخدمات المخصصة لك',
        icon: UserCheck,
        icon_name: 'UserCheck',
        color_class: 'from-violet-500 to-purple-600',
        href: '/category/kimlik'
    },
    {
        id: 'edevlet',
        title: 'خدمات e-Devlet',
        desc: 'رابط مباشر لأهم الخدمات: نفوس، محكمة، طابو',
        icon: Smartphone,
        icon_name: 'Smartphone',
        color_class: 'from-amber-500 to-orange-500',
        href: '/e-devlet-services'
    }
];

export default function GuidedJourney() {
    const [journeys, setJourneys] = useState<any[]>(FALLBACK_JOURNEYS);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchJourneys() {
            // NOTE: Disabled to prevent 404 errors (Table 'home_cards' missing)
            /*
            if (!supabase) return;
            const { data } = await supabase
                .from('home_cards')
                .select('*')
                .eq('section', 'journey')
                .order('sort_order', { ascending: true });

            if (data && data.length > 0) {
                setJourneys(data);
            }
            */
            setLoading(false);
        }
        // fetchJourneys();
    }, []);

    return (
        <section className="py-10 px-4">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center justify-center gap-2">
                        <Sparkles className="text-amber-500" size={24} />
                        كيف يمكننا مساعدتك اليوم؟
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                        اختر حالتك لنقودك إلى المعلومات الصحيحة مباشرة
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {journeys.map((item, i) => {
                        // Dynamic Icon Resolution
                        const IconComponent = ICONS[item.icon_name] || (item.icon ? item.icon : Sparkles);

                        return (
                            <Link key={item.id} href={item.href}>
                                <motion.div
                                    whileHover={{ y: -5 }}
                                    className="relative overflow-hidden bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-lg transition-all group h-full"
                                >
                                    {/* Gradient Border/Background Effect */}
                                    <div className={`absolute top-0 right-0 w-2 h-full bg-gradient-to-b ${item.color_class || item.color}`} />

                                    <div className="flex items-start gap-4">
                                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${item.color_class || item.color} text-white flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform`}>
                                            <IconComponent size={24} />
                                        </div>

                                        <div className="flex-1">
                                            <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 mb-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                                                {item.title}
                                            </h3>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                                                {item.description || item.desc}
                                            </p>
                                        </div>

                                        <ArrowLeft className="text-slate-300 group-hover:text-emerald-500 transform group-hover:-translate-x-1 transition-all" size={20} />
                                    </div>
                                </motion.div>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
