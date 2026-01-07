import { Image as ImageIcon, MapPin, Phone, Briefcase, Star, Clock } from 'lucide-react';
import { Field } from '../ui/Field';
import { inputStyles, textareaStyles, ltrInputStyles } from '../ui/styles';
import { ServiceForm } from '@/lib/schemas';
import { ImageUploader } from '../ui/ImageUploader';

interface ServiceEditorProps {
    form: Partial<ServiceForm>;
    setForm: (data: any) => void;
}

export const ServiceEditor = ({ form, setForm }: ServiceEditorProps) => {
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">

            {/* Header / Identity */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Field label="اسم الخدمة / الطبيب" icon={Briefcase}>
                    <input
                        className={`${inputStyles} text-xl font-bold`}
                        value={form.name || ''}
                        onChange={e => setForm({ ...form, name: e.target.value })}
                    />
                </Field>

                <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">التصنيف (النوع)</label>
                    <div className="flex flex-wrap gap-2">
                        {['طبيب', 'محامي', 'مترجم', 'عقارات', 'تعليم', 'تجميل', 'تأمين', 'سيارات', 'مطاعم', 'شحن', 'سياحة', 'خدمات عامة'].map(cat => (
                            <button
                                key={cat}
                                onClick={() => setForm({ ...form, category: cat })}
                                className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all ${form.category === cat
                                    ? 'bg-blue-600 text-white border-blue-600 shadow-md transform scale-105'
                                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-blue-300'
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="md:col-span-2">
                    <ImageUploader
                        label="صورة شخصية / شعار"
                        value={form.image || undefined}
                        onChange={(url) => setForm({ ...form, image: url })}
                        bucket="images"
                    />
                </div>

                <Field label="المدينة" icon={MapPin}>
                    <input
                        className={inputStyles}
                        value={form.city || ''}
                        onChange={e => setForm({ ...form, city: e.target.value })}
                        placeholder="مثال: Istanbul"
                    />
                </Field>

                <Field label="رقم الهاتف" icon={Phone}>
                    <input
                        className={`${ltrInputStyles} font-mono text-lg tracking-wider text-emerald-700`}
                        value={form.phone || ''}
                        onChange={e => setForm({ ...form, phone: e.target.value })}
                        placeholder="+90 555 123 4567"
                    />
                </Field>
            </div>

            {/* Active Toggle Removed: Service Providers likely do not have an active column */}

            <Field label="وصف الخدمة / نبذة" icon={Clock}>
                <textarea
                    className={`${textareaStyles} h-32`}
                    value={form.description || ''}
                    onChange={e => setForm({ ...form, description: e.target.value })}
                />
            </Field>

        </div>
    );
};
