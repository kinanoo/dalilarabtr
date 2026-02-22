'use client';

import { useState, useEffect } from 'react';
import { MessageSquare, AlertTriangle, Send, CheckCircle2, User, Lock } from 'lucide-react';
import { fetchComments, postComment, type Comment } from '@/lib/api/comments';
import { toast } from 'sonner';
import { createBrowserClient } from '@supabase/ssr';

interface UniversalCommentsProps {
    entityType: 'article' | 'service' | 'update' | 'scenario' | 'zone';
    entityId: string;
    title?: string;
    className?: string;
}

function getOrCreateAnonId(): string {
    const key = 'anon_comment_id';
    let id = localStorage.getItem(key);
    if (!id) {
        id = String(Math.floor(1000 + Math.random() * 9000));
        localStorage.setItem(key, id);
    }
    return id;
}

export default function UniversalComments({ entityType, entityId, title = "التعليقات", className }: UniversalCommentsProps) {
    const [comments, setComments] = useState<Comment[]>([]);
    const [loading, setLoading] = useState(true);

    // Form State
    const [name, setName] = useState('');
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [content, setContent] = useState('');
    const [isCorrection, setIsCorrection] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        loadComments();
        resolveUserName();
    }, [entityId]);

    const resolveUserName = async () => {
        const supabase = createBrowserClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
            const { data: profile } = await supabase
                .from('member_profiles')
                .select('full_name')
                .eq('id', user.id)
                .single();

            const displayName = profile?.full_name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'عضو';
            setName(displayName);
            setIsLoggedIn(true);
        } else {
            const anonId = getOrCreateAnonId();
            setName(`مجهول #${anonId}`);
            setIsLoggedIn(false);
        }
    };

    const loadComments = async () => {
        setLoading(true);
        const { data } = await fetchComments(entityType, entityId);
        if (data) setComments(data);
        setLoading(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim()) return;

        setSubmitting(true);
        const { error } = await postComment({
            entity_type: entityType,
            entity_id: entityId,
            author_name: name.trim() || `مجهول`,
            content: content,
            is_correction: isCorrection
        });

        setSubmitting(false);

        if (error) {
            console.error('Comment Error:', JSON.stringify(error, null, 2));
            toast.error(`خطأ: ${(error as any).message || 'فشل الإرسال'}`, {
                description: (error as any).details || (error as any).hint || 'يرجى تصوير هذا الخطأ وإرساله للمطور',
                duration: 5000
            });
        } else {
            toast.success('تم نشر تعليقك بنجاح!');

            const newComment: Comment = {
                id: (typeof crypto !== 'undefined' && crypto.randomUUID)
                    ? crypto.randomUUID()
                    : Math.random().toString(36).substring(2) + Date.now().toString(36),
                entity_type: entityType,
                entity_id: entityId,
                author_name: name.trim() || 'مجهول',
                content: content,
                is_correction: isCorrection,
                is_official: false,
                status: 'approved',
                created_at: new Date().toISOString(),
                replies: []
            };

            setComments(prev => [newComment, ...prev]);
            setContent('');
            setIsCorrection(false);
        }
    };

    return (
        <section className={`bg-white dark:bg-slate-800 rounded-2xl p-6 md:p-8 shadow-sm border border-slate-100 dark:border-slate-700 ${className}`}>
            {/* Header */}
            <div className="flex items-center gap-3 mb-8">
                <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-xl">
                    <MessageSquare size={24} />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white">{title}</h3>
                    <p className="text-slate-500 text-sm">شاركنا رأيك أو صحح معلوماتنا</p>
                </div>
            </div>

            {/* List */}
            <div className="space-y-6 mb-10">
                {loading ? (
                    <div className="text-center py-4 text-slate-400">جاري التحميل...</div>
                ) : comments.length === 0 ? (
                    <div className="text-center py-8 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                        <p className="text-slate-500 text-sm">كن أول من يشارك في هذا الموضوع!</p>
                    </div>
                ) : (
                    comments.map(c => (
                        <div key={c.id} className={`relative p-4 rounded-2xl ${c.is_official ? 'bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100' : 'bg-slate-50 dark:bg-slate-800/50'}`}>
                            <div className="flex items-center gap-2 mb-2">
                                <span className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-1">
                                    {c.is_official ? <CheckCircle2 size={14} className="text-emerald-500" /> : <User size={14} className="text-slate-400" />}
                                    {c.author_name}
                                </span>
                                {c.is_official && <span className="text-[10px] bg-emerald-200 dark:bg-emerald-800 text-emerald-800 dark:text-emerald-100 px-1.5 rounded font-bold">رد رسمي</span>}
                                {c.is_correction && <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 rounded font-bold flex items-center gap-0.5"><AlertTriangle size={10} /> تصحيح</span>}
                                {c.status === 'pending' && <span className="text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-1.5 rounded font-bold">بانتظار النشر</span>}
                                <span className="text-xs text-slate-400 mr-auto">
                                    {new Date(c.created_at).toLocaleDateString('ar-EG')}
                                </span>
                            </div>
                            <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed">
                                {c.content}
                            </p>
                        </div>
                    ))
                )}
            </div>

            {/* Post Form */}
            <form onSubmit={handleSubmit} className="bg-slate-50 dark:bg-slate-950 p-1 rounded-2xl border border-slate-200 dark:border-slate-800 focus-within:ring-2 focus-within:ring-emerald-500 transition-all">
                <textarea
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    className="w-full bg-transparent p-4 min-h-[100px] outline-none text-slate-800 dark:text-slate-100 placeholder:text-slate-400 resize-none rounded-t-xl"
                    placeholder="اكتب تعليقك هنا..."
                    required
                />

                <div className="bg-white dark:bg-slate-900 p-3 rounded-b-xl border-t border-slate-200 dark:border-slate-800 flex flex-wrap gap-3 items-center justify-between">
                    <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                        {isLoggedIn ? (
                            <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 px-3 py-2 rounded-lg text-sm text-emerald-700 dark:text-emerald-300 font-bold flex-1">
                                <Lock size={13} />
                                {name}
                            </div>
                        ) : (
                            <input
                                type="text"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                className="bg-slate-100 dark:bg-slate-800 px-3 py-2 rounded-lg text-sm outline-none border border-transparent focus:border-emerald-500 w-full"
                                placeholder="الاسم (اختياري)"
                            />
                        )}
                    </div>

                    <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 cursor-pointer group">
                            <input
                                type="checkbox"
                                checked={isCorrection}
                                onChange={e => setIsCorrection(e.target.checked)}
                                className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 border-slate-300"
                            />
                            <span className="text-xs font-bold text-slate-500 group-hover:text-amber-600 transition-colors flex items-center gap-1">
                                <AlertTriangle size={12} className={isCorrection ? 'text-amber-500' : ''} />
                                هل هذا تصحيح؟
                            </span>
                        </label>

                        <button
                            type="submit"
                            disabled={submitting}
                            className="bg-emerald-600 text-white px-6 py-2 rounded-lg font-bold text-sm hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {submitting ? 'جاري الإرسال...' : <><Send size={16} /> إرسال</>}
                        </button>
                    </div>
                </div>
            </form>
        </section>
    );
}
