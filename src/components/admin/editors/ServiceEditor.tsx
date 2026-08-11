import {
    BadgeCheck,
    Briefcase,
    Building2,
    Clock,
    Globe2,
    Languages,
    MapPin,
    Navigation,
    Phone,
    CircleAlert,
    CircleCheck,
} from 'lucide-react';
import { Field } from '../ui/Field';
import { inputStyles, textareaStyles, ltrInputStyles } from '../ui/styles';
import { ServiceForm } from '@/lib/schemas';
import { ImageUploader } from '../ui/ImageUploader';
import { SERVICE_CATEGORIES } from '@/lib/serviceCategories';
import { TR_CITIES } from '@/lib/turkishCities';
import {
    SERVICE_DESCRIPTION_MIN_WORDS,
    countServiceDescriptionWords,
    isGeneratedServiceDescription,
    isValidExplicitWhatsApp,
} from '@/lib/serviceProviderQuality';

type VerificationLevel = 'listed' | 'source_checked' | 'claimed' | 'credential_verified';

export type ServiceEditorForm = Partial<ServiceForm> & {
    district?: string | null;
    whatsapp?: string | null;
    website?: string | null;
    email?: string | null;
    google_maps_url?: string | null;
    languages?: string[];
    verification_level?: VerificationLevel;
    last_verified_at?: string | null;
    is_featured?: boolean;
    status?: string;
};

interface ServiceEditorProps {
    form: ServiceEditorForm;
    setForm: (data: ServiceEditorForm) => void;
}

const VERIFICATION_LEVELS: Array<{
    value: VerificationLevel;
    label: string;
}> = [
    { value: 'listed', label: 'مدرج فقط - لم نتحقق بعد' },
    { value: 'source_checked', label: 'تم فحص المصدر والتواصل' },
    { value: 'claimed', label: 'طالب المزود بصفحته' },
    { value: 'credential_verified', label: 'تم فحص الترخيص أو الوثائق' },
];

