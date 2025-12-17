'use client';

import { useEffect, useMemo, useState, useRef } from 'react';
import Link from 'next/link';
import { 
  FileText, Newspaper, Briefcase, Settings, Search, Plus, Trash2, Save, 
  Edit3, Eye, EyeOff, LogOut, Lock, Shield, AlertTriangle, CheckCircle,
  Calendar, Image as ImageIcon, X, RefreshCw, Download, Upload,
  HelpCircle, ShieldAlert, FileDown, Link2, ExternalLink, Sparkles,
  ChevronDown, ChevronUp, Copy, Check
} from 'lucide-react';
import { ARTICLES } from '@/lib/articles';
import { SERVICES_LIST, LATEST_UPDATES, CATEGORY_SLUGS, OFFICIAL_SOURCES, FORMS } from '@/lib/data';
import { SECURITY_CODES } from '@/lib/codes';

// ============================================
// 🔧 أنواع البيانات
// ============================================

type ArticleRow = {
  id: string;
  title: string;
  category: string;
  lastUpdate: string;
  intro: string;
  details: string;
  documents: string[];
  steps: string[];
  tips: string[];
  fees: string;
  warning: string | null;
  source: string;
  active: boolean;
  createdAt: string;
  image?: string;
  imageAlt?: string;
};

type ServiceRow = {
  id: string;
  title: string;
  desc: string;
  price: number | null;
  whatsapp: string | null;
  active: boolean;
  image?: string;
  imageAlt?: string;
};

type UpdateRow = {
  id: string;
  type: string;
  title: string;
  date: string;
  content: string | null;
  active: boolean;
  image?: string;
  imageAlt?: string;
};

type CodeRow = {
  id: string;
  code: string;
  title: string;
  desc: string;
  category: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'safe';
  active: boolean;
};

type FAQRow = {
  id: string;
  category: string;
  question: string;
  answer: string;
  active: boolean;
};

type FormRow = {
  id: string;
  name: string;
  desc: string;
  type: string;
  url: string;
  active: boolean;
};

type SourceRow = {
  id: string;
  name: string;
  url: string;
  desc: string;
  active: boolean;
};

type TabType = 'articles' | 'updates' | 'services' | 'codes' | 'faq' | 'forms' | 'sources' | 'settings';

// ============================================
// 🗄️ إدارة localStorage
// ============================================

const STORAGE_KEYS = {
  articles: 'admin_articles_v2',
  services: 'admin_services_v2',
  updates: 'admin_updates_v2',
  codes: 'admin_codes_v2',
  faq: 'admin_faq_v2',
  forms: 'admin_forms_v2',
  sources: 'admin_sources_v2',
  session: 'admin_session_v2',
};

// 🔐 بيانات الدخول المشفرة (SHA-256)
const ADMIN_EMAIL_HASH = '2f888559e70e4c77e52db97a9c53a4e230c0a5c803d4ab06d856d98a91dd391e';
const ADMIN_PASSWORD_HASH = 'd4c30806afeaa974d31306fe9dd7b1d813f393b5c4d9e5cd487b22f4b667f806';

// دالة تشفير SHA-256
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function getToday(): string {
  return new Date().toISOString().slice(0, 10);
}

function isNew(dateStr: string): boolean {
  if (!dateStr) return false;
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  return diffDays <= 7;
}

function loadFromStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function saveToStorage<T>(key: string, data: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(data));
    window.dispatchEvent(new Event('admin-data-updated'));
  } catch (e) {
    console.error('Failed to save:', e);
  }
}

// ============================================
// 🖼️ ضغط الصور
// ============================================

async function compressImage(file: File, maxWidth = 800, quality = 0.7): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) { reject(new Error('Canvas not available')); return; }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

// ============================================
// 📦 تحميل البيانات الأولية
// ============================================

function seedArticles(): ArticleRow[] {
  return Object.entries(ARTICLES).map(([slug, article]) => ({
    id: slug, title: article.title, category: article.category, lastUpdate: article.lastUpdate,
    intro: article.intro, details: article.details, documents: article.documents || [],
    steps: article.steps || [], tips: article.tips || [], fees: article.fees,
    warning: article.warning || null, source: article.source || '', active: true, createdAt: article.lastUpdate,
  }));
}

function seedServices(): ServiceRow[] {
  return SERVICES_LIST.map((s) => ({ id: s.id, title: s.title, desc: s.desc, price: null, whatsapp: null, active: true }));
}

function seedUpdates(): UpdateRow[] {
  return LATEST_UPDATES.map((u) => ({ id: String(u.id), type: u.type || 'خبر', title: u.title, date: u.date, content: u.content || null, active: true }));
}

function seedCodes(): CodeRow[] {
  return SECURITY_CODES.map((c, i) => ({ id: `code-${i}`, code: c.code, title: c.title, desc: c.desc, category: c.category, severity: c.severity, active: true }));
}

function seedForms(): FormRow[] {
  return FORMS.map((f, i) => ({ id: `form-${i}`, name: f.name, desc: f.desc, type: f.type, url: (f as any).url || '', active: true }));
}

function seedSources(): SourceRow[] {
  return OFFICIAL_SOURCES.map((s, i) => ({ id: `source-${i}`, name: s.name, url: s.url, desc: s.desc, active: true }));
}

// ============================================
// 🎨 مكونات UI
// ============================================

function Badge({ children, color = 'gray' }: { children: React.ReactNode; color?: string }) {
  const colors: Record<string, string> = {
    gray: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    green: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
    red: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
    yellow: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    blue: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    orange: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  };
  return <span className={`text-xs font-bold px-2 py-1 rounded-full ${colors[color] || colors.gray}`}>{children}</span>;
}

function NewBadge() {
  return (
    <span className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse flex items-center gap-1">
      <Sparkles size={10} /> جديد
    </span>
  );
}

