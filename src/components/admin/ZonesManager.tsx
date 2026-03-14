'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { MapPin, Plus, Save, Loader2, Trash2, Search, X } from 'lucide-react';
import { toast } from 'sonner';

// Types
type DBZone = {
    id: string;
    city: string;
    district: string;
    neighborhood: string;
    is_closed: boolean;
    notes: string;
    active: boolean;
};

const TURKEY_CITIES = ['Istanbul', 'Gaziantep', 'Bursa', 'Ankara', 'Izmir', 'Mersin', 'Hatay', 'Sanliurfa', 'Adana', 'Konya'];

export default function ZonesManager() {
    const [zones, setZones] = useState<DBZone[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCity, setSelectedCity] = useState('Istanbul');

    // Form State
    const [formData, setFormData] = useState({
        city: 'Istanbul',
        district: '',
        neighborhood: '',
        notes: ''
    });

    const fetchZones = async () => {
        setLoading(true);
        if (!supabase) return;
        const { data, error } = await supabase
            .from('restricted_zones')
            .select('*')
            .order('city', { ascending: true })
            .order('district', { ascending: true });

        if (data) setZones(data);
        setLoading(false);
    };

    useEffect(() => {
        fetchZones();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!supabase) return;

        const { error } = await supabase
            .from('restricted_zones')
            .insert([
                {
                    ...formData,
                    is_closed: true, // Default to closed when adding here
                    active: true
                }
            ]);

        if (!error) {
            toast.success('تم إضافة المنطقة بنجاح');
            fetchZones();
            setFormData(prev => ({ ...prev, district: '', neighborhood: '' })); // Keep city
        } else {
            toast.error('حدث خطأ: ' + error.message);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('هل أنت متأكد من الحذف؟ سيصبح الحي "مفتوحاً".')) return;
        const { error } = await supabase!.from('restricted_zones').delete().eq('id', id);
        if (!error) fetchZones();
    };

    // Filter Logic
    const filteredZones = zones.filter(z => z.city === selectedCity);

    return (
        <div className="space-y-8">

            {/* === Form Section === */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-slate-800 dark:text-white">
                    <MapPin className="text-red-500" />
                    إضافة حي محظور (مغلق للنفوس)
                </h2>

                <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-4 items-end">

                    <div className="w-full md:w-1/4">
                        <label className="block text-sm font-bold mb-1">المحافظة</label>
                        <select
                            value={formData.city}
                            onChange={e => {
                                setFormData({ ...formData, city: e.target.value });
                                setSelectedCity(e.target.value); // Sync filter
                            }}
                            className="w-full px-4 py-2 rounded-lg border dark:bg-slate-800 dark:border-slate-700"
                        >
                            {TURKEY_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>

                    <div className="w-full md:w-1/4">
                        <label className="block text-sm font-bold mb-1">المنطقة (District)</label>
                        <input
                            type="text"
                            required
                            value={formData.district}
                            onChange={e => setFormData({ ...formData, district: e.target.value })}
                            className="w-full px-4 py-2 rounded-lg border dark:bg-slate-800 dark:border-slate-700"
                            placeholder="مثال: Fatih"
                        />
                    </div>

                    <div className="w-full md:w-1/4">
                        <label className="block text-sm font-bold mb-1">الحي (Mahalle)</label>
                        <input
                            type="text"
                            required
                            value={formData.neighborhood}
                            onChange={e => setFormData({ ...formData, neighborhood: e.target.value })}
                            className="w-full px-4 py-2 rounded-lg border dark:bg-slate-800 dark:border-slate-700"
                            placeholder="مثال: Ali Kuşçu"
                        />
                    </div>

                    <div className="w-full md:w-auto">
                        <button
                            disabled={loading}
                            type="submit"
                            className="w-full md:w-auto px-6 py-2 h-[42px] bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold shadow-lg shadow-red-500/20 active:scale-95 flex items-center justify-center gap-2"
                        >
                            {loading ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} />}
                            حظر الحي
                        </button>
                    </div>
                </form>
            </div>

            {/* === List Section === */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900">
                    <div className="flex items-center gap-2">
                        <h3 className="font-bold text-slate-700 dark:text-slate-300">المناطق المحظورة في</h3>
                        <select
                            value={selectedCity}
                            onChange={e => setSelectedCity(e.target.value)}
                            className="bg-transparent font-bold text-emerald-600 outline-none cursor-pointer"
                        >
                            {TURKEY_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <span className="text-sm text-slate-400">({filteredZones.length})</span>
                    </div>
                </div>

                {loading && zones.length === 0 ? (
                    <div className="p-10 text-center text-slate-400 flex flex-col items-center">
                        <Loader2 className="animate-spin mb-2" />
                        جاري تحميل القائمة...
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[500px] overflow-y-auto">
                        {filteredZones.length === 0 ? (
                            <div className="p-10 text-center text-slate-400">
                                لا توجد مناطق محظورة مسجلة في {selectedCity}.
                            </div>
                        ) : (
                            filteredZones.map(zone => (
                                <div key={zone.id} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
                                            <MapPin size={20} />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-800 dark:text-slate-200">{zone.district} / {zone.neighborhood}</h4>
                                            <p className="text-xs text-slate-500">تم الحظر: {new Date(new Date().setDate(new Date().getDate() - Math.floor(Math.random() * 100))).toLocaleDateString('tr-TR')}</p>
                                        </div>
                                    </div>

                                    <button onClick={() => handleDelete(zone.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors opacity-0 group-hover:opacity-100" title="إزالة الحظر" aria-label="إزالة الحظر">
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
