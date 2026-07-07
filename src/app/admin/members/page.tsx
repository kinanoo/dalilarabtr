'use client';

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Users, Mail, Calendar, Search, Shield, UserCheck, Loader2, Download, ShieldPlus, ShieldMinus, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { toast } from 'sonner';
import AdminPageHeader from '@/components/admin/AdminPageHeader';

interface Member {
    id: string;
    full_name: string;
    role: string;
    avatar_url: string | null;
    created_at: string;
    email?: string;
}

const PAGE_SIZE = 25;

export default function AdminMembersPage() {
    const [members, setMembers] = useState<Member[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'member'>('all');
    const [page, setPage] = useState(0);
    const [busyId, setBusyId] = useState<string | null>(null);

    useEffect(() => {
        fetchMembers();
    }, []);

    async function fetchMembers() {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/members', { cache: 'no-store' });
            if (res.ok) {
                const json = await res.json();
                setMembers(json.members || []);
                setLoading(false);
                return;
            }
        } catch {
            /* fall through to the direct-query fallback below */
        }

        if (supabase) {
            const { data: profiles } = await supabase
                .from('member_profiles')
                .select('id, full_name, role, avatar_url, created_at')
                .order('created_at', { ascending: false });
            if (profiles) {
                setMembers(profiles.map((p) => ({ ...p, email: '' })));
            }
        }
        setLoading(false);
    }

    // Promote/demote a member. Goes through the service-role PATCH endpoint
    // (RLS forbids the anon client from writing another user's role).
    async function changeRole(member: Member) {
        const nextRole = member.role === 'admin' ? 'member' : 'admin';
        const verb = nextRole === 'admin' ? 'ترقية إلى مدير' : 'إزالة صلاحية المدير';
        if (!confirm(`${verb} — «${member.full_name || 'بدون اسم'}»؟`)) return;

        setBusyId(member.id);
        try {
            const res = await fetch('/api/admin/members', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: member.id, role: nextRole }),
            });
            const json = await res.json().catch(() => ({}));
            if (!res.ok) {
                toast.error(json?.error || 'فشل تحديث الدور');
                return;
            }
            setMembers((prev) => prev.map((m) => (m.id === member.id ? { ...m, role: nextRole } : m)));
            toast.success(nextRole === 'admin' ? 'تمّت الترقية إلى مدير' : 'تمّت إزالة صلاحية المدير');
        } catch {
            toast.error('خطأ في الشبكة');
        } finally {
            setBusyId(null);
        }
    }

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return members.filter((m) => {
            if (roleFilter !== 'all' && m.role !== roleFilter) return false;
            if (!q) return true;
            return (m.full_name?.toLowerCase().includes(q) || m.email?.toLowerCase().includes(q));
        });
    }, [members, search, roleFilter]);

    // Reset to first page whenever the filter set changes.
    useEffect(() => { setPage(0); }, [search, roleFilter]);

    const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const current = Math.min(page, pageCount - 1);
    const paged = filtered.slice(current * PAGE_SIZE, current * PAGE_SIZE + PAGE_SIZE);

    const totalMembers = members.length;
    const adminCount = members.filter((m) => m.role === 'admin').length;

    function exportCsv() {
        const rows = [['الاسم', 'الإيميل', 'الدور', 'تاريخ التسجيل']];
        for (const m of filtered) {
            rows.push([
                (m.full_name || '').replace(/"/g, '""'),
                (m.email || '').replace(/"/g, '""'),
                m.role === 'admin' ? 'مدير' : 'عضو',
                m.created_at || '',
            ]);
        }
        const csv = '﻿' + rows.map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `members-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(a.href);
        toast.success(`تم تصدير ${filtered.length} عضواً`);
    }

    return (
        <div className="p-6 max-w-6xl mx-auto space-y-6" dir="rtl">
            <AdminPageHeader
                icon={Users}
                theme="cyan"
                title="الأعضاء المسجلون"
                subtitle="إدارة المستخدمين: البحث، الأدوار، والتصدير"
                eyebrow="أعضاء"
                actions={
                    <div className="flex items-center gap-2">
                        <div className="bg-gradient-to-br from-emerald-100 to-emerald-200/60 dark:from-emerald-900/40 dark:to-emerald-800/30 border border-emerald-200 dark:border-emerald-900/50 rounded-xl px-4 py-2 text-center shadow-sm">
                            <div className="text-2xl font-black text-emerald-600 tabular-nums" dir="ltr">{totalMembers}</div>
                            <div className="text-[10px] text-emerald-700 dark:text-emerald-400 font-black uppercase tracking-wider">إجمالي</div>
                        </div>
                        <div className="bg-gradient-to-br from-blue-100 to-blue-200/60 dark:from-blue-900/40 dark:to-blue-800/30 border border-blue-200 dark:border-blue-900/50 rounded-xl px-4 py-2 text-center shadow-sm">
                            <div className="text-2xl font-black text-blue-600 tabular-nums" dir="ltr">{adminCount}</div>
                            <div className="text-[10px] text-blue-700 dark:text-blue-400 font-black uppercase tracking-wider">مديرون</div>
                        </div>
                    </div>
                }
            />

            {/* Toolbar: search + role filter + export */}
            <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-[220px] max-w-md">
                    <Search size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="ابحث بالاسم أو الإيميل..."
                        className="w-full pr-10 pl-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                    />
                </div>

                <div className="flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-1">
                    {(['all', 'admin', 'member'] as const).map((r) => (
                        <button
                            key={r}
                            type="button"
                            onClick={() => setRoleFilter(r)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${roleFilter === r ? 'bg-emerald-600 text-white' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                        >
                            {r === 'all' ? 'الكلّ' : r === 'admin' ? 'المديرون' : 'الأعضاء'}
                        </button>
                    ))}
                </div>

                <button
                    type="button"
                    onClick={exportCsv}
                    disabled={filtered.length === 0}
                    className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 text-white rounded-xl text-sm font-bold transition-colors disabled:opacity-40"
                >
                    <Download size={16} /> تصدير CSV
                </button>
            </div>

            {/* Members Table */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="text-center py-16 text-slate-400">
                        <Loader2 size={32} className="mx-auto mb-3 animate-spin" />
                        جاري التحميل...
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-16 text-slate-400">
                        <Users size={40} className="mx-auto mb-3 opacity-30" />
                        <p className="font-bold">لا يوجد أعضاء مطابقون</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                                    <th className="text-right py-3 px-4 font-bold text-slate-500 text-xs">#</th>
                                    <th className="text-right py-3 px-4 font-bold text-slate-500 text-xs">العضو</th>
                                    <th className="text-right py-3 px-4 font-bold text-slate-500 text-xs">الإيميل</th>
                                    <th className="text-right py-3 px-4 font-bold text-slate-500 text-xs">الدور</th>
                                    <th className="text-right py-3 px-4 font-bold text-slate-500 text-xs">تاريخ التسجيل</th>
                                    <th className="text-right py-3 px-4 font-bold text-slate-500 text-xs">إجراء</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                                {paged.map((member, i) => (
                                    <tr key={member.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                        <td className="py-3 px-4 text-slate-400 text-xs">{current * PAGE_SIZE + i + 1}</td>
                                        <td className="py-3 px-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 overflow-hidden">
                                                    {member.avatar_url ? (
                                                        <img src={member.avatar_url} alt={member.full_name || 'عضو'} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <span className="text-sm font-bold text-slate-400">
                                                            {(member.full_name || '?').charAt(0)}
                                                        </span>
                                                    )}
                                                </div>
                                                <span className="font-bold text-slate-800 dark:text-white">
                                                    {member.full_name || 'بدون اسم'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4">
                                            {member.email ? (
                                                <span className="flex items-center gap-1.5 text-slate-500 text-xs font-mono" dir="ltr">
                                                    <Mail size={12} className="text-slate-300" />
                                                    {member.email}
                                                </span>
                                            ) : (
                                                <span className="text-slate-300 text-xs">—</span>
                                            )}
                                        </td>
                                        <td className="py-3 px-4">
                                            {member.role === 'admin' ? (
                                                <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-blue-100 dark:bg-blue-900/30 text-blue-600 px-2 py-1 rounded-lg">
                                                    <Shield size={10} /> مدير
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 px-2 py-1 rounded-lg">
                                                    <UserCheck size={10} /> عضو
                                                </span>
                                            )}
                                        </td>
                                        <td className="py-3 px-4">
                                            <div className="flex items-center gap-1.5 text-slate-400 text-xs">
                                                <Calendar size={12} />
                                                {member.created_at
                                                    ? formatDistanceToNow(new Date(member.created_at), { addSuffix: true, locale: ar })
                                                    : '—'}
                                            </div>
                                        </td>
                                        <td className="py-3 px-4">
                                            <button
                                                type="button"
                                                onClick={() => changeRole(member)}
                                                disabled={busyId === member.id}
                                                title={member.role === 'admin' ? 'إزالة صلاحية المدير' : 'ترقية إلى مدير'}
                                                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-colors disabled:opacity-50 ${member.role === 'admin'
                                                    ? 'bg-rose-50 dark:bg-rose-900/20 text-rose-600 hover:bg-rose-100'
                                                    : 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 hover:bg-blue-100'}`}
                                            >
                                                {busyId === member.id ? (
                                                    <Loader2 size={12} className="animate-spin" />
                                                ) : member.role === 'admin' ? (
                                                    <><ShieldMinus size={12} /> إزالة الإدارة</>
                                                ) : (
                                                    <><ShieldPlus size={12} /> ترقية لمدير</>
                                                )}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Pagination */}
            {!loading && filtered.length > PAGE_SIZE && (
                <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500 font-bold tabular-nums">
                        {current * PAGE_SIZE + 1}–{Math.min((current + 1) * PAGE_SIZE, filtered.length)} من {filtered.length}
                    </span>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setPage((p) => Math.max(0, p - 1))}
                            disabled={current === 0}
                            className="flex items-center gap-1 px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800"
                        >
                            <ChevronRight size={16} /> السابق
                        </button>
                        <span className="text-slate-500 font-bold tabular-nums px-2">{current + 1} / {pageCount}</span>
                        <button
                            type="button"
                            onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
                            disabled={current >= pageCount - 1}
                            className="flex items-center gap-1 px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800"
                        >
                            التالي <ChevronLeft size={16} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
