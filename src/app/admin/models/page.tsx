'use client';

/* eslint-disable @next/next/no-img-element */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import { compressImage } from '@/lib/imageOptimize';
import { watermarkModelImage } from '@/lib/models/watermark';
import type { ModelAsset, ModelCollection, ModelLinkView, ModelShareLink } from '@/lib/models/types';
import {
  Ban,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Copy,
  Download,
  ExternalLink,
  Globe2,
  Eye,
  Images,
  Link2,
  Loader2,
  LockKeyhole,
  Maximize2,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Search,
  Settings2,
  ShieldCheck,
  Trash2,
  UploadCloud,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

type AdminModelAsset = ModelAsset & { preview_url?: string | null };
type AdminModelLink = ModelShareLink & { views?: ModelLinkView[]; url?: string | null };
type AdminModelCollection = ModelCollection & {
  assets: AdminModelAsset[];
  links: AdminModelLink[];
};
type AdminGalleryFilter = 'all' | 'visible' | 'hidden' | 'locked' | 'public';
type AdminGalleryItem = {
  asset: AdminModelAsset;
  collection: AdminModelCollection;
  shareUrl: string | null;
  searchText: string;
};
type QuickPublishForm = {
  title: string;
  description: string;
  watermark_text: string;
  collection_pin: string;
  pin_hint: string;
  default_link_minutes: number;
  show_in_gallery: boolean;
  is_active: boolean;
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
  watermark_text: '',
  collection_pin: '',
  clear_collection_pin: false,
  pin_hint: '',
  default_link_minutes: 60 * 24 * 30,
  show_in_gallery: false,
  gallery_order: 0,
  is_active: true,
};

const QUICK_PUBLISH_DEFAULT: QuickPublishForm = {
  title: '',
  description: '',
  watermark_text: '',
  collection_pin: '',
  pin_hint: '',
  default_link_minutes: 60 * 24 * 30,
  show_in_gallery: false,
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

function appendAssetParam(baseUrl: string | null | undefined, assetId: string) {
  if (!baseUrl) return null;
  try {
    const url = new URL(baseUrl);
    url.searchParams.set('asset', assetId);
    return url.toString();
  } catch {
    const joiner = baseUrl.includes('?') ? '&' : '?';
    return `${baseUrl}${joiner}asset=${encodeURIComponent(assetId)}`;
  }
}

function collectionMainLink(collection: AdminModelCollection) {
  const now = Date.now();
  return collection.links.find((link) => (
    link.link_kind === 'main'
    && !link.revoked_at
    && new Date(link.expires_at).getTime() > now
    && (link.max_views === null || link.view_count < link.max_views)
  ))
    || collection.links.find((link) => link.link_kind === 'main' && !link.revoked_at)
    || collection.links.find((link) => link.link_kind === 'main')
    || null;
}

function safeDownloadName(collection: AdminModelCollection, asset: AdminModelAsset) {
  const ext = asset.storage_path.split('.').pop()?.replace(/[^a-z0-9]/gi, '').slice(0, 8) || 'jpg';
  const base = `${collection.title || 'model'}-${asset.title || 'image'}`
    .replace(/[\\/:*?"<>|]/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 110) || 'model-image';
  return `${base}.${ext}`;
}

function fileBaseName(name: string) {
  return name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 120);
}

export default function AdminModelsPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const quickFileInputRef = useRef<HTMLInputElement>(null);
  const [collections, setCollections] = useState<AdminModelCollection[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [creatingNew, setCreatingNew] = useState(false);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [quickForm, setQuickForm] = useState<QuickPublishForm>(QUICK_PUBLISH_DEFAULT);
  const [quickFiles, setQuickFiles] = useState<File[]>([]);
  const [quickPreviewUrls, setQuickPreviewUrls] = useState<string[]>([]);
  const [quickSaving, setQuickSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [generatedUrl, setGeneratedUrl] = useState('');
  const [linkForm, setLinkForm] = useState({ label: '', durationMinutes: 60, maxViews: '' });
  const [mainDurationMinutes, setMainDurationMinutes] = useState(60 * 24);
  const [bulkDurationMinutes, setBulkDurationMinutes] = useState(60 * 24 * 2);
  const [rotating, setRotating] = useState(false);
  const [bulkVisibilityChanging, setBulkVisibilityChanging] = useState(false);
  const [assetPinDrafts, setAssetPinDrafts] = useState<Record<string, string>>({});
  const [adminGalleryQuery, setAdminGalleryQuery] = useState('');
  const [adminGalleryFilter, setAdminGalleryFilter] = useState<AdminGalleryFilter>('all');
  const [activeGalleryAssetId, setActiveGalleryAssetId] = useState<string | null>(null);

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
    const visibleCount = collections.filter((collection) => collection.is_active).length;
    const galleryCount = collections.filter((collection) => collection.show_in_gallery).length;
    const publicImagesCount = collections.reduce((total, collection) => total + collection.assets.filter((asset) => asset.show_in_gallery && asset.is_active).length, 0);
    const lockedCount = collections.reduce((total, collection) => (
      total
      + (collection.access_pin_hash ? 1 : 0)
      + collection.assets.filter((asset) => asset.access_pin_hash).length
    ), 0);
    return { imagesCount, lockedCount, visibleCount, galleryCount, publicImagesCount };
  }, [collections]);

  const mainStatus = mainLink ? linkStatus(mainLink) : null;
  const activeTitle = creatingNew ? 'نموذج جديد' : selected?.title || 'اختر نموذجاً';

  const adminGalleryItems = useMemo<AdminGalleryItem[]>(() => collections.flatMap((collection) => {
    const link = collectionMainLink(collection);
    return collection.assets.map((asset) => ({
      asset,
      collection,
      shareUrl: appendAssetParam(link?.url, asset.id),
      searchText: [
        collection.title,
        collection.description,
        asset.title,
        asset.caption,
        asset.pin_hint,
      ].filter(Boolean).join(' ').toLowerCase(),
    }));
  }), [collections]);

  const filteredAdminGalleryItems = useMemo(() => {
    const needle = adminGalleryQuery.trim().toLowerCase();
    return adminGalleryItems.filter((item) => {
      const matchesQuery = !needle || item.searchText.includes(needle);
      if (!matchesQuery) return false;
      if (adminGalleryFilter === 'visible') return item.collection.is_active && item.asset.is_active;
      if (adminGalleryFilter === 'hidden') return !item.collection.is_active || !item.asset.is_active;
      if (adminGalleryFilter === 'locked') return Boolean(item.collection.access_pin_hash || item.asset.access_pin_hash);
      if (adminGalleryFilter === 'public') return item.collection.show_in_gallery && item.asset.show_in_gallery && item.collection.is_active && item.asset.is_active;
      return true;
    });
  }, [adminGalleryFilter, adminGalleryItems, adminGalleryQuery]);

  const activeGalleryIndex = useMemo(
    () => filteredAdminGalleryItems.findIndex((item) => item.asset.id === activeGalleryAssetId),
    [activeGalleryAssetId, filteredAdminGalleryItems],
  );
  const activeGalleryItem = activeGalleryIndex >= 0
    ? filteredAdminGalleryItems[activeGalleryIndex]
    : adminGalleryItems.find((item) => item.asset.id === activeGalleryAssetId) || null;

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
      watermark_text: selected.watermark_text || '',
      collection_pin: '',
      clear_collection_pin: false,
      pin_hint: selected.pin_hint || '',
      default_link_minutes: selected.default_link_minutes || 60 * 24 * 30,
      show_in_gallery: selected.show_in_gallery === true,
      gallery_order: selected.gallery_order || 0,
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

  useEffect(() => {
    const urls = quickFiles.slice(0, 4).map((file) => URL.createObjectURL(file));
    setQuickPreviewUrls(urls);
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [quickFiles]);

  function setQuickFilesFromInput(files: FileList | null) {
    const images = Array.from(files || []).filter((file) => file.type.startsWith('image/'));
    setQuickFiles(images);
    if (!quickForm.title.trim() && images[0]) {
      setQuickForm((prev) => ({ ...prev, title: fileBaseName(images[0].name) || prev.title }));
    }
  }

  async function patchUploadedAsset(
    assetId: string,
    data: Partial<Pick<ModelAsset, 'title' | 'caption' | 'sort_order' | 'is_active' | 'show_in_gallery' | 'pin_hint'>>,
    pin?: string,
  ) {
    const res = await fetch('/api/admin/models/assets', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: assetId, data, pin }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(body.error || 'فشل ضبط خيارات الصورة');
  }

  async function uploadImageToCollection(args: {
    collectionId: string;
    raw: File;
    title: string;
    watermarkText: string;
    isActive: boolean;
    showInGallery: boolean;
  }) {
    const compressed = await compressImage(args.raw, 3200, 0.94);
    const watermarked = args.watermarkText
      ? await watermarkModelImage(compressed, args.watermarkText)
      : compressed;
    const payload = new FormData();
    payload.append('collectionId', args.collectionId);
    payload.append('file', watermarked);
    payload.append('title', args.title);
    const res = await fetch('/api/admin/models/upload', { method: 'POST', body: payload });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `فشل رفع ${args.raw.name}`);
    const asset = data.asset as AdminModelAsset | undefined;
    if (!asset?.id) throw new Error('فشل حفظ بيانات الصورة');
    if (!args.isActive || !args.showInGallery) {
      await patchUploadedAsset(asset.id, {
        is_active: args.isActive,
        show_in_gallery: args.showInGallery,
      });
    }
    return asset;
  }

  async function quickPublish() {
    const title = quickForm.title.trim();
    const description = quickForm.description.trim();
    const watermarkText = quickForm.watermark_text.trim();
    if (!title) {
      toast.error('اكتب تسمية النموذج أولاً');
      return;
    }
    if (quickFiles.length === 0) {
      toast.error('اختر صورة واحدة على الأقل');
      return;
    }

    setQuickSaving(true);
    const toastId = toast.loading(`جاري نشر ${quickFiles.length} صورة...`);
    try {
      const res = await fetch('/api/admin/models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          watermark_text: watermarkText,
          collection_pin: quickForm.collection_pin,
          pin_hint: quickForm.pin_hint,
          default_link_minutes: quickForm.default_link_minutes,
          show_in_gallery: quickForm.show_in_gallery,
          gallery_order: 0,
          is_active: quickForm.is_active,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'فشل إنشاء النموذج');
      const collectionId = data.collection?.id as string | undefined;
      if (!collectionId) throw new Error('فشل إنشاء النموذج');

      for (let index = 0; index < quickFiles.length; index += 1) {
        const raw = quickFiles[index];
        await uploadImageToCollection({
          collectionId,
          raw,
          title: quickFiles.length === 1 ? title : `${title} ${index + 1}`,
          watermarkText,
          isActive: quickForm.is_active,
          showInGallery: quickForm.show_in_gallery,
        });
      }

      const url = typeof data.mainLink?.url === 'string' ? data.mainLink.url : '';
      if (url) {
        setGeneratedUrl(url);
        await navigator.clipboard?.writeText(url).catch(() => {});
      }
      toast.success(url ? 'تم النشر ونسخ الرابط' : 'تم النشر', { id: toastId });
      setQuickForm(QUICK_PUBLISH_DEFAULT);
      setQuickFiles([]);
      if (quickFileInputRef.current) quickFileInputRef.current.value = '';
      await loadModels();
      setCreatingNew(false);
      setSelectedId(collectionId);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'فشل النشر', { id: toastId });
    } finally {
      setQuickSaving(false);
    }
  }

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
        const compressed = await compressImage(raw, 3200, 0.94);
        const watermarkText = form.watermark_text.trim();
        const watermarked = watermarkText ? await watermarkModelImage(compressed, watermarkText) : compressed;
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
    data: Partial<Pick<ModelAsset, 'title' | 'caption' | 'sort_order' | 'is_active' | 'show_in_gallery' | 'pin_hint'>>,
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

  async function setAllModelsVisible(isActive: boolean) {
    const message = isActive
      ? 'سيتم إظهار كل النماذج للعملاء. هل أنت متأكد؟'
      : 'سيتم إخفاء كل النماذج عن العملاء فوراً. هل أنت متأكد؟';
    if (!confirm(message)) return;
    setBulkVisibilityChanging(true);
    try {
      const res = await fetch('/api/admin/models', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'set_all_active', is_active: isActive }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'فشل تعديل ظهور النماذج');
      toast.success(isActive ? 'تم إظهار كل النماذج' : 'تم إخفاء كل النماذج');
      await loadModels();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'فشل تعديل ظهور النماذج');
    } finally {
      setBulkVisibilityChanging(false);
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

  function buildAssetShareUrl(assetId: string) {
    return appendAssetParam(mainLink?.url, assetId);
  }

  async function copyAssetShareUrl(assetId: string) {
    const url = buildAssetShareUrl(assetId);
    if (!url) {
      toast.error('أنشئ الرابط الرئيسي أولاً');
      return;
    }
    await navigator.clipboard?.writeText(url);
    toast.success('تم نسخ رابط هذه الصورة');
  }

  async function copyAdminGalleryShareUrl(item: AdminGalleryItem) {
    if (!item.shareUrl) {
      toast.error('لا يوجد رابط رئيسي صالح لهذا النموذج. افتح النموذج ثم دوّر الرابط.');
      return;
    }
    await navigator.clipboard?.writeText(item.shareUrl);
    toast.success('تم نسخ رابط الصورة للعميل');
  }

  async function copyAdminGalleryImageUrl(item: AdminGalleryItem) {
    if (!item.asset.preview_url) {
      toast.error('الصورة غير متاحة حالياً');
      return;
    }
    await navigator.clipboard?.writeText(item.asset.preview_url);
    toast.success('تم نسخ رابط الصورة المؤقت');
  }

  async function downloadAdminGalleryAsset(item: AdminGalleryItem) {
    if (!item.asset.preview_url) {
      toast.error('الصورة غير متاحة حالياً');
      return;
    }
    try {
      const res = await fetch(item.asset.preview_url);
      if (!res.ok) throw new Error('download_failed');
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = safeDownloadName(item.collection, item.asset);
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(blobUrl);
    } catch {
      window.open(item.asset.preview_url, '_blank', 'noopener,noreferrer');
    }
  }

  function editAdminGalleryAsset(item: AdminGalleryItem) {
    setCreatingNew(false);
    setSelectedId(item.collection.id);
    setGeneratedUrl('');
    window.setTimeout(() => {
      document.getElementById(`asset-editor-${item.asset.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 120);
  }

  function moveAdminGalleryViewer(direction: -1 | 1) {
    if (filteredAdminGalleryItems.length === 0) return;
    const current = activeGalleryIndex >= 0 ? activeGalleryIndex : 0;
    const next = (current + direction + filteredAdminGalleryItems.length) % filteredAdminGalleryItems.length;
    setActiveGalleryAssetId(filteredAdminGalleryItems[next]?.asset.id || null);
  }

  return (
    <div className="mx-auto max-w-6xl space-y-5 p-3 sm:p-6">
      <AdminPageHeader
        icon={Images}
        theme="cyan"
        title="موديلس"
        eyebrow="نشر النماذج"
        subtitle="النموذج هو ألبوم صور لخدمة أو كتاب أو شهادة. اكتب شرحاً قصيراً، ارفع الصور، ثم انسخ الرابط."
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
              تدوير روابط الكل
            </button>
            <button
              type="button"
              onClick={() => void setAllModelsVisible(false)}
              disabled={bulkVisibilityChanging || collections.length === 0}
              className="inline-flex items-center gap-2 rounded-xl bg-red-50 px-3 py-2 text-xs font-black text-red-700 hover:bg-red-100 disabled:opacity-50 dark:bg-red-900/20 dark:text-red-300"
            >
              {bulkVisibilityChanging ? <Loader2 className="animate-spin" size={15} /> : <Ban size={15} />}
              إخفاء الكل
            </button>
            <button
              type="button"
              onClick={() => void setAllModelsVisible(true)}
              disabled={bulkVisibilityChanging || collections.length === 0}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700 hover:bg-emerald-100 disabled:opacity-50 dark:bg-emerald-900/20 dark:text-emerald-300"
            >
              {bulkVisibilityChanging ? <Loader2 className="animate-spin" size={15} /> : <Eye size={15} />}
              إظهار الكل
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
          <QuickPublishPanel
            form={quickForm}
            files={quickFiles}
            previewUrls={quickPreviewUrls}
            busy={quickSaving}
            fileInputRef={quickFileInputRef}
            onFormChange={(updates) => setQuickForm((prev) => ({ ...prev, ...updates }))}
            onPickFiles={() => quickFileInputRef.current?.click()}
            onFilesChange={setQuickFilesFromInput}
            onClearFiles={() => {
              setQuickFiles([]);
              if (quickFileInputRef.current) quickFileInputRef.current.value = '';
            }}
            onSubmit={() => void quickPublish()}
          />

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <Stat label="النماذج" value={collections.length} />
            <Stat label="ظاهرة" value={stats.visibleCount} />
            <Stat label="بالمعرض" value={stats.galleryCount} />
            <Stat label="الصور" value={stats.imagesCount} />
            <Stat label="مقفولة" value={stats.lockedCount} />
          </div>

          <section className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-4">
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="flex items-center gap-2 text-lg font-black text-slate-900 dark:text-white">
                  <Images size={20} />
                  معرض الأدمن لكل الصور
                </h2>
                <p className="text-xs leading-6 text-slate-500">
                  كل الصور المخزنة هنا، سواء كانت ظاهرة للزوار أو خاصة. افتح، انسخ، نزّل، أو انتقل للتعديل فوراً.
                </p>
              </div>
              <div className="flex flex-wrap gap-2 text-[11px] font-black">
                <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  {filteredAdminGalleryItems.length} من {adminGalleryItems.length}
                </span>
                <span className="rounded-full bg-cyan-50 px-3 py-1 text-cyan-700 dark:bg-cyan-900/20 dark:text-cyan-300">
                  {stats.publicImagesCount} صورة عامة
                </span>
              </div>
            </div>

            <div className="mb-4 grid gap-2 lg:grid-cols-[minmax(240px,1fr)_auto]">
              <label className="relative block">
                <Search className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                <input
                  value={adminGalleryQuery}
                  onChange={(e) => setAdminGalleryQuery(e.target.value)}
                  placeholder="ابحث باسم النموذج أو الصورة أو الشرح..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-3 pr-10 text-sm font-bold outline-none focus:border-cyan-500 dark:border-slate-800 dark:bg-slate-950"
                />
              </label>
              <div className="flex flex-wrap gap-2">
                {([
                  ['all', 'الكل'],
                  ['visible', 'ظاهرة'],
                  ['hidden', 'مخفية'],
                  ['locked', 'مقفولة'],
                  ['public', 'عامة'],
                ] as Array<[AdminGalleryFilter, string]>).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setAdminGalleryFilter(value)}
                    className={`rounded-xl px-3 py-2 text-xs font-black transition ${
                      adminGalleryFilter === value
                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {adminGalleryItems.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center dark:border-slate-800">
                <div className="mx-auto mb-3 grid h-11 w-11 place-items-center rounded-2xl bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                  <Images size={22} />
                </div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white">لا توجد صور مخزنة بعد</h3>
                <p className="mt-2 text-xs font-bold leading-6 text-slate-400">
                  أنشئ نموذجاً وارفع صورة أو أكثر، وستظهر هنا تلقائياً.
                </p>
              </div>
            ) : filteredAdminGalleryItems.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-sm font-bold text-slate-400 dark:border-slate-800">
                لا توجد صور تطابق البحث أو الفلتر الحالي.
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {filteredAdminGalleryItems.map((item) => (
                  <AdminGalleryCard
                    key={item.asset.id}
                    item={item}
                    onOpen={() => setActiveGalleryAssetId(item.asset.id)}
                    onCopyShare={() => void copyAdminGalleryShareUrl(item)}
                    onCopyImage={() => void copyAdminGalleryImageUrl(item)}
                    onDownload={() => void downloadAdminGalleryAsset(item)}
                    onEdit={() => editAdminGalleryAsset(item)}
                    onToggleActive={() => void updateAsset(item.asset.id, { is_active: !item.asset.is_active })}
                    onToggleGallery={() => void updateAsset(item.asset.id, { show_in_gallery: !item.asset.show_in_gallery })}
                  />
                ))}
              </div>
            )}
          </section>

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
                  <span className="mt-2 flex flex-wrap gap-1">
                    {!collection.is_active && (
                      <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-black text-red-700 dark:bg-red-900/20 dark:text-red-300">
                        مخفي
                      </span>
                    )}
                    {collection.access_pin_hash && (
                      <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-black text-amber-700 dark:bg-amber-900/20 dark:text-amber-300">
                        PIN
                      </span>
                    )}
                    {collection.show_in_gallery && (
                      <span className="rounded-full bg-cyan-50 px-2 py-0.5 text-[10px] font-black text-cyan-700 dark:bg-cyan-900/20 dark:text-cyan-300">
                        معرض
                      </span>
                    )}
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
                      <span className="text-xs font-black text-slate-500">العلامة المائية (اختياري)</span>
                      <input
                        value={form.watermark_text}
                        onChange={(e) => setForm((prev) => ({ ...prev, watermark_text: e.target.value }))}
                        placeholder="اتركه فارغاً بدون علامة"
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
                    <label className="flex items-center gap-2 rounded-xl border border-cyan-200 bg-cyan-50 px-3 py-2 text-sm font-bold text-cyan-800 dark:border-cyan-900/50 dark:bg-cyan-900/15 dark:text-cyan-200">
                      <input
                        type="checkbox"
                        checked={form.show_in_gallery}
                        onChange={(e) => setForm((prev) => ({ ...prev, show_in_gallery: e.target.checked }))}
                        className="h-4 w-4 accent-cyan-600"
                      />
                      عرض في المعرض العام
                    </label>
                    <label className="space-y-1">
                      <span className="text-xs font-black text-slate-500">ترتيب المعرض</span>
                      <input
                        type="number"
                        value={form.gallery_order}
                        onChange={(e) => setForm((prev) => ({ ...prev, gallery_order: Number(e.target.value) || 0 }))}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold outline-none focus:border-cyan-500 dark:border-slate-700 dark:bg-slate-900"
                      />
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

              {(selected || creatingNew) && (
                <Panel
                  number="2"
                  title="صور النموذج"
                  subtitle={selected ? 'ارفع صورة واحدة أو عدة صور لنفس النموذج مثل الأمام والخلف والتفاصيل.' : 'مكان الصور هنا. احفظ بيانات النموذج أولاً، ثم سيظهر زر رفع الصور في هذا المكان.'}
                  action={selected ? (
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
                  ) : (
                    <button
                      type="button"
                      disabled
                      className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2 text-xs font-black text-slate-400 dark:bg-slate-800"
                    >
                      <UploadCloud size={16} />
                      احفظ أولاً
                    </button>
                  )}
                >
                  {!selected ? (
                    <div className="rounded-xl border-2 border-dashed border-emerald-200 bg-emerald-50/50 p-8 text-center dark:border-emerald-900/50 dark:bg-emerald-900/10">
                      <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-white text-emerald-700 shadow-sm dark:bg-slate-900 dark:text-emerald-300">
                        <UploadCloud size={24} />
                      </div>
                      <h3 className="text-sm font-black text-slate-900 dark:text-white">هنا تضيف صور النموذج</h3>
                      <p className="mx-auto mt-2 max-w-md text-xs leading-6 text-slate-500">
                        اكتب العنوان والشرح واضغط حفظ ونشر. بعدها ارفع صورة واحدة أو عدة صور لنفس الخدمة، وتقدر تقفل صورة معينة أو تخفيها لاحقاً.
                      </p>
                    </div>
                  ) : selected.assets.length === 0 ? (
                    <div className="rounded-xl border-2 border-dashed border-slate-200 p-8 text-center dark:border-slate-800">
                      <div className="mx-auto mb-3 grid h-11 w-11 place-items-center rounded-2xl bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                        <Images size={22} />
                      </div>
                      <h3 className="text-sm font-black text-slate-900 dark:text-white">لا توجد صور بعد</h3>
                      <p className="mt-2 text-xs font-bold leading-6 text-slate-400">
                        اضغط رفع صور لإضافة صورة أو عدة صور. كل الصور ستظهر للعميل داخل نفس الرابط.
                      </p>
                    </div>
                  ) : (
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                      {selected.assets.map((asset) => (
                        <div
                          key={asset.id}
                          id={`asset-editor-${asset.id}`}
                          className="scroll-mt-24 overflow-hidden rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950"
                        >
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
                              {asset.show_in_gallery && <Badge tone="cyan">معرض</Badge>}
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
                              <button
                                type="button"
                                onClick={() => void copyAssetShareUrl(asset.id)}
                                disabled={!mainLink?.url || !asset.is_active}
                                className="inline-flex items-center gap-1 rounded-lg bg-cyan-50 px-2 py-1 text-xs font-black text-cyan-700 hover:bg-cyan-100 disabled:opacity-40 dark:bg-cyan-900/20 dark:text-cyan-300"
                              >
                                <Copy size={13} />
                                رابط الصورة
                              </button>
                              <button
                                type="button"
                                onClick={() => void updateAsset(asset.id, { show_in_gallery: !asset.show_in_gallery })}
                                disabled={!asset.is_active}
                                className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-black disabled:opacity-40 ${
                                  asset.show_in_gallery
                                    ? 'bg-cyan-50 text-cyan-700 dark:bg-cyan-900/20 dark:text-cyan-300'
                                    : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300'
                                }`}
                              >
                                <Globe2 size={13} />
                                {asset.show_in_gallery ? 'بالمعرض' : 'خارج المعرض'}
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

      {activeGalleryItem && (
        <AdminGalleryLightbox
          item={activeGalleryItem}
          position={activeGalleryIndex >= 0 ? activeGalleryIndex + 1 : 1}
          total={filteredAdminGalleryItems.length || adminGalleryItems.length}
          onClose={() => setActiveGalleryAssetId(null)}
          onPrev={() => moveAdminGalleryViewer(-1)}
          onNext={() => moveAdminGalleryViewer(1)}
          onCopyShare={() => void copyAdminGalleryShareUrl(activeGalleryItem)}
          onCopyImage={() => void copyAdminGalleryImageUrl(activeGalleryItem)}
          onDownload={() => void downloadAdminGalleryAsset(activeGalleryItem)}
          onEdit={() => {
            editAdminGalleryAsset(activeGalleryItem);
            setActiveGalleryAssetId(null);
          }}
        />
      )}
    </div>
  );
}

function QuickPublishPanel({
  form,
  files,
  previewUrls,
  busy,
  fileInputRef,
  onFormChange,
  onPickFiles,
  onFilesChange,
  onClearFiles,
  onSubmit,
}: {
  form: QuickPublishForm;
  files: File[];
  previewUrls: string[];
  busy: boolean;
  fileInputRef: React.RefObject<HTMLInputElement>;
  onFormChange: (updates: Partial<QuickPublishForm>) => void;
  onPickFiles: () => void;
  onFilesChange: (files: FileList | null) => void;
  onClearFiles: () => void;
  onSubmit: () => void;
}) {
  const canSubmit = Boolean(form.title.trim()) && files.length > 0 && !busy;

  return (
    <section className="rounded-2xl border-2 border-emerald-200 bg-white p-4 shadow-sm dark:border-emerald-900/50 dark:bg-slate-900 sm:p-5">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => onFilesChange(e.target.files)}
      />
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-black text-slate-950 dark:text-white">
            <UploadCloud className="text-emerald-600" size={22} />
            نشر سريع
          </h2>
          <p className="text-xs font-bold leading-6 text-slate-500">
            ارفع صورة أو أكثر، اكتب التسمية، ثم احفظ وانسخ الرابط فوراً.
          </p>
        </div>
        <button
          type="button"
          onClick={onPickFiles}
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-black text-white hover:bg-slate-800 disabled:opacity-50 dark:bg-white dark:text-slate-950"
        >
          <UploadCloud size={17} />
          رفع صورة
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(260px,0.8fr)_minmax(0,1.2fr)]">
        <button
          type="button"
          onClick={onPickFiles}
          disabled={busy}
          className="min-h-[220px] rounded-2xl border-2 border-dashed border-emerald-200 bg-emerald-50/50 p-3 text-right transition hover:border-emerald-400 disabled:opacity-60 dark:border-emerald-900/50 dark:bg-emerald-900/10"
        >
          {previewUrls.length > 0 ? (
            <div className="grid h-full grid-cols-2 gap-2">
              {previewUrls.map((url, index) => (
                <div key={url} className="relative overflow-hidden rounded-xl bg-white shadow-sm dark:bg-slate-950">
                  <img src={url} alt={`صورة ${index + 1}`} className="h-full min-h-[96px] w-full object-cover" />
                </div>
              ))}
              {files.length > previewUrls.length && (
                <div className="grid min-h-[96px] place-items-center rounded-xl bg-white text-sm font-black text-slate-500 dark:bg-slate-950">
                  +{files.length - previewUrls.length}
                </div>
              )}
            </div>
          ) : (
            <div className="grid h-full place-items-center py-8 text-center">
              <div>
                <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-white text-emerald-700 shadow-sm dark:bg-slate-950 dark:text-emerald-300">
                  <Images size={28} />
                </div>
                <div className="text-sm font-black text-slate-900 dark:text-white">اختر الصور</div>
                <div className="mt-1 text-xs font-bold text-slate-500">صورة واحدة أو عدة صور لنفس النموذج</div>
              </div>
            </div>
          )}
        </button>

        <div className="space-y-3">
          <div className="grid gap-3 md:grid-cols-2">
            <label className="space-y-1 md:col-span-2">
              <span className="text-xs font-black text-slate-500">التسمية</span>
              <input
                value={form.title}
                onChange={(e) => onFormChange({ title: e.target.value })}
                placeholder="مثال: شهادة إسعافات أولية"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-bold outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-950"
              />
            </label>
            <label className="space-y-1 md:col-span-2">
              <span className="text-xs font-black text-slate-500">شرح بسطر واحد</span>
              <input
                value={form.description}
                maxLength={220}
                onChange={(e) => onFormChange({ description: e.target.value })}
                placeholder="مثال: نموذج شهادة تدريب قابلة للتوثيق"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-950"
              />
            </label>
            <label className="space-y-1">
              <span className="text-xs font-black text-slate-500">مدة الرابط</span>
              <select
                value={form.default_link_minutes}
                onChange={(e) => onFormChange({ default_link_minutes: Number(e.target.value) })}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-bold outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-950"
              >
                {DURATION_PRESETS.map((preset) => (
                  <option key={preset.minutes} value={preset.minutes}>{preset.label}</option>
                ))}
                <option value={60 * 24 * 30}>30 يوم</option>
              </select>
            </label>
            <label className="space-y-1">
              <span className="text-xs font-black text-slate-500">العلامة المائية</span>
              <input
                value={form.watermark_text}
                onChange={(e) => onFormChange({ watermark_text: e.target.value })}
                placeholder="اختياري"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-bold outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-950"
              />
            </label>
          </div>

          <details className="rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950">
            <summary className="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm font-black text-slate-700 dark:text-slate-200">
              <Settings2 size={16} />
              خيارات النشر
            </summary>
            <div className="grid gap-3 border-t border-slate-200 p-3 dark:border-slate-800 md:grid-cols-2">
              <label className="space-y-1">
                <span className="text-xs font-black text-slate-500">PIN اختياري</span>
                <input
                  value={form.collection_pin}
                  onChange={(e) => onFormChange({ collection_pin: e.target.value })}
                  placeholder="كلمة سر للنموذج"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-900"
                />
              </label>
              <label className="space-y-1">
                <span className="text-xs font-black text-slate-500">تلميح PIN</span>
                <input
                  value={form.pin_hint}
                  onChange={(e) => onFormChange({ pin_hint: e.target.value })}
                  placeholder="مثال: الرقم المرسل لك"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-900"
                />
              </label>
              <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) => onFormChange({ is_active: e.target.checked })}
                  className="h-4 w-4 accent-emerald-600"
                />
                يظهر لمن معه الرابط
              </label>
              <label className="flex items-center gap-2 rounded-xl border border-cyan-200 bg-cyan-50 px-3 py-2 text-sm font-bold text-cyan-800 dark:border-cyan-900/50 dark:bg-cyan-900/15 dark:text-cyan-200">
                <input
                  type="checkbox"
                  checked={form.show_in_gallery}
                  onChange={(e) => onFormChange({ show_in_gallery: e.target.checked })}
                  className="h-4 w-4 accent-cyan-600"
                />
                إدراجه في المعرض العام
              </label>
            </div>
          </details>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs font-bold text-slate-500">
              {files.length > 0 ? `${files.length} صورة جاهزة للنشر` : 'لم يتم اختيار صور بعد'}
            </div>
            <div className="flex flex-wrap gap-2">
              {files.length > 0 && (
                <button
                  type="button"
                  onClick={onClearFiles}
                  disabled={busy}
                  className="rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-black text-slate-600 hover:bg-slate-200 disabled:opacity-50 dark:bg-slate-800 dark:text-slate-300"
                >
                  مسح
                </button>
              )}
              <button
                type="button"
                onClick={onSubmit}
                disabled={!canSubmit}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-black text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {busy ? <Loader2 className="animate-spin" size={17} /> : <Save size={17} />}
                حفظ ونشر
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
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

function AdminGalleryCard({
  item,
  onOpen,
  onCopyShare,
  onCopyImage,
  onDownload,
  onEdit,
  onToggleActive,
  onToggleGallery,
}: {
  item: AdminGalleryItem;
  onOpen: () => void;
  onCopyShare: () => void;
  onCopyImage: () => void;
  onDownload: () => void;
  onEdit: () => void;
  onToggleActive: () => void;
  onToggleGallery: () => void;
}) {
  const isLocked = Boolean(item.collection.access_pin_hash || item.asset.access_pin_hash);
  const isHidden = !item.collection.is_active || !item.asset.is_active;
  const isPublic = item.collection.show_in_gallery && item.asset.show_in_gallery;

  return (
    <article className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50 shadow-sm dark:border-slate-800 dark:bg-slate-950">
      <button
        type="button"
        onClick={onOpen}
        className="group relative block aspect-[4/3] w-full bg-slate-200 text-right dark:bg-slate-800"
        aria-label="فتح الصورة"
      >
        {item.asset.preview_url ? (
          <img src={item.asset.preview_url} alt={item.asset.title || item.collection.title} className="h-full w-full object-cover transition duration-200 group-hover:scale-[1.02]" />
        ) : (
          <div className="grid h-full place-items-center text-slate-400">
            <Images size={30} />
          </div>
        )}
        <div className="absolute right-2 top-2 flex flex-wrap gap-1">
          {isHidden && <Badge tone="slate">مخفي</Badge>}
          {isLocked && <Badge tone="amber">PIN</Badge>}
          {isPublic && <Badge tone="cyan">عام</Badge>}
        </div>
        <span className="absolute left-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-slate-950/70 text-white opacity-0 transition group-hover:opacity-100">
          <Maximize2 size={15} />
        </span>
      </button>
      <div className="space-y-3 p-3">
        <div className="min-w-0">
          <h3 className="line-clamp-1 text-sm font-black text-slate-900 dark:text-white">
            {item.asset.title || item.collection.title}
          </h3>
          <p className="line-clamp-1 text-xs font-bold text-slate-500">{item.collection.title}</p>
        </div>
        <div className="grid grid-cols-4 gap-1.5">
          <button
            type="button"
            onClick={onCopyShare}
            disabled={!item.shareUrl}
            className="grid h-9 place-items-center rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 disabled:opacity-40 dark:bg-emerald-900/20 dark:text-emerald-300"
            aria-label="نسخ رابط العميل"
            title="نسخ رابط العميل"
          >
            <Link2 size={15} />
          </button>
          <button
            type="button"
            onClick={onCopyImage}
            disabled={!item.asset.preview_url}
            className="grid h-9 place-items-center rounded-lg bg-cyan-50 text-cyan-700 hover:bg-cyan-100 disabled:opacity-40 dark:bg-cyan-900/20 dark:text-cyan-300"
            aria-label="نسخ رابط الصورة"
            title="نسخ رابط الصورة المؤقت"
          >
            <Copy size={15} />
          </button>
          <button
            type="button"
            onClick={onDownload}
            disabled={!item.asset.preview_url}
            className="grid h-9 place-items-center rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 disabled:opacity-40 dark:bg-slate-800 dark:text-slate-200"
            aria-label="تنزيل الصورة"
            title="تنزيل الصورة"
          >
            <Download size={15} />
          </button>
          <button
            type="button"
            onClick={onEdit}
            className="grid h-9 place-items-center rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-900/20 dark:text-amber-300"
            aria-label="تعديل الصورة"
            title="تعديل الصورة"
          >
            <Pencil size={15} />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          <button
            type="button"
            onClick={onToggleActive}
            className={`rounded-lg px-2 py-1.5 text-xs font-black ${
              item.asset.is_active
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300'
                : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300'
            }`}
          >
            {item.asset.is_active ? 'ظاهرة' : 'مخفية'}
          </button>
          <button
            type="button"
            onClick={onToggleGallery}
            disabled={!item.asset.is_active}
            className={`rounded-lg px-2 py-1.5 text-xs font-black disabled:opacity-40 ${
              item.asset.show_in_gallery
                ? 'bg-cyan-50 text-cyan-700 dark:bg-cyan-900/20 dark:text-cyan-300'
                : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300'
            }`}
          >
            {item.asset.show_in_gallery ? 'في العام' : 'خاص'}
          </button>
        </div>
      </div>
    </article>
  );
}

function AdminGalleryLightbox({
  item,
  position,
  total,
  onClose,
  onPrev,
  onNext,
  onCopyShare,
  onCopyImage,
  onDownload,
  onEdit,
}: {
  item: AdminGalleryItem;
  position: number;
  total: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  onCopyShare: () => void;
  onCopyImage: () => void;
  onDownload: () => void;
  onEdit: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[80] bg-slate-950 text-white">
      <div className="absolute inset-x-0 top-0 z-10 flex flex-wrap items-center justify-between gap-3 bg-slate-950/85 px-3 py-3 backdrop-blur sm:px-5">
        <div className="min-w-0">
          <h2 className="line-clamp-1 text-sm font-black sm:text-base">
            {item.asset.title || item.collection.title}
          </h2>
          <p className="line-clamp-1 text-xs text-white/60">
            {item.collection.title} · {position} / {total}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={onCopyShare} disabled={!item.shareUrl} className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-500 text-white disabled:opacity-40" aria-label="نسخ رابط العميل" title="نسخ رابط العميل">
            <Link2 size={17} />
          </button>
          <button type="button" onClick={onCopyImage} disabled={!item.asset.preview_url} className="grid h-10 w-10 place-items-center rounded-xl bg-cyan-500 text-white disabled:opacity-40" aria-label="نسخ رابط الصورة" title="نسخ رابط الصورة">
            <Copy size={17} />
          </button>
          <button type="button" onClick={onDownload} disabled={!item.asset.preview_url} className="grid h-10 w-10 place-items-center rounded-xl bg-white/12 text-white disabled:opacity-40" aria-label="تنزيل" title="تنزيل">
            <Download size={17} />
          </button>
          <button type="button" onClick={onEdit} className="grid h-10 w-10 place-items-center rounded-xl bg-amber-500 text-white" aria-label="تعديل" title="تعديل">
            <Pencil size={17} />
          </button>
          <button type="button" onClick={onClose} className="grid h-10 w-10 place-items-center rounded-xl bg-white/12 text-white" aria-label="إغلاق" title="إغلاق">
            <X size={19} />
          </button>
        </div>
      </div>

      <button
        type="button"
        onClick={onPrev}
        className="absolute right-3 top-1/2 z-10 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/12 text-white backdrop-blur hover:bg-white/20"
        aria-label="الصورة السابقة"
      >
        <ChevronRight size={22} />
      </button>
      <button
        type="button"
        onClick={onNext}
        className="absolute left-3 top-1/2 z-10 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/12 text-white backdrop-blur hover:bg-white/20"
        aria-label="الصورة التالية"
      >
        <ChevronLeft size={22} />
      </button>

      <div className="flex h-full items-center justify-center px-3 py-20">
        {item.asset.preview_url ? (
          <img src={item.asset.preview_url} alt={item.asset.title || item.collection.title} className="max-h-full max-w-full object-contain" />
        ) : (
          <div className="grid place-items-center text-white/50">
            <Images size={42} />
          </div>
        )}
      </div>
    </div>
  );
}

function Badge({ tone, children }: { tone: 'slate' | 'amber' | 'cyan'; children: React.ReactNode }) {
  const cls = tone === 'amber'
    ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200'
    : tone === 'cyan'
      ? 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-200'
      : 'bg-slate-900/80 text-white dark:bg-slate-100 dark:text-slate-900';
  return <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${cls}`}>{children}</span>;
}
