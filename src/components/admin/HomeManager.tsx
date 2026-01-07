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

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <LayoutDashboard className="text-emerald-500" />
                    إدارة الواجهة الرئيسية
                </h2>
                <p className="text-slate-500 text-sm mt-1">تحكم كامل في كل قسم من أقسام الصفحة الرئيسية</p>
            </div>

            {/* Main Tabs Navigation */}
            <div className="bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-x-auto">
                <div className="flex gap-2 min-w-max">
                    <button
                        onClick={() => setActiveTab('journey')}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${activeTab === 'journey' ? 'bg-emerald-100 text-emerald-700 shadow-sm' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}`}
                    >
                        <Plane size={18} /> رحلة المستخدم
                    </button>
                    <button
                        onClick={() => setActiveTab('quick')}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${activeTab === 'quick' ? 'bg-blue-100 text-blue-700 shadow-sm' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}`}
                    >
                        <Sparkles size={18} /> الاختصارات السريعة
                    </button>
                    <button
                        disabled
                        className="opacity-50 cursor-not-allowed flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-slate-400"
                        title="قريباً"
                    >
                        <FileText size={18} /> المقالات المميزة
                    </button>
                    <div className="w-px bg-slate-200 dark:bg-slate-700 mx-1"></div>
                    <button
                        onClick={() => setActiveTab('menus')}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${activeTab === 'menus' ? 'bg-purple-100 text-purple-700 shadow-sm' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}`}
                    >
                        <Menu size={18} /> القوائم
                    </button>
                    <button
                        onClick={() => setActiveTab('updates')}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${activeTab === 'updates' ? 'bg-amber-100 text-amber-700 shadow-sm' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}`}
                    >
                        <Bell size={18} /> الأخبار
                    </button>
                    <button
                        onClick={() => setActiveTab('banners')}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${activeTab === 'banners' ? 'bg-red-100 text-red-700 shadow-sm' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}`}
                    >
                        <ShieldAlert size={18} /> البنرات
                    </button>
                </div>
            </div>

            {/* === CONTENT AREA === */}

            {/* 1. Journey & Quick Actions Manager */}
            {(activeTab === 'journey' || activeTab === 'quick') && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Form Side */}
                    <div className="lg:col-span-1 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 h-fit sticky top-6">
                        <h3 className="font-bold mb-6 flex items-center gap-2 border-b pb-4 border-slate-100 dark:border-slate-800">
                            {editingId ? <Edit className="text-blue-500" /> : <Plus className="text-emerald-500" />}
                            {editingId ? 'تعديل البطاقة' : 'إضافة بطاقة جديدة'}
                        </h3>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="text-xs font-bold mb-1 block">العنوان</label>
                                <input required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="w-full p-2.5 rounded-xl border dark:bg-slate-800 focus:ring-2 ring-emerald-500 outline-none transition" placeholder="مثال: تجديد الإقامة" />
                            </div>
                            <div>
                                <label className="text-xs font-bold mb-1 block">الوصف القصير</label>
                                <textarea rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="w-full p-2.5 rounded-xl border dark:bg-slate-800 focus:ring-2 ring-emerald-500 outline-none transition" placeholder="وصف يظهر تحت العنوان..." />
                            </div>
                            <div>
                                <label className="text-xs font-bold mb-1 block">الرابط (Route)</label>
                                <div className="relative">
                                    <ExternalLink size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input required value={form.href} onChange={e => setForm({ ...form, href: e.target.value })} className="w-full pl-10 pr-2.5 py-2.5 rounded-xl border dark:bg-slate-800 focus:ring-2 ring-emerald-500 outline-none transition dir-ltr text-left" placeholder="/example" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold mb-1 block">الأيقونة</label>
                                    <select value={form.icon_name} onChange={e => setForm({ ...form, icon_name: e.target.value })} className="w-full p-2.5 rounded-xl border dark:bg-slate-800 focus:ring-2 ring-emerald-500 outline-none transition">
                                        {Object.keys(ICONS).map(icon => <option key={icon} value={icon}>{icon}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-bold mb-1 block">الترتيب</label>
                                    <input type="number" value={form.sort_order} onChange={e => setForm({ ...form, sort_order: parseInt(e.target.value) })} className="w-full p-2.5 rounded-xl border dark:bg-slate-800 focus:ring-2 ring-emerald-500 outline-none transition" />
                                </div>
                            </div>

                            {activeTab === 'journey' && (
                                <div>
                                    <label className="text-xs font-bold mb-1 block">اللون (للتدرج اللوني)</label>
                                    <select value={form.color_class} onChange={e => setForm({ ...form, color_class: e.target.value })} className="w-full p-2.5 rounded-xl border dark:bg-slate-800 focus:ring-2 ring-emerald-500 outline-none transition">
                                        {COLORS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                                    </select>
                                </div>
                            )}

                            <div className="flex gap-2 pt-4">
                                <button type="submit" className="flex-1 bg-emerald-600 text-white py-2.5 rounded-xl font-bold hover:bg-emerald-700 flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/10">
                                    <Save size={18} /> حفظ
                                </button>
                                {editingId && (
                                    <button type="button" onClick={() => { setEditingId(null); setForm({ ...form, title: '' }); }} className="px-4 bg-slate-100 text-slate-500 rounded-xl font-bold hover:bg-slate-200">
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
                                    <div key={card.id} className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col group relative hover:shadow-md transition-all">
                                        <div className="flex items-start gap-4 mb-3">
                                            <div className={`p-3 rounded-xl shrink-0 ${activeTab === 'journey' ? `bg-gradient-to-br ${card.color_class} text-white` : 'bg-slate-100 dark:bg-slate-800 text-slate-600'}`}>
                                                <Icon size={24} />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-slate-800 dark:text-slate-100">{card.title}</h4>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-500 dir-ltr">{card.href}</span>
                                                    <span className="text-[10px] bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded">#{card.sort_order}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed pl-2 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg mb-4 h-full">
                                            {card.description || 'لا يوجد وصف'}
                                        </p>

                                        <div className="mt-auto flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                                            <button onClick={() => startEdit(card)} className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
                                                <Edit size={14} /> تعديل
                                            </button>
                                            <button onClick={() => handleDelete(card.id)} className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors">
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
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-1">
                    {/* We reuse ConfigManager but force it to look like part of this dashboard if possible, 
                         or just render it. Since ConfigManager spans full width, we just render it. */}
                    <ConfigManager />
                </div>
            )}

            {/* 3. Updates & News */}
            {activeTab === 'updates' && (
                <UpdatesManager />
            )}

            {/* 4. Banners */}
            {activeTab === 'banners' && (
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
                    <BannersManager />
                </div>
            )}

        </div>
    );
}
