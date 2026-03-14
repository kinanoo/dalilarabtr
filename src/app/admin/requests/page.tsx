'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { CheckCircle, XCircle, Clock, User, Phone, MapPin, FileText, Briefcase } from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';

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
            console.error('Error fetching requests:', error);
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

                if (!supabase) throw new Error('Supabase client not initialized');

                const { error } = await supabase
                    .from(table)
                    .update(updateData)
                    .eq('id', item.id);

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
        <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 dark:text-white">طلبات الانضمام</h1>
                    <p className="text-slate-500">مراجعة الخدمات والمقالات المقدمة من الأعضاء</p>
                </div>
                <div className="bg-amber-100 text-amber-700 px-4 py-2 rounded-xl font-bold flex items-center gap-2">
                    <Clock size={20} />
                    <span>{requests.length} طلب معلق</span>
                </div>
            </div>

            {requests.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border-2 border-dashed border-slate-200 dark:border-slate-800">
                    <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle size={40} />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white">لا توجد طلبات معلقة</h2>
                    <p className="text-slate-500 mt-2">كل شيء تحت السيطرة! استمتع بقهوتك ☕</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6">
                    {requests.map((req) => (
                        <div key={req.id} className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col lg:flex-row gap-6 relative overflow-hidden">
                            {/* Type Badge */}
                            <div className={`absolute top-0 right-0 px-3 py-1 text-xs font-bold rounded-bl-xl ${req.type === 'service' ? 'bg-emerald-500 text-white' : 'bg-blue-500 text-white'}`}>
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
                                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-lg shadow-emerald-500/20"
                                    >
                                        <CheckCircle size={20} />
                                        قبول ونشر
                                    </button>
                                    <button
                                        onClick={() => handleAction(req, 'reject')}
                                        className="flex-1 bg-red-100 hover:bg-red-200 text-red-600 font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
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
