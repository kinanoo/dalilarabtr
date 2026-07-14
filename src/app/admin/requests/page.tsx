'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { adminUpdate } from '@/lib/adminApi';
import { CheckCircle, XCircle, Clock, User, Phone, MapPin, FileText, Briefcase, Inbox } from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';
import logger from '@/lib/logger';
import AdminPageHeader from '@/components/admin/AdminPageHeader';

type RequestType = 'service' | 'article';

interface RequestItem {
    id: string;
    type: RequestType;
    title: string; // name for service, title for article
    subtitle: string; // profession for service, category for article
    category: string;
    description: string; // description for service, intro for article
    image?: string;
    user_id?: string;
    created_at: string;
    city?: string; // Service only
    district?: string; // Service only
    phone?: string; // Service only
    details?: string; // Article only
}

export default function RequestsPage() {
    const [requests, setRequests] = useState<RequestItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        setLoading(true);
        if (!supabase) {
            setLoading(false);
            return;
        }
        try {
            // 1. Fetch pending services
            const { data: services, error: servicesError } = await supabase
                .from('service_providers')
                .select('*')
                .eq('status', 'pending')
                .order('created_at', { ascending: false });

            if (servicesError) throw servicesError;

            // 2. Fetch pending articles
            const { data: articles, error: articlesError } = await supabase
                .from('articles')
                .select('*')
                .eq('status', 'pending')
                .order('created_at', { ascending: false });

            if (articlesError) throw articlesError;

            // 3. Normalize and Combine
            const servicesList: RequestItem[] = (services || []).map(s => ({
                id: s.id,
                type: 'service',
                title: s.name,
                subtitle: s.profession,
                category: s.category,
                description: s.description,
                image: s.image,
                user_id: s.user_id,
                created_at: s.created_at,
                city: s.city,
                district: s.district,
                phone: s.phone
            }));

            const articlesList: RequestItem[] = (articles || []).map(a => ({
                id: a.id,
                type: 'article',
                title: a.title,
                subtitle: 'مقال / خبر',
                category: a.category,
                description: a.intro, // Use intro for snippet
                details: a.details, // Full content
                image: a.image,
                user_id: a.user_id,
                created_at: a.created_at || a.lastUpdate
            }));

            // Sort combined list by date desc
            const combined = [...servicesList, ...articlesList].sort((a, b) =>
                new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            );

            setRequests(combined);

        } catch (error) {
            logger.error('Error fetching requests:', error);
            toast.error('فشل جلب الطلبات');
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (item: RequestItem, action: 'approve' | 'reject') => {
        const newStatus = action === 'approve' ? 'approved' : 'rejected';
        const table = item.type === 'service' ? 'service_providers' : 'articles';

        // Optimistic Update
        setRequests(prev => prev.filter(req => req.id !== item.id));

        toast.promise(
            async () => {
                const updateData: Record<string, string | boolean> = { status: newStatus };
                if (item.type === 'service' && action === 'approve') {
                    updateData.is_verified = true; // Auto verify services on approval
                }

                const { error } = await adminUpdate(table, updateData, item.id);

                if (error) throw error;
            },
            {
                loading: 'جاري المعالجة...',
                success: action === 'approve' ? 'تم قبول الطلب ونشره' : 'تم رفض الطلب',
                error: 'حدث خطأ أثناء المعالجة'
            }
        );
    };

    if (loading) return <div className="p-8 text-center text-slate-500">جاري تحميل الطلبات...</div>;

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in">
            <AdminPageHeader
                icon={Inbox}
                theme="amber"
                title="طلبات الانضمام"
                subtitle="مراجعة الخدمات والمقالات المقدمة من الأعضاء"
                eyebrow="معلق"
                actions={
                    <div className="bg-gradient-to-l from-amber-100 to-amber-200/60 dark:from-amber-900/40 dark:to-amber-800/30 text-amber-700 dark:text-amber-300 px-4 py-2 rounded-xl font-black flex items-center gap-2 shadow-sm">
                        <Clock size={18} />
                        <span className="tabular-nums" dir="ltr">{requests.length}</span>
                        <span>طلب معلق</span>
                    </div>
                }
            />

            {requests.length === 0 ? (
                <div className="relative overflow-hidden bg-gradient-to-br from-white to-emerald-50/40 dark:from-slate-900 dark:to-emerald-950/20 rounded-3xl p-12 text-center border-2 border-dashed border-emerald-200 dark:border-emerald-900/40">
                    <span className="absolute top-0 right-0 h-full w-1 bg-emerald-500 opacity-50" />
                    <div className="w-20 h-20 bg-gradient-to-br from-emerald-100 to-emerald-200/60 dark:from-emerald-900/40 dark:to-emerald-800/30 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                        <CheckCircle size={40} />
                    </div>
                    <h2 className="text-2xl font-black text-slate-800 dark:text-white">لا توجد طلبات معلقة</h2>
                    <p className="text-slate-500 mt-2">كل شيء تحت السيطرة! استمتع بقهوتك ☕</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6">
                    {requests.map((req) => (
                        <div key={req.id} className={`group relative overflow-hidden bg-gradient-to-br ${req.type === 'service' ? 'from-white to-emerald-50/40 dark:from-slate-900 dark:to-emerald-950/20' : 'from-white to-blue-50/40 dark:from-slate-900 dark:to-blue-950/20'} rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all flex flex-col lg:flex-row gap-6`}>
                            {/* Accent stripe — right edge in RTL */}
                            <span className={`absolute top-0 right-0 h-full w-1 ${req.type === 'service' ? 'bg-emerald-500' : 'bg-blue-500'} opacity-70`} />

                            {/* Type Badge */}
                            <div className={`absolute top-3 left-3 px-3 py-1 text-[10px] font-black tracking-wider uppercase rounded-lg shadow-sm ${req.type === 'service' ? 'bg-emerald-500 text-white' : 'bg-blue-500 text-white'}`}>
                                {req.type === 'service' ? 'خدمة' : 'مقال'}
                            </div>

                            {/* Image */}
                            <div className="w-full lg:w-48 h-48 bg-slate-100 rounded-xl relative overflow-hidden shrink-0 mt-4 lg:mt-0">
                                {req.image ? (
                                    <Image src={req.image} alt={req.title} fill className="object-cover" />
                                ) : (
                                    <div className="flex items-center justify-center h-full text-slate-400 gap-2">
                                        {req.type === 'service' ? <Briefcase size={24} /> : <FileText size={24} />}
                                    </div>
                                )}
                            </div>

                            {/* Details */}
                            <div className="flex-1 space-y-4 mt-2">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div>
                                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">{req.title}</h3>
                                        <p className={`${req.type === 'service' ? 'text-emerald-600' : 'text-blue-600'} font-bold`}>{req.subtitle}</p>
                                    </div>
                                    <span className="bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-lg text-sm text-slate-600 font-bold self-start">
                                        {req.category}
                                    </span>
                                </div>

                                <div className="flex flex-wrap gap-4 text-sm text-slate-500">
                                    {req.type === 'service' && (
                                        <>
                                            <div className="flex items-center gap-1"><MapPin size={16} /> {req.city} - {req.district}</div>
                                            <div className="flex items-center gap-1"><Phone size={16} /> {req.phone}</div>
                                        </>
                                    )}
                                    {req.user_id && <div className="flex items-center gap-1"><User size={16} /> بواسطة: {req.user_id.substring(0, 8)}...</div>}
                                    <div className="flex items-center gap-1 opacity-70"><Clock size={14} /> {new Date(req.created_at).toLocaleDateString()}</div>
                                </div>

                                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl text-slate-700 dark:text-slate-300 text-sm leading-relaxed">
                                    <p className="font-bold mb-1 opacity-80">الوصف / المقدمة:</p>
                                    {req.description}
                                    {req.details && (
                                        <details className="mt-2 text-xs">
                                            <summary className="cursor-pointer text-blue-500">عرض كامل المقال</summary>
                                            <p className="mt-2 whitespace-pre-wrap">{req.details}</p>
                                        </details>
                                    )}
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-4 pt-2">
                                    <button
                                        onClick={() => handleAction(req, 'approve')}
                                        className="group/btn flex-1 bg-gradient-to-l from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-black py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40 hover:-translate-y-0.5 active:scale-95"
                                    >
                                        <CheckCircle size={20} className="group-hover/btn:rotate-12 transition-transform" />
                                        قبول ونشر
                                    </button>
                                    <button
                                        onClick={() => handleAction(req, 'reject')}
                                        className="flex-1 bg-red-50 hover:bg-red-100 dark:bg-red-900/15 dark:hover:bg-red-900/25 text-red-600 dark:text-red-400 font-black py-3 rounded-xl flex items-center justify-center gap-2 transition-colors border border-red-200 dark:border-red-900/30"
                                    >
                                        <XCircle size={20} />
                                        رفض
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
