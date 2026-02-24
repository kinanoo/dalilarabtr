'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Users, Mail, Calendar, Search, Shield, UserCheck, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

interface Member {
    id: string;
    full_name: string;
    role: string;
    avatar_url: string | null;
    created_at: string;
    email?: string;
}

export default function AdminMembersPage() {
    const [members, setMembers] = useState<Member[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        fetchMembers();
    }, []);

    async function fetchMembers() {
        if (!supabase) return;
        setLoading(true);

        // Fetch member profiles
        const { data: profiles } = await supabase
            .from('member_profiles')
            .select('*')
            .order('created_at', { ascending: false });

        if (profiles) {
            // Try to get emails from auth.users via admin_activity_log
            // (auth.users is not directly accessible from client)
            // We'll show what we have from member_profiles + activity log emails
            const memberIds = profiles.map((p) => p.id);
            const { data: activityEmails } = await supabase
                .from('admin_activity_log')
                .select('entity_id, detail')
                .eq('event_type', 'new_member')
                .in('entity_id', memberIds);

            const emailMap = new Map<string, string>();
            for (const a of activityEmails || []) {
                if (a.entity_id && a.detail) emailMap.set(a.entity_id, a.detail);
            }

            setMembers(
                profiles.map((p) => ({
                    ...p,
                    email: emailMap.get(p.id) || '',
                }))
            );
        }
        setLoading(false);
    }

    const filtered = search.trim()
        ? members.filter(
              (m) =>
                  m.full_name?.toLowerCase().includes(search.toLowerCase()) ||
                  m.email?.toLowerCase().includes(search.toLowerCase())
          )
        : members;

    const totalMembers = members.length;
    const adminCount = members.filter((m) => m.role === 'admin').length;

    return (
        <div className="p-4 sm:p-8 max-w-6xl mx-auto space-y-8" dir="rtl">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                        <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl">
                            <Users size={28} className="text-emerald-600" />
                        </div>
                        الأعضاء المسجلون
                    </h1>
                    <p className="text-slate-500 mt-2 text-sm">
                        جميع المستخدمين المسجلين في المنصة
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl px-4 py-2 text-center">
                        <div className="text-2xl font-black text-emerald-600">{totalMembers}</div>
                        <div className="text-[10px] text-emerald-500 font-bold">إجمالي الأعضاء</div>
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl px-4 py-2 text-center">
                        <div className="text-2xl font-black text-blue-600">{adminCount}</div>
                        <div className="text-[10px] text-blue-500 font-bold">مديرون</div>
                    </div>
                </div>
            </div>

            {/* Search */}
            <div className="relative max-w-md">
                <Search size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="ابحث بالاسم أو الإيميل..."
                    className="w-full pr-10 pl-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                />
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
                        <p className="font-bold">لا يوجد أعضاء</p>
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
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                                {filtered.map((member, i) => (
                                    <tr key={member.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                        <td className="py-3 px-4 text-slate-400 text-xs">{i + 1}</td>
                                        <td className="py-3 px-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 overflow-hidden">
                                                    {member.avatar_url ? (
                                                        <img src={member.avatar_url} alt="" className="w-full h-full object-cover" />
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
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
