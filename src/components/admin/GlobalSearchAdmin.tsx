'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Toaster, toast } from 'sonner';
import {
    Search, Loader2, Save, X, Trash2, LogOut,
    FileText, Briefcase, ShieldAlert, HelpCircle, Menu
} from 'lucide-react';
import { searchAllTables, SearchResult } from '@/lib/adminSearch';
import { ArticleEditor } from './editors/ArticleEditor';
import { ServiceEditor } from './editors/ServiceEditor';
import { StaticPageEditor } from './editors/StaticPageEditor';
import { GenericEditor } from './editors/GenericEditor';
import { CodeEditor } from './editors/CodeEditor';
import { ZoneEditor } from './editors/ZoneEditor';
import { SourceEditor } from './editors/SourceEditor';
import { BannerEditor } from './editors/BannerEditor';
import { TestimonialEditor } from './editors/TestimonialEditor';
import { SuggestionViewer } from './editors/SuggestionViewer';
import { FaqEditor } from './editors/FaqEditor';
import ConfigManager from './ConfigManager';
import DataMigration from './DataMigration';
import { AdminSidebar } from './AdminSidebar';
import { DataTable } from './DataTable';
import logger from '@/lib/logger';

// --- SaveBar Component ---
const SaveBar = ({ onSave, onDelete, onCancel, loading, isNew }: { onSave: () => void, onDelete: () => void, onCancel: () => void, loading: boolean, isNew: boolean }) => (
    <div className="p-6 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex justify-between items-center gap-4 sticky bottom-0 z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        {!isNew && (
            <button
                onClick={onDelete}
                disabled={loading}
                className="flex items-center gap-2 px-5 py-2.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl font-bold transition-all disabled:opacity-50"
            >
                <Trash2 size={18} /> حذف العنصر
            </button>
        )}
        <div className="flex gap-3 mr-auto w-full md:w-auto justify-end">
            <button
                onClick={onCancel}
                disabled={loading}
                className="px-6 py-3 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl font-bold transition-all"
            >
                إلغاء
            </button>
            <button
                onClick={onSave}
                disabled={loading}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-10 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-lg shadow-lg shadow-emerald-600/20 transition-all disabled:opacity-70 active:scale-95"
            >
                {loading ? <Loader2 className="animate-spin" size={22} /> : <Save size={22} />}
                {loading ? 'جاري الحفظ...' : 'حفظ التعديلات'}
            </button>
        </div>
    </div>
);

// --- Quick Button ---
interface QuickBtnProps {
    icon: React.ElementType;
    label: string;
    color: string;
    onClick: () => void;
}

const QuickBtn = ({ icon: Icon, label, color, onClick }: QuickBtnProps) => (
    <button onClick={onClick} className={`flex flex-col items-center justify-center p-6 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-${color}-500 hover:bg-${color}-50 dark:hover:bg-${color}-950/20 transition-all group shadow-sm hover:shadow-xl hover:-translate-y-1 h-full`}>
        <div className={`p-4 rounded-full bg-${color}-100 dark:bg-${color}-900/30 text-${color}-600 dark:text-${color}-400 mb-3 group-hover:scale-110 transition-transform`}>
            <Icon size={28} />
        </div>
        <span className="text-sm font-bold text-slate-700 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-white">{label}</span>
    </button>
);

