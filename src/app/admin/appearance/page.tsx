'use client';

import { useEffect, useState } from 'react';
import { Palette, X, Save, Plus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import AdminCard from '@/components/admin/AdminCard';
import { ImageUploader } from '@/components/admin/ui/ImageUploader';
import { supabase } from '@/lib/supabaseClient';
import type { BackdropConfig } from '@/components/SiteBackdrop';

const DEFAULT_CFG: BackdropConfig = {
  enabled: true,
  images: ['/bg/bg-1.webp', '/bg/bg-2.webp', '/bg/bg-3.webp', '/bg/bg-4.webp'],
  opacity: 20,
  veil: 22,
  mode: 'per-page',
};

const MODES: { id: BackdropConfig['mode']; label: string; desc: string }[] = [
  { id: 'per-page', label: 'موزّعة على الصفحات (مُوصى به)', desc: 'كل قسم يأخذ صورة ثابتة مختلفة — تنوّع عبر الموقع بلا وميض أو تغيّر مزعج.' },
  { id: 'shuffle', label: 'عشوائيّة كل زيارة', desc: 'صورة عشوائيّة تتغيّر مع كل تنقّل بين الصفحات — أكثر ديناميكيّة.' },
  { id: 'single', label: 'صورة واحدة للكل', desc: 'أوّل صورة فقط على جميع الصفحات.' },
];

export default function AdminAppearancePage() {
  const [cfg, setCfg] = useState<BackdropConfig>(DEFAULT_CFG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [urlInput, setUrlInput] = useState('');

  useEffect(() => {
    (async () => {
      if (!supabase) { setLoading(false); return; }
      const { data } = await supabase.from('site_settings').select('backdrop').eq('id', 1).maybeSingle();
      const raw = (data as { backdrop?: unknown } | null)?.backdrop;
      if (raw && typeof raw === 'object') setCfg({ ...DEFAULT_CFG, ...(raw as Partial<BackdropConfig>) });
      setLoading(false);
    })();
  }, []);

  const addImage = (url: string) => {
    const u = url.trim();
    if (!u) return;
    if (cfg.images.includes(u)) { toast.error('الصورة مضافة سلفاً'); return; }
    if (cfg.images.length >= 12) { toast.error('الحدّ الأقصى 12 صورة'); return; }
    setCfg((c) => ({ ...c, images: [...c.images, u] }));
  };

  const removeImage = (url: string) => setCfg((c) => ({ ...c, images: c.images.filter((i) => i !== url) }));

  const save = async () => {
    if (!supabase) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('site_settings').upsert({ id: 1, backdrop: cfg }, { onConflict: 'id' });
      if (error) throw error;
      toast.success('تم الحفظ — تظهر على الموقع خلال دقيقة (حدّث الصفحة بـ Ctrl+Shift+R).');
    } catch (e) {
      toast.error('فشل الحفظ: ' + (e instanceof Error ? e.message : String(e)));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <AdminPageHeader
        icon={Palette}
        theme="emerald"
        title="خلفيّة الموقع"
        subtitle="صور شفّافة خفيفة خلف كل الصفحات — تحكّم كامل بلا برمجة"
        eyebrow="المظهر"
      />

      <AdminCard theme="emerald">
        {loading ? (
          <div className="flex items-center gap-2 text-slate-500 p-4"><Loader2 className="animate-spin" size={18} /> جاري التحميل…</div>
        ) : (
          <div className="space-y-7">
            {/* Enable */}
            <label className="flex items-center justify-between gap-4 cursor-pointer">
              <div>
                <div className="font-bold text-slate-800 dark:text-slate-100">تفعيل خلفيّة الصور</div>
                <div className="text-xs text-slate-500">إيقافها يُعيد الموقع بلا أي خلفيّة.</div>
              </div>
              <input type="checkbox" checked={cfg.enabled} onChange={(e) => setCfg((c) => ({ ...c, enabled: e.target.checked }))} className="w-11 h-6 accent-emerald-600" />
            </label>

            {/* Opacity */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-bold text-slate-800 dark:text-slate-100">شدّة ظهور الصورة</label>
                <span className="font-mono text-emerald-600 font-bold">{cfg.opacity}%</span>
              </div>
              <input type="range" min={0} max={30} step={1} value={cfg.opacity} onChange={(e) => setCfg((c) => ({ ...c, opacity: Number(e.target.value) }))} className="w-full accent-emerald-600" />
              <div className="text-xs text-slate-500 mt-1">كلّما زاد الرقم ظهرت الصورة أكثر. المُوصى به 8–20%.</div>
            </div>

            {/* Veil */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-bold text-slate-800 dark:text-slate-100">حجاب حماية النصّ</label>
                <span className="font-mono text-emerald-600 font-bold">{cfg.veil}%</span>
              </div>
              <input type="range" min={0} max={60} step={1} value={cfg.veil} onChange={(e) => setCfg((c) => ({ ...c, veil: Number(e.target.value) }))} className="w-full accent-emerald-600" />
              <div className="text-xs text-slate-500 mt-1">ارفعه إن صار النصّ صعب القراءة فوق الصورة.</div>
            </div>

            {/* Mode */}
            <div>
              <div className="font-bold text-slate-800 dark:text-slate-100 mb-2">طريقة التوزيع</div>
              <div className="space-y-2">
                {MODES.map((m) => (
                  <label key={m.id} className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${cfg.mode === m.id ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' : 'border-slate-200 dark:border-slate-700'}`}>
                    <input type="radio" name="mode" checked={cfg.mode === m.id} onChange={() => setCfg((c) => ({ ...c, mode: m.id }))} className="mt-1 accent-emerald-600" />
                    <div>
                      <div className="font-bold text-sm text-slate-800 dark:text-slate-100">{m.label}</div>
                      <div className="text-xs text-slate-500">{m.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Images */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="font-bold text-slate-800 dark:text-slate-100">الصور</div>
                <span className="text-xs font-bold text-slate-500">{cfg.images.length}/12</span>
              </div>
              {cfg.images.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mb-3">
                  {cfg.images.map((url) => (
                    <div key={url} className="relative group aspect-video rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt="" className="w-full h-full object-cover" loading="lazy" />
                      <button onClick={() => removeImage(url)} className="absolute top-1 left-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity" title="حذف">
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {cfg.images.length < 12 && (
                <div className="space-y-3">
                  <ImageUploader
                    label="ارفع صورة جديدة (تُضغط تلقائياً، بلا علامة مائيّة)"
                    onChange={(url) => url && addImage(url)}
                    bucket="public"
                    path="backdrops"
                    maxWidth={1600}
                    quality={0.72}
                    watermark={false}
                  />
                  <div className="flex gap-2">
                    <input value={urlInput} onChange={(e) => setUrlInput(e.target.value)} placeholder="أو ألصق رابط صورة (https://…)" dir="ltr" className="flex-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm" />
                    <button onClick={() => { addImage(urlInput); setUrlInput(''); }} className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm font-bold border border-slate-200 dark:border-slate-700">
                      <Plus size={16} /> إضافة رابط
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Save */}
            <button onClick={save} disabled={saving} className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-50">
              {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
              حفظ التغييرات
            </button>
          </div>
        )}
      </AdminCard>
    </div>
  );
}
