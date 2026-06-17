'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
    LayoutDashboard,
    Plus,
    Save,
    Trash2,
    Edit,
    Loader2,
    Plane,
    FileText,
    ShieldAlert,
    Smartphone,
    BrainCircuit,
    FolderOpen,
    UserCheck,
    MapPin,
    Calculator,
    HeartPulse,
    Link as LinkIcon,
    Sparkles,
    Menu,
    Bell,
    Settings,
    Image as ImageIcon,
    ExternalLink
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { UpdatesManager } from './ContentParsers';
import ConfigManager from './ConfigManager';
import BannersManager from './BannersManager';

// Icon Map
const ICONS: Record<string, any> = {
    Plane, FileText, ShieldAlert, Smartphone, BrainCircuit, FolderOpen, UserCheck, MapPin, Calculator, HeartPulse, LinkIcon, Sparkles
};

const COLORS = [
    { label: 'أزرق (Blue/Cyan)', value: 'from-blue-500 to-cyan-500' },
    { label: 'أخضر (Emerald/Teal)', value: 'from-emerald-500 to-teal-500' },
    { label: 'أحمر (Red/Rose)', value: 'from-red-500 to-rose-500' },
    { label: 'برتقالي (Amber/Orange)', value: 'from-amber-500 to-orange-500' },
    { label: 'بنفسجي (Purple/Indigo)', value: 'from-purple-500 to-indigo-500' },
];