export default function AdminDashboard() {
    const router = useRouter();
    // Layout State
    const [view, setView] = useState('dashboard'); // dashboard, articles, services, faqs, codes, settings
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    // Search State
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [searching, setSearching] = useState(false);
    const searchTimeout = useRef<NodeJS.Timeout | null>(null);

    // Editor State
    const [selectedItem, setSelectedItem] = useState<{ id: string; type: string; title: string; subtitle?: string; data: Record<string, unknown> } | null>(null);
    const [form, setForm] = useState<Record<string, unknown>>({});
    const [saving, setSaving] = useState(false);

    // Debounced Search Handler
    const handleSearch = (text: string) => {
        setQuery(text);
        if (searchTimeout.current) clearTimeout(searchTimeout.current);

        if (!text.trim()) {
            setResults([]);
            return;
        }

        setLoading(true);
        setSearching(true);
        searchTimeout.current = setTimeout(async () => {
            try {
                // Use new RPC Search
                const data = await searchAllTables(text);
                setResults(data);
            } catch (error) {
                logger.error("Search error:", error);
            } finally {
                setLoading(false);
                setSearching(false);
            }
        }, 300);
    };

    // Initialize Form when Item Selected (Lazy Fetching)
    useEffect(() => {
        const loadFullData = async () => {
            if (selectedItem) {
                if (selectedItem.id === 'new') {
                    setForm(selectedItem.data || {});
                } else {
                    // Check if data is missing (lite search result)
                    if (!selectedItem.data) {
                        setLoading(true);
                        const { fetchItemDetails } = await import('@/lib/adminSearch');
                        const fullData = await fetchItemDetails(selectedItem.id, selectedItem.type);
                        if (fullData) {
                            setForm(fullData);
                        } else {
                            toast.error('❌ فشل تحميل بيانات العنصر');
                        }
                        setLoading(false);
                    } else {
                        setForm(selectedItem.data);
                    }
                }
            } else {
                setForm({});
            }
        };
        loadFullData();
    }, [selectedItem]);

    // Save Handling
    // --- Payload Sanitation & Validation ---
    const sanitizePayload = (type: string, data: Record<string, unknown>) => {
        const clean = { ...data };

        // 1. Unified Cleanup (Remove nulls/undefined/empty strings if needed or keep based on schema)
        Object.keys(clean).forEach(key => {
            if (clean[key] === undefined || clean[key] === null) delete clean[key];
        });

        // 2. Type-Specific Sanitation
        switch (type) {
            case 'service':
                // REMOVE 'active' and 'whatsapp' (not in DB)
                delete clean.active;
                delete clean.whatsapp;

                // Ensure required fields
                if (!clean.name) throw new Error("اسم الخدمة مطلوب");
                if (!clean.description) throw new Error("الوصف مطلوب");
                break;

            case 'article':
                // Check 'active' removal if article table doesn't have it (User said REMOVE active from payload)
                delete clean.active; // Assuming articles use published_at or similar, or just don't have active.
                // Ensure Arrays are Arrays
                ['steps', 'documents', 'tips'].forEach(k => {
                    if (!Array.isArray(clean[k])) clean[k] = [];
                });
                break;

            case 'code':
                // Ensure 'effect' is used, remove 'solution' if just UI state
                // If CodeEditor sets 'effect', we keep it. If it set 'solution' before, we map it?
                // We changed CodeEditor to set 'effect'.
                if (clean.solution && !clean.effect) {
                    clean.effect = clean.solution; // Fallback just in case
                    delete clean.solution;
                }
                if (clean.solution) delete clean.solution; // Strict removal
                break;

            case 'zone':
                if (!clean.city) throw new Error("اسم المدينة مطلوب (City is required)");
                // Status mapping if needed
                break;

            case 'faq':
                // Ensure active is boolean
                if (typeof clean.active !== 'boolean') clean.active = true;
                break;

            case 'update':
                // Ensure nothing weird
                break;
        }

        return clean;
    };

    // Save Handling
    const handleSave = async () => {
        if (!selectedItem) return;
        if (!supabase) return toast.error('❌ خطأ: لا يوجد اتصال بقاعدة البيانات');



        // Validation: FAQ Answer
        if (selectedItem.type === 'faq' && (!form.answer || !(form.answer as string).trim())) {
            return toast.error('❌ الخطأ: حقل الإجابة (Answer) مطلوب.');
        }

        setSaving(true);
        try {
            let table = '';
            // Table Mapping
            if (selectedItem.type === 'article') table = 'articles';
            if (selectedItem.type === 'service') table = 'service_providers'; // Verified Name
            if (selectedItem.type === 'update') table = 'updates'; // FIXED: Unified with ContentParsers
            if (selectedItem.type === 'menu') table = 'site_menus';
            if (selectedItem.type === 'banner') table = 'site_banners';
            if (selectedItem.type === 'testimonial') table = 'site_testimonials';
            if (selectedItem.type === 'faq') table = 'faqs';
            if (selectedItem.type === 'code') table = 'security_codes';
            if (selectedItem.type === 'zone') table = 'zones';
            if (selectedItem.type === 'source') table = 'official_sources';
            if (selectedItem.type === 'tool') table = 'tools_registry';
            if (selectedItem.type === 'scenario') table = 'consultant_scenarios';
            if ((selectedItem as any).type === 'page') table = 'static_pages';

            // Special: Settings
            if (selectedItem.type === 'settings') {
                const { error } = await supabase.from('site_settings').upsert({ id: 1, ...form });
                if (error) throw error;
                setSelectedItem(null); setSaving(false);
                toast.success('✅ تم حفظ الإعدادات');
                window.location.reload();
                return;
            }

            if (!table) throw new Error(`Unknown table Type: ${selectedItem.type}`);

            // 1. Sanitization & Validation (The Firewall)
            let payload = { ...form };

            // Clean Arrays first
            ['steps', 'documents', 'tips', 'requirements', 'keywords', 'docs'].forEach(key => {
                if (Array.isArray(payload[key])) {
                    payload[key] = payload[key].filter((x: string) => x && x.trim() !== '');
                }
            });

            // Apply Strict Rules
            payload = sanitizePayload(selectedItem.type, payload);

            // Add ID if editing
            if (selectedItem.id !== 'new') {
                payload.id = selectedItem.id;
            } else {
                // Remove ID if it crept in for new items
                delete payload.id;
            }



            // Execute Upsert
            const { data: responseData, error } = await supabase.from(table).upsert(payload).select();

            if (error) throw error;

            toast.success('✅ تم الحفظ بنجاح!');
            setSelectedItem(null);
            setQuery('');
            setResults([]);
            router.refresh();

        } catch (err) {
            logger.error("💥 [AdminSave] Error:", err);
            toast.error('❌ حدث خطأ: ' + (err instanceof Error ? err.message : String(err)));
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!selectedItem || selectedItem.id === 'new') return;
        if (!confirm('هل أنت متأكد من الحذف؟')) return;

        setSaving(true);
        try {
            let table = '';
            // Simplified Mapping for Delete
            if (selectedItem.type === 'article') table = 'articles';
            if (selectedItem.type === 'service') table = 'service_providers';
            if (selectedItem.type === 'faq') table = 'faqs';
            if (selectedItem.type === 'code') table = 'security_codes';
            if (selectedItem.type === 'zone') table = 'zones';
            if (selectedItem.type === 'source') table = 'official_sources';
            if (selectedItem.type === 'tool') table = 'tools_registry';
            if (selectedItem.type === 'scenario') table = 'consultant_scenarios';
            if ((selectedItem as any).type === 'page') table = 'static_pages';

            if (!table) return;

            if (!supabase) return;

            // Determine Primary Key Column
            const idColumn = (table === 'security_codes' || table === 'security_codes_v2') ? 'code' :
                (table === 'tools_registry') ? 'key' : 'id';

            const { error } = await supabase.from(table).delete().eq(idColumn, selectedItem.id);
            if (error) throw error;

            toast.success('🗑️ تم الحذف');
            setSelectedItem(null);
        } catch (err) {
            toast.error('❌ خطأ في الحذف: ' + (err instanceof Error ? err.message : String(err)));
        } finally {
            setSaving(false);
        }
    };

    const renderEditor = () => {
        if (!selectedItem) return null;
        if (loading) return <div className="p-10 text-center"><Loader2 className="animate-spin mx-auto text-emerald-500" /></div>;

        if (selectedItem.type === 'settings') return <ConfigManager />;
        if (selectedItem.type === 'article') return <ArticleEditor form={form} setForm={setForm} />;
        if (selectedItem.type === 'service') return <ServiceEditor form={form} setForm={setForm} />;
        if ((selectedItem as any).type === 'page') return <StaticPageEditor form={form} setForm={setForm} />;
        if (selectedItem.type === 'code') return <CodeEditor form={form} setForm={setForm} />;
        if (selectedItem.type === 'zone') return <ZoneEditor form={form} setForm={setForm} />;
        if (selectedItem.type === 'source') return <SourceEditor form={form} setForm={setForm} />;
        if (selectedItem.type === 'banner') return <BannerEditor form={form} setForm={setForm} />;
        if (selectedItem.type === 'testimonial') return <TestimonialEditor form={form} setForm={setForm} />;
        if (selectedItem.type === 'suggestion') return <SuggestionViewer form={form} setForm={setForm} />;
        if (selectedItem.type === 'faq') return <FaqEditor form={form} setForm={setForm} />;


        // For new types, we can reuse GenericEditor or create new specialized ones later
        return <GenericEditor form={form} setForm={setForm} type={selectedItem.type} />;
    };

    // View Routing
    const renderMainContent = () => {
        // 1. Search Results (Override everything if searching)
        if (results.length > 0) {
            return (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8 p-4">
                    {results.map((item) => (
                        <div key={item.id} onClick={() => setSelectedItem(item as any)} className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500 cursor-pointer shadow-sm hover:shadow-lg transition-all">
                            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded mb-2 inline-block">{item.type}</span>
                            <h3 className="font-bold text-lg mb-2 text-slate-800 dark:text-slate-100">{item.title}</h3>
                            {item.subtitle && <p className="text-sm text-slate-500 line-clamp-2">{item.subtitle}</p>}
                        </div>
                    ))}
                </div>
            );
        }

        // 2. Data Tables based on View
        switch (view) {
            case 'articles':
                return <DataTable
                    title="إدارة المقالات"
                    tableName="articles"
                    columns={[
                        { key: 'title', label: 'العنوان' },
                        { key: 'category', label: 'القسم' },
                        { key: 'last_update', label: 'آخر تحديث' }
                    ]}
                    onEdit={(row) => setSelectedItem({ id: row.id, type: 'article', title: row.title, data: row })}
                    onCreate={() => setSelectedItem({ id: 'new', type: 'article', title: 'إضافة مقال جديد', data: { category: '', steps: [], documents: [] } as any })}
                />;

            case 'services':
                return <DataTable
                    title="الخدمات والخبراء"
                    tableName="service_providers"
                    columns={[
                        { key: 'name', label: 'الاسم' },
                        { key: 'profession', label: 'التخصص' },
                        { key: 'phone', label: 'الهاتف' },
                        { key: 'rating', label: 'التقييم' }
                    ]}
                    onEdit={(row) => setSelectedItem({ id: row.id, type: 'service', title: row.name, data: row })}
                    onCreate={() => setSelectedItem({ id: 'new', type: 'service', title: 'إضافة خدمة جديدة', data: { profession: 'طبيب', rating: 5, active: true } as any })}
                />;

            case 'faqs':
                return <DataTable
                    title="الأسئلة الشائعة"
                    tableName="faqs"
                    columns={[
                        { key: 'question', label: 'السؤال' },
                        { key: 'category', label: 'التصنيف' },
                        { key: 'active', label: 'الحالة', render: (v) => v ? '✅' : '❌' }
                    ]}
                    onEdit={(row) => setSelectedItem({ id: row.id, type: 'faq', title: 'تعديل سؤال', data: row })}
                    onCreate={() => setSelectedItem({ id: 'new', type: 'faq', title: 'إضافة سؤال جديد', data: {} as any })}
                />;

            case 'codes':
                return <DataTable
                    title="الأكواد الأمنية"
                    tableName="security_codes"
                    idField="code"
                    searchFields={['code', 'title', 'description']}
                    columns={[
                        { key: 'code', label: 'الكود' },
                        { key: 'title', label: 'الوصف المختصر' },
                        { key: 'severity', label: 'الخطورة' }
                    ]}
                    onEdit={(row) => setSelectedItem({ id: row.code, type: 'code', title: row.code, data: row })}
                    onCreate={() => setSelectedItem({ id: 'new', type: 'code', title: 'إضافة كود جديد', data: { severity: 'low', category: 'general' } as any })}
                />;

            case 'zones':
                return <DataTable
                    title="المناطق المحظورة"
                    tableName="zones"
                    columns={[
                        { key: 'city', label: 'المدينة' },
                        { key: 'district', label: 'المنطقة' },
                        { key: 'neighborhood', label: 'الحي' },
                        { key: 'status', label: 'الحالة', render: (v: any) => v === 'closed' ? '🔴 محظور' : '🟢 مفتوح' }
                    ]}
                    searchFields={['city', 'district', 'neighborhood']}
                    onEdit={(row) => setSelectedItem({ id: row.id, type: 'zone', title: `${row.city} - ${row.district}`, data: row })}
                    onCreate={() => setSelectedItem({ id: 'new', type: 'zone', title: 'إضافة منطقة جديدة', data: { status: 'closed' } as any })}
                />;

            case 'sources':
                return <DataTable
                    title="المصادر الرسمية"
                    tableName="official_sources"
                    columns={[
                        { key: 'name', label: 'المصدر' },
                        { key: 'category', label: 'التصنيف' },
                        { key: 'url', label: 'الرابط', render: (v: any) => v ? <a href={v} target="_blank" className="text-blue-500 underline">زيارة</a> : '-' }
                    ]}
                    searchFields={['name', 'category']}
                    onEdit={(row) => setSelectedItem({ id: row.id, type: 'source', title: row.name, data: row })}
                    onCreate={() => setSelectedItem({ id: 'new', type: 'source', title: 'إضافة مصدر جديد', data: { category: 'government' } as any })}
                />;

            case 'banners':
                return <DataTable
                    title="البنرات والتنبيهات"
                    tableName="site_banners"
                    columns={[
                        { key: 'content', label: 'المحتوى' },
                        { key: 'type', label: 'النوع' },
                        { key: 'is_active', label: 'مفعل', render: (v: any) => v ? '✅' : '❌' }
                    ]}
                    searchFields={['content']}
                    onEdit={(row) => setSelectedItem({ id: row.id, type: 'banner', title: row.content, data: row })}
                    onCreate={() => setSelectedItem({ id: 'new', type: 'banner', title: 'إضافة تنبيه جديد', data: { type: 'alert', is_active: true } as any })}
                />;

            case 'suggestions':
                return <DataTable
                    title="صندوق الاقتراحات"
                    tableName="suggestions"
                    columns={[
                        { key: 'name', label: 'الاسم' },
                        { key: 'message', label: 'الرسالة' },
                        { key: 'created_at', label: 'التاريخ', render: (v: any) => new Date(v).toLocaleDateString('ar-EG') }
                    ]}
                    searchFields={['name', 'message']}
                    // Suggestions are read-only mostly, but we use edit to view details
                    onEdit={(row) => setSelectedItem({ id: row.id, type: 'suggestion', title: row.name, data: row })}
                />;

            case 'settings':
                return <div className="max-w-4xl"><ConfigManager /></div>;

            case 'migration':
                return <div className="max-w-4xl"><DataMigration /></div>;

            case 'dashboard':
            default:
                return (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6 p-4">
                        <QuickBtn icon={FileText} label="مقال جديد" color="emerald" onClick={() => setSelectedItem({ id: 'new', type: 'article', title: 'مقال جديد', data: { title: '', category: '', steps: [], documents: [] } })} />
                        <QuickBtn icon={Briefcase} label="خدمة جديدة" color="blue" onClick={() => setSelectedItem({ id: 'new', type: 'service', title: 'خدمة جديدة', data: { name: '', active: true } })} />
                        <QuickBtn icon={HelpCircle} label="سؤال جديد" color="violet" onClick={() => setSelectedItem({ id: 'new', type: 'faq', title: 'سؤال جديد', data: { question: '', answer: '', category: 'general', active: true } })} />
                        <QuickBtn icon={ShieldAlert} label="كود جديد" color="red" onClick={() => setSelectedItem({ id: 'new', type: 'code', title: 'كود جديد', data: { code: '' } })} />

                    </div>
                );
        }
    };

    return (
        <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100" dir="rtl">
            <Toaster richColors position="top-center" dir="rtl" />

            {/* Sidebar */}
            <AdminSidebar currentView={view} setView={setView} collapsed={sidebarCollapsed} />

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Top Navigation Bar */}
                <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 sticky top-0 z-30">
                    <div className="flex items-center gap-4 flex-1">
                        <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500" aria-label="القائمة">
                            <Menu size={20} />
                        </button>

                        {/* Global Search Input */}
                        <div className="relative w-full max-w-xl group">
                            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" size={18} />
                            <input
                                className="w-full bg-slate-100 dark:bg-slate-950 border border-transparent focus:bg-white dark:focus:bg-slate-900 focus:border-emerald-500 rounded-xl py-2 pr-10 pl-4 text-sm transition-all outline-none"
                                placeholder="بحث شامل (Global Search)..."
                                value={query}
                                onChange={(e) => handleSearch(e.target.value)}
                            />
                            {loading && <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 animate-spin text-emerald-500" size={16} />}
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <button
                            onClick={async () => { await supabase?.auth.signOut(); window.location.reload(); }}
                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="تسجيل خروج"
                            aria-label="تسجيل خروج"
                        >
                            <LogOut size={20} />
                        </button>
                    </div>
                </header>

                {/* Dashboard Operations Area */}
                <main className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                    <div className="max-w-7xl mx-auto w-full">
                        {/* Breadcrumbs or Title could go here */}
                        <div className="mb-6">
                            <h2 className="text-2xl font-bold capitalize flex items-center gap-2 text-slate-800 dark:text-slate-100">
                                {view === 'dashboard' ? 'لوحة التحكم' :
                                    view === 'articles' ? 'إدارة المقالات' :
                                        view === 'services' ? 'الخدمات' :
                                            view === 'faqs' ? 'الأسئلة الشائعة' : view}
                            </h2>
                        </div>

                        {renderMainContent()}
                    </div>
                </main>
            </div>

            {/* Editor Modal (Overlay) */}
            {selectedItem && (
                <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex justify-center overflow-y-auto custom-scrollbar pt-10 pb-10" onClick={() => setSelectedItem(null)}>
                    <div className="w-full max-w-5xl bg-white dark:bg-slate-900 shadow-2xl rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col relative overflow-hidden" onClick={e => e.stopPropagation()}>
                        {/* Modal Header */}
                        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
                            <div>
                                <h3 className="font-bold text-xl">{selectedItem.id === 'new' ? 'إضافة عنصر' : 'تعديل عنصر'}</h3>
                                <p className="text-xs text-slate-400 font-mono mt-1">{selectedItem.id}</p>
                            </div>
                            <button onClick={() => setSelectedItem(null)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full" aria-label="إغلاق"><X size={20} /></button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 max-h-[70vh]">
                            {renderEditor()}
                        </div>

                        {selectedItem.type !== 'settings' && (
                            <SaveBar onSave={handleSave} onDelete={handleDelete} onCancel={() => setSelectedItem(null)} loading={saving} isNew={selectedItem.id === 'new'} />
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

// --- Inline Editors Removed - Imported from ./editors/ ---

