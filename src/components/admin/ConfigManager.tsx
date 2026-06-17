'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Settings, Menu, Layers, Save, Loader2, RefreshCw, Trash2, Edit, Check, X, Bot, Plus, Zap, Eye, EyeOff, AlertTriangle, BarChart3, MessageSquare, TrendingUp } from 'lucide-react';
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

    // Centralised tab metadata — keeps the pill row consistent with the
    // rest of the admin (HomeManager uses the same pattern). Each tab
    // carries an icon + theme; the active tab gets a coloured pill +
    // small accent bar, inactive tabs sit in slate.
    type CMTabId = 'menus' | 'categories' | 'migration' | 'settings' | 'ai';
    const TABS: Array<{ id: CMTabId; label: string; icon: typeof Menu; theme: { bg: string; text: string; accent: string } }> = [
        { id: 'menus',      label: 'القوائم',         icon: Menu,      theme: { bg: 'bg-blue-100 dark:bg-blue-900/30',     text: 'text-blue-700 dark:text-blue-300',     accent: 'bg-blue-500' } },
        { id: 'categories', label: 'التصنيفات',       icon: Layers,    theme: { bg: 'bg-violet-100 dark:bg-violet-900/30', text: 'text-violet-700 dark:text-violet-300', accent: 'bg-violet-500' } },
        { id: 'settings',   label: 'إعدادات الموقع',  icon: Settings,  theme: { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-300', accent: 'bg-emerald-500' } },
        { id: 'migration',  label: 'أدوات متقدمة',    icon: RefreshCw, theme: { bg: 'bg-slate-200 dark:bg-slate-700',      text: 'text-slate-800 dark:text-slate-100',   accent: 'bg-slate-500' } },
        { id: 'ai',         label: 'المساعد الذكي (AI)', icon: Bot,     theme: { bg: 'bg-amber-100 dark:bg-amber-900/30',   text: 'text-amber-700 dark:text-amber-300',   accent: 'bg-amber-500' } },
    ];

    return (
        <div className="space-y-6">
            {/* Sub-Tabs — pill row */}
            <div className="relative overflow-hidden bg-gradient-to-br from-white to-slate-50/60 dark:from-slate-900 dark:to-slate-800/40 p-2 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-x-auto">
                <div className="flex gap-1.5 min-w-max">
                    {TABS.map(tab => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => setActiveTab(tab.id)}
                                className={`group/tab relative flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-sm transition-all ${
                                    isActive
                                        ? `${tab.theme.bg} ${tab.theme.text} shadow-sm`
                                        : 'text-slate-500 hover:bg-white dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200'
                                }`}
                            >
                                <Icon size={16} className={isActive ? 'group-hover/tab:rotate-3 transition-transform' : ''} />
                                {tab.label}
                                {isActive && (
                                    <span className={`absolute -bottom-0.5 right-3 left-3 h-0.5 ${tab.theme.accent} rounded-full opacity-80`} />
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* === MENUS TAB === */}
            {activeTab === 'menus' && (
                <div className="relative overflow-hidden bg-gradient-to-br from-white to-blue-50/30 dark:from-slate-900 dark:to-blue-950/15 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <span className="absolute top-0 right-0 h-full w-1 bg-blue-500 opacity-70 z-10" />
                    <div className="relative p-4 bg-white/70 dark:bg-slate-900/70 backdrop-blur font-black border-b border-slate-200 dark:border-slate-700 flex justify-between items-center text-slate-800 dark:text-slate-100">
                        <span className="flex items-center gap-2">
                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                                <Menu size={14} />
                            </span>
                            إدارة القوائم
                        </span>
                        <button onClick={fetchMenus} className="p-2 rounded-xl bg-blue-50 dark:bg-blue-900/15 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:rotate-180 transition-all duration-500" aria-label="تحديث"><RefreshCw size={14} /></button>
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
                <div className="relative overflow-hidden bg-gradient-to-br from-white to-violet-50/30 dark:from-slate-900 dark:to-violet-950/15 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <span className="absolute top-0 right-0 h-full w-1 bg-violet-500 opacity-70 z-10" />
                    <div className="relative p-4 bg-white/70 dark:bg-slate-900/70 backdrop-blur font-black border-b border-slate-200 dark:border-slate-700 flex justify-between items-center text-slate-800 dark:text-slate-100">
                        <span className="flex items-center gap-2">
                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400">
                                <Layers size={14} />
                            </span>
                            إدارة التصنيفات
                        </span>
                        <button onClick={fetchCategories} className="p-2 rounded-xl bg-violet-50 dark:bg-violet-900/15 text-violet-600 dark:text-violet-400 hover:bg-violet-100 dark:hover:bg-violet-900/30 hover:rotate-180 transition-all duration-500" aria-label="تحديث"><RefreshCw size={14} /></button>
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
                <div className="relative overflow-hidden bg-gradient-to-br from-white to-emerald-50/30 dark:from-slate-900 dark:to-emerald-950/15 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                    <span className="absolute top-0 right-0 h-full w-1 bg-emerald-500 opacity-70" />
                    <h3 className="font-black text-lg mb-5 flex items-center gap-2 text-slate-800 dark:text-slate-100 relative">
                        <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 shadow-sm">
                            <Settings size={16} />
                        </span>
                        إعدادات الموقع العامة
                    </h3>
                    <div className="relative">
                        <GeneralSettingsForm />
                    </div>
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
                <div className="space-y-6">
                    <div className="relative overflow-hidden bg-gradient-to-br from-white to-amber-50/30 dark:from-slate-900 dark:to-amber-950/15 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                        <span className="absolute top-0 right-0 h-full w-1 bg-amber-500 opacity-70" />
                        <h3 className="font-black text-lg mb-5 flex items-center gap-2 text-slate-800 dark:text-slate-100 relative">
                            <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 shadow-sm">
                                <Bot size={16} />
                            </span>
                            إعدادات المساعد الذكي — مفاتيح API
                        </h3>
                        <div className="relative">
                            <AIProviderManager />
                        </div>
                    </div>
                    <AIUsageStats />
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
    priority: number;
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
        is_active: true,
        priority: 0,
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
        setForm({ provider: 'gemini', api_key: '', model_default: 'gemini-2.5-flash', model_deep: 'gemini-2.5-pro', label: '', is_active: true, priority: providers.length });
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
                body: JSON.stringify({ id: p.id, provider: p.provider, api_key: p.api_key, model_default: p.model_default }),
            });
            const data = await res.json();
            setTestResult({ id: p.id!, ok: data.success, msg: data.message || data.error || 'لا استجابة' });
        } catch (err: any) {
            setTestResult({ id: p.id!, ok: false, msg: err.message });
        }
        setTesting(null);
    }

    async function handleMovePriority(id: string, direction: 'up' | 'down') {
        const idx = providers.findIndex(p => p.id === id);
        if (idx < 0) return;
        const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
        if (swapIdx < 0 || swapIdx >= providers.length) return;

        // Swap priorities via API
        try {
            await Promise.all([
                fetch('/api/admin/ai-settings', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ...providers[idx], id: providers[idx].id, priority: swapIdx }),
                }),
                fetch('/api/admin/ai-settings', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ...providers[swapIdx], id: providers[swapIdx].id, priority: idx }),
                }),
            ]);
            fetchProviders();
        } catch { toast.error('فشل تغيير الترتيب'); }
    }

    const getProviderMeta = (val: string) => PROVIDER_OPTIONS.find(o => o.value === val);

    if (loading && providers.length === 0) {
        return <div className="p-8 text-center"><Loader2 className="animate-spin inline" /> جاري التحميل...</div>;
    }

    const inputCls = 'w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all';
    const labelCls = 'text-xs font-black mb-1.5 block text-slate-700 dark:text-slate-200 uppercase tracking-wider';

    return (
        <div className="space-y-5">
            {/* Status notice — accent stripe + gradient */}
            {providers.length > 0 ? (
                <div className="relative overflow-hidden bg-gradient-to-br from-emerald-50 to-teal-50/50 dark:from-emerald-900/15 dark:to-teal-900/10 border border-emerald-200 dark:border-emerald-900/40 rounded-xl p-4 flex items-center gap-3">
                    <span className="absolute top-0 right-0 h-full w-1 bg-emerald-500 opacity-80" />
                    <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 shrink-0">
                        <Zap size={18} />
                    </span>
                    <div>
                        <span className="font-black text-emerald-700 dark:text-emerald-300 tabular-nums" dir="ltr">{providers.length}</span>
                        <span className="font-black text-emerald-700 dark:text-emerald-300"> مفتاح مُفعّل </span>
                        <span className="text-sm text-slate-600 dark:text-slate-400">— النظام يجرب الأول، لو فشل ينتقل للتالي تلقائياً.</span>
                    </div>
                </div>
            ) : (
                <div className="relative overflow-hidden bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-900/15 dark:to-amber-900/10 border border-amber-200 dark:border-amber-900/40 rounded-xl p-4 flex items-center gap-3">
                    <span className="absolute top-0 right-0 h-full w-1 bg-amber-500 opacity-80" />
                    <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 shrink-0">
                        <AlertTriangle size={18} />
                    </span>
                    <div>
                        <span className="font-black text-amber-700 dark:text-amber-300">لا يوجد مفاتيح! </span>
                        <span className="text-sm text-slate-600 dark:text-slate-400">المساعد الذكي لن يعمل حتى تضيف مفتاح API.</span>
                    </div>
                </div>
            )}

            {/* Provider list — accent stripes per priority */}
            <div className="space-y-3">
                {providers.map((p, idx) => (
                    <div key={p.id} className="group relative overflow-hidden border border-slate-200 dark:border-slate-700 bg-gradient-to-br from-white to-amber-50/20 dark:from-slate-900 dark:to-amber-950/10 rounded-2xl p-4 hover:shadow-md hover:-translate-y-0.5 transition-all">
                        <span className="absolute top-0 right-0 h-full w-0.5 bg-amber-500 opacity-60 group-hover:opacity-100 transition-opacity" />

                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 font-black text-sm tabular-nums shrink-0" dir="ltr">{idx + 1}</span>
                                <div className="flex gap-0.5 flex-col shrink-0">
                                    <button
                                        onClick={() => handleMovePriority(p.id!, 'up')}
                                        disabled={idx === 0}
                                        className="text-[10px] text-slate-400 hover:text-amber-600 disabled:opacity-20 transition-colors p-0.5"
                                        aria-label="رفع الأولوية"
                                    >▲</button>
                                    <button
                                        onClick={() => handleMovePriority(p.id!, 'down')}
                                        disabled={idx === providers.length - 1}
                                        className="text-[10px] text-slate-400 hover:text-amber-600 disabled:opacity-20 transition-colors p-0.5"
                                        aria-label="خفض الأولوية"
                                    >▼</button>
                                </div>
                                <span className={`text-[10px] px-2 py-0.5 rounded-lg font-black shrink-0 uppercase tracking-wider ${getProviderMeta(p.provider)?.color}`}>
                                    {getProviderMeta(p.provider)?.label || p.provider}
                                </span>
                                <span className="font-black text-slate-800 dark:text-slate-100 truncate">{p.label}</span>
                            </div>
                            <div className="flex gap-1.5 shrink-0">
                                <button
                                    onClick={() => handleTest(p)}
                                    disabled={testing === p.id}
                                    className="px-3 py-1.5 text-xs font-black bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/40 rounded-xl disabled:opacity-50 transition-all hover:scale-105 active:scale-95"
                                >
                                    {testing === p.id ? <Loader2 size={14} className="animate-spin" /> : 'اختبار'}
                                </button>
                                <button
                                    onClick={() => openEditForm(p)}
                                    className="p-1.5 rounded-xl bg-blue-50 dark:bg-blue-900/15 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-all hover:scale-110 active:scale-95"
                                    aria-label="تعديل"
                                >
                                    <Edit size={16} />
                                </button>
                                <button
                                    onClick={() => handleDelete(p.id!)}
                                    className="p-1.5 rounded-xl bg-red-50 dark:bg-red-900/15 text-red-500 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 transition-all hover:scale-110 active:scale-95"
                                    aria-label="حذف"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500 mr-12">
                            <span>الموديل: <strong className="text-slate-700 dark:text-slate-300 font-mono" dir="ltr">{p.model_default}</strong></span>
                            <span>التفكير العميق: <strong className="text-slate-700 dark:text-slate-300 font-mono" dir="ltr">{p.model_deep}</strong></span>
                            <span className="flex items-center gap-1">
                                المفتاح: <code className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-lg text-[11px] font-mono" dir="ltr">{showKey[p.id!] ? p.api_key : '•••••••••'}</code>
                                <button onClick={() => setShowKey(s => ({ ...s, [p.id!]: !s[p.id!] }))} className="text-slate-400 hover:text-amber-600 transition-colors">
                                    {showKey[p.id!] ? <EyeOff size={12} /> : <Eye size={12} />}
                                </button>
                            </span>
                        </div>
                        {/* Test result */}
                        {testResult && testResult.id === p.id && (
                            <div className={`mt-2 mr-12 p-2.5 rounded-xl text-xs font-bold ${testResult.ok ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'}`}>
                                {testResult.ok ? '✅' : '❌'} {testResult.msg}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Add new button */}
            <button
                onClick={openNewForm}
                className="group/add w-full border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-2xl p-4 text-slate-500 hover:border-amber-400 hover:bg-amber-50/40 dark:hover:bg-amber-950/15 hover:text-amber-600 transition-colors flex items-center justify-center gap-2 font-black"
            >
                <Plus size={18} className="group-hover/add:rotate-90 transition-transform" />
                إضافة مفتاح API جديد
            </button>

            {/* Add/Edit form — gradient surface + amber accent */}
            {showForm && (
                <div className="relative overflow-hidden border border-amber-300 dark:border-amber-700 bg-gradient-to-br from-amber-50/80 to-amber-100/40 dark:from-amber-900/15 dark:to-amber-900/5 rounded-2xl p-5 space-y-4">
                    <span className="absolute top-0 right-0 h-full w-1 bg-amber-500 opacity-80" />
                    <h4 className="font-black text-amber-800 dark:text-amber-300 flex items-center gap-2 relative">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-amber-200/60 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300">
                            {editingId ? <Edit size={14} /> : <Plus size={14} />}
                        </span>
                        {editingId ? 'تعديل مفتاح API' : 'إضافة مفتاح API جديد'}
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative">
                        <div>
                            <label className={labelCls}>المزود</label>
                            <select
                                className={inputCls}
                                value={form.provider}
                                onChange={e => onProviderChange(e.target.value)}
                            >
                                {PROVIDER_OPTIONS.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className={labelCls}>اسم المفتاح (تسمية)</label>
                            <input
                                className={inputCls}
                                placeholder="مثال: مفتاح جيميناي الأساسي"
                                value={form.label}
                                onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className={labelCls}>مفتاح API</label>
                            <input
                                className={`${inputCls} font-mono text-sm`}
                                dir="ltr"
                                placeholder={editingId ? 'اتركه فارغاً لإبقاء المفتاح الحالي' : 'الصق مفتاح API هنا...'}
                                value={form.api_key.startsWith('•') ? '' : form.api_key}
                                onChange={e => setForm(f => ({ ...f, api_key: e.target.value }))}
                                type="password"
                            />
                            {editingId && <p className="text-[10px] text-slate-400 mt-1">اتركه فارغاً إذا لا تريد تغيير المفتاح</p>}
                        </div>
                        <div>
                            <label className={labelCls}>الموديل الافتراضي (سريع)</label>
                            <input
                                className={`${inputCls} font-mono text-sm`}
                                dir="ltr"
                                value={form.model_default}
                                onChange={e => setForm(f => ({ ...f, model_default: e.target.value }))}
                            />
                        </div>
                        <div>
                            <label className={labelCls}>موديل التفكير العميق</label>
                            <input
                                className={`${inputCls} font-mono text-sm`}
                                dir="ltr"
                                value={form.model_deep}
                                onChange={e => setForm(f => ({ ...f, model_deep: e.target.value }))}
                            />
                        </div>
                    </div>

                    <div className="flex gap-3 relative">
                        <button onClick={handleSave} disabled={loading} className="group/save bg-gradient-to-l from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white px-6 py-2.5 rounded-xl font-black hover:-translate-y-0.5 shadow-md shadow-amber-500/30 hover:shadow-lg hover:shadow-amber-500/40 active:scale-95 flex items-center gap-2 disabled:opacity-50 disabled:hover:translate-y-0 transition-all">
                            <Save size={16} className="group-hover/save:rotate-12 transition-transform" />
                            {loading ? 'جاري الحفظ...' : 'حفظ'}
                        </button>
                        <button onClick={() => setShowForm(false)} className="px-6 py-2.5 rounded-xl font-black text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                            إلغاء
                        </button>
                    </div>
                </div>
            )}

            {/* Info box — accent stripe + gradient */}
            <div className="relative overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100/60 dark:from-slate-800/50 dark:to-slate-800/30 rounded-2xl p-4 text-xs text-slate-500 dark:text-slate-400 space-y-2 border border-slate-200 dark:border-slate-700">
                <span className="absolute top-0 right-0 h-full w-0.5 bg-slate-400 opacity-60" />
                <p className="font-black text-slate-700 dark:text-slate-300 flex items-center gap-2 uppercase tracking-wider">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
                        <Zap size={12} />
                    </span>
                    كيف يعمل النظام
                </p>
                <ul className="list-disc list-inside space-y-1 leading-relaxed">
                    <li>كل المفاتيح المضافة نشطة تلقائياً — لا تحتاج تفعيل يدوي.</li>
                    <li>النظام يجرب المفتاح رقم 1 أولاً. لو فشل (ليمت، عطل) ينتقل للتالي تلقائياً.</li>
                    <li>استخدم الأسهم ▲▼ لتغيير ترتيب الأولوية.</li>
                    <li>استخدم زر "اختبار" للتحقق من صلاحية المفتاح.</li>
                    <li>يدعم: Google Gemini، OpenAI، Anthropic (Claude)، OpenRouter.</li>
                    <li>عبر OpenRouter يمكنك استخدام أي موديل (Gemini، GPT، Claude، Llama، إلخ).</li>
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

    // Shared input styles — keeps every field consistent without copying
    // 5 long class strings per input.
    const inputCls = 'w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all';
    const labelCls = 'text-xs font-black mb-1.5 block text-slate-700 dark:text-slate-200 uppercase tracking-wider';

    return (
        <div className="space-y-6 max-w-2xl">
            {/* Hero Section */}
            <div className="space-y-3 border-b pb-6 border-slate-200 dark:border-slate-700">
                <h4 className="font-black text-slate-600 dark:text-slate-300 text-sm flex items-center gap-2 uppercase tracking-wider">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    واجهة الموقع (Hero Section)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                        <label className={labelCls}>العنوان الرئيسي</label>
                        <input className={inputCls} value={settings.hero_title || ''} onChange={e => setSettings({ ...settings, hero_title: e.target.value })} />
                    </div>
                    <div>
                        <label className={labelCls}>العنوان الفرعي</label>
                        <input className={inputCls} value={settings.hero_subtitle || ''} onChange={e => setSettings({ ...settings, hero_subtitle: e.target.value })} />
                    </div>
                    <div>
                        <label className={labelCls}>نص الزر الأساسي</label>
                        <input className={inputCls} value={settings.hero_cta_primary || ''} onChange={e => setSettings({ ...settings, hero_cta_primary: e.target.value })} />
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="space-y-3 border-b pb-6 border-slate-200 dark:border-slate-700">
                <h4 className="font-black text-slate-600 dark:text-slate-300 text-sm flex items-center gap-2 uppercase tracking-wider">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    أرقام وإحصائيات
                </h4>
                <div className="grid grid-cols-3 gap-3">
                    <div>
                        <label className={labelCls}>عدد المقالات</label>
                        <input className={`${inputCls} tabular-nums`} dir="ltr" value={settings.stats_articles || ''} onChange={e => setSettings({ ...settings, stats_articles: e.target.value })} />
                    </div>
                    <div>
                        <label className={labelCls}>عدد المستخدمين</label>
                        <input className={`${inputCls} tabular-nums`} dir="ltr" value={settings.stats_users || ''} onChange={e => setSettings({ ...settings, stats_users: e.target.value })} />
                    </div>
                    <div>
                        <label className={labelCls}>وقت العمل</label>
                        <input className={`${inputCls} tabular-nums`} dir="ltr" value={settings.stats_uptime || ''} onChange={e => setSettings({ ...settings, stats_uptime: e.target.value })} />
                    </div>
                </div>
            </div>

            {/* Contact & Social */}
            <div className="space-y-3 border-b pb-6 border-slate-200 dark:border-slate-700">
                <h4 className="font-black text-slate-600 dark:text-slate-300 text-sm flex items-center gap-2 uppercase tracking-wider">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    التواصل والخبراء
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                        <label className={labelCls}>رقم التواصل (واتساب)</label>
                        <input className={`${inputCls} font-mono`} dir="ltr" placeholder="+90..." value={settings.whatsapp_number || ''} onChange={e => setSettings({ ...settings, whatsapp_number: e.target.value })} />
                    </div>
                    <div>
                        <label className={labelCls}>البريد الإلكتروني</label>
                        <input className={`${inputCls} font-mono`} dir="ltr" value={settings.email_address || ''} onChange={e => setSettings({ ...settings, email_address: e.target.value })} />
                    </div>
                </div>
            </div>

            <button
                onClick={saveSettings}
                className="group/save bg-gradient-to-l from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-8 py-3 rounded-xl font-black flex items-center gap-2 shadow-md shadow-emerald-600/30 hover:shadow-lg hover:shadow-emerald-600/40 hover:-translate-y-0.5 active:scale-95 transition-all"
            >
                <Save size={18} className="group-hover/save:rotate-12 transition-transform" />
                حفظ التغييرات
            </button>
        </div>
    );
}

// === AI Usage Stats Dashboard ===
function AIUsageStats() {
    const [stats, setStats] = useState<any>(null);
    const [recentQueries, setRecentQueries] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showRecent, setShowRecent] = useState(false);

    const fetchStats = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/ai-usage');
            const data = await res.json();
            if (data.stats) setStats(data.stats);
            if (data.recentQueries) setRecentQueries(data.recentQueries);
        } catch { /* ignore */ }
        setLoading(false);
    };

    useEffect(() => { fetchStats(); }, []);

    if (loading) {
        return (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 flex items-center justify-center gap-2 text-slate-400">
                <Loader2 size={18} className="animate-spin" /> جاري تحميل الإحصائيات...
            </div>
        );
    }

    if (!stats) {
        return (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 text-center text-slate-400 text-sm">
                لا توجد بيانات استخدام بعد. ابدأ باستخدام المساعد الذكي لتظهر الإحصائيات هنا.
            </div>
        );
    }

    const providerLabels: Record<string, string> = {
        gemini: 'Google Gemini',
        openrouter: 'OpenRouter',
        openai: 'OpenAI',
        anthropic: 'Claude',
    };

    return (
        <div className="relative overflow-hidden bg-gradient-to-br from-white to-blue-50/30 dark:from-slate-900 dark:to-blue-950/15 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-5 shadow-sm">
            <span className="absolute top-0 right-0 h-full w-1 bg-blue-500 opacity-70" />
            <div className="flex items-center justify-between relative">
                <h3 className="font-black text-lg flex items-center gap-2 text-slate-800 dark:text-slate-100">
                    <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 shadow-sm">
                        <BarChart3 size={16} />
                    </span>
                    سجل استخدام المساعد الذكي
                </h3>
                <button onClick={fetchStats} className="text-slate-400 hover:text-blue-500 transition-colors" title="تحديث">
                    <RefreshCw size={18} />
                </button>
            </div>

            {/* Stats cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-blue-50 dark:bg-blue-950/30 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600">{stats.totalQueries}</div>
                    <div className="text-xs text-blue-500 mt-1">إجمالي الأسئلة</div>
                </div>
                <div className="bg-emerald-50 dark:bg-emerald-950/30 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-emerald-600">{stats.todayQueries}</div>
                    <div className="text-xs text-emerald-500 mt-1">أسئلة اليوم</div>
                </div>
                <div className="bg-purple-50 dark:bg-purple-950/30 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-purple-600">{stats.weekQueries}</div>
                    <div className="text-xs text-purple-500 mt-1">هذا الأسبوع</div>
                </div>
                <div className="bg-amber-50 dark:bg-amber-950/30 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-amber-600">{stats.successRate}%</div>
                    <div className="text-xs text-amber-500 mt-1">نسبة النجاح</div>
                </div>
            </div>

            {/* Provider breakdown */}
            {Object.keys(stats.providerCounts || {}).length > 0 && (
                <div>
                    <h4 className="font-bold text-sm mb-2 flex items-center gap-1.5">
                        <TrendingUp size={14} /> استخدام المزودات
                    </h4>
                    <div className="flex flex-wrap gap-2">
                        {Object.entries(stats.providerCounts).map(([provider, count]) => (
                            <div key={provider} className="bg-slate-100 dark:bg-slate-800 rounded-lg px-3 py-2 text-sm">
                                <span className="font-bold">{providerLabels[provider] || provider}</span>
                                <span className="text-slate-500 mr-2">{count as number} طلب</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Top topics */}
            {stats.topTopics?.length > 0 && (
                <div>
                    <h4 className="font-bold text-sm mb-2 flex items-center gap-1.5">
                        <MessageSquare size={14} /> أكثر المواضيع طلباً
                    </h4>
                    <div className="flex flex-wrap gap-2">
                        {stats.topTopics.map((t: any) => (
                            <div key={t.topic} className="bg-slate-100 dark:bg-slate-800 rounded-full px-3 py-1.5 text-xs font-medium">
                                {t.topic} <span className="text-slate-400 mr-1">({t.count})</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Recent queries toggle */}
            <div>
                <button
                    onClick={() => setShowRecent(!showRecent)}
                    className="text-sm text-blue-600 hover:text-blue-700 font-bold"
                >
                    {showRecent ? 'إخفاء آخر الأسئلة ▲' : 'عرض آخر الأسئلة ▼'}
                </button>

                {showRecent && recentQueries.length > 0 && (
                    <div className="mt-3 space-y-2 max-h-80 overflow-y-auto">
                        {recentQueries.map((q) => (
                            <div key={q.id} className="flex items-start gap-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 text-sm">
                                <div className={`shrink-0 w-2 h-2 rounded-full mt-1.5 ${q.success ? 'bg-emerald-500' : 'bg-red-500'}`} />
                                <div className="flex-1 min-w-0">
                                    <p className="text-slate-700 dark:text-slate-200 truncate">{q.query}</p>
                                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                                        <span>{providerLabels[q.provider] || q.provider}</span>
                                        <span>{q.model}</span>
                                        <span>{new Date(q.created_at).toLocaleString('ar-SA')}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {showRecent && recentQueries.length === 0 && (
                    <p className="mt-3 text-sm text-slate-400">لا توجد أسئلة مسجلة بعد.</p>
                )}
            </div>
        </div>
    );
}
