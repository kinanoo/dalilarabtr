'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Settings, Menu, Layers, Save, Loader2, RefreshCw, Trash2, Edit, Check, X } from 'lucide-react';
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
    const [activeTab, setActiveTab] = useState<'menus' | 'categories' | 'migration' | 'settings'>('menus');
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
        </div>
    );
}

function GeneralSettingsForm() {
    const [settings, setSettings] = useState<any>({});
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