export const ServiceEditor = ({ form, setForm }: ServiceEditorProps) => {
    const languagesValue = Array.isArray(form.languages) ? form.languages.join('، ') : '';
    const descriptionWords = countServiceDescriptionWords(form.description);
    const validWhatsApp = isValidExplicitWhatsApp(form.whatsapp);
    const generatedDescription = isGeneratedServiceDescription(form.description);
    const readyToPublish = validWhatsApp &&
        descriptionWords >= SERVICE_DESCRIPTION_MIN_WORDS &&
        !generatedDescription;

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Field label="اسم المزود أو المنشأة" icon={Building2}>
                    <input
                        required
                        className={`${inputStyles} text-lg font-bold`}
                        value={form.name || ''}
                        onChange={(event) => setForm({ ...form, name: event.target.value })}
                        placeholder="مثال: عيادة النور لطب الأسنان"
                    />
                </Field>

                <Field label="التصنيف الرئيسي" icon={Briefcase}>
                    <select
                        required
                        className={inputStyles}
                        value={form.category || ''}
                        onChange={(event) => setForm({ ...form, category: event.target.value })}
                    >
                        <option value="">اختر التصنيف</option>
                        {SERVICE_CATEGORIES.map((category) => (
                            <option key={category.slug} value={category.name}>
                                {category.labelAr}
                            </option>
                        ))}
                    </select>
                </Field>

                <div className="md:col-span-2">
                    <Field label="التخصص أو الخدمة الدقيقة" icon={Briefcase}>
                        <input
                            required
                            className={inputStyles}
                            value={form.profession || ''}
                            onChange={(event) => setForm({ ...form, profession: event.target.value })}
                            placeholder="مثال: طبيب أطفال، محامي هجرة، تمديدات صحية"
                        />
                    </Field>
                </div>

                <Field label="المدينة" icon={MapPin}>
                    <select
                        required
                        className={inputStyles}
                        value={form.city || ''}
                        onChange={(event) => setForm({ ...form, city: event.target.value })}
                    >
                        <option value="">اختر المدينة</option>
                        {TR_CITIES.map((city) => (
                            <option key={city.slug} value={city.ar}>{city.ar}</option>
                        ))}
                    </select>
                </Field>

                <Field label="الحي أو المنطقة" icon={Navigation}>
                    <input
                        className={inputStyles}
                        value={form.district || ''}
                        onChange={(event) => setForm({ ...form, district: event.target.value })}
                        placeholder="مثال: الفاتح، شاهين بيه"
                    />
                </Field>

                <Field label="رقم الاتصال العادي - اختياري" icon={Phone}>
                    <input
                        inputMode="tel"
                        className={`${ltrInputStyles} font-mono text-base text-emerald-700`}
                        value={form.phone || ''}
                        onChange={(event) => setForm({ ...form, phone: event.target.value })}
                        placeholder="+90 212 000 00 00"
                    />
                </Field>

                <Field label="رقم واتساب المؤكد - مطلوب للنشر" icon={Phone}>
                    <input
                        inputMode="tel"
                        className={`${ltrInputStyles} font-mono text-base`}
                        value={form.whatsapp || ''}
                        onChange={(event) => setForm({ ...form, whatsapp: event.target.value })}
                        placeholder="+90 5xx xxx xx xx"
                    />
                </Field>

                <div className="md:col-span-2">
                    <Field label="وصف مهني حقيقي" icon={Clock}>
                        <textarea
                            required
                            className={`${textareaStyles} h-40`}
                            value={form.description || ''}
                            onChange={(event) => setForm({ ...form, description: event.target.value })}
                            placeholder="اشرح الخدمات والخبرة ونطاق العمل وأوقات التواصل وما يحتاج العميل إلى معرفته. الحد الأدنى 40 كلمة."
                        />
                    </Field>
                    <div className={`mt-2 flex flex-wrap items-center justify-between gap-2 rounded-xl border px-3 py-2 text-xs font-bold ${readyToPublish ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/20 dark:text-emerald-200' : 'border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/20 dark:text-rose-200'}`}>
                        <span className="inline-flex items-center gap-2">
                            {readyToPublish ? <CircleCheck size={16} /> : <CircleAlert size={16} />}
                            {readyToPublish ? 'جاهز للنشر العام والفهرسة' : 'غير جاهز للنشر العام'}
                        </span>
                        <span className="tabular-nums">
                            الوصف: {descriptionWords}/{SERVICE_DESCRIPTION_MIN_WORDS} كلمة · واتساب: {validWhatsApp ? 'صحيح' : 'ناقص أو غير صحيح'}
                        </span>
                        {generatedDescription && <span className="w-full">هذا وصف آلي قديم؛ استبدله بوصف كتبه مقدم الخدمة أو راجعته الإدارة.</span>}
                    </div>
                </div>

                <div className="md:col-span-2">
                    <ImageUploader
                        label="شعار أو صورة مقدمة من صاحب الخدمة"
                        value={form.image || undefined}
                        onChange={(url) => setForm({ ...form, image: url })}
                        bucket="images"
                    />
                </div>
            </div>

            <details className="group border-t border-slate-200 dark:border-slate-800 pt-4">
                <summary className="cursor-pointer list-none flex items-center justify-between gap-3 py-2 font-black text-slate-800 dark:text-slate-100">
                    <span className="inline-flex items-center gap-2">
                        <BadgeCheck size={18} className="text-blue-500" />
                        التحقق والروابط المتقدمة
                    </span>
                    <span className="text-xs text-slate-400 group-open:hidden">إظهار</span>
                    <span className="text-xs text-slate-400 hidden group-open:inline">إخفاء</span>
                </summary>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-4">
                    <Field label="درجة التحقق" icon={BadgeCheck}>
                        <select
                            className={inputStyles}
                            value={form.verification_level || 'listed'}
                            onChange={(event) => setForm({
                                ...form,
                                verification_level: event.target.value as VerificationLevel,
                            })}
                        >
                            {VERIFICATION_LEVELS.map((level) => (
                                <option key={level.value} value={level.value}>{level.label}</option>
                            ))}
                        </select>
                    </Field>

                    <Field label="آخر فحص للمعلومات" icon={Clock}>
                        <input
                            type="datetime-local"
                            className={inputStyles}
                            value={form.last_verified_at?.slice(0, 16) || ''}
                            onChange={(event) => setForm({
                                ...form,
                                last_verified_at: event.target.value
                                    ? new Date(event.target.value).toISOString()
                                    : null,
                            })}
                        />
                    </Field>

                    <Field label="الموقع الرسمي" icon={Globe2}>
                        <input
                            type="url"
                            dir="ltr"
                            className={ltrInputStyles}
                            value={form.website || ''}
                            onChange={(event) => setForm({ ...form, website: event.target.value })}
                            placeholder="https://example.com"
                        />
                    </Field>

                    <Field label="رابط الموقع على الخريطة" icon={MapPin}>
                        <input
                            type="url"
                            dir="ltr"
                            className={ltrInputStyles}
                            value={form.google_maps_url || ''}
                            onChange={(event) => setForm({ ...form, google_maps_url: event.target.value })}
                            placeholder="https://maps.google.com/..."
                        />
                    </Field>

                    <Field label="اللغات المعلنة" icon={Languages}>
                        <input
                            className={inputStyles}
                            value={languagesValue}
                            onChange={(event) => setForm({
                                ...form,
                                languages: event.target.value
                                    .split(/[،,]/)
                                    .map((value) => value.trim())
                                    .filter(Boolean),
                            })}
                            placeholder="العربية، التركية، الإنجليزية"
                        />
                    </Field>

                    <Field label="البريد المهني" icon={Globe2}>
                        <input
                            type="email"
                            dir="ltr"
                            className={ltrInputStyles}
                            value={form.email || ''}
                            onChange={(event) => setForm({ ...form, email: event.target.value })}
                            placeholder="info@example.com"
                        />
                    </Field>

                    <label className="inline-flex items-center gap-3 min-h-12 px-4 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-sm">
                        <input
                            type="checkbox"
                            checked={Boolean(form.is_featured)}
                            onChange={(event) => setForm({ ...form, is_featured: event.target.checked })}
                        />
                        مزود مميّز
                    </label>

                    <Field label="حالة النشر" icon={BadgeCheck}>
                        <select
                            className={inputStyles}
                            value={form.status || 'pending'}
                            onChange={(event) => setForm({ ...form, status: event.target.value })}
                        >
                            <option value="draft">مسودة</option>
                            <option value="pending">بانتظار المراجعة</option>
                            <option value="approved">منشور</option>
                            <option value="rejected">مرفوض</option>
                        </select>
                    </Field>
                </div>
            </details>
        </div>
    );
};
