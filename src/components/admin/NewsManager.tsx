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
import {
  Newspaper, Loader2, Trash2, Pencil, Send, Eye, EyeOff, Pin, X,
} from 'lucide-react';
import { toast } from 'sonner';
import { ImageUploader } from '@/components/admin/ui/ImageUploader';
import dynamic from 'next/dynamic';
import logger from '@/lib/logger';

const RichTextEditor = dynamic(() => import('@/components/admin/ui/RichTextEditor'), { ssr: false });

// === Types ===
type UpdateType = 'news' | 'alert' | 'feature';

type DBUpdate = {
  id: string;
  title: string;
  type: UpdateType;
  content: string;
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

export default function NewsManager() {
  const [updates, setUpdates] = useState<DBUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  // Original row while editing — preserves date + active on save.
  const [editingRow, setEditingRow] = useState<DBUpdate | null>(null);
  const [sendPush, setSendPush] = useState(true);
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const composerRef = useRef<HTMLDivElement>(null);

  const fetchUpdates = useCallback(async () => {
    if (!supabase) { setLoading(false); return; }
    setLoading(true);
    const { data, error } = await supabase
      .from('updates')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);
    if (error) toast.error('فشل تحميل الأخبار: ' + error.message);
    if (data) setUpdates(data as DBUpdate[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetchUpdates(); }, [fetchUpdates]);

  const resetForm = () => {
    setEditingRow(null);
    setForm(EMPTY_FORM);
    setSendPush(true);
  };

  const startEdit = (u: DBUpdate) => {
    setEditingRow(u);
    setForm({
      title: u.title || '',
      type: u.type || 'news',
      category: u.category || 'general',
      summary: u.summary || '',
      content: u.content || '',
      link: u.link || '',
      image: u.image || '',
      source_name: u.source_name || '',
      source_url: u.source_url || '',
      pinned: !!u.pinned,
    });
    composerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    if (!form.title.trim()) { toast.error('العنوان مطلوب'); return; }
    setSubmitting(true);

    try {
      // Preserve original date + visibility on edit; new rows go live today.
      const date = editingRow ? editingRow.date : new Date().toISOString().split('T')[0];
      const active = editingRow ? editingRow.active : true;

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
      let { error } = await supabase.from('updates').upsert(fullPayload);
      if (error && isMissingColumnError(error)) {
        const retry = await supabase.from('updates').upsert(basePayload);
        error = retry.error;
        if (!error) toast.warning(MIGRATION_TOAST, { description: MIGRATION_FILE });
      }
      if (error) {
        toast.error('فشل الحفظ: ' + error.message);
        return;
      }

      // Notify for new items (not edits). One instant pipeline fans out to
      // bell + push + Telegram; the 30-min cron is only a safety net.
      // No body — the pipeline scans recent updates itself.
      if (!editingRow && sendPush) {
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
        toast.success(editingRow ? 'تم حفظ التعديل' : 'تم النشر');
      }

      resetForm();
      fetchUpdates();
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (u: DBUpdate) => {
    if (!confirm(`حذف «${u.title}» نهائياً؟`)) return;
    if (!supabase) return;
    const toastId = toast.loading('جاري الحذف...');
    const { error } = await supabase.from('updates').delete().eq('id', u.id);
    if (error) {
      logger.error('Delete update failed:', error);
      toast.error('فشل الحذف: ' + error.message, { id: toastId });
    } else {
      toast.success('تم الحذف', { id: toastId });
      if (editingRow?.id === u.id) resetForm();
      fetchUpdates();
    }
  };

  // Show/hide without deleting — active=false hides the item from visitors
  // but keeps it editable/restorable.
  const toggleActive = async (u: DBUpdate) => {
    if (!supabase) return;
    const { error } = await supabase.from('updates').update({ active: !u.active }).eq('id', u.id);
    if (error) { toast.error('فشل التحديث: ' + error.message); return; }
    toast.success(u.active ? 'أُخفي عن الزوّار' : 'أصبح ظاهراً');
    fetchUpdates();
  };

  const filtered = useMemo(() => updates.filter((u) => {
    if (typeFilter !== 'all' && u.type !== typeFilter) return false;
    if (statusFilter === 'visible' && !u.active) return false;
    if (statusFilter === 'hidden' && u.active) return false;
    return true;
  }), [updates, typeFilter, statusFilter]);

  const pill = (isOn: boolean) =>
    `px-3 py-1.5 rounded-full text-xs font-black transition-colors ${
      isOn
        ? 'bg-emerald-600 text-white'
        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
    }`;

  return (
    <div className="space-y-6">
      {/* ===== Composer ===== */}
      <div ref={composerRef} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-sm scroll-mt-24">
        <div className="flex items-center justify-between gap-2 mb-5">
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
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
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
            <input
              type="url"
              dir="ltr"
              value={form.link}
              onChange={(e) => setForm({ ...form, link: e.target.value })}
              placeholder="/article/123"
              className={inputCls}
            />
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
              إن وُضع، يفتح الخبر هذا الرابط بدل صفحة التفاصيل
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

            {!editingRow && (
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
            className="w-full py-3 rounded-xl font-black text-white bg-emerald-600 hover:bg-emerald-700 flex items-center justify-center gap-2 shadow-sm hover:shadow transition-all disabled:opacity-60 active:scale-[0.99]"
          >
            {submitting
              ? <Loader2 size={18} className="animate-spin" />
              : editingRow
                ? 'حفظ التعديل'
                : sendPush
                  ? <><Send size={16} /> نشر وإرسال إشعار</>
                  : 'نشر الخبر'}
          </button>
        </form>
      </div>

      {/* ===== List ===== */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 space-y-3">
          <div className="flex items-center gap-2 font-black text-slate-800 dark:text-slate-100">
            سجل الأخبار
            <span className="inline-flex items-center px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-full text-[10px] font-black tabular-nums" dir="ltr">
              {filtered.length}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <button type="button" onClick={() => setTypeFilter('all')} className={pill(typeFilter === 'all')}>الكل</button>
            <button type="button" onClick={() => setTypeFilter('news')} className={pill(typeFilter === 'news')}>أخبار</button>
            <button type="button" onClick={() => setTypeFilter('alert')} className={pill(typeFilter === 'alert')}>تنبيهات</button>
            <button type="button" onClick={() => setTypeFilter('feature')} className={pill(typeFilter === 'feature')}>جديد الموقع</button>
            <span className="w-px h-5 bg-slate-200 dark:bg-slate-700 mx-1" />
            <button type="button" onClick={() => setStatusFilter('all')} className={pill(statusFilter === 'all')}>الكل</button>
            <button type="button" onClick={() => setStatusFilter('visible')} className={pill(statusFilter === 'visible')}>ظاهر</button>
            <button type="button" onClick={() => setStatusFilter('hidden')} className={pill(statusFilter === 'hidden')}>مخفي</button>
          </div>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[560px] overflow-y-auto">
          {loading && (
            <div className="flex items-center justify-center gap-2 py-12 text-slate-400">
              <Loader2 size={18} className="animate-spin" />
              <span className="text-sm font-bold">جاري التحميل...</span>
            </div>
          )}

          {!loading && filtered.map((u) => (
            <div key={u.id} className="group p-4 hover:bg-slate-50 dark:hover:bg-slate-800/40 flex justify-between gap-3 transition-colors">
              <div className="flex items-start gap-3 min-w-0">
                {u.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={u.image} alt={u.title} className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
                )}
                <div className="min-w-0">
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
                  <h4 className="font-black text-sm text-slate-800 dark:text-slate-100 truncate">{u.title}</h4>
                  {u.summary && (
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 line-clamp-1">{u.summary}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
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
                  onClick={() => startEdit(u)}
                  title="تعديل"
                  aria-label="تعديل"
                  className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  <Pencil size={16} />
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
          ))}

          {!loading && filtered.length === 0 && (
            <div className="text-center py-12">
              <Newspaper size={32} className="mx-auto mb-2 text-slate-300 dark:text-slate-600" />
              <p className="text-slate-500 dark:text-slate-400 font-bold text-sm">
                {updates.length === 0 ? 'لا توجد أخبار بعد — انشر أول خبر من الأعلى.' : 'لا نتائج مطابقة للفلاتر.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
