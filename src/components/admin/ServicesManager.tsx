'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Plus, Search, Trash2, Edit, Save, X, Loader2, MapPin, Phone, Briefcase, Filter } from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';

// Types
type ServiceProvider = {
    id: any;
    name: string;
    profession: string;
    category: string;
    city: string;
    district?: string;
    phone: string;
    description?: string;
    image?: string;
    rating?: number;
    review_count?: number;
    is_verified?: boolean;
};

export default function ServicesManager() {
    const [view, setView] = useState<'list' | 'form'>('list');
    const [services, setServices] = useState<ServiceProvider[]>([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [editId, setEditId] = useState<any>(null); // If null, adding new. If set, editing.

    // Form State
    const [formData, setFormData] = useState<Partial<ServiceProvider>>({});
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [formLoading, setFormLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // Initial Fetch
    useEffect(() => {
        if (view === 'list') {
            fetchServices(true);
        }
    }, [view, searchQuery]);

    async function fetchServices(reset = false) {
        if (!supabase) return;
        setLoading(true);
        try {
            const from = reset ? 0 : page * 20;
            const to = from + 19;

            let query = supabase
                .from('service_providers')
                .select('*')
                .range(from, to)
                .order('created_at', { ascending: false });

            if (searchQuery) {
                query = query.ilike('name', `%${searchQuery}%`);
            }

            const { data, error } = await query;

            if (error) throw error;

            if (reset) {
                setServices(data || []);
                setPage(1);
            } else {
                setServices(prev => [...prev, ...(data || [])]);
                setPage(prev => prev + 1);
            }

            if (!data || data.length < 20) setHasMore(false);
            else setHasMore(true);

        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    async function handleDelete(id: any) {
        if (!confirm('هل أنت متأكد من حذف هذه الخدمة نهائياً؟')) return;
        if (!supabase) return;

        try {
            const { error } = await supabase.from('service_providers').delete().eq('id', id);
            if (error) throw error;
            setServices(prev => prev.filter(s => s.id !== id));
        } catch (err) {
            toast.error('حدث خطأ أثناء الحذف');
            console.error(err);
        }
    }

    function handleEdit(service: ServiceProvider) {
        setEditId(service.id);
        setFormData(service);
        setView('form');
        setMessage(null);
    }

    function handleAddNew() {
        setEditId(null);
        setFormData({
            category: 'other',
            city: 'Istanbul',
            rating: 5.0,
            review_count: 0,
            is_verified: true
        });
        setImageFile(null);
        setView('form');
        setMessage(null);
    }

    async function handleSave(e: React.FormEvent) {
        e.preventDefault();
        if (!supabase) return;
        setFormLoading(true);
        setMessage(null);

        try {
            let imageUrl = formData.image;

            // Upload Image if changed
            if (imageFile) {
                const fileExt = imageFile.name.split('.').pop();
                const fileName = `${Date.now()}.${fileExt}`;
                const { error: uploadError } = await supabase.storage
                    .from('providers')
                    .upload(fileName, imageFile);

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('providers')
                    .getPublicUrl(fileName);

                imageUrl = publicUrl;
            }

            const payload = { ...formData, image: imageUrl };

            if (editId) {
                // Update
                const { error } = await supabase
                    .from('service_providers')
                    .update(payload)
                    .eq('id', editId);
                if (error) throw error;
                setMessage({ type: 'success', text: 'تم التعديل بنجاح' });
            } else {
                // Insert
                const { error } = await supabase
                    .from('service_providers')
                    .insert([payload]);
                if (error) throw error;
                setMessage({ type: 'success', text: 'تمت الإضافة بنجاح' });
                setFormData({}); // Clear after add
            }

        } catch (err: any) {
            setMessage({ type: 'error', text: err.message || 'حدث خطأ' });
        } finally {
            setFormLoading(false);
        }
    }

    return (
        <div className="space-y-6">

            {/* Header / Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
                <h2 className="text-xl font-bold flex items-center gap-2">
                    <Briefcase className="text-emerald-500" />
                    إدارة الخدمات
                </h2>

                {view === 'list' && (
                    <div className="flex items-center gap-3 flex-grow max-w-md">
                        <div className="relative flex-grow">
                            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="text"
                                placeholder="بحث بالاسم..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-4 pr-10 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none"
                            />
                        </div>
                        <button
                            onClick={handleAddNew}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-colors whitespace-nowrap"
                        >
                            <Plus size={18} /> إضافة جديد
                        </button>
                    </div>
                )}

                {view === 'form' && (
                    <button
                        onClick={() => setView('list')}
                        className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                    >
                        <X size={18} /> إلغاء / عودة
                    </button>
                )}
            </div>

            {/* List View */}
            {view === 'list' && (
                <>
                    {/* Mobile Cards View (< 768px) */}
                    <div className="md:hidden grid grid-cols-1 gap-4">
                        {loading && services.length === 0 ? (
                            <div className="py-12 flex justify-center text-emerald-500"><Loader2 className="animate-spin" size={32} /></div>
                        ) : services.map((service) => (
                            <div key={service.id} className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-3 relative overflow-hidden">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                        {service.image ? (
                                            <Image src={service.image} alt={service.name} width={48} height={48} className="rounded-xl object-cover flex-shrink-0 bg-slate-100" />
                                        ) : (
                                            <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 flex-shrink-0">
                                                <Briefcase size={20} />
                                            </div>
                                        )}
                                        <div className="min-w-0 flex-1">
                                            <h3 className="font-bold text-slate-800 dark:text-slate-100 truncate">{service.name}</h3>
                                            <p className="text-xs text-slate-500 truncate">{service.profession}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-1">
                                        <button onClick={() => handleEdit(service)} className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors" aria-label="تعديل">
                                            <Edit size={16} />
                                        </button>
                                        <button onClick={() => handleDelete(service.id)} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors" aria-label="حذف">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 text-xs flex-wrap mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 w-full">
                                    <span className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 flex items-center gap-1 shrink-0">
                                        <MapPin size={12} /> {service.city}
                                    </span>
                                    <span className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 shrink-0">
                                        {service.category}
                                    </span>
                                    {service.phone && (
                                        <span className="bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded-md text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/30 flex items-center gap-1 max-w-full overflow-hidden min-w-0">
                                            <Phone size={12} className="shrink-0" />
                                            <span className="truncate dir-ltr flex-1">{service.phone}</span>
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Desktop Table View (>= 768px) */}
                    <div className="hidden md:block bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-right">
                                <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-bold border-b border-slate-100 dark:border-slate-800">
                                    <tr>
                                        <th className="p-4">الخدمة</th>
                                        <th className="p-4">التصنيف</th>
                                        <th className="p-4">الموقع</th>
                                        <th className="p-4">الهاتف</th>
                                        <th className="p-4">إجراءات</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {services.map((service) => (
                                        <tr key={service.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    {service.image ? (
                                                        <Image src={service.image} alt={service.name} width={40} height={40} className="rounded-lg object-cover" />
                                                    ) : (
                                                        <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                                                            <Briefcase size={20} />
                                                        </div>
                                                    )}
                                                    <div>
                                                        <div className="font-bold text-slate-800 dark:text-slate-200">{service.name}</div>
                                                        <div className="text-xs text-slate-500">{service.profession}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4 text-slate-600 dark:text-slate-400">
                                                <span className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-xs">
                                                    {service.category}
                                                </span>
                                            </td>
                                            <td className="p-4 text-slate-600 dark:text-slate-400">
                                                <div className="flex items-center gap-1">
                                                    <MapPin size={14} />
                                                    {service.city}
                                                </div>
                                            </td>
                                            <td className="p-4 text-slate-600 dark:text-slate-400 font-mono text-xs" dir="ltr">
                                                {service.phone}
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => handleEdit(service)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg" title="تعديل" aria-label="تعديل">
                                                        <Edit size={18} />
                                                    </button>
                                                    <button onClick={() => handleDelete(service.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg" title="حذف" aria-label="حذف">
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {loading && (
                            <div className="p-8 flex justify-center text-emerald-500"><Loader2 className="animate-spin" size={32} /></div>
                        )}

                        {!loading && services.length === 0 && (
                            <div className="p-12 text-center text-slate-400">
                                <p>لا توجد نتائج مطابقة</p>
                            </div>
                        )}

                        {!loading && hasMore && (
                            <div className="p-4 border-t border-slate-100 dark:border-slate-800 text-center">
                                <button onClick={() => fetchServices()} className="text-emerald-600 font-bold hover:underline">
                                    تحميل المزيد...
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Link Load More for Mobile (outside the hidden desktop div) */}
                    {!loading && hasMore && (
                        <div className="md:hidden mt-4 text-center">
                            <button onClick={() => fetchServices()} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full py-3 rounded-xl text-emerald-600 font-bold shadow-sm">
                                تحميل المزيد
                            </button>
                        </div>
                    )}
                </>
            )}

            {/* Form View */}
            {view === 'form' && (
                <div className="max-w-3xl mx-auto bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                    <h3 className="text-lg font-bold mb-6 pb-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        {editId ? `تعديل: ${formData.name}` : 'إضافة خدمة جديدة'}
                        {message && (
                            <span className={`text-sm px-3 py-1 rounded-full ${message.type === 'success' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                {message.text}
                            </span>
                        )}
                    </h3>

                    <form onSubmit={handleSave} className="space-y-6">
                        {/* Basic Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold mb-2">الاسم</label>
                                <input
                                    required
                                    className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none focus:border-emerald-500"
                                    value={formData.name || ''}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-2">المهنة (Subtitle)</label>
                                <input
                                    required
                                    className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none focus:border-emerald-500"
                                    value={formData.profession || ''}
                                    onChange={e => setFormData({ ...formData, profession: e.target.value })}
                                />
                            </div>
                        </div>

                        {/* Location & Contact */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold mb-2">المدينة</label>
                                <select
                                    className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none focus:border-emerald-500"
                                    value={formData.city || 'Istanbul'}
                                    onChange={e => setFormData({ ...formData, city: e.target.value })}
                                >
                                    <option value="Istanbul">Istanbul</option>
                                    <option value="Gaziantep">Gaziantep</option>
                                    <option value="Bursa">Bursa</option>
                                    <option value="Izmir">Izmir</option>
                                    <option value="Ankara">Ankara</option>
                                    <option value="Mersin">Mersin</option>
                                    <option value="Hatay">Hatay</option>
                                    <option value="Konya">Konya</option>
                                    <option value="Antalya">Antalya</option>
                                    <option value="Adana">Adana</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-2">الهاتف (واتساب)</label>
                                <input
                                    dir="ltr"
                                    className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none focus:border-emerald-500 text-right"
                                    value={formData.phone || ''}
                                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                    placeholder="+90..."
                                />
                            </div>
                        </div>

                        {/* Classification */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold mb-2">التصنيف (Slug)</label>
                                <input
                                    className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none focus:border-emerald-500 text-slate-500"
                                    value={formData.category || ''}
                                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                                    placeholder="health, law, food..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-2">المنطقة (District)</label>
                                <input
                                    className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none focus:border-emerald-500"
                                    value={formData.district || ''}
                                    onChange={e => setFormData({ ...formData, district: e.target.value })}
                                    placeholder="Fatih, Esenyurt..."
                                />
                            </div>
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-sm font-bold mb-2">التفاصيل</label>
                            <textarea
                                rows={4}
                                className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none focus:border-emerald-500"
                                value={formData.description || ''}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>

                        {/* Image */}
                        <div>
                            <label className="block text-sm font-bold mb-2">الصورة (اختياري)</label>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={e => setImageFile(e.target.files?.[0] || null)}
                                className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                            />
                            {formData.image && (
                                <div className="mt-2 text-xs text-slate-400">الصورة الحالية: {formData.image}</div>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="flex gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                            <button
                                type="submit"
                                disabled={formLoading}
                                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2"
                            >
                                {formLoading ? <Loader2 className="animate-spin" /> : <Save size={20} />}
                                حفظ التغييرات
                            </button>
                            <button
                                type="button"
                                onClick={() => setView('list')}
                                className="px-6 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold rounded-xl"
                            >
                                إلغاء
                            </button>
                        </div>
                    </form>
                </div>
            )}

        </div>
    );
}