export default function HomeManager() {
    const { showToast } = useToast();
    const [activeTab, setActiveTab] = useState<'journey' | 'quick' | 'menus' | 'updates' | 'banners' | 'hero'>('journey');
    const [cards, setCards] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    // Form
    const [form, setForm] = useState({
        title: '',
        description: '',
        href: '',
        icon_name: 'FileText',
        color_class: 'from-blue-500 to-cyan-500',
        sort_order: 0,
        section: 'journey'
    });

    useEffect(() => {
        if (activeTab === 'journey' || activeTab === 'quick') {
            fetchCards();
        }
    }, [activeTab]);

    async function fetchCards() {
        setLoading(true);
        if (!supabase) return;
        const { data } = await supabase
            .from('home_cards')
            .select('*')
            .eq('section', activeTab === 'quick' ? 'quick_action' : 'journey')
            .order('sort_order');

        if (data) setCards(data);
        setLoading(false);
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!supabase) return;

        const payload = {
            ...form,
            section: activeTab === 'quick' ? 'quick_action' : 'journey'
        };

        let result;
        if (editingId) {
            result = await supabase.from('home_cards').update(payload).eq('id', editingId);
        } else {
            result = await supabase.from('home_cards').insert([payload]);
        }

        if (!result.error) {
            showToast('تم الحفظ بنجاح', 'success');
            setEditingId(null);
            setForm({ title: '', description: '', href: '', icon_name: 'FileText', color_class: 'from-blue-500 to-cyan-500', sort_order: 0, section: 'journey' });
            fetchCards();
        } else {
            showToast(result.error.message, 'error');
        }
    }

    async function handleDelete(id: string) {
        if (!confirm('حذف هذا العنصر؟')) return;
        if (!supabase) return;
        await supabase.from('home_cards').delete().eq('id', id);
        fetchCards();
    }

    const startEdit = (card: any) => {
        setEditingId(card.id);
        setForm({
            title: card.title,
            description: card.description || '',
            href: card.href,
            icon_name: card.icon_name || 'FileText',
            color_class: card.color_class || 'from-blue-500 to-cyan-500',
            sort_order: card.sort_order,
            section: card.section
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Tab metadata centralised — same shape (id/label/icon/colour theme)
    // so the render loop stays terse and adding a new tab only touches
    // one array. The colour theme drives the tab pill bg/text + a small
    // pulse indicator under the active tab.
    type TabId = 'journey' | 'quick' | 'menus' | 'updates' | 'banners' | 'hero';
    const TABS: Array<{ id: TabId; label: string; icon: typeof Plane; theme: { bg: string; text: string; accent: string }; disabled?: boolean }> = [
        { id: 'journey', label: 'رحلة المستخدم', icon: Plane,       theme: { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-300', accent: 'bg-emerald-500' } },
        { id: 'quick',   label: 'الاختصارات',     icon: Sparkles,    theme: { bg: 'bg-blue-100 dark:bg-blue-900/30',       text: 'text-blue-700 dark:text-blue-300',       accent: 'bg-blue-500' } },
        { id: 'menus',   label: 'القوائم',         icon: Menu,        theme: { bg: 'bg-violet-100 dark:bg-violet-900/30',   text: 'text-violet-700 dark:text-violet-300',   accent: 'bg-violet-500' } },
        { id: 'updates', label: 'الأخبار',         icon: Bell,        theme: { bg: 'bg-amber-100 dark:bg-amber-900/30',     text: 'text-amber-700 dark:text-amber-300',     accent: 'bg-amber-500' } },
        { id: 'banners', label: 'البنرات',         icon: ShieldAlert, theme: { bg: 'bg-red-100 dark:bg-red-900/30',         text: 'text-red-700 dark:text-red-300',         accent: 'bg-red-500' } },
    ];

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-full text-[10px] font-black tracking-wider uppercase mb-2">
                        <LayoutDashboard size={12} />
                        واجهة
                    </span>
                    <h2 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-3">
                        <span className="inline-flex items-center justify-center w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-100 to-emerald-200/60 dark:from-emerald-900/40 dark:to-emerald-800/30 text-emerald-600 dark:text-emerald-400 shadow-sm">
                            <LayoutDashboard size={22} />
                        </span>
                        إدارة الواجهة الرئيسية
                    </h2>
                    <p className="text-slate-500 text-sm mt-1.5">تحكم كامل في كل قسم من أقسام الصفحة الرئيسية</p>
                </div>
            </div>

            {/* Main Tabs Navigation — pill row w/ active accent */}
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

                    <button
                        type="button"
                        disabled
                        className="opacity-40 cursor-not-allowed flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-sm text-slate-400"
                        title="قريباً"
                    >
                        <FileText size={16} /> المقالات المميزة
                    </button>
                </div>
            </div>

            {/* === CONTENT AREA === */}

            {/* 1. Journey & Quick Actions Manager */}
            {(activeTab === 'journey' || activeTab === 'quick') && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Form Side — accent stripe + gradient */}
                    <div className={`lg:col-span-1 relative overflow-hidden bg-gradient-to-br ${activeTab === 'journey' ? 'from-white to-emerald-50/40 dark:from-slate-900 dark:to-emerald-950/15' : 'from-white to-blue-50/40 dark:from-slate-900 dark:to-blue-950/15'} p-6 rounded-2xl border border-slate-200 dark:border-slate-800 h-fit sticky top-6 shadow-sm`}>
                        <span className={`absolute top-0 right-0 h-full w-1 ${activeTab === 'journey' ? 'bg-emerald-500' : 'bg-blue-500'} opacity-70`} />

                        <h3 className="font-black mb-5 flex items-center gap-2 border-b pb-4 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100">
                            <span className={`inline-flex items-center justify-center w-9 h-9 rounded-lg ${editingId ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'} shadow-sm`}>
                                {editingId ? <Edit size={16} /> : <Plus size={16} />}
                            </span>
                            {editingId ? 'تعديل البطاقة' : 'إضافة بطاقة جديدة'}
                        </h3>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label htmlFor="card-title" className="text-xs font-bold mb-1 block">العنوان</label>
                                <input id="card-title" name="card-title" required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="w-full p-2.5 rounded-xl border dark:bg-slate-800 focus:ring-2 ring-emerald-500 outline-none transition" placeholder="مثال: تجديد الإقامة" />
                            </div>
                            <div>
                                <label htmlFor="card-description" className="text-xs font-bold mb-1 block">الوصف القصير</label>
                                <textarea id="card-description" name="card-description" rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="w-full p-2.5 rounded-xl border dark:bg-slate-800 focus:ring-2 ring-emerald-500 outline-none transition" placeholder="وصف يظهر تحت العنوان..." />
                            </div>
                            <div>
                                <label htmlFor="card-href" className="text-xs font-bold mb-1 block">الرابط (Route)</label>
                                <div className="relative">
                                    <ExternalLink size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input id="card-href" name="card-href" required value={form.href} onChange={e => setForm({ ...form, href: e.target.value })} className="w-full pl-10 pr-2.5 py-2.5 rounded-xl border dark:bg-slate-800 focus:ring-2 ring-emerald-500 outline-none transition dir-ltr text-left" placeholder="/example" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="card-icon" className="text-xs font-bold mb-1 block">الأيقونة</label>
                                    <select id="card-icon" name="card-icon" value={form.icon_name} onChange={e => setForm({ ...form, icon_name: e.target.value })} className="w-full p-2.5 rounded-xl border dark:bg-slate-800 focus:ring-2 ring-emerald-500 outline-none transition">
                                        {Object.keys(ICONS).map(icon => <option key={icon} value={icon}>{icon}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="card-sort-order" className="text-xs font-bold mb-1 block">الترتيب</label>
                                    <input id="card-sort-order" name="card-sort-order" type="number" value={form.sort_order} onChange={e => setForm({ ...form, sort_order: parseInt(e.target.value) })} className="w-full p-2.5 rounded-xl border dark:bg-slate-800 focus:ring-2 ring-emerald-500 outline-none transition" />
                                </div>
                            </div>

                            {activeTab === 'journey' && (
                                <div>
                                    <label htmlFor="card-color" className="text-xs font-bold mb-1 block">اللون (للتدرج اللوني)</label>
                                    <select id="card-color" name="card-color" value={form.color_class} onChange={e => setForm({ ...form, color_class: e.target.value })} className="w-full p-2.5 rounded-xl border dark:bg-slate-800 focus:ring-2 ring-emerald-500 outline-none transition">
                                        {COLORS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                                    </select>
                                </div>
                            )}

                            <div className="flex gap-2 pt-4">
                                <button type="submit" className="group/btn flex-1 bg-gradient-to-l from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white py-3 rounded-xl font-black flex items-center justify-center gap-2 shadow-md shadow-emerald-600/30 hover:shadow-lg hover:shadow-emerald-600/40 hover:-translate-y-0.5 active:scale-95 transition-all">
                                    <Save size={18} className="group-hover/btn:rotate-12 transition-transform" />
                                    حفظ
                                </button>
                                {editingId && (
                                    <button type="button" onClick={() => { setEditingId(null); setForm({ ...form, title: '' }); }} className="px-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-black hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                                        إلغاء
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>

                    {/* Preview List */}
                    <div className="lg:col-span-2">
                        <div className={`grid gap-4 ${activeTab === 'quick' ? 'grid-cols-2' : 'grid-cols-1'}`}>
                            {cards.map(card => {
                                const Icon = ICONS[card.icon_name] || FileText;
                                return (
                                    <div key={card.id} className={`group relative overflow-hidden bg-gradient-to-br ${activeTab === 'journey' ? 'from-white to-emerald-50/40 dark:from-slate-900 dark:to-emerald-950/15' : 'from-white to-blue-50/40 dark:from-slate-900 dark:to-blue-950/15'} p-5 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col hover:shadow-md hover:-translate-y-0.5 transition-all`}>
                                        <span className={`absolute top-0 right-0 h-full w-0.5 ${activeTab === 'journey' ? 'bg-emerald-500' : 'bg-blue-500'} opacity-60 group-hover:opacity-100 transition-opacity`} />

                                        <div className="flex items-start gap-4 mb-3">
                                            <div className={`p-3 rounded-2xl shrink-0 shadow-sm group-hover:rotate-3 transition-transform ${activeTab === 'journey' ? `bg-gradient-to-br ${card.color_class} text-white` : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'}`}>
                                                <Icon size={22} />
                                            </div>
                                            <div className="min-w-0">
                                                <h4 className="font-black text-slate-800 dark:text-slate-100">{card.title}</h4>
                                                <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                                                    <span className="text-[10px] font-mono bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-lg text-slate-500 dark:text-slate-400" dir="ltr">{card.href}</span>
                                                    <span className="text-[10px] font-black bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-lg tabular-nums" dir="ltr">#{card.sort_order}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-lg mb-4 h-full">
                                            {card.description || 'لا يوجد وصف'}
                                        </p>

                                        <div className="mt-auto flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                                            <button onClick={() => startEdit(card)} className="flex items-center gap-1 px-3 py-1.5 text-xs font-black text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/15 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-all hover:scale-105 active:scale-95">
                                                <Edit size={14} /> تعديل
                                            </button>
                                            <button onClick={() => handleDelete(card.id)} className="flex items-center gap-1 px-3 py-1.5 text-xs font-black text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/15 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-all hover:scale-105 active:scale-95">
                                                <Trash2 size={14} /> حذف
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* 2. Menus Manager (Imported) */}
            {activeTab === 'menus' && (
                <div className="relative overflow-hidden bg-gradient-to-br from-white to-violet-50/30 dark:from-slate-900 dark:to-violet-950/15 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
                    <span className="absolute top-0 right-0 h-full w-1 bg-violet-500 opacity-70" />
                    <div className="relative">
                        <ConfigManager />
                    </div>
                </div>
            )}

            {/* 3. Updates & News */}
            {activeTab === 'updates' && (
                <div className="relative overflow-hidden bg-gradient-to-br from-white to-amber-50/30 dark:from-slate-900 dark:to-amber-950/15 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
                    <span className="absolute top-0 right-0 h-full w-1 bg-amber-500 opacity-70" />
                    <div className="relative">
                        <UpdatesManager />
                    </div>
                </div>
            )}

            {/* 4. Banners */}
            {activeTab === 'banners' && (
                <div className="relative overflow-hidden bg-gradient-to-br from-white to-red-50/30 dark:from-slate-900 dark:to-red-950/15 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
                    <span className="absolute top-0 right-0 h-full w-1 bg-red-500 opacity-70" />
                    <div className="relative">
                        <BannersManager />
                    </div>
                </div>
            )}

        </div>
    );
}
