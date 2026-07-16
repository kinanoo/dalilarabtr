'use client';

/**
 * NotificationsManager — the missing control over the bell.
 *
 * Notifications are written by TWO automated writers (the notify_on_new_content
 * DB trigger and the notify pipeline), and until now the admin had no way to
 * take one back: a test row reading «للحذف فوراً» sat in every visitor's bell
 * for 18 hours because nothing in /admin could touch it.
 *
 * Two actions, deliberately different in weight:
 *  • إخفاء (is_active=false) — the bell query filters `is_active = true`, so
 *    this hides the row from every reader on their next fetch while keeping the
 *    record. Reversible. This is the default, safe action.
 *  • حذف — permanent, for genuine mistakes/tests. Confirmed before firing.
 *
 * Both writes go through the admin API (server-side session + role check), never
 * the anon key.
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { adminUpdate, adminDelete } from '@/lib/adminApi';
import { Trash2, Eye, EyeOff, Bell, RefreshCw, ExternalLink, Users, User } from 'lucide-react';
import { toast } from 'sonner';
import logger from '@/lib/logger';

interface NotificationRow {
    id: string;
    type: string | null;
    title: string;
    message: string | null;
    link: string | null;
    icon: string | null;
    is_active: boolean;
    created_at: string;
    target_user_id: string | null;
    group_count: number | null;
}

export default function NotificationsManager() {
    const [items, setItems] = useState<NotificationRow[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [busyId, setBusyId] = useState<string | null>(null);
    const [showHidden, setShowHidden] = useState(true);

    const fetchItems = useCallback(async () => {
        if (!supabase) return;
        setIsLoading(true);
        const { data, error } = await supabase
            .from('notifications')
            .select('id, type, title, message, link, icon, is_active, created_at, target_user_id, group_count')
            .order('created_at', { ascending: false })
            .limit(60);
        if (error) {
            logger.error('notifications fetch failed:', error);
            toast.error('تعذّر تحميل الإشعارات');
        }
        setItems(data || []);
        setIsLoading(false);
    }, []);

    useEffect(() => { fetchItems(); }, [fetchItems]);

    async function toggleActive(n: NotificationRow) {
        setBusyId(n.id);
        const next = !n.is_active;
        const { error } = await adminUpdate('notifications', { is_active: next }, n.id);
        setBusyId(null);
        if (error) {
            toast.error(`تعذّر التنفيذ: ${error.message}`);
            return;
        }
        setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, is_active: next } : x)));
        toast.success(next ? 'أعيد إظهار الإشعار للمستخدمين' : 'أُخفي الإشعار — لن يظهر للمستخدمين');
    }

    async function remove(n: NotificationRow) {
        if (!confirm(`حذف نهائي لهذا الإشعار؟\n\n«${n.title}»\n\nلا يمكن التراجع. للإخفاء المؤقّت استخدم زر «إخفاء».`)) return;
        setBusyId(n.id);
        const { error } = await adminDelete('notifications', n.id);
        setBusyId(null);
        if (error) {
            toast.error(`تعذّر الحذف: ${error.message}`);
            return;
        }
        setItems((prev) => prev.filter((x) => x.id !== n.id));
        toast.success('حُذف الإشعار نهائياً');
    }

    const visible = showHidden ? items : items.filter((n) => n.is_active);
    const activeCount = items.filter((n) => n.is_active).length;

    return (
        <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="text-sm text-slate-600 dark:text-slate-300">
                    <span className="font-black text-slate-900 dark:text-slate-100">{activeCount}</span> إشعار ظاهر للمستخدمين
                    <span className="text-slate-400"> · من أصل {items.length} محمّل</span>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => setShowHidden((v) => !v)}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:border-emerald-300 transition-colors"
                    >
                        {showHidden ? <EyeOff size={14} /> : <Eye size={14} />}
                        {showHidden ? 'إخفاء المخفيّة من القائمة' : 'إظهار المخفيّة أيضاً'}
                    </button>
                    <button
                        type="button"
                        onClick={fetchItems}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:border-emerald-300 transition-colors"
                    >
                        <RefreshCw size={14} /> تحديث
                    </button>
                </div>
            </div>

            {isLoading ? (
                <div className="space-y-2">
                    {[0, 1, 2].map((i) => (
                        <div key={i} className="h-20 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
                    ))}
                </div>
            ) : visible.length === 0 ? (
                <div className="text-center py-14 text-slate-500 dark:text-slate-400">
                    <Bell size={30} className="mx-auto mb-3 opacity-40" />
                    <p className="font-bold">لا توجد إشعارات</p>
                </div>
            ) : (
                <ul className="space-y-2">
                    {visible.map((n) => (
                        <li
                            key={n.id}
                            className={`flex items-start gap-3 rounded-2xl border p-4 transition-colors ${
                                n.is_active
                                    ? 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
                                    : 'border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 opacity-70'
                            }`}
                        >
                            <span className="text-xl leading-none shrink-0 mt-0.5">{n.icon || '🔔'}</span>

                            <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="font-black text-sm text-slate-900 dark:text-slate-100 break-words">{n.title}</span>
                                    {!n.is_active && (
                                        <span className="rounded-lg bg-slate-200 dark:bg-slate-700 px-2 py-0.5 text-[10px] font-black text-slate-600 dark:text-slate-300">
                                            مخفيّ
                                        </span>
                                    )}
                                    <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-500 dark:text-slate-400">
                                        {n.target_user_id ? <><User size={10} /> شخصي</> : <><Users size={10} /> للجميع</>}
                                    </span>
                                    {n.type && (
                                        <span className="rounded-lg bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-500 dark:text-slate-400" dir="ltr">
                                            {n.type}
                                        </span>
                                    )}
                                </div>

                                {n.message && (
                                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">{n.message}</p>
                                )}

                                <div className="mt-1.5 flex flex-wrap items-center gap-3 text-[11px] text-slate-400">
                                    <span dir="ltr" className="tabular-nums">
                                        {new Date(n.created_at).toISOString().slice(0, 16).replace('T', ' ')}
                                    </span>
                                    {n.link && (
                                        <a
                                            href={n.link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1 font-bold text-emerald-700 dark:text-emerald-400 hover:underline"
                                            dir="ltr"
                                        >
                                            {n.link} <ExternalLink size={10} />
                                        </a>
                                    )}
                                </div>
                            </div>

                            <div className="flex shrink-0 items-center gap-1.5">
                                <button
                                    type="button"
                                    disabled={busyId === n.id}
                                    onClick={() => toggleActive(n)}
                                    title={n.is_active ? 'إخفاء عن المستخدمين' : 'إعادة الإظهار'}
                                    className="grid place-items-center w-9 h-9 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-amber-300 hover:text-amber-600 disabled:opacity-40 transition-colors"
                                >
                                    {n.is_active ? <EyeOff size={15} /> : <Eye size={15} />}
                                </button>
                                <button
                                    type="button"
                                    disabled={busyId === n.id}
                                    onClick={() => remove(n)}
                                    title="حذف نهائي"
                                    className="grid place-items-center w-9 h-9 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-red-300 hover:text-red-600 disabled:opacity-40 transition-colors"
                                >
                                    <Trash2 size={15} />
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
