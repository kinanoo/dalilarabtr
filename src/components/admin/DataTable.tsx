'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Edit, Trash2, ChevronLeft, ChevronRight, Loader2, Search, Plus } from 'lucide-react';
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
    refreshKey
}: DataTableProps) {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(0);
    const [search, setSearch] = useState('');
    const [total, setTotal] = useState(0);

    const PAGE_SIZE = 10;

    useEffect(() => {
        fetchData();
    }, [page, tableName, customFilter, refreshKey]); // refreshKey triggers manual refresh

    // Debounced search effect
    useEffect(() => {
        const timer = setTimeout(() => {
            setPage(0); // Reset to page 0 on new search
            fetchData();
        }, 500);
        return () => clearTimeout(timer);
    }, [search]);

    async function fetchData() {
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

            if (search) {
                if (searchFields && searchFields.length > 0) {
                    // Use OR syntax for multiple fields
                    const orQuery = searchFields.map(field => `${field}.ilike.%${search}%`).join(',');
                    query = query.or(orQuery);
                } else {
                    // Fallback legacy logic
                    const searchCol = tableName === 'faqs' ? 'question' : (tableName === 'service_providers' ? 'name' : 'title');
                    query = query.ilike(searchCol, `%${search}%`);
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
        if (!supabase) return;

        try {
            const { error } = await supabase.from(tableName).delete().eq(idField, id);
            if (error) throw error;
            toast.success('تم الحذف بنجاح');
            fetchData(); // Refresh
        } catch (err: any) {
            toast.error('من المحتمل أن الجدول يستخدم عمود معرف مختلف عن المتوقع.\n' + err.message);
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
                        <div key={row[idField] || index} className="relative group bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 flex items-center gap-4 hover:shadow-lg hover:border-emerald-500/30 transition-all duration-300">

                            {/* Icon / Leading */}
                            <div className={`w-12 h-12 shrink-0 rounded-xl flex items-center justify-center text-lg font-bold shadow-sm transition-transform group-hover:scale-110 
                                ${type === 'code' ? 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400' :
                                    type === 'service' ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' :
                                        'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400'}`}>
                                {type === 'code' ? (row.code || 'C') : type === 'service' ? (row.name?.charAt(0) || 'S') : (row.title?.charAt(0) || 'A')}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-3">
                                    <h3 className="font-bold text-slate-800 dark:text-slate-100 truncate text-base">
                                        {row.title || row.name || row.question || row.code}
                                    </h3>
                                    {/* Subtitle / Badge */}
                                    {(row.category || row.profession || row.severity) && (
                                        <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 w-fit">
                                            {row.category || row.profession || row.severity}
                                        </span>
                                    )}
                                </div>
                                <div className="flex flex-wrap items-center gap-x-3 gap-y-2 mt-2 text-xs text-slate-400 font-medium w-full overflow-hidden">
                                    {columns.map(col => {
                                        // Skip columns that are already shown as title
                                        if (col.key === 'title' || col.key === 'name' || col.key === 'question') return null;
                                        return (
                                            <div key={col.key} className="flex items-center gap-1 min-w-0 max-w-[45%]">
                                                <span className="opacity-50 shrink-0">{col.label}:</span>
                                                <span className="text-slate-600 dark:text-slate-300 truncate">
                                                    {col.render ? col.render(row[col.key], row) : String(row[col.key] || '-')}
                                                </span>
                                            </div>
                                        )
                                    })}
                                    <div className="flex items-center gap-1 min-w-0 shrink-0">
                                        <span className="md:hidden opacity-50 shrink-0">التاريخ:</span>
                                        <span className="hidden md:inline-block w-1 h-1 bg-slate-300 rounded-full mx-1 shrink-0"></span>
                                        <span className="truncate dir-ltr">{row.created_at ? new Date(row.created_at).toLocaleDateString('en-GB') : ''}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2 pl-2">
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
