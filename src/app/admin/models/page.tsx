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
  LockKeyhole,
  Plus,
  RefreshCw,
  Save,
  Settings2,
  ShieldCheck,
  Trash2,
  UploadCloud,
} from 'lucide-react';
import { toast } from 'sonner';

type AdminModelAsset = ModelAsset & { preview_url?: string | null };
type AdminModelLink = ModelShareLink & { views?: ModelLinkView[]; url?: string | null };
type AdminModelCollection = ModelCollection & {
  assets: AdminModelAsset[];
  links: AdminModelLink[];
};

const DURATION_PRESETS = [
  { label: 'ساعة', minutes: 60 },
  { label: 'يوم', minutes: 60 * 24 },
  { label: 'يومين', minutes: 60 * 24 * 2 },
  { label: 'أسبوع', minutes: 60 * 24 * 7 },
];

const DEFAULT_FORM = {
  title: '',
  description: '',
  watermark_text: 'موديلس',
  collection_pin: '',
  clear_collection_pin: false,
  pin_hint: '',
  default_link_minutes: 60 * 24 * 30,
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
  const [creatingNew, setCreatingNew] = useState(false);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [generatedUrl, setGeneratedUrl] = useState('');
  const [linkForm, setLinkForm] = useState({ label: '', durationMinutes: 60, maxViews: '' });
  const [mainDurationMinutes, setMainDurationMinutes] = useState(60 * 24);
  const [bulkDurationMinutes, setBulkDurationMinutes] = useState(60 * 24 * 2);
  const [rotating, setRotating] = useState(false);
  const [assetPinDrafts, setAssetPinDrafts] = useState<Record<string, string>>({});

  const selected = useMemo(() => {
    if (creatingNew) return null;
    return collections.find((collection) => collection.id === selectedId) || collections[0] || null;
  }, [collections, creatingNew, selectedId]);

  const mainLink = useMemo(
    () => selected?.links.find((link) => link.link_kind === 'main' && !link.revoked_at)
      || selected?.links.find((link) => link.link_kind === 'main')
      || null,
    [selected],
  );

  const linkHistory = useMemo(
    () => selected?.links.filter((link) => link.id !== mainLink?.id) || [],
    [mainLink?.id, selected],
  );

  const stats = useMemo(() => {
    const imagesCount = collections.reduce((total, collection) => total + collection.assets.length, 0);
    const lockedCount = collections.reduce((total, collection) => (
      total
      + (collection.access_pin_hash ? 1 : 0)
      + collection.assets.filter((asset) => asset.access_pin_hash).length
    ), 0);
    const linksCount = collections.reduce((total, collection) => total + collection.links.length, 0);
    return { imagesCount, lockedCount, linksCount };
  }, [collections]);

  const mainStatus = mainLink ? linkStatus(mainLink) : null;
  const activeTitle = creatingNew ? 'نموذج جديد' : selected?.title || 'اختر نموذجاً';

  useEffect(() => {
    if (creatingNew) return;
    if (selected && selected.id !== selectedId) setSelectedId(selected.id);
  }, [creatingNew, selected, selectedId]);

  useEffect(() => {
    if (!selected) {
      setForm(DEFAULT_FORM);
      return;
    }
    setForm({
      title: selected.title || '',
      description: selected.description || '',
      watermark_text: selected.watermark_text || 'موديلس',
      collection_pin: '',
      clear_collection_pin: false,
      pin_hint: selected.pin_hint || '',
      default_link_minutes: selected.default_link_minutes || 60 * 24 * 30,
      is_active: selected.is_active,
    });
    setMainDurationMinutes(selected.default_link_minutes || 60 * 24);
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
        body: JSON.stringify({ id: creatingNew ? undefined : selected?.id, ...form }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'فشل حفظ النموذج');
      if (data.mainLink?.url && creatingNew) {
        setGeneratedUrl(data.mainLink.url);
        await navigator.clipboard?.writeText(data.mainLink.url).catch(() => {});
        toast.success('تم حفظ النموذج ونسخ رابطه');
      } else {
        toast.success('تم حفظ النموذج');
      }
      await loadModels();
      setCreatingNew(false);
      setSelectedId(data.collection?.id || selected?.id || null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'فشل الحفظ');
    } finally {
      setSaving(false);
    }
  }

  function createCollection() {
    setCreatingNew(true);
    setForm(DEFAULT_FORM);
    setSelectedId(null);
    setGeneratedUrl('');
    toast.message('اكتب العنوان ثم اضغط حفظ ونشر');
  }

  async function deleteCollection() {
    if (!selected) return;
    if (!confirm('سيتم حذف النموذج وكل الصور والروابط التابعة له. هل أنت متأكد؟')) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/models?id=${encodeURIComponent(selected.id)}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'فشل الحذف');
      toast.success('تم حذف النموذج');
      setCreatingNew(false);
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

  async function updateAsset(
    assetId: string,
    data: Partial<Pick<ModelAsset, 'title' | 'caption' | 'sort_order' | 'is_active' | 'pin_hint'>>,
    pin?: string,
    clearPin = false,
  ) {
    try {
      const res = await fetch('/api/admin/models/assets', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: assetId, data, pin, clearPin }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || 'فشل تعديل الصورة');
      setAssetPinDrafts((prev) => ({ ...prev, [assetId]: '' }));
      await loadModels();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'فشل تعديل الصورة');
    }
  }

  async function deleteAsset(assetId: string) {
    if (!confirm('حذف الصورة من النموذج؟')) return;
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
          linkKind: 'temporary',
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

  async function createMainLink() {
    if (!selected) return;
    setSaving(true);
    setGeneratedUrl('');
    try {
      const res = await fetch('/api/admin/models/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          collectionId: selected.id,
          linkKind: 'main',
          label: 'الرابط الرئيسي',
          durationMinutes: mainDurationMinutes,
          maxViews: null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'فشل إنشاء الرابط الرئيسي');
      const url = typeof data.url === 'string' ? data.url : '';
      if (url) {
        setGeneratedUrl(url);
        await navigator.clipboard?.writeText(url).catch(() => {});
      }
      toast.success('تم إنشاء الرابط ونسخه');
      await loadModels();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'فشل إنشاء الرابط');
    } finally {
      setSaving(false);
    }
  }

  async function extendLink(id: string) {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/models/links', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: 'extend', durationMinutes: mainDurationMinutes }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'فشل تمديد الرابط');
      toast.success('تم تمديد صلاحية الرابط');
      await loadModels();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'فشل تمديد الرابط');
    } finally {
      setSaving(false);
    }
  }

  async function rotateMainLinks(scope: 'selected' | 'all') {
    if (scope === 'selected' && !selected) return;
    const message = scope === 'all'
      ? 'سيتم إلغاء الروابط الرئيسية القديمة لكل النماذج وإنشاء روابط جديدة. هل أنت متأكد؟'
      : 'سيتم إلغاء الرابط الرئيسي القديم لهذا النموذج وإنشاء رابط جديد. هل أنت متأكد؟';
    if (!confirm(message)) return;

    setRotating(true);
    setGeneratedUrl('');
    try {
      const durationMinutes = scope === 'all' ? bulkDurationMinutes : mainDurationMinutes;
      const res = await fetch('/api/admin/models/links/rotate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scope: scope === 'all' ? 'all' : 'selected',
          collectionId: scope === 'selected' ? selected?.id : undefined,
          durationMinutes,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'فشل تدوير الروابط');
      const links = Array.isArray(data.links) ? data.links : [];
      const firstUrl = links.find((link: { url?: string | null }) => link.url)?.url || '';
      if (firstUrl && scope === 'selected') {
        setGeneratedUrl(firstUrl);
        await navigator.clipboard?.writeText(firstUrl).catch(() => {});
      }
      toast.success(scope === 'all' ? `تم تدوير ${links.length} رابط رئيسي` : 'تم تدوير الرابط ونسخه');
      await loadModels();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'فشل تدوير الروابط');
    } finally {
      setRotating(false);
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

  async function copyUrl(url?: string | null) {
    if (!url) return;
    await navigator.clipboard?.writeText(url);
    toast.success('تم نسخ الرابط');
  }

  return (
    <div className="mx-auto max-w-6xl space-y-5 p-3 sm:p-6">
      <AdminPageHeader
        icon={Images}
        theme="cyan"
        title="موديلس"
        eyebrow="نشر النماذج"
        subtitle="أنشئ نموذجاً، ارفع صوره، ثم انسخ الرابط الخاص من مكان واحد."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={bulkDurationMinutes}
              onChange={(e) => setBulkDurationMinutes(Number(e.target.value))}
              className="rounded-xl border border-slate-200 bg-white px-2 py-2 text-xs font-black text-slate-600 outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
              aria-label="مدة روابط الكل الجديدة"
            >
              {DURATION_PRESETS.map((preset) => (
                <option key={preset.minutes} value={preset.minutes}>{preset.label}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => void rotateMainLinks('all')}
              disabled={rotating || collections.length === 0}
              className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-3 py-2 text-xs font-black text-white hover:bg-amber-600 disabled:opacity-50"
            >
              {rotating ? <Loader2 className="animate-spin" size={15} /> : <RefreshCw size={15} />}
              تدوير الكل
            </button>
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
              onClick={createCollection}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-black text-white hover:bg-emerald-700"
            >
              <Plus size={15} />
              نموذج جديد
            </button>
          </div>
        }
      />

      {loading ? (
        <div className="flex min-h-[360px] items-center justify-center rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <Loader2 className="animate-spin text-emerald-500" size={32} />
        </div>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-4">
            <Stat label="النماذج" value={collections.length} />
            <Stat label="الصور" value={stats.imagesCount} />
            <Stat label="الروابط" value={stats.linksCount} />
            <Stat label="مقفولة" value={stats.lockedCount} />
          </div>

          <section className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-black text-slate-900 dark:text-white">اختر النموذج</h2>
                <p className="text-xs text-slate-500">كل نموذج له صوره ورابطه الخاص.</p>
              </div>
              <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-black text-slate-500 dark:bg-slate-800">
                {activeTitle}
              </span>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {collections.length === 0 && !creatingNew && (
                <div className="w-full rounded-xl border border-dashed border-slate-200 p-5 text-center text-sm font-bold text-slate-400 dark:border-slate-800">
                  ابدأ بإنشاء أول نموذج.
                </div>
              )}
              {creatingNew && (
                <button
                  type="button"
                  className="min-w-[220px] rounded-xl border border-emerald-400 bg-emerald-50 p-3 text-right text-emerald-900 dark:border-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-100"
                >
                  <span className="block text-sm font-black">نموذج جديد</span>
                  <span className="mt-1 block text-[11px] font-bold">اكتب بياناته ثم احفظ</span>
                </button>
              )}
              {collections.map((collection) => (
                <button
                  key={collection.id}
                  type="button"
                  onClick={() => { setCreatingNew(false); setSelectedId(collection.id); setGeneratedUrl(''); }}
                  className={`min-w-[230px] rounded-xl border p-3 text-right transition ${
                    selected?.id === collection.id
                      ? 'border-emerald-400 bg-emerald-50 text-emerald-900 dark:border-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-100'
                      : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-950 dark:hover:border-slate-700'
                  }`}
                >
                  <span className="line-clamp-1 text-sm font-black">{collection.title}</span>
                  <span className="mt-1 block text-[11px] text-slate-500">
                    {collection.assets.length} صورة / {collection.links.length} رابط
                  </span>
                </button>
              ))}
            </div>
          </section>

          <section className="grid gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
            <div className="space-y-5">
              <Panel
                number="1"
                title="بيانات النموذج"
                subtitle="العنوان والشرح المختصر فقط. الرابط الرئيسي يتولد تلقائياً عند الحفظ."
              >
                <div className="grid gap-3 md:grid-cols-2">
                  <label className="space-y-1 md:col-span-2">
                    <span className="text-xs font-black text-slate-500">العنوان</span>
                    <input
                      value={form.title}
                      onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                      placeholder="مثال: شهادة A2 لغة تركية"
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-bold outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-950"
                    />
                  </label>
                  <label className="space-y-1 md:col-span-2">
                    <span className="text-xs font-black text-slate-500">شرح بسطر واحد</span>
                    <input
                      value={form.description}
                      maxLength={220}
                      onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                      placeholder="جملة قصيرة توضح النموذج"
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-950"
                    />
                  </label>
                </div>

                <details className="rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950">
                  <summary className="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm font-black text-slate-700 dark:text-slate-200">
                    <Settings2 size={16} />
                    خيارات متقدمة
                  </summary>
                  <div className="grid gap-3 border-t border-slate-200 p-3 dark:border-slate-800 md:grid-cols-2">
                    <label className="space-y-1">
                      <span className="text-xs font-black text-slate-500">العلامة المائية</span>
                      <input
                        value={form.watermark_text}
                        onChange={(e) => setForm((prev) => ({ ...prev, watermark_text: e.target.value }))}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-900"
                      />
                    </label>
                    <label className="space-y-1">
                      <span className="text-xs font-black text-slate-500">مدة الرابط الافتراضية</span>
                      <select
                        value={form.default_link_minutes}
                        onChange={(e) => setForm((prev) => ({ ...prev, default_link_minutes: Number(e.target.value) }))}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-900"
                      >
                        {DURATION_PRESETS.map((preset) => (
                          <option key={preset.minutes} value={preset.minutes}>{preset.label}</option>
                        ))}
                        <option value={60 * 24 * 30}>30 يوم</option>
                      </select>
                    </label>
                    <label className="space-y-1">
                      <span className="text-xs font-black text-slate-500">PIN للنموذج كله</span>
                      <input
                        value={form.collection_pin}
                        onChange={(e) => setForm((prev) => ({ ...prev, collection_pin: e.target.value, clear_collection_pin: false }))}
                        placeholder={selected?.access_pin_hash ? 'قفل موجود - اكتب لتغييره' : 'اختياري'}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-900"
                      />
                    </label>
                    <label className="space-y-1">
                      <span className="text-xs font-black text-slate-500">تلميح PIN</span>
                      <input
                        value={form.pin_hint}
                        onChange={(e) => setForm((prev) => ({ ...prev, pin_hint: e.target.value }))}
                        placeholder="مثال: الرقم الذي أرسلناه لك"
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-900"
                      />
                    </label>
                    <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                      <input
                        type="checkbox"
                        checked={form.is_active}
                        onChange={(e) => setForm((prev) => ({ ...prev, is_active: e.target.checked }))}
                        className="h-4 w-4 accent-emerald-600"
                      />
                      النموذج فعال
                    </label>
                    <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                      <input
                        type="checkbox"
                        checked={form.clear_collection_pin}
                        onChange={(e) => setForm((prev) => ({ ...prev, clear_collection_pin: e.target.checked, collection_pin: e.target.checked ? '' : prev.collection_pin }))}
                        className="h-4 w-4 accent-emerald-600"
                      />
                      إزالة قفل النموذج
                    </label>
                  </div>
                </details>

                <div className="flex flex-wrap items-center justify-between gap-3">
                  {selected ? (
                    <button
                      type="button"
                      onClick={() => void deleteCollection()}
                      disabled={saving}
                      className="inline-flex items-center gap-2 rounded-xl bg-red-50 px-4 py-2.5 text-sm font-black text-red-600 hover:bg-red-100 disabled:opacity-50 dark:bg-red-900/20 dark:text-red-300"
                    >
                      <Trash2 size={16} />
                      حذف
                    </button>
                  ) : <span />}
                  <button
                    type="button"
                    onClick={() => void saveCollection()}
                    disabled={saving || !form.title.trim()}
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-black text-white hover:bg-emerald-700 disabled:opacity-50"
                  >
                    {saving ? <Loader2 className="animate-spin" size={17} /> : <Save size={17} />}
                    حفظ ونشر
                  </button>
                </div>
              </Panel>

              {selected && (
                <Panel
                  number="2"
                  title="الصور"
                  subtitle="ارفع صورة واحدة أو عدة صور. الخيارات الخاصة بكل صورة موجودة تحتها."
                  action={(
                    <>
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
                        className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-xs font-black text-white hover:bg-slate-800 disabled:opacity-60 dark:bg-white dark:text-slate-900"
                      >
                        {uploading ? <Loader2 className="animate-spin" size={16} /> : <UploadCloud size={16} />}
                        رفع صور
                      </button>
                    </>
                  )}
                >
                  {selected.assets.length === 0 ? (
                    <div className="rounded-xl border-2 border-dashed border-slate-200 p-8 text-center text-sm font-bold text-slate-400 dark:border-slate-800">
                      لا توجد صور بعد
                    </div>
                  ) : (
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                      {selected.assets.map((asset) => (
                        <div key={asset.id} className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950">
                          <div className="relative aspect-[4/3] bg-slate-200 dark:bg-slate-800">
                            {asset.preview_url ? (
                              <img src={asset.preview_url} alt={asset.title || ''} className="h-full w-full object-cover" />
                            ) : (
                              <div className="grid h-full place-items-center text-slate-400">
                                <Images size={30} />
                              </div>
                            )}
                            <div className="absolute right-2 top-2 flex gap-1">
                              {!asset.is_active && <Badge tone="slate">مخفي</Badge>}
                              {asset.access_pin_hash && <Badge tone="amber">PIN</Badge>}
                            </div>
                          </div>
                          <div className="space-y-2 p-3">
                            <input
                              defaultValue={asset.title || ''}
                              onBlur={(e) => void updateAsset(asset.id, { title: e.target.value })}
                              placeholder="عنوان الصورة"
                              className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-bold outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-900"
                            />
                            <details className="rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                              <summary className="cursor-pointer px-2 py-1.5 text-xs font-black text-slate-600 dark:text-slate-300">
                                خيارات الصورة
                              </summary>
                              <div className="space-y-2 border-t border-slate-200 p-2 dark:border-slate-800">
                                <input
                                  defaultValue={asset.pin_hint || ''}
                                  onBlur={(e) => void updateAsset(asset.id, { pin_hint: e.target.value })}
                                  placeholder="تلميح PIN"
                                  className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-950"
                                />
                                <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
                                  <input
                                    value={assetPinDrafts[asset.id] || ''}
                                    onChange={(e) => setAssetPinDrafts((prev) => ({ ...prev, [asset.id]: e.target.value }))}
                                    placeholder={asset.access_pin_hash ? 'PIN جديد' : 'PIN للصورة'}
                                    className="min-w-0 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-bold outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-950"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => void updateAsset(asset.id, {}, assetPinDrafts[asset.id] || undefined)}
                                    disabled={!assetPinDrafts[asset.id]?.trim()}
                                    className="rounded-lg bg-slate-900 px-2 py-1.5 text-xs font-black text-white disabled:opacity-40 dark:bg-white dark:text-slate-900"
                                  >
                                    حفظ
                                  </button>
                                </div>
                              </div>
                            </details>
                            <div className="flex flex-wrap items-center justify-between gap-2">
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
                              {asset.access_pin_hash && (
                                <button
                                  type="button"
                                  onClick={() => void updateAsset(asset.id, {}, undefined, true)}
                                  className="inline-flex items-center gap-1 rounded-lg bg-amber-50 px-2 py-1 text-xs font-black text-amber-700 hover:bg-amber-100 dark:bg-amber-900/20 dark:text-amber-300"
                                >
                                  <LockKeyhole size={13} />
                                  إزالة القفل
                                </button>
                              )}
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
                </Panel>
              )}
            </div>

            <div className="space-y-5">
              {selected ? (
                <>
                  <Panel number="3" title="الرابط" subtitle="انسخ الرابط الرئيسي وأرسله للعميل.">
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-900/50 dark:bg-emerald-900/15">
                      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                        <span className="text-xs font-black text-emerald-700 dark:text-emerald-300">الرابط الرئيسي</span>
                        {mainStatus && (
                          <span className={`rounded-full px-2 py-0.5 text-[11px] font-black ${mainStatus.cls}`}>
                            {mainStatus.label}
                          </span>
                        )}
                      </div>
                      {mainLink ? (
                        <div className="space-y-3">
                          <div className="flex gap-2">
                            <input
                              readOnly
                              dir="ltr"
                              value={mainLink.url || 'رابط قديم - دوّر الرابط لإنشاء رابط قابل للنسخ'}
                              className="min-w-0 flex-1 rounded-xl border border-emerald-200 bg-white px-3 py-2 text-xs text-slate-700 dark:border-emerald-900/50 dark:bg-slate-950 dark:text-slate-200"
                            />
                            <button
                              type="button"
                              onClick={() => void copyUrl(mainLink.url)}
                              disabled={!mainLink.url}
                              className="rounded-xl bg-emerald-600 px-3 text-white disabled:opacity-50"
                              aria-label="نسخ"
                            >
                              <Copy size={16} />
                            </button>
                            {mainLink.url && (
                              <a href={mainLink.url} target="_blank" rel="noreferrer" className="grid place-items-center rounded-xl bg-slate-900 px-3 text-white" aria-label="فتح">
                                <ExternalLink size={16} />
                              </a>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
                            <span className="inline-flex items-center gap-1"><Clock3 size={12} /> ينتهي: {formatDate(mainLink.expires_at)}</span>
                            <span className="inline-flex items-center gap-1"><Eye size={12} /> {mainLink.view_count} مشاهدة</span>
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => void createMainLink()}
                          disabled={saving || selected.assets.length === 0}
                          className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-black text-white hover:bg-emerald-700 disabled:opacity-50"
                        >
                          {saving ? <Loader2 className="animate-spin" size={18} /> : <ShieldCheck size={18} />}
                          إنشاء الرابط الرئيسي
                        </button>
                      )}
                    </div>

                    <div className="space-y-2">
                      <span className="text-xs font-black text-slate-500">مدة التمديد أو التدوير</span>
                      <div className="grid grid-cols-4 gap-2">
                        {DURATION_PRESETS.map((preset) => (
                          <button
                            key={preset.minutes}
                            type="button"
                            onClick={() => setMainDurationMinutes(preset.minutes)}
                            className={`rounded-xl border px-2 py-2 text-xs font-black transition ${
                              mainDurationMinutes === preset.minutes
                                ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300'
                                : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-950'
                            }`}
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid gap-2 sm:grid-cols-2">
                      {mainLink && (
                        <button
                          type="button"
                          onClick={() => void extendLink(mainLink.id)}
                          disabled={saving || selected.assets.length === 0}
                          className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-black text-white hover:bg-emerald-700 disabled:opacity-50"
                        >
                          {saving ? <Loader2 className="animate-spin" size={18} /> : <ShieldCheck size={18} />}
                          تمديد
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => void rotateMainLinks('selected')}
                        disabled={rotating || selected.assets.length === 0}
                        className="flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-3 text-sm font-black text-white hover:bg-amber-600 disabled:opacity-50"
                      >
                        {rotating ? <Loader2 className="animate-spin" size={18} /> : <RefreshCw size={18} />}
                        تدوير الرابط
                      </button>
                    </div>

                    {generatedUrl && (
                      <div className="rounded-xl border border-cyan-200 bg-cyan-50 p-3 dark:border-cyan-900/50 dark:bg-cyan-900/15">
                        <p className="mb-2 text-xs font-black text-cyan-700 dark:text-cyan-300">آخر رابط تم توليده</p>
                        <div className="flex gap-2">
                          <input
                            readOnly
                            dir="ltr"
                            value={generatedUrl}
                            className="min-w-0 flex-1 rounded-xl border border-cyan-200 bg-white px-3 py-2 text-xs text-slate-700 dark:border-cyan-900/50 dark:bg-slate-950 dark:text-slate-200"
                          />
                          <button onClick={() => void copyGenerated()} className="rounded-xl bg-cyan-600 px-3 text-white" aria-label="نسخ">
                            <Copy size={16} />
                          </button>
                        </div>
                      </div>
                    )}
                  </Panel>

                  <details className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <summary className="flex cursor-pointer items-center gap-2 text-sm font-black text-slate-800 dark:text-white">
                      <Link2 size={17} />
                      رابط مؤقت وسجل المشاهدات
                    </summary>
                    <div className="mt-4 space-y-4 border-t border-slate-100 pt-4 dark:border-slate-800">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <input
                          value={linkForm.label}
                          onChange={(e) => setLinkForm((prev) => ({ ...prev, label: e.target.value }))}
                          placeholder="تسمية داخلية"
                          className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-950"
                        />
                        <input
                          type="number"
                          min={5}
                          value={linkForm.durationMinutes}
                          onChange={(e) => setLinkForm((prev) => ({ ...prev, durationMinutes: Number(e.target.value) || 60 }))}
                          placeholder="المدة بالدقائق"
                          className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-950"
                        />
                        <input
                          type="number"
                          min={1}
                          value={linkForm.maxViews}
                          onChange={(e) => setLinkForm((prev) => ({ ...prev, maxViews: e.target.value }))}
                          placeholder="حد مشاهدات اختياري"
                          className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-950"
                        />
                        <button
                          type="button"
                          onClick={() => void generateLink()}
                          disabled={saving || selected.assets.length === 0}
                          className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-black text-white hover:bg-emerald-700 disabled:opacity-50"
                        >
                          توليد رابط مؤقت
                        </button>
                      </div>

                      {linkHistory.length === 0 ? (
                        <p className="rounded-xl bg-slate-50 p-4 text-center text-xs font-bold text-slate-400 dark:bg-slate-950">
                          لا توجد روابط أخرى.
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {linkHistory.map((link) => {
                            const status = linkStatus(link);
                            return (
                              <div key={link.id} className="rounded-xl border border-slate-200 p-3 dark:border-slate-800">
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
                                      <span>ينتهي: {formatDate(link.expires_at)}</span>
                                      <span>{link.view_count} مشاهدة</span>
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
                  </details>
                </>
              ) : (
                <Panel number="3" title="الرابط" subtitle="سيظهر الرابط تلقائياً بعد حفظ النموذج.">
                  <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm font-bold text-slate-400 dark:border-slate-800">
                    احفظ النموذج أولاً، ثم ارفع الصور وانسخ الرابط.
                  </div>
                </Panel>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="text-xs font-black text-slate-500">{label}</div>
      <div className="mt-1 text-2xl font-black text-slate-900 dark:text-white">{value}</div>
    </div>
  );
}

function Panel({
  number,
  title,
  subtitle,
  action,
  children,
}: {
  number: string;
  title: string;
  subtitle: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-emerald-50 text-sm font-black text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300">
            {number}
          </span>
          <div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white">{title}</h2>
            <p className="text-xs leading-6 text-slate-500">{subtitle}</p>
          </div>
        </div>
        {action}
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function Badge({ tone, children }: { tone: 'slate' | 'amber'; children: React.ReactNode }) {
  const cls = tone === 'amber'
    ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200'
    : 'bg-slate-900/80 text-white dark:bg-slate-100 dark:text-slate-900';
  return <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${cls}`}>{children}</span>;
}
