'use client';

/**
 * NewsManager — the admin "newsroom": composer + list for public.updates.
 *
 * Replaces the old UpdatesManager (ContentParsers.tsx) on /admin/updates with
 * the news-redesign fields: category, summary, source, pinned. Those columns
 * are OPTIONAL in the DB (owner runs sql/2026-07-09_news_page_v2.sql later) —
 * so every read tolerates undefined, and a save that fails with "column does
 * not exist" retries with the base columns only and tells the admin to run
 * the migration.
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { adminUpsert, adminUpdate, adminDelete } from '@/lib/adminApi';
import {
  Newspaper, Loader2, Trash2, Pencil, Send, Eye, EyeOff, Pin, X,
  Search, Users, CalendarDays, ExternalLink, RefreshCw, ImageOff,
} from 'lucide-react';
import { toast } from 'sonner';
import { ImageUploader } from '@/components/admin/ui/ImageUploader';
import dynamic from 'next/dynamic';
import logger from '@/lib/logger';
import { stripHtml } from '@/lib/stripHtml';

const RichTextEditor = dynamic(() => import('@/components/admin/ui/RichTextEditor'), { ssr: false });

// === Types ===
type UpdateType = 'news' | 'alert' | 'feature';

type DBUpdate = {
  id: string;
  title: string;
  type: UpdateType;
  content?: string;
  date: string;
  active: boolean;
  link?: string | null;
  image?: string | null;
  created_at?: string;
  // New optional columns — may not exist until the owner runs the migration.
  category?: string | null;
  summary?: string | null;
  source_url?: string | null;
  source_name?: string | null;
  pinned?: boolean | null;
};

type FormState = {
  title: string;
  type: UpdateType;
  category: string;
  summary: string;
  content: string;
  link: string;
  image: string;
  source_name: string;
  source_url: string;
  pinned: boolean;
};

const EMPTY_FORM: FormState = {
  title: '',
  type: 'news',
  category: 'general',
  summary: '',
  content: '',
  link: '',
  image: '',
  source_name: '',
  source_url: '',
  pinned: false,
};

// Fixed UI list — the value is what gets stored in updates.category.
const CATEGORIES: { value: string; label: string }[] = [
  { value: 'official', label: 'قرارات رسمية' },
  { value: 'residence', label: 'إقامات وجنسية' },
  { value: 'work', label: 'عمل واقتصاد' },
  { value: 'education', label: 'تعليم' },
  { value: 'health', label: 'صحة' },
  { value: 'security', label: 'أمن وتنبيهات' },
  { value: 'general', label: 'عام' },
];

const TYPE_LABEL: Record<UpdateType, string> = {
  news: 'خبر',
  alert: 'تنبيه',
  feature: 'جديد الموقع',
};

// Calm palette: emerald is the single accent (news), rose only for alerts,
// slate for the rest.
const TYPE_CHIP: Record<UpdateType, string> = {
  news: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300',
  alert: 'bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300',
  feature: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300',
};

const categoryLabel = (value?: string | null) =>
  (CATEGORIES.find((c) => c.value === value) || CATEGORIES[CATEGORIES.length - 1]).label;

// New-columns tolerance: PostgREST reports a missing column either as code
// PGRST204 or with a message containing column ... does not exist.
const isMissingColumnError = (err: { code?: string; message?: string }) =>
  err.code === 'PGRST204' ||
  (!!err.message && err.message.includes('column') && err.message.includes('does not exist'));

const MIGRATION_TOAST = 'أعمدة الأخبار الجديدة غير مفعّلة بعد — شغّل ملف SQL في Supabase';
const MIGRATION_FILE = 'sql/2026-07-09_news_page_v2.sql';

const inputCls =
  'w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all';
const labelCls =
  'text-xs font-black mb-1.5 block text-slate-700 dark:text-slate-200 uppercase tracking-wider';

type TypeFilter = 'all' | UpdateType;
type StatusFilter = 'all' | 'visible' | 'hidden';
type ReaderRange = 'today' | 'week';

type PerformanceItem = {
  ref: string;
  readers_today: number | string;
  readers_week: number | string;
  views_total?: number | string;
};

type PerformancePayload = {
  summary?: {
    readers_today?: number | string;
    readers_week?: number | string;
  };
  items?: PerformanceItem[];
};

const asNumber = (value: number | string | null | undefined) => Number(value ?? 0);

export default function NewsManager() {
  const [updates, setUpdates] = useState<DBUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editingLoading, setEditingLoading] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  // Original row while editing — preserves date + active on save.
  const [editingRow, setEditingRow] = useState<DBUpdate | null>(null);
  const [sendPush, setSendPush] = useState(true);
  // New items: publish live now (default — keeps the fast one-tap flow) OR
  // save as a hidden draft to review/verify before it goes public. A draft
  // never pushes. Editing preserves the row's existing visibility (list toggle).
  const [goLive, setGoLive] = useState(true);
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [query, setQuery] = useState('');
  const [readerRange, setReaderRange] = useState<ReaderRange>('week');
  const [performance, setPerformance] = useState<PerformancePayload | null>(null);
  const [performanceLoading, setPerformanceLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(20);
  const composerRef = useRef<HTMLDivElement>(null);

  const fetchUpdates = useCallback(async () => {
    if (!supabase) { setLoading(false); return; }
    setLoading(true);
    const { data, error } = await supabase
      .from('updates')
      .select('id,title,type,date,active,link,image,created_at,category,summary,source_url,source_name,pinned')
      .order('created_at', { ascending: false })
      .limit(250);
    if (error) toast.error('فشل تحميل الأخبار: ' + error.message);
    if (data) setUpdates(data as DBUpdate[]);
    setLoading(false);
  }, []);

  const fetchPerformance = useCallback(async () => {
    if (!supabase) { setPerformanceLoading(false); return; }
    setPerformanceLoading(true);

    // Dedicated RPC covers the full newsroom. During the first deployment,
    // fall back to the older mixed-content RPC until the SQL migration lands.
    const dedicated = await supabase.rpc('get_update_performance');
    if (!dedicated.error && dedicated.data) {
      setPerformance(dedicated.data as PerformancePayload);
      setPerformanceLoading(false);
      return;
    }

    const fallback = await supabase.rpc('get_content_performance', { p_limit: 100 });
    if (!fallback.error && fallback.data) {
      const payload = fallback.data as { items?: Array<PerformanceItem & { kind?: string }> };
      setPerformance({ items: (payload.items || []).filter((item) => item.kind === 'update') });
    }
    setPerformanceLoading(false);
  }, []);

  useEffect(() => {
    void fetchUpdates();
    void fetchPerformance();
  }, [fetchUpdates, fetchPerformance]);

  const resetForm = () => {
    setEditingRow(null);
    setForm(EMPTY_FORM);
    setSendPush(true);
    setGoLive(true);
  };

  const startEdit = async (u: DBUpdate) => {
    if (!supabase) return;
    setEditingLoading(u.id);
    const { data, error } = await supabase
      .from('updates')
      .select('*')
      .eq('id', u.id)
      .maybeSingle();
    setEditingLoading(null);
    if (error || !data) {
      toast.error('تعذّر تحميل نص الخبر للتعديل');
      return;
    }
    const fullRow = data as DBUpdate;
    setEditingRow(fullRow);
    setForm({
      title: fullRow.title || '',
      type: fullRow.type || 'news',
      category: fullRow.category || 'general',
      summary: fullRow.summary || '',
      content: fullRow.content || '',
      link: fullRow.link || '',
      image: fullRow.image || '',
      source_name: fullRow.source_name || '',
      source_url: fullRow.source_url || '',
      pinned: !!fullRow.pinned,
    });
    composerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    if (!form.title.trim()) { toast.error('العنوان مطلوب'); return; }
    setSubmitting(true);

    try {
      // Preserve original date + visibility on edit; a new row is live today
      // unless the admin chose "draft" (goLive=false → hidden until published).
      const date = editingRow ? editingRow.date : new Date().toISOString().split('T')[0];
      const active = editingRow ? editingRow.active : goLive;

      const basePayload: Record<string, unknown> = {
        type: form.type,
        title: form.title.trim(),
        content: form.content,
        date,
        link: form.link.trim() || null,
        image: form.image.trim() || null,
        active,
      };
      if (editingRow) basePayload.id = editingRow.id;

      const fullPayload = {
        ...basePayload,
        category: form.category || 'general',
        summary: form.summary.trim() || null,
        source_name: form.source_name.trim() || null,
        source_url: form.source_url.trim() || null,
        pinned: form.pinned,
      };

      // Try the full payload first; if the new columns are missing in the DB,
      // retry with the base columns only and point the admin at the migration.
      let { error } = await adminUpsert('updates', fullPayload);
      if (error && isMissingColumnError(error)) {
        const retry = await adminUpsert('updates', basePayload);
        error = retry.error;
        if (!error) toast.warning(MIGRATION_TOAST, { description: MIGRATION_FILE });
      }
      if (error) {
        toast.error('فشل الحفظ: ' + error.message);
        return;
      }

      // Purge the cached news pages so the change is visible immediately.
      // /updates and /updates/[id] use a long ISR window (see their
      // `export const revalidate`) to keep Supabase egress down — that window
      // is only affordable because publishing purges the cache right here.
      // Fire-and-forget: a failed purge just means the page waits for its
      // next ISR tick, so it must never block or fail the save.
      try {
        const paths = ['/', '/updates'];
        if (editingRow?.id) paths.push(`/updates/${editingRow.id}`);
        void fetch('/api/admin/revalidate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paths }),
        });
      } catch {
        // ignore — cache falls back to its ISR window
      }

      // Notify when an item BECOMES live: a brand-new published row, or a
      // draft flipped to live. The old condition was `!editingRow`, so the
      // most common workflow — save a draft, review it, then publish — never
      // fired the instant path and every such item waited for the 30-minute
      // cron. Re-saving an already-live row still stays silent, and the
      // pipeline dedupes by link, so a later cron pass cannot double-post.
      const becameLive = goLive && (!editingRow || editingRow.active === false);
      if (becameLive && sendPush) {
        try {
          const res = await fetch('/api/admin/notify-now', { method: 'POST' });
          const r = await res.json();
          if (res.ok) {
            const bits: string[] = [];
            if (typeof r.pushSuccess === 'number' && r.pushSuccess > 0) bits.push(`${r.pushSuccess} جهاز`);
            if (r.telegramSent > 0) bits.push('تلغرام');
            toast.success(bits.length ? `تم النشر + إشعار (${bits.join(' + ')})` : 'تم النشر + إشعار');
          } else {
            toast.success('تم النشر');
            toast.error('فشل إرسال الإشعار: ' + (r.error || ''));
          }
        } catch {
          toast.success('تم النشر');
          toast.error('فشل إرسال الإشعار');
        }
      } else {
        toast.success(editingRow ? 'تم حفظ التعديل' : goLive ? 'تم النشر' : 'حُفظ كمسودة (غير ظاهر للزوّار)');
      }

      resetForm();
      void fetchUpdates();
      void fetchPerformance();
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (u: DBUpdate) => {
    if (!confirm(`حذف «${u.title}» نهائياً؟`)) return;
    const toastId = toast.loading('جاري الحذف...');
    const { error } = await adminDelete('updates', u.id);
    if (error) {
      logger.error('Delete update failed:', error);
      toast.error('فشل الحذف: ' + error.message, { id: toastId });
    } else {
      toast.success('تم الحذف', { id: toastId });
      if (editingRow?.id === u.id) resetForm();
      void fetchUpdates();
      void fetchPerformance();
    }
  };

  // Show/hide without deleting — active=false hides the item from visitors
  // but keeps it editable/restorable.
  const toggleActive = async (u: DBUpdate) => {
    const { error } = await adminUpdate('updates', { active: !u.active }, u.id);
    if (error) { toast.error('فشل التحديث: ' + error.message); return; }
    toast.success(u.active ? 'أُخفي عن الزوّار' : 'أصبح ظاهراً');
    // Visibility flips change what visitors see — purge the cached pages too.
    void fetch('/api/admin/revalidate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paths: ['/', '/updates', `/updates/${u.id}`] }),
    }).catch(() => { /* falls back to the ISR window */ });
    void fetchUpdates();
    void fetchPerformance();
  };

  const filtered = useMemo(() => updates.filter((u) => {
    if (typeFilter !== 'all' && u.type !== typeFilter) return false;
    if (statusFilter === 'visible' && !u.active) return false;
    if (statusFilter === 'hidden' && u.active) return false;
    const needle = query.trim().toLocaleLowerCase('ar');
    if (needle) {
      const haystack = [u.title, u.summary, u.content, u.source_name, categoryLabel(u.category)]
        .filter(Boolean)
        .map((value) => stripHtml(String(value)).toLocaleLowerCase('ar'))
        .join(' ');
      if (!haystack.includes(needle)) return false;
    }
    return true;
  }), [updates, typeFilter, statusFilter, query]);

  const performanceById = useMemo(() => new Map(
    (performance?.items || []).map((item) => [String(item.ref), item]),
  ), [performance]);

  const readersKey = readerRange === 'today' ? 'readers_today' : 'readers_week';
  const sorted = useMemo(() => [...filtered].sort((a, b) => {
    const readersA = asNumber(performanceById.get(String(a.id))?.[readersKey]);
    const readersB = asNumber(performanceById.get(String(b.id))?.[readersKey]);
    if (readersB !== readersA) return readersB - readersA;
    return String(b.created_at || b.date || '').localeCompare(String(a.created_at || a.date || ''));
  }), [filtered, performanceById, readersKey]);

  const visibleRows = sorted.slice(0, visibleCount);
  const visibleNews = updates.filter((item) => item.active).length;
  const hiddenNews = updates.length - visibleNews;
  const newsroomReaders = asNumber(performance?.summary?.[readersKey]);

  const qualityIssues = (item: DBUpdate) => {
    const missing: string[] = [];
    if (!item.image) missing.push('صورة');
    if (!stripHtml(item.summary || '').trim()) missing.push('خلاصة');
    if (!item.source_url) missing.push('مصدر');
    return missing;
  };

  const pill = (isOn: boolean) =>
    `px-3 py-1.5 rounded-full text-xs font-black transition-colors ${
      isOn
        ? 'bg-emerald-700 text-white'
        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
    }`;

  return (
    <div className="space-y-4">
      {/* ===== Composer ===== */}
      <div ref={composerRef} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-sm scroll-mt-24">
        <div className="flex items-center justify-between gap-2 mb-4">
          <h3 className="font-black flex items-center gap-2 text-slate-800 dark:text-slate-100">
            <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400">
              <Newspaper size={16} />
            </span>
            {editingRow ? 'تعديل خبر' : 'خبر جديد'}
          </h3>
          {editingRow && (
            <button
              type="button"
              onClick={resetForm}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              <X size={12} />
              إلغاء التعديل
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={labelCls}>العنوان</label>
            <input
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="عنوان واضح ومباشر للخبر"
              className={inputCls}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>النوع</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value as UpdateType })}
                className={inputCls}
              >
                <option value="news">خبر</option>
                <option value="alert">تنبيه</option>
                <option value="feature">جديد الموقع</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>التصنيف</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className={inputCls}
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className={labelCls}>الخلاصة</label>
            <textarea
              rows={2}
              value={form.summary}
              onChange={(e) => setForm({ ...form, summary: e.target.value })}
              placeholder="خلاصة قصيرة تلخّص الخبر"
              className={inputCls}
            />
            <p className="text-[11px] text-slate-400 dark:text-slate-400 mt-1">
              يظهر في قائمة الأخبار — اجعله خلاصة من سطرين
            </p>
          </div>

          <div>
            <label className={labelCls}>المحتوى</label>
            <RichTextEditor
              value={form.content}
              onChange={(html) => setForm({ ...form, content: html })}
              placeholder="اكتب نص الخبر كاملاً..."
              minHeight="220px"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>اسم المصدر (اختياري)</label>
              <input
                value={form.source_name}
                onChange={(e) => setForm({ ...form, source_name: e.target.value })}
                placeholder="مثلاً: إدارة الهجرة"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>رابط المصدر (اختياري)</label>
              <input
                type="url"
                dir="ltr"
                value={form.source_url}
                onChange={(e) => setForm({ ...form, source_url: e.target.value })}
                placeholder="https://..."
                className={inputCls}
              />
            </div>
          </div>

          <div>
            <label className={labelCls}>رابط توجيه بديل (اختياري)</label>
            {/* type="text": the value is usually an INTERNAL path (/article/…) which
                type="url" rejects natively, blocking the whole save. The pattern
                still validates the two legal shapes. */}
            <input
              type="text"
              dir="ltr"
              value={form.link}
              onChange={(e) => setForm({ ...form, link: e.target.value })}
              placeholder="/article/123"
              pattern="(/.*|https?://.*)"
              title="رابط داخلي يبدأ بـ / (مثل ‎/article/123) أو رابط كامل يبدأ بـ https://"
              className={inputCls}
            />
            <p className="text-[11px] text-slate-400 dark:text-slate-400 mt-1">
              مقال أو شرح سابق يظهر كرابط اختياري أسفل الخبر؛ ولا يستبدل صفحة الخبر.
            </p>
          </div>

          <ImageUploader
            label="صورة الخبر (اختياري)"
            value={form.image || undefined}
            onChange={(url) => setForm({ ...form, image: url })}
            bucket="public"
            path="updates"
          />

          <div className="space-y-2">
            {/* Publish state — new items only. Default "نشر الآن" keeps the
                one-tap flow; "مسودة" saves it hidden so the admin can review /
                verify before it goes public (and it never pushes). */}
            {!editingRow && (
              <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/40 p-1.5">
                <button
                  type="button"
                  onClick={() => setGoLive(true)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-black transition-all ${goLive ? 'bg-emerald-700 text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                >
                  <Eye size={14} /> نشر الآن
                </button>
                <button
                  type="button"
                  onClick={() => setGoLive(false)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-black transition-all ${!goLive ? 'bg-amber-500 text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                >
                  <EyeOff size={14} /> حفظ كمسودة
                </button>
              </div>
            )}

            <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/40 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              <input
                type="checkbox"
                checked={form.pinned}
                onChange={(e) => setForm({ ...form, pinned: e.target.checked })}
                className="w-4 h-4 rounded accent-emerald-600"
              />
              <Pin size={16} className="text-slate-500 dark:text-slate-400" />
              <span className="text-sm font-black text-slate-700 dark:text-slate-300">تثبيت كخبر أبرز</span>
            </label>

            {/* Push option — only for a NEW item that goes live now. A draft
                can't notify anyone, so the toggle hides when "مسودة" is picked. */}
            {!editingRow && goLive && (
              <label className="flex items-center gap-3 p-3 rounded-xl border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/50 dark:bg-emerald-900/10 cursor-pointer hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors">
                <input
                  type="checkbox"
                  checked={sendPush}
                  onChange={(e) => setSendPush(e.target.checked)}
                  className="w-4 h-4 rounded accent-emerald-600"
                />
                <Send size={16} className="text-emerald-600" />
                <span className="text-sm font-black text-slate-700 dark:text-slate-300">
                  إرسال إشعار فوري للمشتركين (Telegram + Push + جرس)
                </span>
              </label>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className={`w-full py-3 rounded-xl font-black text-white flex items-center justify-center gap-2 shadow-sm hover:shadow transition-all disabled:opacity-60 active:scale-[0.99] ${
              !editingRow && !goLive
                ? 'bg-amber-500 hover:bg-amber-600'
                : 'bg-emerald-600 hover:bg-emerald-800'
            }`}
          >
            {submitting
              ? <Loader2 size={18} className="animate-spin" />
              : editingRow
                ? 'حفظ التعديل'
                : !goLive
                  ? <><EyeOff size={16} /> حفظ كمسودة</>
                  : sendPush
                    ? <><Send size={16} /> نشر وإرسال إشعار</>
                    : 'نشر الخبر'}
          </button>
        </form>
      </div>

      {/* ===== List ===== */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="border-b border-slate-100 dark:border-slate-800">
          <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2 font-black text-slate-800 dark:text-slate-100">
                سجل الأخبار
                <span className="inline-flex items-center px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-full text-[10px] font-black tabular-nums" dir="ltr">
                  {updates.length}
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                رتّب حسب من دخلوا فعلياً، وافتح الخبر أو عدّله من السطر نفسه.
              </p>
            </div>
            <div className="flex items-center gap-1 rounded-xl border border-slate-200 dark:border-slate-700 p-1 text-xs font-black">
              <button
                type="button"
                onClick={() => setReaderRange('today')}
                className={`rounded-lg px-3 py-1.5 transition-colors ${readerRange === 'today' ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'text-slate-500'}`}
              >
                اليوم
              </button>
              <button
                type="button"
                onClick={() => setReaderRange('week')}
                className={`rounded-lg px-3 py-1.5 transition-colors ${readerRange === 'week' ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'text-slate-500'}`}
              >
                آخر 7 أيام
              </button>
              <button
                type="button"
                onClick={() => void fetchPerformance()}
                title="تحديث عدد الداخلين"
                aria-label="تحديث عدد الداخلين"
                className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-emerald-700 dark:hover:bg-slate-800"
              >
                <RefreshCw size={14} className={performanceLoading ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-3 border-y border-slate-100 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-950/30">
            <div className="p-3 text-center">
              <p className="text-lg font-black tabular-nums text-slate-900 dark:text-white">{visibleNews}</p>
              <p className="text-[10px] font-bold text-slate-500">منشور</p>
            </div>
            <div className="border-x border-slate-200 p-3 text-center dark:border-slate-800">
              <p className="text-lg font-black tabular-nums text-slate-900 dark:text-white">{hiddenNews}</p>
              <p className="text-[10px] font-bold text-slate-500">مسودة أو مخفي</p>
            </div>
            <div className="p-3 text-center">
              <p className="text-lg font-black tabular-nums text-emerald-700 dark:text-emerald-400">
                {performanceLoading ? '…' : performance?.summary ? newsroomReaders.toLocaleString('en-US') : '—'}
              </p>
              <p className="text-[10px] font-bold text-slate-500">دخلوا {readerRange === 'today' ? 'اليوم' : 'خلال 7 أيام'}</p>
            </div>
          </div>

          <div className="space-y-3 p-4">
            <div className="relative">
              <Search size={15} className="absolute start-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(event) => { setQuery(event.target.value); setVisibleCount(20); }}
                placeholder="ابحث بعنوان الخبر أو خلاصته أو مصدره..."
                className={`${inputCls} ps-9`}
              />
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <button type="button" onClick={() => { setTypeFilter('all'); setVisibleCount(20); }} className={pill(typeFilter === 'all')}>كل الأنواع</button>
              <button type="button" onClick={() => { setTypeFilter('news'); setVisibleCount(20); }} className={pill(typeFilter === 'news')}>أخبار</button>
              <button type="button" onClick={() => { setTypeFilter('alert'); setVisibleCount(20); }} className={pill(typeFilter === 'alert')}>تنبيهات</button>
              <button type="button" onClick={() => { setTypeFilter('feature'); setVisibleCount(20); }} className={pill(typeFilter === 'feature')}>جديد الموقع</button>
              <span className="hidden h-5 w-px bg-slate-200 dark:bg-slate-700 sm:block" />
              <button type="button" onClick={() => { setStatusFilter('all'); setVisibleCount(20); }} className={pill(statusFilter === 'all')}>الكل</button>
              <button type="button" onClick={() => { setStatusFilter('visible'); setVisibleCount(20); }} className={pill(statusFilter === 'visible')}>منشور</button>
              <button type="button" onClick={() => { setStatusFilter('hidden'); setVisibleCount(20); }} className={pill(statusFilter === 'hidden')}>مخفي</button>
            </div>
          </div>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {loading && (
            <div className="flex items-center justify-center gap-2 py-12 text-slate-400">
              <Loader2 size={18} className="animate-spin" />
              <span className="text-sm font-bold">جاري التحميل...</span>
            </div>
          )}

          {!loading && visibleRows.map((u) => {
            const itemPerformance = performanceById.get(String(u.id));
            const readers = asNumber(itemPerformance?.[readersKey]);
            const issues = qualityIssues(u);
            return (
            <div key={u.id} className="group p-4 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40">
              <div className="flex items-start gap-3 min-w-0">
                {u.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={u.image} alt={u.title} className="h-16 w-16 rounded-xl object-cover flex-shrink-0 sm:h-20 sm:w-24" />
                ) : (
                  <span className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-300 dark:bg-slate-800 dark:text-slate-600 sm:h-20 sm:w-24">
                    <ImageOff size={20} />
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg ${TYPE_CHIP[u.type] || TYPE_CHIP.news}`}>
                      {TYPE_LABEL[u.type] || u.type}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                      {categoryLabel(u.category)}
                    </span>
                    {!!u.pinned && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300">
                        <Pin size={10} />
                        مثبّت
                      </span>
                    )}
                    {!u.active && (
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400">مخفي</span>
                    )}
                    <span className="text-xs text-slate-400 tabular-nums" dir="ltr">{u.date}</span>
                  </div>
                  <h4 className="font-black text-sm leading-relaxed text-slate-800 dark:text-slate-100 line-clamp-2">{u.title}</h4>
                  {u.summary && (
                    <p dir="auto" className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 [unicode-bidi:plaintext]">{stripHtml(u.summary)}</p>
                  )}
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] font-bold">
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300">
                      <Users size={12} />
                      {performanceLoading ? '…' : `دخلوا ${readers.toLocaleString('en-US')}`}
                    </span>
                    <span className="inline-flex items-center gap-1 text-slate-400">
                      <CalendarDays size={12} />
                      {readerRange === 'today' ? 'اليوم' : 'آخر 7 أيام'}
                    </span>
                    {issues.length > 0 && (
                      <span className="text-amber-700 dark:text-amber-400">ناقص: {issues.join('، ')}</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-end gap-1.5 border-t border-slate-100 pt-3 dark:border-slate-800">
                {u.active ? (
                  <a
                    href={`/updates/${u.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="فتح صفحة الخبر"
                    aria-label="فتح صفحة الخبر"
                    className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  >
                    <ExternalLink size={16} />
                  </a>
                ) : (
                  <span
                    title="انشر الخبر أولاً لفتح صفحته العامة"
                    className="cursor-not-allowed rounded-xl bg-slate-50 p-2 text-slate-300 dark:bg-slate-800 dark:text-slate-600"
                  >
                    <ExternalLink size={16} />
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => toggleActive(u)}
                  role="switch"
                  aria-checked={u.active}
                  title={u.active ? 'إخفاء عن الزوّار' : 'إظهار للزوّار'}
                  aria-label={u.active ? 'إخفاء عن الزوّار' : 'إظهار للزوّار'}
                  className={`p-2 rounded-xl transition-colors ${u.active ? 'bg-emerald-50 dark:bg-emerald-900/15 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 hover:bg-slate-200'}`}
                >
                  {u.active ? <Eye size={16} /> : <EyeOff size={16} />}
                </button>
                <button
                  type="button"
                  onClick={() => void startEdit(u)}
                  disabled={editingLoading === u.id}
                  title="تعديل"
                  aria-label="تعديل"
                  className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  {editingLoading === u.id ? <Loader2 size={16} className="animate-spin" /> : <Pencil size={16} />}
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(u)}
                  title="حذف"
                  aria-label="حذف"
                  className="p-2 rounded-xl bg-rose-50 dark:bg-rose-900/15 text-rose-500 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/30 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          )})}

          {!loading && sorted.length === 0 && (
            <div className="text-center py-12">
              <Newspaper size={32} className="mx-auto mb-2 text-slate-300 dark:text-slate-600" />
              <p className="text-slate-500 dark:text-slate-400 font-bold text-sm">
                {updates.length === 0 ? 'لا توجد أخبار بعد — انشر أول خبر من الأعلى.' : 'لا نتائج مطابقة للفلاتر.'}
              </p>
            </div>
          )}

          {!loading && visibleCount < sorted.length && (
            <div className="p-4 text-center">
              <button
                type="button"
                onClick={() => setVisibleCount((count) => count + 20)}
                className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-black text-slate-700 transition-colors hover:border-emerald-400 hover:text-emerald-700 dark:border-slate-700 dark:text-slate-200"
              >
                عرض أخبار أقدم ({sorted.length - visibleCount})
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
