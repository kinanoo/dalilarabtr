'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Edit, Trash2, ChevronLeft, ChevronRight, Loader2, Search, Plus, ToggleLeft, ToggleRight } from 'lucide-react';
import { toast } from 'sonner';

interface Column {
    key: string;
    label: string;
    render?: (value: any, row: any) => React.ReactNode;
}

interface DataTableProps {
    tableName: string;
    columns: Column[];
    onEdit: (item: any) => void;
    onCreate?: () => void; // New Prop
    title?: string;
    searchPlaceholder?: string;
    orderBy?: string; // Default: created_at
    type?: string; // For specific styling (e.g. 'service', 'article')
    idField?: string; // Default: 'id'
    searchFields?: string[]; // Columns to search in
    customFilter?: (query: any) => any; // New: Allow external filtering
    refreshKey?: number; // Increment to trigger a data refresh
    toggleField?: string; // Boolean field to toggle inline (e.g. 'is_active', 'active')
}

export function DataTable({
    tableName,
    columns,
    onEdit,
    onCreate,
    title,
    searchPlaceholder = "بحث...",
    orderBy = 'created_at',
    type,
    idField = 'id',
    searchFields,
    customFilter,
    refreshKey,
    toggleField
}: DataTableProps) {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(0);
    const [search, setSearch] = useState('');
    const [total, setTotal] = useState(0);

    const PAGE_SIZE = 10;

    // Reset to page 0 when customFilter changes (e.g., switching filter modes in services page)
    const prevCustomFilter = useRef(customFilter);
    useEffect(() => {
        if (customFilter !== prevCustomFilter.current) {
            prevCustomFilter.current = customFilter;
            setPage(0);
        }
    }, [customFilter]);

    useEffect(() => {
        fetchData(search);
    }, [page, tableName, customFilter, refreshKey]); // refreshKey triggers manual refresh

    // Debounced search — capture current search value to avoid stale closure
    useEffect(() => {
        const currentSearch = search;
        const timer = setTimeout(() => {
            setPage(0);
            fetchData(currentSearch);
        }, 500);
        return () => clearTimeout(timer);
    }, [search]);

    async function fetchData(searchTerm?: string) {
        const term = searchTerm !== undefined ? searchTerm : search;
        if (!supabase) return;
        setLoading(true);

        try {
            let query = supabase
                .from(tableName)
                .select('*', { count: 'exact' });

            // Apply Custom Filter first (if any)
            if (customFilter) {
                query = customFilter(query);
            }

            if (term) {
                if (searchFields && searchFields.length > 0) {
                    // Use OR syntax for multiple fields
                    const orQuery = searchFields.map(field => `${field}.ilike.%${term}%`).join(',');
                    query = query.or(orQuery);
                } else {
                    // Fallback legacy logic
                    const searchCol = tableName === 'faqs' ? 'question' : (tableName === 'service_providers' ? 'name' : 'title');
                    query = query.ilike(searchCol, `%${term}%`);
                }
            }

            query = query.order(orderBy, { ascending: false })
                .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

            const { data: rows, count, error } = await query;

            if (error) throw error;

            setData(rows || []);
            setTotal(count || 0);

        } catch (err: any) {
            console.error('Error fetching data:', err);
            toast.error('فشل تحميل البيانات: ' + err.message);
        } finally {
            setLoading(false);
        }
    }

    async function handleDelete(id: string) {
        if (!confirm('هل أنت متأكد من الحذف؟ لا يمكن التراجع عن هذا الإجراء.')) return;

        try {
            const res = await fetch('/api/admin/delete-record', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ table: tableName, id, idField }),
            });
            const result = await res.json();
            if (!res.ok) throw new Error(result.error || 'فشل الحذف');
            toast.success('تم الحذف بنجاح');
            fetchData();
        } catch (err: any) {
            toast.error('خطأ في الحذف: ' + err.message);
        }
    }

    async function handleToggle(id: string, currentValue: boolean) {
        if (!supabase || !toggleField) return;
        try {
            const { error } = await supabase
                .from(tableName)
                .update({ [toggleField]: !currentValue })
                .eq(idField, id);
            if (error) throw error;
            toast.success(currentValue ? 'تم التعطيل' : 'تم التفعيل');
            fetchData();
        } catch (err: any) {
            toast.error('خطأ: ' + err.message);
        }
    }

    const totalPages = Math.ceil(total / PAGE_SIZE);

    return (
        <div className="space-y-6">
            {/* Header / Toolbar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    {title && (
                        <div className="flex items-center gap-3">
                            <h2 className="text-xl font-bold text-slate-800 dark:text-white">{title}</h2>
                            <span className="px-2.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-400">{total}</span>
                        </div>
                    )}
                    {onCreate && (
                        <button onClick={onCreate} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition shadow-lg shadow-emerald-600/20">
                            <Plus size={18} /> <span className="hidden xs:inline">إضافة جديد</span>
                        </button>
                    )}
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto">
                    <div className="relative flex-1 md:w-80 group">
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" size={18} />
                        <input
                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl pl-3 pr-10 py-2.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm"
                            placeholder={searchPlaceholder}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* List / Grid */}
            <div className="space-y-3">
                {loading && data.length === 0 ? (
                    <div className="p-12 text-center text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                        <Loader2 className="animate-spin mx-auto mb-3 text-emerald-500" size={32} />
                        <p className="font-bold">جاري تحميل البيانات...</p>
                    </div>
                ) : data.length === 0 ? (
                    <div className="p-12 text-center text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                        <p className="font-bold">لا توجد بيانات مطابقة للبحث.</p>
                    </div>
                ) : (
                    data.map((row, index) => (
                        <div key={row[idField] || index} className="relative group bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-3 sm:p-4 hover:shadow-lg hover:border-emerald-500/30 transition-all duration-300">
                            <div className="flex items-start gap-3">
                                {/* Icon / Leading */}
                                <div className={`w-10 h-10 sm:w-12 sm:h-12 shrink-0 rounded-xl flex items-center justify-center text-base sm:text-lg font-bold shadow-sm
                                    ${type === 'code' ? 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400' :
                                        type === 'service' ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' :
                                            'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400'}`}>
                                    {type === 'code' ? (row.code || 'C') : type === 'service' ? (row.name?.charAt(0) || 'S') : (row.title?.charAt(0) || 'A')}
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="min-w-0">
                                            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm sm:text-base leading-tight line-clamp-2">
                                                {row.title || row.name || row.question || row.code}
                                            </h3>
                                            {(row.category || row.profession || row.severity) && (
                                                <span className="inline-flex mt-1 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                                                    {row.category || row.profession || row.severity}
                                                </span>
                                            )}
                                        </div>
                                        {/* Actions — desktop inline */}
                                        <div className="hidden sm:flex items-center gap-1 shrink-0">
                                            {toggleField && (
                                                <button
                                                    onClick={() => handleToggle(row[idField], !!row[toggleField])}
                                                    className={`p-2 rounded-xl transition-all ${
                                                        row[toggleField]
                                                            ? 'text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'
                                                            : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                                                    }`}
                                                    title={row[toggleField] ? 'تعطيل' : 'تفعيل'}
                                                >
                                                    {row[toggleField] ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                                                </button>
                                            )}
                                            <button
                                                onClick={() => onEdit(row)}
                                                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-all"
                                                title="تعديل"
                                            >
                                                <Edit size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(row[idField])}
                                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"
                                                title="حذف"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1.5 text-[11px] sm:text-xs text-slate-400 font-medium">
                                        {columns.map(col => {
                                            if (col.key === 'title' || col.key === 'name' || col.key === 'question') return null;
                                            const val = col.render ? col.render(row[col.key], row) : String(row[col.key] || '-');
                                            return (
                                                <span key={col.key} className="truncate max-w-[45%]">
                                                    <span className="opacity-50">{col.label}: </span>
                                                    <span className="text-slate-600 dark:text-slate-300">{val}</span>
                                                </span>
                                            );
                                        })}
                                        {row.created_at && (
                                            <span className="text-slate-400">{new Date(row.created_at).toLocaleDateString('en-GB')}</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            {/* Actions — mobile bottom row */}
                            <div className="flex sm:hidden items-center justify-end gap-1 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                                {toggleField && (
                                    <button
                                        onClick={() => handleToggle(row[idField], !!row[toggleField])}
                                        className={`p-1.5 rounded-lg transition-all text-xs font-bold flex items-center gap-1 ${
                                            row[toggleField]
                                                ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20'
                                                : 'text-slate-400 bg-slate-50 dark:bg-slate-800'
                                        }`}
                                    >
                                        {row[toggleField] ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                                        {row[toggleField] ? 'مفعّل' : 'معطّل'}
                                    </button>
                                )}
                                <button
                                    onClick={() => onEdit(row)}
                                    className="p-1.5 rounded-lg text-blue-600 bg-blue-50 dark:bg-blue-900/20 transition-all flex items-center gap-1 text-xs font-bold"
                                >
                                    <Edit size={14} /> تعديل
                                </button>
                                <button
                                    onClick={() => handleDelete(row[idField])}
                                    className="p-1.5 rounded-lg text-red-600 bg-red-50 dark:bg-red-900/20 transition-all flex items-center gap-1 text-xs font-bold"
                                >
                                    <Trash2 size={14} /> حذف
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex justify-center items-center gap-4 mt-6">
                    <button
                        onClick={() => setPage(p => Math.max(0, p - 1))}
                        disabled={page === 0 || loading}
                        className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 disabled:opacity-50 hover:border-emerald-500 transition-all text-slate-500"
                    >
                        <ChevronRight size={20} />
                    </button>
                    <span className="text-sm font-bold text-slate-500">
                        {page + 1} / {totalPages}
                    </span>
                    <button
                        onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                        disabled={page >= totalPages - 1 || loading}
                        className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 disabled:opacity-50 hover:border-emerald-500 transition-all text-slate-500"
                    >
                        <ChevronLeft size={20} />
                    </button>
                </div>
            )}
        </div>
    );
}