function TabButton({ active, onClick, icon, label, count }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string; count?: number }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-3 py-2.5 font-bold text-sm transition-all rounded-xl whitespace-nowrap ${
        active
          ? 'bg-emerald-600 text-white shadow-lg'
          : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
      }`}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
      {count !== undefined && count > 0 && (
        <span className={`text-xs px-1.5 py-0.5 rounded-full ${active ? 'bg-white/20' : 'bg-slate-200 dark:bg-slate-600'}`}>{count}</span>
      )}
    </button>
  );
}

function Toast({ message, type, onClose }: { message: string; type: 'success' | 'error'; onClose: () => void }) {
  useEffect(() => { const timer = setTimeout(onClose, 3000); return () => clearTimeout(timer); }, [onClose]);
  return (
    <div className={`fixed bottom-24 left-4 right-4 sm:left-auto sm:right-4 sm:w-80 p-4 rounded-xl shadow-lg z-50 flex items-center gap-3 ${type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`}>
      {type === 'success' ? <CheckCircle size={20} /> : <AlertTriangle size={20} />}
      <span className="font-bold text-sm flex-1">{message}</span>
      <button onClick={onClose}><X size={18} /></button>
    </div>
  );
}

function ConfirmDialog({ open, title, message, onConfirm, onCancel }: { open: boolean; title: string; message: string; onConfirm: () => void; onCancel: () => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-md w-full shadow-2xl">
        <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">{title}</h3>
        <p className="text-slate-600 dark:text-slate-300 mb-6">{message}</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 px-4 py-3 rounded-xl font-bold bg-slate-100 dark:bg-slate-800">إلغاء</button>
          <button onClick={onConfirm} className="flex-1 px-4 py-3 rounded-xl font-bold bg-red-600 text-white">تأكيد</button>
        </div>
      </div>
    </div>
  );
}

function ImageUploader({ 
  value, 
  onChange, 
  label,
  altValue,
  onAltChange 
}: { 
  value?: string; 
  onChange: (img: string | undefined) => void; 
  label?: string;
  altValue?: string;
  onAltChange?: (alt: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) { alert('يرجى اختيار ملف صورة'); return; }
    setLoading(true);
    try { const compressed = await compressImage(file, 800, 0.7); onChange(compressed); } 
    catch { alert('فشل في معالجة الصورة'); } 
    finally { setLoading(false); }
  };
  return (
    <div className="space-y-2">
      {label && <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">{label}</label>}
      <div className="flex items-start gap-3">
        {value ? (
          <div className="relative inline-block flex-shrink-0">
            <img src={value} alt={altValue || 'Preview'} className="w-24 h-24 object-cover rounded-xl border" />
            <button onClick={() => onChange(undefined)} className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center"><X size={14} /></button>
          </div>
        ) : (
          <div onClick={() => inputRef.current?.click()} className={`w-24 h-24 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-emerald-500 transition flex-shrink-0 ${loading ? 'opacity-50' : ''}`}>
            {loading ? <RefreshCw size={20} className="text-slate-400 animate-spin" /> : <><ImageIcon size={20} className="text-slate-400 mb-1" /><span className="text-[10px] text-slate-500">رفع صورة</span></>}
          </div>
        )}
        {value && onAltChange && (
          <div className="flex-1">
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">وصف الصورة (للمكفوفين)</label>
            <input 
              type="text" 
              value={altValue || ''} 
              onChange={(e) => onAltChange(e.target.value)}
              placeholder="صورة توضح خطوات تجديد الإقامة..."
              className="w-full px-3 py-2 rounded-lg border bg-white dark:bg-slate-800 text-sm"
            />
          </div>
        )}
      </div>
      <input ref={inputRef} type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} className="hidden" />
    </div>
  );
}

// ============================================
// 🔐 محرر الأكواد الأمنية
// ============================================

function CodeEditor({ code, onSave, onCancel }: { code: CodeRow | null; onSave: (code: CodeRow) => void; onCancel: () => void }) {
  const [form, setForm] = useState<CodeRow>(code || {
    id: generateId(), code: '', title: '', desc: '', category: 'تقييد أمني', severity: 'medium', active: true
  });
  const severities = ['critical', 'high', 'medium', 'low', 'safe'] as const;
  const categories = ['تقييد أمني', 'تقييد إداري', 'تقييد قضائي', 'إيقاف مؤقت', 'أخرى'];
  const severityLabels: Record<string, string> = { critical: 'خطير جداً', high: 'عالي', medium: 'متوسط', low: 'منخفض', safe: 'آمن' };
  
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave(form); }} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">الكود *</label>
          <input type="text" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} required placeholder="V-87" className="w-full px-4 py-3 rounded-xl border bg-white dark:bg-slate-800 font-mono text-lg" dir="ltr" />
        </div>
        <div>
          <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">التصنيف</label>
          <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full px-4 py-3 rounded-xl border bg-white dark:bg-slate-800">
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">الخطورة</label>
          <select value={form.severity} onChange={(e) => setForm({ ...form, severity: e.target.value as CodeRow['severity'] })} className="w-full px-4 py-3 rounded-xl border bg-white dark:bg-slate-800">
            {severities.map(s => <option key={s} value={s}>{severityLabels[s]}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">العنوان *</label>
        <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required placeholder="منع دخول - تهديد أمني" className="w-full px-4 py-3 rounded-xl border bg-white dark:bg-slate-800" />
      </div>
      <div>
        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">الوصف *</label>
        <textarea value={form.desc} onChange={(e) => setForm({ ...form, desc: e.target.value })} required rows={3} placeholder="شرح تفصيلي للكود وما يعنيه..." className="w-full px-4 py-3 rounded-xl border bg-white dark:bg-slate-800" />
      </div>
      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} className="w-5 h-5 rounded" />
        <span className="text-sm font-bold">مفعّل</span>
      </label>
      <div className="flex gap-3 pt-4 border-t">
        <button type="button" onClick={onCancel} className="flex-1 px-4 py-3 rounded-xl font-bold bg-slate-100 dark:bg-slate-800">إلغاء</button>
        <button type="submit" className="flex-1 px-4 py-3 rounded-xl font-bold bg-emerald-600 text-white flex items-center justify-center gap-2"><Save size={18} />{code ? 'حفظ' : 'إضافة'}</button>
      </div>
    </form>
  );
}

// ============================================
// ❓ محرر الأسئلة الشائعة
// ============================================

function FAQEditor({ faq, onSave, onCancel, categories }: { faq: FAQRow | null; onSave: (faq: FAQRow) => void; onCancel: () => void; categories: string[] }) {
  const [form, setForm] = useState<FAQRow>(faq || {
    id: generateId(), category: categories[0] || 'عام', question: '', answer: '', active: true
  });
  const [newCategory, setNewCategory] = useState('');
  
  return (
    <form onSubmit={(e) => { e.preventDefault(); const cat = form.category === '__new__' ? newCategory : form.category; onSave({ ...form, category: cat }); }} className="space-y-4">
      <div>
        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">التصنيف</label>
        <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full px-4 py-3 rounded-xl border bg-white dark:bg-slate-800">
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
          <option value="__new__">+ تصنيف جديد</option>
        </select>
        {form.category === '__new__' && (
          <input type="text" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} placeholder="اسم التصنيف الجديد" className="w-full mt-2 px-4 py-3 rounded-xl border bg-white dark:bg-slate-800" />
        )}
      </div>
      <div>
        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">السؤال *</label>
        <input type="text" value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })} required placeholder="كيف أجدد إقامتي؟" className="w-full px-4 py-3 rounded-xl border bg-white dark:bg-slate-800" />
      </div>
      <div>
        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">الجواب *</label>
        <textarea value={form.answer} onChange={(e) => setForm({ ...form, answer: e.target.value })} required rows={4} placeholder="الجواب التفصيلي..." className="w-full px-4 py-3 rounded-xl border bg-white dark:bg-slate-800" />
      </div>
      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} className="w-5 h-5 rounded" />
        <span className="text-sm font-bold">مفعّل</span>
      </label>
      <div className="flex gap-3 pt-4 border-t">
        <button type="button" onClick={onCancel} className="flex-1 px-4 py-3 rounded-xl font-bold bg-slate-100 dark:bg-slate-800">إلغاء</button>
        <button type="submit" className="flex-1 px-4 py-3 rounded-xl font-bold bg-emerald-600 text-white flex items-center justify-center gap-2"><Save size={18} />{faq ? 'حفظ' : 'إضافة'}</button>
      </div>
    </form>
  );
}

// ============================================
// 📄 محرر النماذج
// ============================================

function FormEditor({ form: formData, onSave, onCancel }: { form: FormRow | null; onSave: (form: FormRow) => void; onCancel: () => void }) {
  const [form, setForm] = useState<FormRow>(formData || {
    id: generateId(), name: '', desc: '', type: 'PDF', url: '', active: true
  });
  const types = ['PDF', 'DOCX', 'DOC', 'XLSX', 'ZIP'];
  
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave(form); }} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">اسم النموذج *</label>
          <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="عقد إيجار عربي-تركي" className="w-full px-4 py-3 rounded-xl border bg-white dark:bg-slate-800" />
        </div>
        <div>
          <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">نوع الملف</label>
          <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full px-4 py-3 rounded-xl border bg-white dark:bg-slate-800">
            {types.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">الوصف *</label>
        <textarea value={form.desc} onChange={(e) => setForm({ ...form, desc: e.target.value })} required rows={2} placeholder="وصف مختصر للنموذج..." className="w-full px-4 py-3 rounded-xl border bg-white dark:bg-slate-800" />
      </div>
      <div>
        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">رابط التحميل</label>
        <input type="url" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="https://drive.google.com/..." className="w-full px-4 py-3 rounded-xl border bg-white dark:bg-slate-800" dir="ltr" />
      </div>
      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} className="w-5 h-5 rounded" />
        <span className="text-sm font-bold">مفعّل</span>
      </label>
      <div className="flex gap-3 pt-4 border-t">
        <button type="button" onClick={onCancel} className="flex-1 px-4 py-3 rounded-xl font-bold bg-slate-100 dark:bg-slate-800">إلغاء</button>
        <button type="submit" className="flex-1 px-4 py-3 rounded-xl font-bold bg-emerald-600 text-white flex items-center justify-center gap-2"><Save size={18} />{formData ? 'حفظ' : 'إضافة'}</button>
      </div>
    </form>
  );
}

// ============================================
// 🔗 محرر المصادر
// ============================================

function SourceEditor({ source, onSave, onCancel }: { source: SourceRow | null; onSave: (source: SourceRow) => void; onCancel: () => void }) {
  const [form, setForm] = useState<SourceRow>(source || {
    id: generateId(), name: '', url: '', desc: '', active: true
  });
  
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave(form); }} className="space-y-4">
      <div>
        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">اسم المصدر *</label>
        <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="البوابة الإلكترونية e-Devlet" className="w-full px-4 py-3 rounded-xl border bg-white dark:bg-slate-800" />
      </div>
      <div>
        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">الرابط *</label>
        <input type="url" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} required placeholder="https://www.turkiye.gov.tr" className="w-full px-4 py-3 rounded-xl border bg-white dark:bg-slate-800" dir="ltr" />
      </div>
      <div>
        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">الوصف *</label>
        <textarea value={form.desc} onChange={(e) => setForm({ ...form, desc: e.target.value })} required rows={2} placeholder="البوابة الحكومية الإلكترونية لجميع الخدمات..." className="w-full px-4 py-3 rounded-xl border bg-white dark:bg-slate-800" />
      </div>
      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} className="w-5 h-5 rounded" />
        <span className="text-sm font-bold">مفعّل</span>
      </label>
      <div className="flex gap-3 pt-4 border-t">
        <button type="button" onClick={onCancel} className="flex-1 px-4 py-3 rounded-xl font-bold bg-slate-100 dark:bg-slate-800">إلغاء</button>
        <button type="submit" className="flex-1 px-4 py-3 rounded-xl font-bold bg-emerald-600 text-white flex items-center justify-center gap-2"><Save size={18} />{source ? 'حفظ' : 'إضافة'}</button>
      </div>
    </form>
  );
}

// ============================================
// 📝 محررات المقالات والأخبار والخدمات (مختصرة)
// ============================================

function ArticleEditor({ article, onSave, onCancel, categories }: { article: ArticleRow | null; onSave: (a: ArticleRow) => void; onCancel: () => void; categories: string[] }) {
  const [form, setForm] = useState<ArticleRow>(article || { id: '', title: '', category: categories[0] || '', lastUpdate: getToday(), intro: '', details: '', documents: [], steps: [], tips: [], fees: '', warning: null, source: '', active: true, createdAt: getToday() });
  const [docsText, setDocsText] = useState((article?.documents || []).join('\n'));
  const [stepsText, setStepsText] = useState((article?.steps || []).join('\n'));
  const [tipsText, setTipsText] = useState((article?.tips || []).join('\n'));
  const [newCat, setNewCat] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const slug = form.id.trim() || form.title.toLowerCase().replace(/\s+/g, '-').replace(/[^\u0600-\u06FFa-z0-9-]/g, '').slice(0, 50) || generateId();
    const finalCat = form.category === '__new__' ? newCat : form.category;
    onSave({ ...form, id: slug, category: finalCat, documents: docsText.split('\n').filter(Boolean), steps: stepsText.split('\n').filter(Boolean), tips: tipsText.split('\n').filter(Boolean), lastUpdate: getToday(), createdAt: article?.createdAt || getToday() });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <input type="text" value={form.id} onChange={(e) => setForm({ ...form, id: e.target.value })} placeholder="معرّف URL" className="px-4 py-3 rounded-xl border bg-white dark:bg-slate-800" dir="ltr" />
        <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="px-4 py-3 rounded-xl border bg-white dark:bg-slate-800">
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
          <option value="__new__">+ جديد</option>
        </select>
        <ImageUploader 
  value={form.image} 
  onChange={(img) => setForm({ ...form, image: img })} 
  label="صورة"
  altValue={form.imageAlt}
  onAltChange={(alt) => setForm({ ...form, imageAlt: alt })}
/>
      </div>
      {form.category === '__new__' && <input type="text" value={newCat} onChange={(e) => setNewCat(e.target.value)} placeholder="التصنيف الجديد" className="w-full px-4 py-3 rounded-xl border bg-white dark:bg-slate-800" />}
      <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required placeholder="العنوان *" className="w-full px-4 py-3 rounded-xl border bg-white dark:bg-slate-800" />
      <textarea value={form.intro} onChange={(e) => setForm({ ...form, intro: e.target.value })} required rows={2} placeholder="المقدمة *" className="w-full px-4 py-3 rounded-xl border bg-white dark:bg-slate-800" />
      <textarea value={form.details} onChange={(e) => setForm({ ...form, details: e.target.value })} required rows={4} placeholder="التفاصيل *" className="w-full px-4 py-3 rounded-xl border bg-white dark:bg-slate-800" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <textarea value={docsText} onChange={(e) => setDocsText(e.target.value)} rows={3} placeholder="الأوراق (سطر لكل ورقة)" className="px-4 py-3 rounded-xl border bg-white dark:bg-slate-800 text-sm" />
        <textarea value={stepsText} onChange={(e) => setStepsText(e.target.value)} rows={3} placeholder="الخطوات (سطر لكل خطوة)" className="px-4 py-3 rounded-xl border bg-white dark:bg-slate-800 text-sm" />
        <textarea value={tipsText} onChange={(e) => setTipsText(e.target.value)} rows={3} placeholder="النصائح (سطر لكل نصيحة)" className="px-4 py-3 rounded-xl border bg-white dark:bg-slate-800 text-sm" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input type="text" value={form.fees} onChange={(e) => setForm({ ...form, fees: e.target.value })} placeholder="الرسوم" className="px-4 py-3 rounded-xl border bg-white dark:bg-slate-800" />
        <input type="url" value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} placeholder="المصدر الرسمي" className="px-4 py-3 rounded-xl border bg-white dark:bg-slate-800" dir="ltr" />
      </div>
      <input type="text" value={form.warning || ''} onChange={(e) => setForm({ ...form, warning: e.target.value || null })} placeholder="تحذير (اختياري)" className="w-full px-4 py-3 rounded-xl border border-amber-300 bg-amber-50 dark:bg-amber-900/20" />
      <label className="flex items-center gap-2"><input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} className="w-5 h-5 rounded" /><span className="text-sm font-bold">منشور</span></label>
      <div className="flex gap-3 pt-4 border-t">
        <button type="button" onClick={onCancel} className="flex-1 px-4 py-3 rounded-xl font-bold bg-slate-100 dark:bg-slate-800">إلغاء</button>
        <button type="submit" className="flex-1 px-4 py-3 rounded-xl font-bold bg-emerald-600 text-white flex items-center justify-center gap-2"><Save size={18} />{article ? 'حفظ' : 'إضافة'}</button>
      </div>
    </form>
  );
}

function UpdateEditor({ update, onSave, onCancel }: { update: UpdateRow | null; onSave: (u: UpdateRow) => void; onCancel: () => void }) {
  const [form, setForm] = useState<UpdateRow>(update || { id: generateId(), type: 'هام', title: '', date: getToday(), content: null, active: true });
  const types = ['هام', 'خبر', 'تحديث', 'تنبيه', 'جديد', 'عاجل'];
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave(form); }} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="px-4 py-3 rounded-xl border bg-white dark:bg-slate-800">{types.map(t => <option key={t} value={t}>{t}</option>)}</select>
        <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="px-4 py-3 rounded-xl border bg-white dark:bg-slate-800" />
        <ImageUploader 
  value={form.image} 
  onChange={(img) => setForm({ ...form, image: img })} 
  label="صورة"
  altValue={form.imageAlt}
  onAltChange={(alt) => setForm({ ...form, imageAlt: alt })}
/>
      </div>
      <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required placeholder="العنوان *" className="w-full px-4 py-3 rounded-xl border bg-white dark:bg-slate-800" />
      <textarea value={form.content || ''} onChange={(e) => setForm({ ...form, content: e.target.value || null })} rows={3} placeholder="المحتوى" className="w-full px-4 py-3 rounded-xl border bg-white dark:bg-slate-800" />
      <label className="flex items-center gap-2"><input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} className="w-5 h-5 rounded" /><span className="text-sm font-bold">منشور</span></label>
      <div className="flex gap-3 pt-4 border-t">
        <button type="button" onClick={onCancel} className="flex-1 px-4 py-3 rounded-xl font-bold bg-slate-100 dark:bg-slate-800">إلغاء</button>
        <button type="submit" className="flex-1 px-4 py-3 rounded-xl font-bold bg-emerald-600 text-white flex items-center justify-center gap-2"><Save size={18} />{update ? 'حفظ' : 'إضافة'}</button>
      </div>
    </form>
  );
}

function ServiceEditor({ service, onSave, onCancel }: { service: ServiceRow | null; onSave: (s: ServiceRow) => void; onCancel: () => void }) {
  const [form, setForm] = useState<ServiceRow>(service || { id: '', title: '', desc: '', price: null, whatsapp: null, active: true });
  return (
    <form onSubmit={(e) => { e.preventDefault(); const slug = form.id.trim() || form.title.toLowerCase().replace(/\s+/g, '-').slice(0, 30) || generateId(); onSave({ ...form, id: slug }); }} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <input type="text" value={form.id} onChange={(e) => setForm({ ...form, id: e.target.value })} placeholder="معرّف" className="px-4 py-3 rounded-xl border bg-white dark:bg-slate-800" dir="ltr" />
        <input type="number" value={form.price || ''} onChange={(e) => setForm({ ...form, price: e.target.value ? Number(e.target.value) : null })} placeholder="السعر (ليرة)" className="px-4 py-3 rounded-xl border bg-white dark:bg-slate-800" />
        <ImageUploader 
  value={form.image} 
  onChange={(img) => setForm({ ...form, image: img })} 
  label="صورة"
  altValue={form.imageAlt}
  onAltChange={(alt) => setForm({ ...form, imageAlt: alt })}
/>
      </div>
      <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required placeholder="اسم الخدمة *" className="w-full px-4 py-3 rounded-xl border bg-white dark:bg-slate-800" />
      <textarea value={form.desc} onChange={(e) => setForm({ ...form, desc: e.target.value })} required rows={2} placeholder="الوصف *" className="w-full px-4 py-3 rounded-xl border bg-white dark:bg-slate-800" />
      <input type="tel" value={form.whatsapp || ''} onChange={(e) => setForm({ ...form, whatsapp: e.target.value || null })} placeholder="واتساب (اختياري)" className="w-full px-4 py-3 rounded-xl border bg-white dark:bg-slate-800" dir="ltr" />
      <label className="flex items-center gap-2"><input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} className="w-5 h-5 rounded" /><span className="text-sm font-bold">مفعّلة</span></label>
      <div className="flex gap-3 pt-4 border-t">
        <button type="button" onClick={onCancel} className="flex-1 px-4 py-3 rounded-xl font-bold bg-slate-100 dark:bg-slate-800">إلغاء</button>
        <button type="submit" className="flex-1 px-4 py-3 rounded-xl font-bold bg-emerald-600 text-white flex items-center justify-center gap-2"><Save size={18} />{service ? 'حفظ' : 'إضافة'}</button>
      </div>
    </form>
  );
}

// ============================================
// 🎛️ لوحة التحكم الرئيسية
// ============================================

export default function AdminDashboard() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const [activeTab, setActiveTab] = useState<TabType>('articles');
  const [searchQuery, setSearchQuery] = useState('');
  
  // البيانات
  const [articles, setArticles] = useState<ArticleRow[]>([]);
  const [updates, setUpdates] = useState<UpdateRow[]>([]);
  const [services, setServices] = useState<ServiceRow[]>([]);
  const [codes, setCodes] = useState<CodeRow[]>([]);
  const [faq, setFaq] = useState<FAQRow[]>([]);
  const [forms, setForms] = useState<FormRow[]>([]);
  const [sources, setSources] = useState<SourceRow[]>([]);
  
  // حالة التحرير
  const [editingArticle, setEditingArticle] = useState<ArticleRow | null>(null);
  const [editingUpdate, setEditingUpdate] = useState<UpdateRow | null>(null);
  const [editingService, setEditingService] = useState<ServiceRow | null>(null);
  const [editingCode, setEditingCode] = useState<CodeRow | null>(null);
  const [editingFaq, setEditingFaq] = useState<FAQRow | null>(null);
  const [editingForm, setEditingForm] = useState<FormRow | null>(null);
  const [editingSource, setEditingSource] = useState<SourceRow | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  
  const [confirmDelete, setConfirmDelete] = useState<{ type: string; id: string } | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // التصنيفات
  const articleCategories = useMemo(() => {
    const cats = new Set(articles.map(a => a.category));
    Object.values(CATEGORY_SLUGS).forEach(cat => cats.add(cat));
    return Array.from(cats).filter(Boolean).sort();
  }, [articles]);

  const faqCategories = useMemo(() => {
    const cats = new Set(faq.map(f => f.category));
    cats.add('الإقامة');
    cats.add('العمل');
    cats.add('الصحة');
    cats.add('عام');
    return Array.from(cats).filter(Boolean).sort();
  }, [faq]);

  // تحميل البيانات
  useEffect(() => {
    const session = loadFromStorage<string | null>(STORAGE_KEYS.session, null);
    if (session) setIsLoggedIn(true);

    setArticles(loadFromStorage(STORAGE_KEYS.articles, []).length > 0 ? loadFromStorage(STORAGE_KEYS.articles, []) : seedArticles());
    setUpdates(loadFromStorage(STORAGE_KEYS.updates, []).length > 0 ? loadFromStorage(STORAGE_KEYS.updates, []) : seedUpdates());
    setServices(loadFromStorage(STORAGE_KEYS.services, []).length > 0 ? loadFromStorage(STORAGE_KEYS.services, []) : seedServices());
    setCodes(loadFromStorage(STORAGE_KEYS.codes, []).length > 0 ? loadFromStorage(STORAGE_KEYS.codes, []) : seedCodes());
    setFaq(loadFromStorage(STORAGE_KEYS.faq, []));
    setForms(loadFromStorage(STORAGE_KEYS.forms, []).length > 0 ? loadFromStorage(STORAGE_KEYS.forms, []) : seedForms());
    setSources(loadFromStorage(STORAGE_KEYS.sources, []).length > 0 ? loadFromStorage(STORAGE_KEYS.sources, []) : seedSources());
  }, []);

  // حفظ تلقائي
  useEffect(() => { if (articles.length > 0) saveToStorage(STORAGE_KEYS.articles, articles); }, [articles]);
  useEffect(() => { if (updates.length > 0) saveToStorage(STORAGE_KEYS.updates, updates); }, [updates]);
  useEffect(() => { if (services.length > 0) saveToStorage(STORAGE_KEYS.services, services); }, [services]);
  useEffect(() => { if (codes.length > 0) saveToStorage(STORAGE_KEYS.codes, codes); }, [codes]);
  useEffect(() => { saveToStorage(STORAGE_KEYS.faq, faq); }, [faq]);
  useEffect(() => { if (forms.length > 0) saveToStorage(STORAGE_KEYS.forms, forms); }, [forms]);
  useEffect(() => { if (sources.length > 0) saveToStorage(STORAGE_KEYS.sources, sources); }, [sources]);

  // تسجيل الدخول
const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault();
  const emailHash = await hashPassword(loginEmail);
  const passwordHash = await hashPassword(loginPassword);
  if (emailHash === ADMIN_EMAIL_HASH && passwordHash === ADMIN_PASSWORD_HASH) {
    setIsLoggedIn(true);
    saveToStorage(STORAGE_KEYS.session, emailHash);
    setLoginError('');
  } else {
    setLoginError('بيانات الدخول غير صحيحة');
  }
};

  const handleLogout = () => {
    setIsLoggedIn(false);
    saveToStorage(STORAGE_KEYS.session, null);
  };

  // إغلاق التحرير
  const closeAllEditors = () => {
    setEditingArticle(null); setEditingUpdate(null); setEditingService(null);
    setEditingCode(null); setEditingFaq(null); setEditingForm(null); setEditingSource(null);
    setIsAddingNew(false);
  };

  // حفظ العناصر
  const saveItem = (type: string, item: ArticleRow | UpdateRow | ServiceRow | CodeRow | FAQRow | FormRow | SourceRow) => {
    const updateList = <T extends { id: string }>(list: T[], newItem: T, setList: React.Dispatch<React.SetStateAction<T[]>>) => {
      const idx = list.findIndex(i => i.id === newItem.id);
      if (idx >= 0) { const updated = [...list]; updated[idx] = newItem; setList(updated); }
      else { setList([newItem, ...list]); }
    };

    if (type === 'article') updateList(articles, item as ArticleRow, setArticles);
    if (type === 'update') updateList(updates, item as UpdateRow, setUpdates);
    if (type === 'service') updateList(services, item as ServiceRow, setServices);
    if (type === 'code') updateList(codes, item as CodeRow, setCodes);
    if (type === 'faq') updateList(faq, item as FAQRow, setFaq);
    if (type === 'form') updateList(forms, item as FormRow, setForms);
    if (type === 'source') updateList(sources, item as SourceRow, setSources);

    setToast({ message: 'تم الحفظ ✓', type: 'success' });
    closeAllEditors();
  };

  // حذف العناصر
  const deleteItem = (type: string, id: string) => {
    if (type === 'article') setArticles(articles.filter(a => a.id !== id));
    if (type === 'update') setUpdates(updates.filter(u => u.id !== id));
    if (type === 'service') setServices(services.filter(s => s.id !== id));
    if (type === 'code') setCodes(codes.filter(c => c.id !== id));
    if (type === 'faq') setFaq(faq.filter(f => f.id !== id));
    if (type === 'form') setForms(forms.filter(f => f.id !== id));
    if (type === 'source') setSources(sources.filter(s => s.id !== id));
    setToast({ message: 'تم الحذف', type: 'success' });
    setConfirmDelete(null);
  };

  // تبديل الحالة
  const toggleActive = (type: string, id: string) => {
    if (type === 'article') setArticles(articles.map(a => a.id === id ? { ...a, active: !a.active } : a));
    if (type === 'update') setUpdates(updates.map(u => u.id === id ? { ...u, active: !u.active } : u));
    if (type === 'service') setServices(services.map(s => s.id === id ? { ...s, active: !s.active } : s));
    if (type === 'code') setCodes(codes.map(c => c.id === id ? { ...c, active: !c.active } : c));
    if (type === 'faq') setFaq(faq.map(f => f.id === id ? { ...f, active: !f.active } : f));
    if (type === 'form') setForms(forms.map(f => f.id === id ? { ...f, active: !f.active } : f));
    if (type === 'source') setSources(sources.map(s => s.id === id ? { ...s, active: !s.active } : s));
  };

  // تصدير/استيراد
  const exportData = () => {
    const data = { articles, updates, services, codes, faq, forms, sources, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `daleel-backup-${getToday()}.json`; a.click();
    URL.revokeObjectURL(url);
    setToast({ message: 'تم تصدير البيانات ✓', type: 'success' });
  };

  const importStaticData = () => {
    if (!confirm('سيتم استيراد البيانات من الملفات الثابتة. هل تريد المتابعة؟')) return;
    setArticles(seedArticles()); setServices(seedServices()); setUpdates(seedUpdates());
    setCodes(seedCodes()); setForms(seedForms()); setSources(seedSources());
    setToast({ message: 'تم استيراد البيانات ✓', type: 'success' });
  };

  // فلترة البحث
  const filter = <T extends { title?: string; name?: string; question?: string; code?: string; desc?: string }>(list: T[]): T[] => {
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(item => 
      (item.title?.toLowerCase().includes(q)) ||
      (item.name?.toLowerCase().includes(q)) ||
      (item.question?.toLowerCase().includes(q)) ||
      (item.code?.toLowerCase().includes(q)) ||
      (item.desc?.toLowerCase().includes(q))
    );
  };

  // شاشة تسجيل الدخول
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Shield className="text-emerald-600" size={32} />
            </div>
            <h1 className="text-2xl font-bold">لوحة التحكم الشاملة</h1>
            <p className="text-slate-500 text-sm mt-1">دليل العرب والسوريين في تركيا</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <input type="email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} required placeholder="البريد الإلكتروني" className="w-full px-4 py-3 rounded-xl border bg-slate-50 dark:bg-slate-800" dir="ltr" />
            <input type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} required placeholder="كلمة المرور" className="w-full px-4 py-3 rounded-xl border bg-slate-50 dark:bg-slate-800" dir="ltr" />
            {loginError && <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm font-bold flex items-center gap-2"><AlertTriangle size={16} /> {loginError}</div>}
            <button type="submit" className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold hover:bg-emerald-700 flex items-center justify-center gap-2"><Lock size={18} /> تسجيل الدخول</button>
          </form>
          <div className="mt-4 text-center"><Link href="/" className="text-sm text-slate-500 hover:text-emerald-600">← العودة للموقع</Link></div>
        </div>
      </div>
    );
  }

  // لوحة التحكم
  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950">
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center"><Shield className="text-emerald-600" size={20} /></div>
            <div><h1 className="font-bold">لوحة التحكم الشاملة</h1><p className="text-xs text-slate-500">إدارة كاملة للموقع</p></div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/" target="_blank" className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200" title="عرض الموقع"><ExternalLink size={20} className="text-slate-600" /></Link>
            <button onClick={handleLogout} className="p-2 rounded-xl bg-red-50 text-red-600 hover:bg-red-100" title="خروج"><LogOut size={20} /></button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* بحث + إضافة */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="بحث سريع..." className="w-full pr-10 pl-4 py-3 rounded-xl border bg-white dark:bg-slate-800" />
          </div>
          <button onClick={() => { closeAllEditors(); setIsAddingNew(true); }} className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg">
            <Plus size={20} /> إضافة جديد
          </button>
        </div>

        {/* التبويبات */}
        <div className="flex flex-wrap gap-2 mb-6 overflow-x-auto pb-2">
          <TabButton active={activeTab === 'articles'} onClick={() => { setActiveTab('articles'); closeAllEditors(); }} icon={<FileText size={16} />} label="المقالات" count={articles.length} />
          <TabButton active={activeTab === 'updates'} onClick={() => { setActiveTab('updates'); closeAllEditors(); }} icon={<Newspaper size={16} />} label="الأخبار" count={updates.length} />
          <TabButton active={activeTab === 'services'} onClick={() => { setActiveTab('services'); closeAllEditors(); }} icon={<Briefcase size={16} />} label="الخدمات" count={services.length} />
          <TabButton active={activeTab === 'codes'} onClick={() => { setActiveTab('codes'); closeAllEditors(); }} icon={<ShieldAlert size={16} />} label="الأكواد" count={codes.length} />
          <TabButton active={activeTab === 'faq'} onClick={() => { setActiveTab('faq'); closeAllEditors(); }} icon={<HelpCircle size={16} />} label="FAQ" count={faq.length} />
          <TabButton active={activeTab === 'forms'} onClick={() => { setActiveTab('forms'); closeAllEditors(); }} icon={<FileDown size={16} />} label="النماذج" count={forms.length} />
          <TabButton active={activeTab === 'sources'} onClick={() => { setActiveTab('sources'); closeAllEditors(); }} icon={<Link2 size={16} />} label="المصادر" count={sources.length} />
          <TabButton active={activeTab === 'settings'} onClick={() => { setActiveTab('settings'); closeAllEditors(); }} icon={<Settings size={16} />} label="الإعدادات" />
        </div>

        {/* المحتوى */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border p-4 sm:p-6">
          
          {/* المحررات */}
          {isAddingNew && (
            <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Plus size={20} /> إضافة جديد</h3>
              {activeTab === 'articles' && <ArticleEditor article={null} onSave={(a) => saveItem('article', a)} onCancel={closeAllEditors} categories={articleCategories} />}
              {activeTab === 'updates' && <UpdateEditor update={null} onSave={(u) => saveItem('update', u)} onCancel={closeAllEditors} />}
              {activeTab === 'services' && <ServiceEditor service={null} onSave={(s) => saveItem('service', s)} onCancel={closeAllEditors} />}
              {activeTab === 'codes' && <CodeEditor code={null} onSave={(c) => saveItem('code', c)} onCancel={closeAllEditors} />}
              {activeTab === 'faq' && <FAQEditor faq={null} onSave={(f) => saveItem('faq', f)} onCancel={closeAllEditors} categories={faqCategories} />}
              {activeTab === 'forms' && <FormEditor form={null} onSave={(f) => saveItem('form', f)} onCancel={closeAllEditors} />}
              {activeTab === 'sources' && <SourceEditor source={null} onSave={(s) => saveItem('source', s)} onCancel={closeAllEditors} />}
            </div>
          )}

          {editingArticle && <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl"><h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Edit3 size={20} /> تعديل المقال</h3><ArticleEditor article={editingArticle} onSave={(a) => saveItem('article', a)} onCancel={closeAllEditors} categories={articleCategories} /></div>}
          {editingUpdate && <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl"><h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Edit3 size={20} /> تعديل الخبر</h3><UpdateEditor update={editingUpdate} onSave={(u) => saveItem('update', u)} onCancel={closeAllEditors} /></div>}
          {editingService && <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl"><h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Edit3 size={20} /> تعديل الخدمة</h3><ServiceEditor service={editingService} onSave={(s) => saveItem('service', s)} onCancel={closeAllEditors} /></div>}
          {editingCode && <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl"><h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Edit3 size={20} /> تعديل الكود</h3><CodeEditor code={editingCode} onSave={(c) => saveItem('code', c)} onCancel={closeAllEditors} /></div>}
          {editingFaq && <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl"><h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Edit3 size={20} /> تعديل السؤال</h3><FAQEditor faq={editingFaq} onSave={(f) => saveItem('faq', f)} onCancel={closeAllEditors} categories={faqCategories} /></div>}
          {editingForm && <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl"><h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Edit3 size={20} /> تعديل النموذج</h3><FormEditor form={editingForm} onSave={(f) => saveItem('form', f)} onCancel={closeAllEditors} /></div>}
          {editingSource && <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl"><h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Edit3 size={20} /> تعديل المصدر</h3><SourceEditor source={editingSource} onSave={(s) => saveItem('source', s)} onCancel={closeAllEditors} /></div>}

          {/* قوائم العناصر */}
          {activeTab === 'articles' && !isAddingNew && !editingArticle && (
            <div className="space-y-3">
              <h3 className="text-lg font-bold mb-4">المقالات ({filter(articles).length})</h3>
              {filter(articles).map(item => (
                <div key={item.id} className={`p-4 rounded-xl border flex items-center justify-between gap-4 ${item.active ? 'bg-white dark:bg-slate-800' : 'opacity-60'}`}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap"><h4 className="font-bold truncate">{item.title}</h4>{isNew(item.createdAt) && <NewBadge />}{!item.active && <Badge color="red">مخفي</Badge>}</div>
                    <div className="flex items-center gap-2 text-sm mt-1"><Badge color="blue">{item.category}</Badge><span className="text-slate-400">{item.lastUpdate}</span></div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => toggleActive('article', item.id)} className="p-2 rounded-lg hover:bg-slate-100">{item.active ? <Eye size={18} className="text-emerald-600" /> : <EyeOff size={18} className="text-slate-400" />}</button>
                    <button onClick={() => { closeAllEditors(); setEditingArticle(item); }} className="p-2 rounded-lg hover:bg-blue-50 text-blue-600"><Edit3 size={18} /></button>
                    <button onClick={() => setConfirmDelete({ type: 'article', id: item.id })} className="p-2 rounded-lg hover:bg-red-50 text-red-600"><Trash2 size={18} /></button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'updates' && !isAddingNew && !editingUpdate && (
            <div className="space-y-3">
              <h3 className="text-lg font-bold mb-4">الأخبار ({filter(updates).length})</h3>
              {filter(updates).map(item => (
                <div key={item.id} className={`p-4 rounded-xl border flex items-center justify-between gap-4 ${item.active ? 'bg-white dark:bg-slate-800' : 'opacity-60'}`}>
                  <div className="flex-1"><div className="flex items-center gap-2 flex-wrap"><h4 className="font-bold">{item.title}</h4>{isNew(item.date) && <NewBadge />}</div><div className="flex items-center gap-2 text-sm mt-1"><Badge color={item.type === 'هام' || item.type === 'عاجل' ? 'red' : 'gray'}>{item.type}</Badge><span className="text-slate-400">{item.date}</span></div></div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => toggleActive('update', item.id)} className="p-2 rounded-lg hover:bg-slate-100">{item.active ? <Eye size={18} className="text-emerald-600" /> : <EyeOff size={18} className="text-slate-400" />}</button>
                    <button onClick={() => { closeAllEditors(); setEditingUpdate(item); }} className="p-2 rounded-lg hover:bg-blue-50 text-blue-600"><Edit3 size={18} /></button>
                    <button onClick={() => setConfirmDelete({ type: 'update', id: item.id })} className="p-2 rounded-lg hover:bg-red-50 text-red-600"><Trash2 size={18} /></button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'services' && !isAddingNew && !editingService && (
            <div className="space-y-3">
              <h3 className="text-lg font-bold mb-4">الخدمات ({filter(services).length})</h3>
              {filter(services).map(item => (
                <div key={item.id} className={`p-4 rounded-xl border flex items-center justify-between gap-4 ${item.active ? 'bg-white dark:bg-slate-800' : 'opacity-60'}`}>
                  <div className="flex-1"><div className="flex items-center gap-2"><h4 className="font-bold">{item.title}</h4>{item.price && <Badge color="green">{item.price} ₺</Badge>}</div><p className="text-sm text-slate-500 truncate">{item.desc}</p></div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => toggleActive('service', item.id)} className="p-2 rounded-lg hover:bg-slate-100">{item.active ? <Eye size={18} className="text-emerald-600" /> : <EyeOff size={18} className="text-slate-400" />}</button>
                    <button onClick={() => { closeAllEditors(); setEditingService(item); }} className="p-2 rounded-lg hover:bg-blue-50 text-blue-600"><Edit3 size={18} /></button>
                    <button onClick={() => setConfirmDelete({ type: 'service', id: item.id })} className="p-2 rounded-lg hover:bg-red-50 text-red-600"><Trash2 size={18} /></button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'codes' && !isAddingNew && !editingCode && (
            <div className="space-y-3">
              <h3 className="text-lg font-bold mb-4">الأكواد الأمنية ({filter(codes).length})</h3>
              {filter(codes).map(item => (
                <div key={item.id} className={`p-4 rounded-xl border flex items-center justify-between gap-4 ${item.active ? 'bg-white dark:bg-slate-800' : 'opacity-60'}`}>
                  <div className="flex-1"><div className="flex items-center gap-2"><span className="font-mono font-bold text-lg">{item.code}</span><Badge color={item.severity === 'critical' ? 'red' : item.severity === 'high' ? 'orange' : item.severity === 'medium' ? 'yellow' : 'green'}>{item.severity}</Badge></div><p className="text-sm font-bold">{item.title}</p></div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => toggleActive('code', item.id)} className="p-2 rounded-lg hover:bg-slate-100">{item.active ? <Eye size={18} className="text-emerald-600" /> : <EyeOff size={18} className="text-slate-400" />}</button>
                    <button onClick={() => { closeAllEditors(); setEditingCode(item); }} className="p-2 rounded-lg hover:bg-blue-50 text-blue-600"><Edit3 size={18} /></button>
                    <button onClick={() => setConfirmDelete({ type: 'code', id: item.id })} className="p-2 rounded-lg hover:bg-red-50 text-red-600"><Trash2 size={18} /></button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'faq' && !isAddingNew && !editingFaq && (
            <div className="space-y-3">
              <h3 className="text-lg font-bold mb-4">الأسئلة الشائعة ({filter(faq).length})</h3>
              {filter(faq).length === 0 && <p className="text-slate-500 text-center py-8">لا توجد أسئلة. اضغط "إضافة جديد" لإنشاء سؤال.</p>}
              {filter(faq).map(item => (
                <div key={item.id} className={`p-4 rounded-xl border flex items-center justify-between gap-4 ${item.active ? 'bg-white dark:bg-slate-800' : 'opacity-60'}`}>
                  <div className="flex-1"><div className="flex items-center gap-2"><Badge color="blue">{item.category}</Badge></div><p className="font-bold mt-1">{item.question}</p><p className="text-sm text-slate-500 truncate">{item.answer}</p></div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => toggleActive('faq', item.id)} className="p-2 rounded-lg hover:bg-slate-100">{item.active ? <Eye size={18} className="text-emerald-600" /> : <EyeOff size={18} className="text-slate-400" />}</button>
                    <button onClick={() => { closeAllEditors(); setEditingFaq(item); }} className="p-2 rounded-lg hover:bg-blue-50 text-blue-600"><Edit3 size={18} /></button>
                    <button onClick={() => setConfirmDelete({ type: 'faq', id: item.id })} className="p-2 rounded-lg hover:bg-red-50 text-red-600"><Trash2 size={18} /></button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'forms' && !isAddingNew && !editingForm && (
            <div className="space-y-3">
              <h3 className="text-lg font-bold mb-4">النماذج ({filter(forms).length})</h3>
              {filter(forms).map(item => (
                <div key={item.id} className={`p-4 rounded-xl border flex items-center justify-between gap-4 ${item.active ? 'bg-white dark:bg-slate-800' : 'opacity-60'}`}>
                  <div className="flex-1"><div className="flex items-center gap-2"><h4 className="font-bold">{item.name}</h4><Badge>{item.type}</Badge></div><p className="text-sm text-slate-500 truncate">{item.desc}</p></div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => toggleActive('form', item.id)} className="p-2 rounded-lg hover:bg-slate-100">{item.active ? <Eye size={18} className="text-emerald-600" /> : <EyeOff size={18} className="text-slate-400" />}</button>
                    <button onClick={() => { closeAllEditors(); setEditingForm(item); }} className="p-2 rounded-lg hover:bg-blue-50 text-blue-600"><Edit3 size={18} /></button>
                    <button onClick={() => setConfirmDelete({ type: 'form', id: item.id })} className="p-2 rounded-lg hover:bg-red-50 text-red-600"><Trash2 size={18} /></button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'sources' && !isAddingNew && !editingSource && (
            <div className="space-y-3">
              <h3 className="text-lg font-bold mb-4">المصادر الرسمية ({filter(sources).length})</h3>
              {filter(sources).map(item => (
                <div key={item.id} className={`p-4 rounded-xl border flex items-center justify-between gap-4 ${item.active ? 'bg-white dark:bg-slate-800' : 'opacity-60'}`}>
                  <div className="flex-1"><h4 className="font-bold">{item.name}</h4><p className="text-sm text-blue-600 truncate" dir="ltr">{item.url}</p></div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => toggleActive('source', item.id)} className="p-2 rounded-lg hover:bg-slate-100">{item.active ? <Eye size={18} className="text-emerald-600" /> : <EyeOff size={18} className="text-slate-400" />}</button>
                    <button onClick={() => { closeAllEditors(); setEditingSource(item); }} className="p-2 rounded-lg hover:bg-blue-50 text-blue-600"><Edit3 size={18} /></button>
                    <button onClick={() => setConfirmDelete({ type: 'source', id: item.id })} className="p-2 rounded-lg hover:bg-red-50 text-red-600"><Trash2 size={18} /></button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-6">
              <h3 className="text-lg font-bold">الإعدادات</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <button onClick={importStaticData} className="p-4 rounded-xl border bg-white dark:bg-slate-800 hover:bg-slate-50 text-right"><div className="flex items-center gap-3 mb-2"><RefreshCw className="text-blue-600" size={24} /><h4 className="font-bold">استيراد البيانات</h4></div><p className="text-sm text-slate-500">من الملفات الثابتة</p></button>
                <button onClick={exportData} className="p-4 rounded-xl border bg-white dark:bg-slate-800 hover:bg-slate-50 text-right"><div className="flex items-center gap-3 mb-2"><Download className="text-emerald-600" size={24} /><h4 className="font-bold">تصدير البيانات</h4></div><p className="text-sm text-slate-500">حفظ نسخة احتياطية JSON</p></button>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                <h4 className="font-bold mb-2">📊 إحصائيات</h4>
                <ul className="text-sm text-slate-600 space-y-1">
                  <li>• المقالات: {articles.length}</li>
                  <li>• الأخبار: {updates.length}</li>
                  <li>• الخدمات: {services.length}</li>
                  <li>• الأكواد: {codes.length}</li>
                  <li>• الأسئلة: {faq.length}</li>
                  <li>• النماذج: {forms.length}</li>
                  <li>• المصادر: {sources.length}</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog open={confirmDelete !== null} title="تأكيد الحذف" message="هل أنت متأكد من حذف هذا العنصر؟" onConfirm={() => confirmDelete && deleteItem(confirmDelete.type, confirmDelete.id)} onCancel={() => setConfirmDelete(null)} />
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
