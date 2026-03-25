'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Settings, Menu, Layers, Save, Loader2, RefreshCw, Trash2, Edit, Check, X, Bot, Plus, Zap, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import DataMigration from './DataMigration';

// === Types ===
type DBMenu = {
    id: string;
    location: string;
    label: string;
    href: string;
    is_active: boolean;
    sort_order: number;
    icon?: string;
};

type DBCategory = {
    slug: string;
    title: string;
    is_featured: boolean;
    active: boolean;
    sort_order: number;
    icon: string;
};

export default function ConfigManager() {
    const [activeTab, setActiveTab] = useState<'menus' | 'categories' | 'migration' | 'settings' | 'ai'>('menus');
    const [loading, setLoading] = useState(false);

    // Menus State
    const [menus, setMenus] = useState<DBMenu[]>([]);
    const [editingMenu, setEditingMenu] = useState<string | null>(null);
    const [menuForm, setMenuForm] = useState<Partial<DBMenu>>({});

    // Categories State
    const [categories, setCategories] = useState<DBCategory[]>([]);
    const [editingCategory, setEditingCategory] = useState<string | null>(null);
    const [catForm, setCatForm] = useState<Partial<DBCategory>>({});

    useEffect(() => {
        if (activeTab === 'menus') fetchMenus();
        if (activeTab === 'categories') fetchCategories();
    }, [activeTab]);

    // --- MENUS ---
    const fetchMenus = async () => {
        setLoading(true);
        if (!supabase) return;
        const { data } = await supabase.from('site_menus').select('*').order('location').order('sort_order');
        if (data) setMenus(data);
        setLoading(false);
    };

    const handleSaveMenu = async (id: string) => {
        if (!supabase) return;
        const { error } = await supabase.from('site_menus').update(menuForm).eq('id', id);
        if (!error) {
            setEditingMenu(null);
            fetchMenus();
        }
    };

    const handleDeleteMenu = async (id: string) => {
        if (!confirm('حذف هذا الرابط؟')) return;
        if (!supabase) return;
        await supabase.from('site_menus').delete().eq('id', id);
        fetchMenus();
    };

    // --- CATEGORIES ---
    const fetchCategories = async () => {
        setLoading(true);
        if (!supabase) return;
        const { data } = await supabase.from('service_categories').select('*').order('sort_order');
        if (data) setCategories(data);
        setLoading(false);
    };

    const handleSaveCategory = async (slug: string) => {
        if (!supabase) return;
        const { error } = await supabase.from('service_categories').update(catForm).eq('slug', slug);
        if (!error) {
            setEditingCategory(null);
            fetchCategories();
        }
    };

    const toggleCatStatus = async (slug: string, current: boolean) => {
        if (!supabase) return;
        await supabase.from('service_categories').update({ active: !current }).eq('slug', slug);
        fetchCategories();
    }

    return (
        <div className="space-y-6">
            {/* Sub-Tabs */}
            <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
                <button
                    onClick={() => setActiveTab('menus')}
                    className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 ${activeTab === 'menus' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                >
                    <Menu size={16} /> القوائم (Menus)
                </button>
                <button
                    onClick={() => setActiveTab('categories')}
                    className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 ${activeTab === 'categories' ? 'bg-purple-600 text-white' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                >
                    <Layers size={16} /> التصنيفات
                </button>
                <button
                    onClick={() => setActiveTab('settings')}
                    className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 ${activeTab === 'settings' ? 'bg-emerald-600 text-white' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                >
                    <Settings size={16} /> إعدادات الموقع
                </button>
                <button
                    onClick={() => setActiveTab('migration')}
                    className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 ${activeTab === 'migration' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                >
                    <RefreshCw size={16} /> أدوات متقدمة
                </button>
                <button
                    onClick={() => setActiveTab('ai')}
                    className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 ${activeTab === 'ai' ? 'bg-amber-600 text-white' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                >
                    <Bot size={16} /> المساعد الذكي (AI)
                </button>
            </div>

            {/* === MENUS TAB === */}
            {activeTab === 'menus' && (
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                    <div className="p-4 bg-slate-50 dark:bg-slate-800 font-bold border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                        <span>إدارة القوائم</span>
                        <button onClick={fetchMenus} className="text-slate-400 hover:text-blue-500" aria-label="تحديث"><RefreshCw size={16} /></button>
                    </div>
                    {loading ? (
                        <div className="p-8 text-center text-slate-400 flex justify-center"><Loader2 className="animate-spin" /></div>
                    ) : (
                        <div className="divide-y divide-slate-100 dark:divide-slate-800">
                            {menus.map(menu => (
                                <div key={menu.id} className="p-3 flex flex-wrap items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 gap-2">
                                    {editingMenu === menu.id ? (
                                        <div className="flex flex-1 gap-2 items-center">
                                            <input
                                                className="border rounded px-2 py-1 w-24 text-sm bg-white dark:bg-slate-900 dark:border-slate-700"
                                                value={menuForm.label}
                                                onChange={e => setMenuForm({ ...menuForm, label: e.target.value })}
                                            />
                                            <input
                                                className="border rounded px-2 py-1 flex-1 text-sm ltr bg-white dark:bg-slate-900 dark:border-slate-700"
                                                value={menuForm.href}
                                                onChange={e => setMenuForm({ ...menuForm, href: e.target.value })}
                                            />
                                            <input
                                                className="border rounded px-2 py-1 w-16 text-sm bg-white dark:bg-slate-900 dark:border-slate-700"
                                                type="number"
                                                value={menuForm.sort_order}
                                                onChange={e => setMenuForm({ ...menuForm, sort_order: parseInt(e.target.value) })}
                                            />
                                            <button onClick={() => handleSaveMenu(menu.id)} className="p-1 bg-green-100 text-green-600 rounded" aria-label="حفظ"><Check size={16} /></button>
                                            <button onClick={() => setEditingMenu(null)} className="p-1 bg-red-100 text-red-600 rounded" aria-label="إلغاء"><X size={16} /></button>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="flex items-center gap-3 flex-1">
                                                <span className={`text-[10px] px-2 py-0.5 rounded uppercase font-bold w-16 text-center ${menu.location === 'header' ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-700'}`}>
                                                    {menu.location}
                                                </span>
                                                <span className="font-bold text-slate-700 dark:text-slate-300">{menu.label}</span>
                                                <span className="text-xs text-slate-400 font-mono hidden sm:inline">{menu.href}</span>
                                                <span className="text-xs bg-slate-100 px-1 rounded dark:text-slate-500">#{menu.sort_order}</span>
                                            </div>
                                            <div className="flex gap-1">
                                                <button
                                                    onClick={() => { setEditingMenu(menu.id); setMenuForm(menu); }}
                                                    className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg"
                                                    aria-label="تعديل"
                                                >
                                                    <Edit size={16} />
                                                </button>
                                                <button onClick={() => handleDeleteMenu(menu.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg" aria-label="حذف"><Trash2 size={16} /></button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* === CATEGORIES TAB === */}
            {activeTab === 'categories' && (
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                    <div className="p-4 bg-slate-50 dark:bg-slate-800 font-bold border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                        <span>إدارة التصنيفات</span>
                        <button onClick={fetchCategories} className="text-slate-400 hover:text-blue-500" aria-label="تحديث"><RefreshCw size={16} /></button>
                    </div>
                    {loading ? (
                        <div className="p-8 text-center text-slate-400 flex justify-center"><Loader2 className="animate-spin" /></div>
                    ) : (
                        <div className="divide-y divide-slate-100 dark:divide-slate-800">
                            {categories.map(cat => (
                                <div key={cat.slug} className="p-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    {editingCategory === cat.slug ? (
                                        <div className="flex flex-1 gap-2 items-center">
                                            <input
                                                className="border rounded px-2 py-1 flex-1 text-sm bg-white dark:bg-slate-900 dark:border-slate-700"
                                                value={catForm.title}
                                                onChange={e => setCatForm({ ...catForm, title: e.target.value })}
                                            />
                                            <input
                                                className="border rounded px-2 py-1 w-16 text-sm bg-white dark:bg-slate-900 dark:border-slate-700"
                                                type="number"
                                                value={catForm.sort_order}
                                                onChange={e => setCatForm({ ...catForm, sort_order: parseInt(e.target.value) })}
                                            />
                                            <button onClick={() => handleSaveCategory(cat.slug)} className="p-1 bg-green-100 text-green-600 rounded" aria-label="حفظ"><Check size={16} /></button>
                                            <button onClick={() => setEditingCategory(null)} className="p-1 bg-slate-100 text-slate-600 rounded" aria-label="إلغاء">إلغاء</button>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="flex items-center gap-3 flex-1">
                                                <span className="text-xs text-slate-400 font-mono w-24">{cat.slug}</span>
                                                <span className="font-bold text-slate-700 dark:text-slate-300 flex-1">{cat.title}</span>
                                                <span className="text-xs bg-slate-100 px-1 rounded dark:text-slate-500">#{cat.sort_order}</span>
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => toggleCatStatus(cat.slug, cat.active)}
                                                    className={`text-[10px] px-2 py-1 rounded font-bold ${cat.active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}
                                                    aria-label={cat.active ? 'تعطيل' : 'تفعيل'}
                                                >
                                                    {cat.active ? 'فعال' : 'معطل'}
                                                </button>
                                                <button
                                                    onClick={() => { setEditingCategory(cat.slug); setCatForm(cat); }}
                                                    className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg"
                                                    aria-label="تعديل"
                                                >
                                                    <Edit size={16} />
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* === SETTINGS TAB === */}
            {activeTab === 'settings' && (
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
                    <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                        <Settings className="text-emerald-500" /> إعدادات الموقع العامة
                    </h3>
                    <GeneralSettingsForm />
                </div>
            )}

            {/* === MIGRATION TAB === */}
            {activeTab === 'migration' && (
                <div className="space-y-4">
                    <DataMigration />
                </div>
            )}

            {/* === AI PROVIDERS TAB === */}
            {activeTab === 'ai' && (
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
                    <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                        <Bot className="text-amber-500" /> إعدادات المساعد الذكي — مفاتيح API
                    </h3>
                    <AIProviderManager />
                </div>
            )}
        </div>
    );
}

// === AI Provider Key type ===
type AIProvider = {
    id?: string;
    provider: string;
    api_key: string;
    model_default: string;
    model_deep: string;
    label: string;
    is_active: boolean;
    created_at?: string;
};

const PROVIDER_OPTIONS = [
    { value: 'gemini', label: 'Google Gemini', defaultModel: 'gemini-2.5-flash', deepModel: 'gemini-2.5-pro', color: 'bg-blue-100 text-blue-700' },
    { value: 'openai', label: 'OpenAI', defaultModel: 'gpt-4o-mini', deepModel: 'gpt-4o', color: 'bg-green-100 text-green-700' },
    { value: 'anthropic', label: 'Anthropic (Claude)', defaultModel: 'claude-sonnet-4-6-20250514', deepModel: 'claude-opus-4-6-20250514', color: 'bg-orange-100 text-orange-700' },
    { value: 'openrouter', label: 'OpenRouter', defaultModel: 'google/gemini-2.5-flash', deepModel: 'google/gemini-2.5-pro', color: 'bg-purple-100 text-purple-700' },
];

function AIProviderManager() {
    const [providers, setProviders] = useState<AIProvider[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [testing, setTesting] = useState<string | null>(null);
    const [testResult, setTestResult] = useState<{ id: string; ok: boolean; msg: string } | null>(null);
    const [showKey, setShowKey] = useState<Record<string, boolean>>({});
    const [form, setForm] = useState<AIProvider>({
        provider: 'gemini',
        api_key: '',
        model_default: 'gemini-2.5-flash',
        model_deep: 'gemini-2.5-pro',
        label: '',
        is_active: false,
    });

    useEffect(() => { fetchProviders(); }, []);

    async function fetchProviders() {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/ai-settings');
            const data = await res.json();
            if (data.providers) setProviders(data.providers);
        } catch (err) {
            toast.error('فشل تحميل مفاتيح AI');
        }
        setLoading(false);
    }

    function openNewForm() {
        setEditingId(null);
        setForm({ provider: 'gemini', api_key: '', model_default: 'gemini-2.5-flash', model_deep: 'gemini-2.5-pro', label: '', is_active: false });
        setShowForm(true);
    }

    function openEditForm(p: AIProvider) {
        setEditingId(p.id || null);
        setForm({ ...p });
        setShowForm(true);
    }

    function onProviderChange(provider: string) {
        const opt = PROVIDER_OPTIONS.find(o => o.value === provider);
        setForm(f => ({
            ...f,
            provider,
            model_default: opt?.defaultModel || '',
            model_deep: opt?.deepModel || '',
        }));
    }

    async function handleSave() {
        if (!form.label.trim()) { toast.error('اسم المفتاح مطلوب'); return; }
        if (!editingId && (!form.api_key || form.api_key.startsWith('•'))) { toast.error('مفتاح API مطلوب'); return; }
        setLoading(true);
        try {
            const res = await fetch('/api/admin/ai-settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...form, id: editingId }),
            });
            const data = await res.json();
            if (data.error) { toast.error(data.error); }
            else { toast.success('تم الحفظ بنجاح'); setShowForm(false); fetchProviders(); }
        } catch { toast.error('فشل الحفظ'); }
        setLoading(false);
    }

    async function handleDelete(id: string) {
        if (!confirm('هل تريد حذف هذا المفتاح؟')) return;
        try {
            await fetch(`/api/admin/ai-settings?id=${id}`, { method: 'DELETE' });
            toast.success('تم الحذف');
            fetchProviders();
        } catch { toast.error('فشل الحذف'); }
    }

    async function handleTest(p: AIProvider) {
        setTesting(p.id || null);
        setTestResult(null);
        try {
            const res = await fetch('/api/admin/ai-settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ provider: p.provider, api_key: p.api_key, model_default: p.model_default }),
            });
            const data = await res.json();
            setTestResult({ id: p.id!, ok: data.success, msg: data.message || data.error || 'لا استجابة' });
        } catch (err: any) {
            setTestResult({ id: p.id!, ok: false, msg: err.message });
        }
        setTesting(null);
    }

    async function handleActivate(p: AIProvider) {
        setLoading(true);
        try {
            await fetch('/api/admin/ai-settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...p, is_active: true }),
            });
            toast.success(`تم تفعيل "${p.label}" كمزود أساسي`);
            fetchProviders();
        } catch { toast.error('فشل التفعيل'); }
        setLoading(false);
    }

    const activeProvider = providers.find(p => p.is_active);
    const getProviderMeta = (val: string) => PROVIDER_OPTIONS.find(o => o.value === val);

    if (loading && providers.length === 0) {
        return <div className="p-8 text-center"><Loader2 className="animate-spin inline" /> جاري التحميل...</div>;
    }

    return (
        <div className="space-y-6">
            {/* Current active provider notice */}
            {activeProvider ? (
                <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4 flex items-center gap-3">
                    <Zap className="text-emerald-600" size={20} />
                    <div>
                        <span className="font-bold text-emerald-700 dark:text-emerald-400">المزود النشط: </span>
                        <span className="font-bold">{activeProvider.label}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded font-bold mr-2 ${getProviderMeta(activeProvider.provider)?.color}`}>
                            {getProviderMeta(activeProvider.provider)?.label}
                        </span>
                        <span className="text-xs text-slate-500 mr-2">الموديل: {activeProvider.model_default}</span>
                    </div>
                </div>
            ) : (
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 flex items-center gap-3">
                    <AlertTriangle className="text-amber-600" size={20} />
                    <div>
                        <span className="font-bold text-amber-700 dark:text-amber-400">لا يوجد مزود نشط! </span>
                        <span className="text-sm text-slate-600 dark:text-slate-400">المساعد الذكي لن يعمل حتى تفعّل مفتاح API.</span>
                    </div>
                </div>
            )}

            {/* Provider list */}
            <div className="space-y-3">
                {providers.map(p => (
                    <div key={p.id} className={`border rounded-xl p-4 transition-all ${p.is_active ? 'border-emerald-400 bg-emerald-50/50 dark:bg-emerald-900/10 dark:border-emerald-700' : 'border-slate-200 dark:border-slate-700'}`}>
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                <span className={`text-[10px] px-2 py-0.5 rounded font-bold shrink-0 ${getProviderMeta(p.provider)?.color}`}>
                                    {getProviderMeta(p.provider)?.label || p.provider}
                                </span>
                                <span className="font-bold text-slate-700 dark:text-slate-300 truncate">{p.label}</span>
                                {p.is_active && <span className="text-[10px] bg-emerald-500 text-white px-2 py-0.5 rounded-full font-bold shrink-0">نشط</span>}
                            </div>
                            <div className="flex gap-1.5 shrink-0">
                                {!p.is_active && (
                                    <button
                                        onClick={() => handleActivate(p)}
                                        className="px-3 py-1.5 text-xs font-bold bg-emerald-100 text-emerald-700 hover:bg-emerald-200 rounded-lg"
                                    >
                                        تفعيل
                                    </button>
                                )}
                                <button
                                    onClick={() => handleTest(p)}
                                    disabled={testing === p.id}
                                    className="px-3 py-1.5 text-xs font-bold bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-lg disabled:opacity-50"
                                >
                                    {testing === p.id ? <Loader2 size={14} className="animate-spin" /> : 'اختبار'}
                                </button>
                                <button
                                    onClick={() => openEditForm(p)}
                                    className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg"
                                    aria-label="تعديل"
                                >
                                    <Edit size={16} />
                                </button>
                                <button
                                    onClick={() => handleDelete(p.id!)}
                                    className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"
                                    aria-label="حذف"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-500">
                            <span>الموديل: <strong className="text-slate-700 dark:text-slate-300">{p.model_default}</strong></span>
                            <span>التفكير العميق: <strong className="text-slate-700 dark:text-slate-300">{p.model_deep}</strong></span>
                            <span className="flex items-center gap-1">
                                المفتاح: <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded text-[11px]">{showKey[p.id!] ? p.api_key : '•••••••••'}</code>
                                <button onClick={() => setShowKey(s => ({ ...s, [p.id!]: !s[p.id!] }))} className="text-slate-400 hover:text-slate-600">
                                    {showKey[p.id!] ? <EyeOff size={12} /> : <Eye size={12} />}
                                </button>
                            </span>
                        </div>
                        {/* Test result */}
                        {testResult && testResult.id === p.id && (
                            <div className={`mt-2 p-2 rounded-lg text-xs ${testResult.ok ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                                {testResult.ok ? '✅' : '❌'} {testResult.msg}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Add new button */}
            <button
                onClick={openNewForm}
                className="w-full border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-4 text-slate-500 hover:border-amber-400 hover:text-amber-600 transition-colors flex items-center justify-center gap-2 font-bold"
            >
                <Plus size={18} /> إضافة مفتاح API جديد
            </button>

            {/* Add/Edit form */}
            {showForm && (
                <div className="border border-amber-300 dark:border-amber-700 bg-amber-50/50 dark:bg-amber-900/10 rounded-xl p-5 space-y-4">
                    <h4 className="font-bold text-amber-700 dark:text-amber-400 flex items-center gap-2">
                        {editingId ? <Edit size={16} /> : <Plus size={16} />}
                        {editingId ? 'تعديل مفتاح API' : 'إضافة مفتاح API جديد'}
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs block mb-1 font-bold">المزود</label>
                            <select
                                className="w-full border p-2 rounded bg-white dark:bg-slate-900 dark:border-slate-700"
                                value={form.provider}
                                onChange={e => onProviderChange(e.target.value)}
                            >
                                {PROVIDER_OPTIONS.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs block mb-1 font-bold">اسم المفتاح (تسمية)</label>
                            <input
                                className="w-full border p-2 rounded bg-white dark:bg-slate-900 dark:border-slate-700"
                                placeholder="مثال: مفتاح جيميناي الأساسي"
                                value={form.label}
                                onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="text-xs block mb-1 font-bold">مفتاح API</label>
                            <input
                                className="w-full border p-2 rounded font-mono text-sm dir-ltr bg-white dark:bg-slate-900 dark:border-slate-700"
                                placeholder={editingId ? 'اتركه فارغاً لإبقاء المفتاح الحالي' : 'الصق مفتاح API هنا...'}
                                value={form.api_key.startsWith('•') ? '' : form.api_key}
                                onChange={e => setForm(f => ({ ...f, api_key: e.target.value }))}
                                type="password"
                            />
                            {editingId && <p className="text-[10px] text-slate-400 mt-1">اتركه فارغاً إذا لا تريد تغيير المفتاح</p>}
                        </div>
                        <div>
                            <label className="text-xs block mb-1 font-bold">الموديل الافتراضي (سريع)</label>
                            <input
                                className="w-full border p-2 rounded font-mono text-sm dir-ltr bg-white dark:bg-slate-900 dark:border-slate-700"
                                value={form.model_default}
                                onChange={e => setForm(f => ({ ...f, model_default: e.target.value }))}
                            />
                        </div>
                        <div>
                            <label className="text-xs block mb-1 font-bold">موديل التفكير العميق</label>
                            <input
                                className="w-full border p-2 rounded font-mono text-sm dir-ltr bg-white dark:bg-slate-900 dark:border-slate-700"
                                value={form.model_deep}
                                onChange={e => setForm(f => ({ ...f, model_deep: e.target.value }))}
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="is_active_check"
                            checked={form.is_active}
                            onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))}
                            className="rounded"
                        />
                        <label htmlFor="is_active_check" className="text-sm font-bold">تفعيل كمزود أساسي (يلغي تفعيل المزودات الأخرى)</label>
                    </div>

                    <div className="flex gap-3">
                        <button onClick={handleSave} disabled={loading} className="bg-amber-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-amber-700 flex items-center gap-2 disabled:opacity-50">
                            <Save size={16} /> {loading ? 'جاري الحفظ...' : 'حفظ'}
                        </button>
                        <button onClick={() => setShowForm(false)} className="px-6 py-2 rounded-lg font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">
                            إلغاء
                        </button>
                    </div>
                </div>
            )}

            {/* Info box */}
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 text-xs text-slate-500 space-y-2">
                <p className="font-bold text-slate-600 dark:text-slate-400">ملاحظات:</p>
                <ul className="list-disc list-inside space-y-1">
                    <li>المزود النشط هو الذي يستخدمه المساعد الذكي. يمكنك تبديله في أي وقت.</li>
                    <li>استخدم زر "اختبار" للتحقق من صلاحية المفتاح قبل التفعيل.</li>
                    <li>يدعم النظام: Google Gemini، OpenAI، Anthropic (Claude)، OpenRouter.</li>
                    <li>عبر OpenRouter يمكنك استخدام أي موديل متاح (Gemini، GPT، Claude، Llama، إلخ).</li>
                    <li>المفاتيح مخزنة بشكل آمن في قاعدة البيانات ولا تظهر كاملة أبداً.</li>
                </ul>
            </div>
        </div>
    );
}

function GeneralSettingsForm() {
    const [settings, setSettings] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchSettings();
    }, []);

    async function fetchSettings() {
        if (!supabase) return;
        const { data } = await supabase.from('site_settings').select('*').limit(1).single();
        if (data) setSettings(data);
        setLoading(false);
    }

    async function saveSettings() {
        if (!supabase) return;
        setLoading(true);
        // Ensure ID 1 exists
        const { error } = await supabase.from('site_settings').upsert({ id: 1, ...settings });
        if (!error) toast.success('تم الحفظ بنجاح');
        else toast.error('فشل الحفظ: ' + error.message);
        setLoading(false);
    }

    if (loading) return <div className="p-8 text-center"><Loader2 className="animate-spin inline" /> جاري التحميل...</div>;

    return (
        <div className="space-y-6 max-w-2xl">
            {/* Hero Section */}
            <div className="space-y-4 border-b pb-6 dark:border-slate-700">
                <h4 className="font-bold text-slate-500 text-sm">واجهة الموقع (Hero Section)</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs block mb-1">العنوان الرئيسي</label>
                        <input className="w-full border p-2 rounded bg-white dark:bg-slate-900 dark:border-slate-700" value={settings.hero_title || ''} onChange={e => setSettings({ ...settings, hero_title: e.target.value })} />
                    </div>
                    <div>
                        <label className="text-xs block mb-1">العنوان الفرعي</label>
                        <input className="w-full border p-2 rounded bg-white dark:bg-slate-900 dark:border-slate-700" value={settings.hero_subtitle || ''} onChange={e => setSettings({ ...settings, hero_subtitle: e.target.value })} />
                    </div>
                    <div>
                        <label className="text-xs block mb-1">نص الزر الأساسي</label>
                        <input className="w-full border p-2 rounded bg-white dark:bg-slate-900 dark:border-slate-700" value={settings.hero_cta_primary || ''} onChange={e => setSettings({ ...settings, hero_cta_primary: e.target.value })} />
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="space-y-4 border-b pb-6 dark:border-slate-700">
                <h4 className="font-bold text-slate-500 text-sm">أرقام وإحصائيات</h4>
                <div className="grid grid-cols-3 gap-4">
                    <div>
                        <label className="text-xs block mb-1">عدد المقالات</label>
                        <input className="w-full border p-2 rounded bg-white dark:bg-slate-900 dark:border-slate-700" value={settings.stats_articles || ''} onChange={e => setSettings({ ...settings, stats_articles: e.target.value })} />
                    </div>
                    <div>
                        <label className="text-xs block mb-1">عدد المستخدمين</label>
                        <input className="w-full border p-2 rounded bg-white dark:bg-slate-900 dark:border-slate-700" value={settings.stats_users || ''} onChange={e => setSettings({ ...settings, stats_users: e.target.value })} />
                    </div>
                    <div>
                        <label className="text-xs block mb-1">وقت العمل</label>
                        <input className="w-full border p-2 rounded bg-white dark:bg-slate-900 dark:border-slate-700" value={settings.stats_uptime || ''} onChange={e => setSettings({ ...settings, stats_uptime: e.target.value })} />
                    </div>
                </div>
            </div>

            {/* Contact & Social */}
            <div className="space-y-4 border-b pb-6 dark:border-slate-700">
                <h4 className="font-bold text-slate-500 text-sm">التواصل والخبراء</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs block mb-1">رقم التواصل (واتساب)</label>
                        <input className="w-full border p-2 rounded dir-ltr bg-white dark:bg-slate-900 dark:border-slate-700" placeholder="+90..." value={settings.whatsapp_number || ''} onChange={e => setSettings({ ...settings, whatsapp_number: e.target.value })} />
                    </div>
                    <div>
                        <label className="text-xs block mb-1">البريد الإلكتروني</label>
                        <input className="w-full border p-2 rounded bg-white dark:bg-slate-900 dark:border-slate-700" value={settings.email_address || ''} onChange={e => setSettings({ ...settings, email_address: e.target.value })} />
                    </div>
                </div>
            </div>

            <button onClick={saveSettings} className="bg-emerald-600 text-white px-8 py-2 rounded-lg font-bold hover:bg-emerald-700 flex items-center gap-2">
                <Save size={18} /> حفظ التغييرات
            </button>
        </div>
    );
}
