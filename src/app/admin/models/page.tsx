'use client';

/* eslint-disable @next/next/no-img-element */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import { compressImage } from '@/lib/imageOptimize';
import { watermarkModelImage } from '@/lib/models/watermark';
import type { ModelAsset, ModelCollection, ModelLinkView, ModelShareLink } from '@/lib/models/types';
import {
  Ban,
  Clock3,
  Copy,
  ExternalLink,
  Eye,
  Images,
  Link2,
  Loader2,
  Plus,
  RefreshCw,
  Save,
  ShieldCheck,
  Trash2,
  UploadCloud,
} from 'lucide-react';
import { toast } from 'sonner';

type AdminModelAsset = ModelAsset & { preview_url?: string | null };
type AdminModelLink = ModelShareLink & { views?: ModelLinkView[] };
type AdminModelCollection = ModelCollection & {
  assets: AdminModelAsset[];
  links: AdminModelLink[];
};

const DEFAULT_FORM = {
  title: '',
  description: '',
  watermark_text: 'موديلس',
  is_active: true,
};

function formatDate(value: string | null) {
  if (!value) return '-';
  return new Date(value).toLocaleString('tr-TR');
}

function linkStatus(link: AdminModelLink) {
  if (link.revoked_at) return { label: 'ملغي', cls: 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300' };
  if (new Date(link.expires_at).getTime() <= Date.now()) return { label: 'منتهي', cls: 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300' };
  if (link.max_views !== null && link.view_count >= link.max_views) return { label: 'اكتمل العدد', cls: 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300' };
  return { label: 'فعال', cls: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300' };
}

function simpleDevice(userAgent?: string | null) {
  const ua = (userAgent || '').toLowerCase();
  if (!ua) return 'غير معروف';
  if (ua.includes('iphone') || ua.includes('android') || ua.includes('mobile')) return 'هاتف';
  if (ua.includes('ipad') || ua.includes('tablet')) return 'تابلت';
  return 'كمبيوتر';
}

export default function AdminModelsPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [collections, setCollections] = useState<AdminModelCollection[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [generatedUrl, setGeneratedUrl] = useState('');
  const [linkForm, setLinkForm] = useState({ label: '', durationMinutes: 60, maxViews: '' });

  const selected = useMemo(
    () => collections.find((collection) => collection.id === selectedId) || collections[0] || null,
    [collections, selectedId],
  );

  useEffect(() => {
    if (selected && selected.id !== selectedId) setSelectedId(selected.id);
  }, [selected, selectedId]);

  useEffect(() => {
    if (!selected) {
      setForm(DEFAULT_FORM);
      return;
    }
    setForm({
      title: selected.title || '',
      description: selected.description || '',
      watermark_text: selected.watermark_text || 'موديلس',
      is_active: selected.is_active,
    });
  }, [selected]);

  const loadModels = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/models', { cache: 'no-store' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'فشل تحميل موديلس');
      setCollections(data.collections || []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'فشل تحميل البيانات');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadModels();
  }, [loadModels]);

  async function saveCollection() {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selected?.id, ...form }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'فشل حفظ المجموعة');
      toast.success('تم حفظ مجموعة النماذج');
      await loadModels();
      setSelectedId(data.collection?.id || selected?.id || null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'فشل الحفظ');
    } finally {
      setSaving(false);
    }
  }

  async function createCollection() {
    setForm(DEFAULT_FORM);
    setSelectedId(null);
    setGeneratedUrl('');
    toast.message('اكتب عنوان المجموعة ثم اضغط حفظ');
  }

  async function deleteCollection() {
    if (!selected) return;
    if (!confirm('سيتم حذف المجموعة وكل الصور والروابط التابعة لها. هل أنت متأكد؟')) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/models?id=${encodeURIComponent(selected.id)}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'فشل الحذف');
      toast.success('تم حذف المجموعة');
      setSelectedId(null);
      await loadModels();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'فشل الحذف');
    } finally {
      setSaving(false);
    }
  }

  async function uploadFiles(files: FileList | null) {
    if (!selected || !files || files.length === 0) return;
    setUploading(true);
    const toastId = toast.loading(`جاري رفع ${files.length} صورة...`);
    try {
      for (const raw of Array.from(files)) {
        const compressed = await compressImage(raw, 1800, 0.86);
        const watermarked = await watermarkModelImage(compressed, form.watermark_text || 'موديلس');
        const payload = new FormData();
        payload.append('collectionId', selected.id);
        payload.append('file', watermarked);
        payload.append('title', raw.name.replace(/\.[^.]+$/, ''));
        const res = await fetch('/api/admin/models/upload', { method: 'POST', body: payload });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || `فشل رفع ${raw.name}`);
      }
      toast.success('تم رفع الصور', { id: toastId });
      await loadModels();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'فشل الرفع', { id: toastId });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function updateAsset(assetId: string, data: Partial<Pick<ModelAsset, 'title' | 'caption' | 'sort_order' | 'is_active'>>) {
    try {
      const res = await fetch('/api/admin/models/assets', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: assetId, data }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || 'فشل تعديل الصورة');
      await loadModels();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'فشل تعديل الصورة');
    }
  }

  async function deleteAsset(assetId: string) {
    if (!confirm('حذف الصورة من موديلس؟')) return;
    try {
      const res = await fetch(`/api/admin/models/assets?id=${encodeURIComponent(assetId)}`, { method: 'DELETE' });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || 'فشل حذف الصورة');
      toast.success('تم حذف الصورة');
      await loadModels();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'فشل حذف الصورة');
    }
  }

  async function generateLink() {
    if (!selected) return;
    setSaving(true);
    setGeneratedUrl('');
    try {
      const res = await fetch('/api/admin/models/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          collectionId: selected.id,
          label: linkForm.label,
          durationMinutes: linkForm.durationMinutes,
          maxViews: linkForm.maxViews ? Number(linkForm.maxViews) : null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'فشل توليد الرابط');
      setGeneratedUrl(data.url);
      await navigator.clipboard?.writeText(data.url).catch(() => {});
      toast.success('تم توليد الرابط ونسخه');
      await loadModels();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'فشل توليد الرابط');
    } finally {
      setSaving(false);
    }
  }

  async function revokeLink(id: string) {
    if (!confirm('إلغاء هذا الرابط فوراً؟')) return;
    try {
      const res = await fetch('/api/admin/models/links', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'فشل إلغاء الرابط');
      toast.success('تم إلغاء الرابط');
      await loadModels();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'فشل إلغاء الرابط');
    }
  }

  async function copyGenerated() {
    if (!generatedUrl) return;
    await navigator.clipboard?.writeText(generatedUrl);
    toast.success('تم نسخ الرابط');
  }

  return (
    <div className="mx-auto max-w-7xl space-y-5 p-3 sm:p-6">
      <AdminPageHeader
        icon={Images}
        theme="cyan"
        title="موديلس"
        eyebrow="نماذج خاصة"
        subtitle="معرض صور خاص بروابط مؤقتة لا تظهر للعامة ولا لمحركات البحث"
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void loadModels()}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
            >
              <RefreshCw size={15} />
              تحديث
            </button>
            <button
              type="button"
              onClick={() => void createCollection()}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-black text-white hover:bg-emerald-700"
            >
              <Plus size={15} />
              مجموعة جديدة
            </button>
          </div>
        }
      />

      {loading ? (
        <div className="flex min-h-[360px] items-center justify-center rounded-3xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <Loader2 className="animate-spin text-emerald-500" size={32} />
        </div>
      ) : (
        <div className="grid gap-5 xl:grid-cols-[300px_minmax(0,1fr)]">
          <aside className="space-y-3">
            <div className="rounded-3xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-black text-slate-800 dark:text-white">المجموعات</h2>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-black text-slate-500 dark:bg-slate-800">
                  {collections.length}
                </span>
              </div>
              <div className="space-y-2">
                {collections.length === 0 && (
                  <p className="rounded-2xl bg-slate-50 p-4 text-center text-xs leading-6 text-slate-500 dark:bg-slate-800/60">
                    لا توجد مجموعات بعد. أنشئ أول مجموعة نماذج.
                  </p>
                )}
                {collections.map((collection) => (
                  <button
                    key={collection.id}
                    type="button"
                    onClick={() => { setSelectedId(collection.id); setGeneratedUrl(''); }}
                    className={`w-full rounded-2xl border p-3 text-right transition-all ${
                      selected?.id === collection.id
                        ? 'border-emerald-400 bg-emerald-50 text-emerald-900 dark:border-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-100'
                        : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="line-clamp-1 text-sm font-black">{collection.title}</span>
                      <span className="text-[10px] font-bold text-slate-400">{collection.assets.length} صورة</span>
                    </div>
                    <div className="mt-1 text-[11px] text-slate-500">{collection.links.length} رابط</div>
                  </button>
                ))}
              </div>
            </div>
          </aside>

          <section className="space-y-5">
            <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5">
              <div className="grid gap-3 md:grid-cols-2">
                <label className="space-y-1">
                  <span className="text-xs font-black text-slate-500">عنوان المجموعة</span>
                  <input
                    value={form.title}
                    onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                    placeholder="مثال: نماذج الشهادات"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-bold outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-950"
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-xs font-black text-slate-500">العلامة المائية</span>
                  <input
                    value={form.watermark_text}
                    onChange={(e) => setForm((prev) => ({ ...prev, watermark_text: e.target.value }))}
                    placeholder="موديلس"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-bold outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-950"
                  />
                </label>
                <label className="space-y-1 md:col-span-2">
                  <span className="text-xs font-black text-slate-500">وصف اختياري يظهر أعلى الرابط</span>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-950"
                  />
                </label>
              </div>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <label className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(e) => setForm((prev) => ({ ...prev, is_active: e.target.checked }))}
                    className="h-4 w-4 accent-emerald-600"
                  />
                  المجموعة فعالة
                </label>
                <div className="flex gap-2">
                  {selected && (
                    <button
                      type="button"
                      onClick={() => void deleteCollection()}
                      disabled={saving}
                      className="inline-flex items-center gap-2 rounded-xl bg-red-50 px-4 py-2.5 text-sm font-black text-red-600 hover:bg-red-100 disabled:opacity-50 dark:bg-red-900/20 dark:text-red-300"
                    >
                      <Trash2 size={16} />
                      حذف
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => void saveCollection()}
                    disabled={saving || !form.title.trim()}
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-black text-white hover:bg-emerald-700 disabled:opacity-50"
                  >
                    {saving ? <Loader2 className="animate-spin" size={17} /> : <Save size={17} />}
                    حفظ
                  </button>
                </div>
              </div>
            </div>

            {selected && (
              <>
                <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5">
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-black text-slate-900 dark:text-white">الصور</h2>
                      <p className="text-xs text-slate-500">ترفع الصور إلى تخزين خاص، وتظهر للمشاهد عبر الرابط المؤقت فقط.</p>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={(e) => void uploadFiles(e.target.files)}
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-black text-white hover:bg-slate-800 disabled:opacity-60 dark:bg-white dark:text-slate-900"
                    >
                      {uploading ? <Loader2 className="animate-spin" size={17} /> : <UploadCloud size={17} />}
                      رفع صور
                    </button>
                  </div>

                  {selected.assets.length === 0 ? (
                    <div className="rounded-2xl border-2 border-dashed border-slate-200 p-8 text-center text-sm font-bold text-slate-400 dark:border-slate-800">
                      لا توجد صور بعد
                    </div>
                  ) : (
                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                      {selected.assets.map((asset) => (
                        <div key={asset.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950">
                          <div className="relative aspect-[4/3] bg-slate-200 dark:bg-slate-800">
                            {asset.preview_url ? (
                              <img src={asset.preview_url} alt={asset.title || ''} className="h-full w-full object-cover" />
                            ) : (
                              <div className="flex h-full items-center justify-center text-slate-400">
                                <Images size={30} />
                              </div>
                            )}
                            {!asset.is_active && (
                              <div className="absolute inset-0 grid place-items-center bg-slate-950/60 text-sm font-black text-white">
                                مخفية
                              </div>
                            )}
                          </div>
                          <div className="space-y-2 p-3">
                            <input
                              defaultValue={asset.title || ''}
                              onBlur={(e) => void updateAsset(asset.id, { title: e.target.value })}
                              placeholder="عنوان الصورة"
                              className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-bold outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-900"
                            />
                            <div className="flex items-center justify-between gap-2">
                              <button
                                type="button"
                                onClick={() => void updateAsset(asset.id, { is_active: !asset.is_active })}
                                className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-black ${
                                  asset.is_active ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300'
                                }`}
                              >
                                <Eye size={13} />
                                {asset.is_active ? 'ظاهرة' : 'مخفية'}
                              </button>
                              <button
                                type="button"
                                onClick={() => void deleteAsset(asset.id)}
                                className="inline-flex items-center gap-1 rounded-lg bg-red-50 px-2 py-1 text-xs font-black text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-300"
                              >
                                <Trash2 size={13} />
                                حذف
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid gap-5 xl:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
                  <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5">
                    <div className="mb-4 flex items-center gap-2">
                      <div className="rounded-xl bg-emerald-50 p-2 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-300">
                        <Link2 size={20} />
                      </div>
                      <div>
                        <h2 className="text-lg font-black text-slate-900 dark:text-white">توليد رابط مؤقت</h2>
                        <p className="text-xs text-slate-500">افتراضياً: ساعة واحدة، مفتوح لكل من يملك الرابط.</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <label className="space-y-1 block">
                        <span className="text-xs font-black text-slate-500">تسمية الرابط داخلياً</span>
                        <input
                          value={linkForm.label}
                          onChange={(e) => setLinkForm((prev) => ({ ...prev, label: e.target.value }))}
                          placeholder="مثال: عميل أحمد"
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-950"
                        />
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <label className="space-y-1 block">
                          <span className="text-xs font-black text-slate-500">المدة بالدقائق</span>
                          <input
                            type="number"
                            min={5}
                            value={linkForm.durationMinutes}
                            onChange={(e) => setLinkForm((prev) => ({ ...prev, durationMinutes: Number(e.target.value) || 60 }))}
                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-950"
                          />
                        </label>
                        <label className="space-y-1 block">
                          <span className="text-xs font-black text-slate-500">حد مشاهدات اختياري</span>
                          <input
                            type="number"
                            min={1}
                            value={linkForm.maxViews}
                            onChange={(e) => setLinkForm((prev) => ({ ...prev, maxViews: e.target.value }))}
                            placeholder="بدون حد"
                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-950"
                          />
                        </label>
                      </div>
                      <button
                        type="button"
                        onClick={() => void generateLink()}
                        disabled={saving || selected.assets.length === 0}
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-black text-white hover:bg-emerald-700 disabled:opacity-50"
                      >
                        {saving ? <Loader2 className="animate-spin" size={18} /> : <ShieldCheck size={18} />}
                        توليد ونسخ الرابط
                      </button>
                      {generatedUrl && (
                        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-900/50 dark:bg-emerald-900/15">
                          <p className="mb-2 text-xs font-black text-emerald-700 dark:text-emerald-300">الرابط الجديد</p>
                          <div className="flex gap-2">
                            <input
                              readOnly
                              dir="ltr"
                              value={generatedUrl}
                              className="min-w-0 flex-1 rounded-xl border border-emerald-200 bg-white px-3 py-2 text-xs text-slate-700 dark:border-emerald-900/50 dark:bg-slate-950 dark:text-slate-200"
                            />
                            <button onClick={() => void copyGenerated()} className="rounded-xl bg-emerald-600 px-3 text-white" aria-label="نسخ">
                              <Copy size={16} />
                            </button>
                            <a href={generatedUrl} target="_blank" rel="noreferrer" className="grid place-items-center rounded-xl bg-slate-900 px-3 text-white" aria-label="فتح">
                              <ExternalLink size={16} />
                            </a>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5">
                    <h2 className="mb-4 text-lg font-black text-slate-900 dark:text-white">الروابط والمشاهدات</h2>
                    {selected.links.length === 0 ? (
                      <div className="rounded-2xl border-2 border-dashed border-slate-200 p-8 text-center text-sm font-bold text-slate-400 dark:border-slate-800">
                        لا توجد روابط بعد
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {selected.links.map((link) => {
                          const status = linkStatus(link);
                          return (
                            <div key={link.id} className="rounded-2xl border border-slate-200 p-3 dark:border-slate-800">
                              <div className="flex flex-wrap items-start justify-between gap-3">
                                <div>
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-black ${status.cls}`}>
                                      {status.label}
                                    </span>
                                    <span className="text-sm font-black text-slate-900 dark:text-white">
                                      {link.label || 'رابط بدون تسمية'}
                                    </span>
                                  </div>
                                  <div className="mt-1 flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
                                    <span className="inline-flex items-center gap-1"><Clock3 size={12} /> ينتهي: {formatDate(link.expires_at)}</span>
                                    <span className="inline-flex items-center gap-1"><Eye size={12} /> {link.view_count} مشاهدة</span>
                                    {link.max_views !== null && <span>الحد: {link.max_views}</span>}
                                  </div>
                                </div>
                                {!link.revoked_at && new Date(link.expires_at).getTime() > Date.now() && (
                                  <button
                                    type="button"
                                    onClick={() => void revokeLink(link.id)}
                                    className="inline-flex items-center gap-1 rounded-lg bg-red-50 px-2.5 py-1.5 text-xs font-black text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-300"
                                  >
                                    <Ban size={13} />
                                    إلغاء
                                  </button>
                                )}
                              </div>
                              {link.views && link.views.length > 0 && (
                                <div className="mt-3 rounded-xl bg-slate-50 p-2 dark:bg-slate-950">
                                  <p className="mb-1 text-[11px] font-black text-slate-500">آخر المشاهدات</p>
                                  <div className="space-y-1">
                                    {link.views.slice(0, 5).map((view) => (
                                      <div key={view.id} className="flex items-center justify-between gap-2 text-[11px] text-slate-500">
                                        <span>{formatDate(view.viewed_at)}</span>
                                        <span>{simpleDevice(view.user_agent)}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
