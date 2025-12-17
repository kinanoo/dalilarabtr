'use client';

import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { SERVICES_LIST } from '@/lib/data';
import { notifyDemoDataUpdated } from '@/lib/remoteData';
import { getOfficialSourceUrls } from '@/lib/externalLinks';

type ServiceRow = {
  id: string;
  title: string;
  desc: string;
  price: number | null;
  whatsapp: string | null;
  active: boolean | null;
};

type SettingsRow = {
  id: 1;
  default_whatsapp: string | null;
};

type UpdateRow = {
  id: string;
  type: string;
  title: string;
  date: string;
  content: string | null;
  active: boolean | null;
};

type ArticleRow = {
  id: string; // slug
  title: string;
  category: string;
  lastUpdate: string; // YYYY-MM-DD
  intro: string;
  details: string;
  documents: string[];
  steps: string[];
  tips: string[];
  fees: string;
  warning: string | null;
  source: string;
  active: boolean | null;
};

type ArticleDraft = {
  id: string;
  title: string;
  category: string;
  lastUpdate: string;
  intro: string;
  details: string;
  documentsText: string;
  stepsText: string;
  tipsText: string;
  fees: string;
  warning: string;
  source: string;
  active: boolean;
};

function normalizeWaPhone(phone: string) {
  return phone.replace(/\D/g, '');
}

const DEMO_SERVICES_KEY = 'daleel_demo_services_v1';
const DEMO_SETTINGS_KEY = 'daleel_demo_settings_v1';
const DEMO_SESSION_KEY = 'daleel_demo_admin_session_v1';
const DEMO_UPDATES_KEY = 'daleel_demo_updates_v1';
const DEMO_ARTICLES_KEY = 'daleel_demo_articles_v1';

function isDemoMode() {
  return process.env.NEXT_PUBLIC_ADMIN_DEMO === '1';
}

function seedDemoServices(): ServiceRow[] {
  return SERVICES_LIST.map((s) => ({
    id: s.id,
    title: s.title,
    desc: s.desc,
    price: null,
    whatsapp: null,
    active: true,
  }));
}

function readDemoUpdates(): UpdateRow[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(DEMO_UPDATES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as UpdateRow[];
  } catch {
    return [];
  }
}

function asStringArray(value: unknown): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.map((v) => String(v)).filter(Boolean);
  return [];
}

function readDemoArticles(): ArticleRow[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(DEMO_ARTICLES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return (parsed as ArticleRow[]).map((a) => ({
      ...a,
      documents: asStringArray((a as unknown as { documents?: unknown }).documents),
      steps: asStringArray((a as unknown as { steps?: unknown }).steps),
      tips: asStringArray((a as unknown as { tips?: unknown }).tips),
    }));
  } catch {
    return [];
  }
}

function writeDemoUpdates(nextUpdates: UpdateRow[]) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(DEMO_UPDATES_KEY, JSON.stringify(nextUpdates));
  notifyDemoDataUpdated();
}

function writeDemoArticles(nextArticles: ArticleRow[]) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(DEMO_ARTICLES_KEY, JSON.stringify(nextArticles));
  notifyDemoDataUpdated();
}

function listToText(list: string[] | null | undefined) {
  return (list || []).join('\n');
}

function textToList(text: string) {
  return (text || '')
    .split(/\r?\n/g)
    .map((s) => s.trim())
    .filter(Boolean);
}

function rowToDraft(row: ArticleRow): ArticleDraft {
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    lastUpdate: row.lastUpdate,
    intro: row.intro,
    details: row.details,
    documentsText: listToText(row.documents),
    stepsText: listToText(row.steps),
    tipsText: listToText(row.tips),
    fees: row.fees,
    warning: row.warning ?? '',
    source: row.source,
    active: row.active !== false,
  };
}

function draftToRow(draft: ArticleDraft): ArticleRow {
  const officialSources = getOfficialSourceUrls(draft.source);
  return {
    id: draft.id.trim(),
    title: draft.title.trim(),
    category: draft.category.trim(),
    lastUpdate: draft.lastUpdate.trim(),
    intro: draft.intro.trim(),
    details: draft.details.trim(),
    documents: textToList(draft.documentsText),
    steps: textToList(draft.stepsText),
    tips: textToList(draft.tipsText),
    fees: draft.fees.trim(),
    warning: draft.warning.trim() ? draft.warning.trim() : null,
    source: officialSources[0] || '',
    active: draft.active,
  };
}

function newId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function readDemoServices(): ServiceRow[] {
  if (typeof window === 'undefined') return seedDemoServices();
  try {
    const raw = window.localStorage.getItem(DEMO_SERVICES_KEY);
    if (!raw) {
      const seeded = seedDemoServices();
      window.localStorage.setItem(DEMO_SERVICES_KEY, JSON.stringify(seeded));
      return seeded;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) throw new Error('bad demo services');
    return parsed as ServiceRow[];
  } catch {
    const seeded = seedDemoServices();
    try {
      window.localStorage.setItem(DEMO_SERVICES_KEY, JSON.stringify(seeded));
    } catch {
      // ignore
    }
    return seeded;
  }
}

function writeDemoServices(nextServices: ServiceRow[]) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(DEMO_SERVICES_KEY, JSON.stringify(nextServices));
  notifyDemoDataUpdated();
}

function readDemoSettingsPhone(): string {
  if (typeof window === 'undefined') return '';
  try {
    const raw = window.localStorage.getItem(DEMO_SETTINGS_KEY);
    if (!raw) return '';
    const parsed: unknown = JSON.parse(raw);
    const value =
      parsed && typeof parsed === 'object' && 'default_whatsapp' in parsed
        ? (parsed as { default_whatsapp?: unknown }).default_whatsapp
        : undefined;
    return typeof value === 'string' ? value : '';
  } catch {
    return '';
  }
}

function writeDemoSettingsPhone(phone: string) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(DEMO_SETTINGS_KEY, JSON.stringify({ default_whatsapp: phone }));
  notifyDemoDataUpdated();
}

function readDemoSessionEmail(): string | null {
  if (typeof window === 'undefined') return null;
  const raw = window.sessionStorage.getItem(DEMO_SESSION_KEY);
  return raw || null;
}

function writeDemoSessionEmail(email: string | null) {
  if (typeof window === 'undefined') return;
  if (!email) window.sessionStorage.removeItem(DEMO_SESSION_KEY);
  else window.sessionStorage.setItem(DEMO_SESSION_KEY, email);
}

function toSafeAuthError(message: string) {
  const m = (message || '').toLowerCase();
  if (m.includes('invalid') || m.includes('credentials') || m.includes('password') || m.includes('email')) {
    return 'بيانات الدخول غير صحيحة.';
  }
  return 'تعذر تسجيل الدخول.';
}

export default function AdminPage() {
  const [sessionEmail, setSessionEmail] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [services, setServices] = useState<ServiceRow[]>([]);
  const [settingsPhone, setSettingsPhone] = useState('');

  const [updates, setUpdates] = useState<UpdateRow[]>([]);
  const [updatesQuery, setUpdatesQuery] = useState('');

  const [articles, setArticles] = useState<ArticleDraft[]>([]);
  const [articlesQuery, setArticlesQuery] = useState('');

  const [newUpdate, setNewUpdate] = useState<UpdateRow>({
    id: '',
    type: 'هام',
    title: '',
    date: new Date().toISOString().slice(0, 10),
    content: '',
    active: true,
  });

  const [newArticle, setNewArticle] = useState<ArticleDraft>({
    id: '',
    title: '',
    category: '',
    lastUpdate: new Date().toISOString().slice(0, 10),
    intro: '',
    details: '',
    documentsText: '',
    stepsText: '',
    tipsText: '',
    fees: '',
    warning: '',
    source: '',
    active: false,
  });

  const [newService, setNewService] = useState({
    id: '',
    title: '',
    desc: '',
    price: '',
    whatsapp: '',
  });

  const canUseSupabase = Boolean(supabase);
  const demoEnabled = !canUseSupabase && isDemoMode();
  const demoEmail = process.env.NEXT_PUBLIC_ADMIN_DEMO_EMAIL || '';
  const demoPassword = process.env.NEXT_PUBLIC_ADMIN_DEMO_PASSWORD || '';

  const reload = async () => {
    if (demoEnabled) {
      setServices(readDemoServices());
      setSettingsPhone(readDemoSettingsPhone());
      setUpdates(readDemoUpdates());
      setArticles(readDemoArticles().map(rowToDraft));
      return;
    }
    if (!supabase) return;

    setLoading(true);
    try {
      const [{ data: servicesData }, { data: settingsData }, { data: updatesData }, { data: articlesData }] = await Promise.all([
        supabase.from('services').select('id,title,desc,price,whatsapp,active').order('title', { ascending: true }),
        supabase.from('site_settings').select('id,default_whatsapp').eq('id', 1).maybeSingle(),
        supabase.from('site_updates').select('id,type,title,date,content,active').order('date', { ascending: false }),
        supabase
          .from('articles')
          .select('id,title,category,lastUpdate,intro,details,documents,steps,tips,fees,warning,source,active')
          .order('lastUpdate', { ascending: false }),
      ]);

      setServices(((servicesData as ServiceRow[]) ?? []).slice());
      const phone = (settingsData as { default_whatsapp?: unknown } | null)?.default_whatsapp;
      setSettingsPhone(typeof phone === 'string' ? phone : '');

      setUpdates(((updatesData as UpdateRow[]) ?? []).slice());

      const normalizedArticles = (((articlesData as ArticleRow[]) ?? []) as ArticleRow[]).map((a) => ({
        ...a,
        documents: asStringArray((a as unknown as { documents?: unknown }).documents),
        steps: asStringArray((a as unknown as { steps?: unknown }).steps),
        tips: asStringArray((a as unknown as { tips?: unknown }).tips),
      }));
      setArticles(normalizedArticles.map(rowToDraft));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (demoEnabled) {
      const s = readDemoSessionEmail();
      setSessionEmail(s);
      if (s) reload();
      return;
    }
    if (!supabase) return;

    supabase.auth.getSession().then(({ data }) => {
      setSessionEmail(data.session?.user?.email ?? null);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSessionEmail(s?.user?.email ?? null);
    });

    return () => {
      sub.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (demoEnabled) return;
    if (!supabase) return;
    if (!sessionEmail) return;
    reload();
  }, [sessionEmail]);

  const onSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (demoEnabled) {
      setAuthError(null);
      const expectedEmail = demoEmail.trim();
      const expectedPassword = demoPassword;
      if (!expectedEmail || !expectedPassword) {
        setAuthError('لوحة التحكم غير متاحة حالياً.');
        return;
      }
      if (email.trim().toLowerCase() !== expectedEmail.toLowerCase() || password !== expectedPassword) {
        setAuthError('بيانات الدخول غير صحيحة.');
        return;
      }
      writeDemoSessionEmail(expectedEmail);
      setSessionEmail(expectedEmail);
      await reload();
      return;
    }
    if (!supabase) {
      setAuthError('لوحة التحكم غير متاحة حالياً.');
      return;
    }

    setAuthError(null);
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setAuthError(toSafeAuthError(error.message));
    } finally {
      setLoading(false);
    }
  };

  const onSignOut = async () => {
    if (demoEnabled) {
      writeDemoSessionEmail(null);
      setSessionEmail(null);
      return;
    }
    if (!supabase) return;
    await supabase.auth.signOut();
  };

  const upsertService = async (row: ServiceRow) => {
    if (demoEnabled) {
      setLoading(true);
      try {
        const payload: ServiceRow = {
          id: row.id.trim(),
          title: row.title.trim(),
          desc: row.desc.trim(),
          price: row.price,
          whatsapp: row.whatsapp ? normalizeWaPhone(row.whatsapp) : null,
          active: row.active ?? true,
        };
        const next = readDemoServices();
        const idx = next.findIndex((s) => s.id === payload.id);
        if (idx >= 0) next[idx] = payload;
        else next.push(payload);
        writeDemoServices(next);
        setServices(next);
      } finally {
        setLoading(false);
      }
      return;
    }
    if (!supabase) return;
    setLoading(true);
    try {
      const payload = {
        id: row.id.trim(),
        title: row.title.trim(),
        desc: row.desc.trim(),
        price: row.price,
        whatsapp: row.whatsapp ? normalizeWaPhone(row.whatsapp) : null,
        active: row.active ?? true,
      };
      await supabase.from('services').upsert(payload, { onConflict: 'id' });
      await reload();
    } finally {
      setLoading(false);
    }
  };

  const deleteService = async (id: string) => {
    if (demoEnabled) {
      setLoading(true);
      try {
        const next = readDemoServices().filter((s) => s.id !== id);
        writeDemoServices(next);
        setServices(next);
      } finally {
        setLoading(false);
      }
      return;
    }
    if (!supabase) return;
    setLoading(true);
    try {
      await supabase.from('services').delete().eq('id', id);
      await reload();
    } finally {
      setLoading(false);
    }
  };

  const upsertUpdate = async (row: UpdateRow) => {
    const payload: UpdateRow = {
      id: row.id.trim() || newId(),
      type: (row.type || 'هام').trim(),
      title: row.title.trim(),
      date: row.date.trim(),
      content: row.content?.trim() || null,
      active: row.active ?? true,
    };

    if (demoEnabled) {
      setLoading(true);
      try {
        const next = readDemoUpdates();
        const idx = next.findIndex((u) => u.id === payload.id);
        if (idx >= 0) next[idx] = payload;
        else next.unshift(payload);
        next.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
        writeDemoUpdates(next);
        setUpdates(next);
        setNewUpdate((p) => ({ ...p, id: '', title: '', content: '' }));
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!supabase) return;
    setLoading(true);
    try {
      await supabase.from('site_updates').upsert(payload, { onConflict: 'id' });
      await reload();
      setNewUpdate((p) => ({ ...p, id: '', title: '', content: '' }));
    } finally {
      setLoading(false);
    }
  };

  const deleteUpdate = async (id: string) => {
    if (demoEnabled) {
      setLoading(true);
      try {
        const next = readDemoUpdates().filter((u) => u.id !== id);
        writeDemoUpdates(next);
        setUpdates(next);
      } finally {
        setLoading(false);
      }
      return;
    }
    if (!supabase) return;
    setLoading(true);
    try {
      await supabase.from('site_updates').delete().eq('id', id);
      await reload();
    } finally {
      setLoading(false);
    }
  };

  const upsertArticle = async (draft: ArticleDraft, opts?: { resetNew?: boolean }) => {
    const payload = draftToRow(draft);
    if (!payload.id) return;

    if (demoEnabled) {
      setLoading(true);
      try {
        const next = readDemoArticles();
        const idx = next.findIndex((a) => a.id === payload.id);
        if (idx >= 0) next[idx] = payload;
        else next.unshift(payload);
        next.sort((a, b) => (b.lastUpdate || '').localeCompare(a.lastUpdate || ''));
        writeDemoArticles(next);
        setArticles(next.map(rowToDraft));
        if (opts?.resetNew) {
          setNewArticle((p) => ({
            ...p,
            id: '',
            title: '',
            category: '',
            intro: '',
            details: '',
            documentsText: '',
            stepsText: '',
            tipsText: '',
            fees: '',
            warning: '',
            source: '',
            active: false,
          }));
        }
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!supabase) return;
    setLoading(true);
    try {
      await supabase.from('articles').upsert(payload, { onConflict: 'id' });
      await reload();
      if (opts?.resetNew) {
        setNewArticle((p) => ({
          ...p,
          id: '',
          title: '',
          category: '',
          intro: '',
          details: '',
          documentsText: '',
          stepsText: '',
          tipsText: '',
          fees: '',
          warning: '',
          source: '',
          active: false,
        }));
      }
    } finally {
      setLoading(false);
    }
  };

  const deleteArticle = async (id: string) => {
    const safeId = (id || '').trim();
    if (!safeId) return;

    if (demoEnabled) {
      setLoading(true);
      try {
        const next = readDemoArticles().filter((a) => a.id !== safeId);
        writeDemoArticles(next);
        setArticles(next.map(rowToDraft));
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!supabase) return;
    setLoading(true);
    try {
      await supabase.from('articles').delete().eq('id', safeId);
      await reload();
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    if (demoEnabled) {
      setLoading(true);
      try {
        writeDemoSettingsPhone(settingsPhone ? normalizeWaPhone(settingsPhone) : '');
      } finally {
        setLoading(false);
      }
      return;
    }
    if (!supabase) return;
    setLoading(true);
    try {
      const payload: SettingsRow = {
        id: 1,
        default_whatsapp: settingsPhone ? normalizeWaPhone(settingsPhone) : null,
      };
      await supabase.from('site_settings').upsert(payload, { onConflict: 'id' });
      await reload();
    } finally {
      setLoading(false);
    }
  };

  const canAdd = useMemo(() => {
    const okId = /^[a-z0-9-]{3,50}$/i.test(newService.id.trim());
    return okId && newService.title.trim().length > 0 && newService.desc.trim().length > 0;
  }, [newService]);

  const canAddUpdate = useMemo(() => {
    return newUpdate.title.trim().length > 0 && /^\d{4}-\d{2}-\d{2}$/.test(newUpdate.date.trim());
  }, [newUpdate]);

  const canAddArticle = useMemo(() => {
    const okId = /^[a-z0-9_-]{3,80}$/i.test(newArticle.id.trim());
    const okDate = /^\d{4}-\d{2}-\d{2}$/.test(newArticle.lastUpdate.trim());
    const hasBasics = okId && newArticle.title.trim().length > 0 && newArticle.category.trim().length > 0 && okDate;
    if (!hasBasics) return false;

    if (newArticle.active) {
      return (
        newArticle.intro.trim().length > 0 &&
        newArticle.details.trim().length > 0 &&
        newArticle.fees.trim().length > 0
      );
    }
    return true;
  }, [newArticle]);

  const filteredUpdates = useMemo(() => {
    const q = updatesQuery.trim().toLowerCase();
    if (!q) return updates;
    return updates.filter((u) => {
      return (
        u.title.toLowerCase().includes(q) ||
        (u.type || '').toLowerCase().includes(q) ||
        (u.date || '').toLowerCase().includes(q)
      );
    });
  }, [updates, updatesQuery]);

  const filteredArticles = useMemo(() => {
    const q = articlesQuery.trim().toLowerCase();
    if (!q) return articles;
    return articles.filter((a) => {
      return (
        a.id.toLowerCase().includes(q) ||
        a.title.toLowerCase().includes(q) ||
        a.category.toLowerCase().includes(q)
      );
    });
  }, [articles, articlesQuery]);

  return (
    <main className="flex flex-col min-h-screen">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-10 w-full">
        {!sessionEmail && (
          <div className="max-w-md mx-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
            <div className="font-bold text-slate-800 dark:text-slate-100 mb-4">تسجيل الدخول</div>
            <form onSubmit={onSignIn} className="space-y-4">
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl px-4 py-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800"
                placeholder="Email"
                type="email"
                required
              />
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl px-4 py-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800"
                placeholder="Password"
                type="password"
                required
              />
              {authError && <div className="text-sm text-red-600">{authError}</div>}
              <button disabled={loading} className="w-full rounded-xl py-3 font-bold bg-primary-700 text-white disabled:opacity-40">
                دخول
              </button>
            </form>
          </div>
        )}

        {(canUseSupabase || demoEnabled) && sessionEmail && (
          <div className="space-y-6">
            <div className="flex items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
              <div className="text-sm text-slate-700 dark:text-slate-200">
                مسجّل الدخول: <span className="font-bold">{sessionEmail}</span>
              </div>
              <button onClick={onSignOut} className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 font-bold">
                تسجيل خروج
              </button>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
              <div className="font-bold text-slate-800 dark:text-slate-100 mb-4">رقم التواصل الافتراضي (واتساب)</div>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  value={settingsPhone}
                  onChange={(e) => setSettingsPhone(e.target.value)}
                  className="flex-1 rounded-xl px-4 py-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800"
                  placeholder="مثال: 905xxxxxxxxx"
                />
                <button
                  disabled={loading}
                  onClick={saveSettings}
                  className="rounded-xl px-5 py-3 font-bold bg-green-600 text-white disabled:opacity-40"
                >
                  حفظ
                </button>
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-300 mt-2">
                اكتب الرقم بصيغة دولية بدون + (أو سيتم تنظيفه تلقائياً).
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
              <div className="font-bold text-slate-800 dark:text-slate-100 mb-4">إضافة خدمة</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  value={newService.id}
                  onChange={(e) => setNewService((p) => ({ ...p, id: e.target.value }))}
                  className="rounded-xl px-4 py-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800"
                  placeholder="id (مثال: visa-appointment)"
                />
                <input
                  value={newService.title}
                  onChange={(e) => setNewService((p) => ({ ...p, title: e.target.value }))}
                  className="rounded-xl px-4 py-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800"
                  placeholder="اسم الخدمة"
                />
                <input
                  value={newService.price}
                  onChange={(e) => setNewService((p) => ({ ...p, price: e.target.value }))}
                  className="rounded-xl px-4 py-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800"
                  placeholder="السعر (اختياري)"
                  inputMode="decimal"
                />
                <input
                  value={newService.whatsapp}
                  onChange={(e) => setNewService((p) => ({ ...p, whatsapp: e.target.value }))}
                  className="rounded-xl px-4 py-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800"
                  placeholder="واتساب للتواصل (اختياري)"
                />
                <textarea
                  value={newService.desc}
                  onChange={(e) => setNewService((p) => ({ ...p, desc: e.target.value }))}
                  className="sm:col-span-2 rounded-xl px-4 py-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 min-h-[90px]"
                  placeholder="وصف"
                />
              </div>
              <button
                disabled={loading || !canAdd}
                onClick={async () => {
                  const priceNumber = newService.price.trim() ? Number(newService.price) : null;
                  await upsertService({
                    id: newService.id.trim(),
                    title: newService.title.trim(),
                    desc: newService.desc.trim(),
                    price: Number.isFinite(priceNumber) ? priceNumber : null,
                    whatsapp: newService.whatsapp.trim() || null,
                    active: true,
                  });
                  setNewService({ id: '', title: '', desc: '', price: '', whatsapp: '' });
                }}
                className="mt-4 w-full rounded-xl py-3 font-bold bg-primary-700 text-white disabled:opacity-40"
              >
                إضافة
              </button>
              <div className="text-xs text-slate-500 dark:text-slate-300 mt-2">
                ملاحظة: id يُستخدم في رابط الطلب: <span className="font-mono">/request?service=id</span>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
              <div className="font-bold text-slate-800 dark:text-slate-100 mb-4">تحديثات 2026 (الأخبار)</div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  value={newUpdate.title}
                  onChange={(e) => setNewUpdate((p) => ({ ...p, title: e.target.value }))}
                  className="sm:col-span-2 rounded-xl px-4 py-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800"
                  placeholder="عنوان الخبر"
                />

                <input
                  value={newUpdate.date}
                  onChange={(e) => setNewUpdate((p) => ({ ...p, date: e.target.value }))}
                  className="rounded-xl px-4 py-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800"
                  placeholder="التاريخ (YYYY-MM-DD)"
                />

                <input
                  value={newUpdate.type}
                  onChange={(e) => setNewUpdate((p) => ({ ...p, type: e.target.value }))}
                  className="rounded-xl px-4 py-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800"
                  placeholder="النوع (مثال: هام)"
                />

                <textarea
                  value={newUpdate.content ?? ''}
                  onChange={(e) => setNewUpdate((p) => ({ ...p, content: e.target.value }))}
                  className="sm:col-span-2 rounded-xl px-4 py-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 min-h-[90px]"
                  placeholder="نص الخبر (اختياري)"
                />

                <label className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-200">
                  <input
                    type="checkbox"
                    checked={newUpdate.active !== false}
                    onChange={(e) => setNewUpdate((p) => ({ ...p, active: e.target.checked }))}
                  />
                  منشور
                </label>
              </div>

              <button
                disabled={loading || !canAddUpdate}
                onClick={() => upsertUpdate(newUpdate)}
                className="mt-4 w-full rounded-xl py-3 font-bold bg-primary-700 text-white disabled:opacity-40"
              >
                نشر التحديث
              </button>

              <div className="mt-6 flex items-center justify-between gap-3">
                <div className="font-bold text-slate-800 dark:text-slate-100">كل التحديثات</div>
                <input
                  value={updatesQuery}
                  onChange={(e) => setUpdatesQuery(e.target.value)}
                  className="rounded-xl px-4 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800"
                  placeholder="بحث…"
                />
              </div>

              {filteredUpdates.length === 0 ? (
                <div className="text-sm text-slate-600 dark:text-slate-300 mt-4">لا توجد تحديثات بعد.</div>
              ) : (
                <div className="space-y-4 mt-4">
                  {filteredUpdates.map((u) => (
                    <div key={u.id} className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
                      <div className="text-xs text-slate-500 dark:text-slate-300 mb-2">ID: {u.id}</div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <input
                          value={u.title}
                          onChange={(e) =>
                            setUpdates((prev) => prev.map((p) => (p.id === u.id ? { ...p, title: e.target.value } : p)))
                          }
                          className="sm:col-span-2 rounded-xl px-4 py-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800"
                          placeholder="العنوان"
                        />
                        <input
                          value={u.date}
                          onChange={(e) =>
                            setUpdates((prev) => prev.map((p) => (p.id === u.id ? { ...p, date: e.target.value } : p)))
                          }
                          className="rounded-xl px-4 py-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800"
                          placeholder="التاريخ"
                        />
                        <input
                          value={u.type}
                          onChange={(e) =>
                            setUpdates((prev) => prev.map((p) => (p.id === u.id ? { ...p, type: e.target.value } : p)))
                          }
                          className="rounded-xl px-4 py-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800"
                          placeholder="النوع"
                        />
                        <label className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-200">
                          <input
                            type="checkbox"
                            checked={u.active !== false}
                            onChange={(e) =>
                              setUpdates((prev) => prev.map((p) => (p.id === u.id ? { ...p, active: e.target.checked } : p)))
                            }
                          />
                          منشور
                        </label>
                        <textarea
                          value={u.content ?? ''}
                          onChange={(e) =>
                            setUpdates((prev) => prev.map((p) => (p.id === u.id ? { ...p, content: e.target.value } : p)))
                          }
                          className="sm:col-span-2 rounded-xl px-4 py-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 min-h-[90px]"
                          placeholder="المحتوى"
                        />
                      </div>

                      <div className="flex flex-col sm:flex-row gap-2 mt-3">
                        <button
                          disabled={loading}
                          onClick={() => upsertUpdate(u)}
                          className="flex-1 rounded-xl py-3 font-bold bg-green-600 text-white disabled:opacity-40"
                        >
                          حفظ التعديل
                        </button>
                        <button
                          disabled={loading}
                          onClick={() => deleteUpdate(u.id)}
                          className="flex-1 rounded-xl py-3 font-bold bg-red-600 text-white disabled:opacity-40"
                        >
                          حذف
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="text-xs text-slate-500 dark:text-slate-300 mt-4">
                ملاحظة: زر “تحديثات 2026” في القائمة سيظهر تنبيهاً تلقائياً عند نشر خبر جديد.
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
              <div className="font-bold text-slate-800 dark:text-slate-100 mb-4">المقالات</div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  value={newArticle.id}
                  onChange={(e) => setNewArticle((p) => ({ ...p, id: e.target.value }))}
                  className="rounded-xl px-4 py-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800"
                  placeholder="المعرف (slug) مثال: phone_imei_register"
                />
                <input
                  value={newArticle.lastUpdate}
                  onChange={(e) => setNewArticle((p) => ({ ...p, lastUpdate: e.target.value }))}
                  className="rounded-xl px-4 py-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800"
                  placeholder="آخر تحديث (YYYY-MM-DD)"
                />
                <input
                  value={newArticle.title}
                  onChange={(e) => setNewArticle((p) => ({ ...p, title: e.target.value }))}
                  className="sm:col-span-2 rounded-xl px-4 py-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800"
                  placeholder="عنوان المقال"
                />
                <input
                  value={newArticle.category}
                  onChange={(e) => setNewArticle((p) => ({ ...p, category: e.target.value }))}
                  className="sm:col-span-2 rounded-xl px-4 py-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800"
                  placeholder="التصنيف (مثال: الحياة اليومية)"
                />
                <textarea
                  value={newArticle.intro}
                  onChange={(e) => setNewArticle((p) => ({ ...p, intro: e.target.value }))}
                  className="sm:col-span-2 rounded-xl px-4 py-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 min-h-[80px]"
                  placeholder="مقدمة قصيرة"
                />
                <textarea
                  value={newArticle.details}
                  onChange={(e) => setNewArticle((p) => ({ ...p, details: e.target.value }))}
                  className="sm:col-span-2 rounded-xl px-4 py-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 min-h-[120px]"
                  placeholder="التفاصيل"
                />
                <textarea
                  value={newArticle.documentsText}
                  onChange={(e) => setNewArticle((p) => ({ ...p, documentsText: e.target.value }))}
                  className="sm:col-span-2 rounded-xl px-4 py-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 min-h-[90px]"
                  placeholder="الأوراق المطلوبة (كل سطر عنصر)"
                />
                <textarea
                  value={newArticle.stepsText}
                  onChange={(e) => setNewArticle((p) => ({ ...p, stepsText: e.target.value }))}
                  className="sm:col-span-2 rounded-xl px-4 py-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 min-h-[90px]"
                  placeholder="الخطوات (كل سطر خطوة)"
                />
                <textarea
                  value={newArticle.tipsText}
                  onChange={(e) => setNewArticle((p) => ({ ...p, tipsText: e.target.value }))}
                  className="sm:col-span-2 rounded-xl px-4 py-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 min-h-[90px]"
                  placeholder="نصائح (كل سطر نصيحة)"
                />
                <input
                  value={newArticle.fees}
                  onChange={(e) => setNewArticle((p) => ({ ...p, fees: e.target.value }))}
                  className="sm:col-span-2 rounded-xl px-4 py-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800"
                  placeholder="التكلفة (مثال: 500 ليرة تقريباً)"
                />
                <input
                  value={newArticle.source}
                  onChange={(e) => setNewArticle((p) => ({ ...p, source: e.target.value }))}
                  className="sm:col-span-2 rounded-xl px-4 py-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800"
                  placeholder="رابط المصدر الرسمي (اختياري لكنه مهم عند النشر)"
                />
                <input
                  value={newArticle.warning}
                  onChange={(e) => setNewArticle((p) => ({ ...p, warning: e.target.value }))}
                  className="sm:col-span-2 rounded-xl px-4 py-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800"
                  placeholder="تنبيه مهم (اختياري)"
                />
                <label className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-200">
                  <input
                    type="checkbox"
                    checked={newArticle.active}
                    onChange={(e) => setNewArticle((p) => ({ ...p, active: e.target.checked }))}
                  />
                  منشور
                </label>
              </div>

              <button
                disabled={loading || !canAddArticle}
                onClick={() => upsertArticle(newArticle, { resetNew: true })}
                className="mt-4 w-full rounded-xl py-3 font-bold bg-primary-700 text-white disabled:opacity-40"
              >
                حفظ المقال
              </button>

              <div className="text-xs text-slate-500 dark:text-slate-300 mt-2">
                ملاحظة: إذا كان المعرف موجوداً ضمن مقالات الموقع الحالية سيظهر ضمن صفحة المقال الأساسية، وإلا سيظهر ضمن صفحة القراءة.
              </div>

              <div className="mt-6 flex items-center justify-between gap-3">
                <div className="font-bold text-slate-800 dark:text-slate-100">كل المقالات</div>
                <input
                  value={articlesQuery}
                  onChange={(e) => setArticlesQuery(e.target.value)}
                  className="rounded-xl px-4 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800"
                  placeholder="بحث…"
                />
              </div>

              {filteredArticles.length === 0 ? (
                <div className="text-sm text-slate-600 dark:text-slate-300 mt-4">لا توجد مقالات بعد.</div>
              ) : (
                <div className="space-y-4 mt-4">
                  {filteredArticles.map((a) => (
                    <div key={a.id} className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="text-xs text-slate-500 dark:text-slate-300">ID: {a.id}</div>
                        <div className="flex gap-2">
                          <a
                            href={`/article/${encodeURIComponent(a.id)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold"
                          >
                            فتح صفحة المقال
                          </a>
                          <a
                            href={`/read?id=${encodeURIComponent(a.id)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold"
                          >
                            فتح صفحة القراءة
                          </a>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                        <input
                          value={a.title}
                          onChange={(e) =>
                            setArticles((prev) => prev.map((p) => (p.id === a.id ? { ...p, title: e.target.value } : p)))
                          }
                          className="sm:col-span-2 rounded-xl px-4 py-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800"
                          placeholder="العنوان"
                        />
                        <input
                          value={a.lastUpdate}
                          onChange={(e) =>
                            setArticles((prev) =>
                              prev.map((p) => (p.id === a.id ? { ...p, lastUpdate: e.target.value } : p))
                            )
                          }
                          className="rounded-xl px-4 py-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800"
                          placeholder="آخر تحديث (YYYY-MM-DD)"
                        />
                        <input
                          value={a.category}
                          onChange={(e) =>
                            setArticles((prev) =>
                              prev.map((p) => (p.id === a.id ? { ...p, category: e.target.value } : p))
                            )
                          }
                          className="rounded-xl px-4 py-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800"
                          placeholder="التصنيف"
                        />
                        <label className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-200">
                          <input
                            type="checkbox"
                            checked={a.active}
                            onChange={(e) =>
                              setArticles((prev) => prev.map((p) => (p.id === a.id ? { ...p, active: e.target.checked } : p)))
                            }
                          />
                          منشور
                        </label>

                        <textarea
                          value={a.intro}
                          onChange={(e) =>
                            setArticles((prev) => prev.map((p) => (p.id === a.id ? { ...p, intro: e.target.value } : p)))
                          }
                          className="sm:col-span-2 rounded-xl px-4 py-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 min-h-[70px]"
                          placeholder="المقدمة"
                        />
                        <textarea
                          value={a.details}
                          onChange={(e) =>
                            setArticles((prev) =>
                              prev.map((p) => (p.id === a.id ? { ...p, details: e.target.value } : p))
                            )
                          }
                          className="sm:col-span-2 rounded-xl px-4 py-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 min-h-[120px]"
                          placeholder="التفاصيل"
                        />
                        <textarea
                          value={a.documentsText}
                          onChange={(e) =>
                            setArticles((prev) =>
                              prev.map((p) => (p.id === a.id ? { ...p, documentsText: e.target.value } : p))
                            )
                          }
                          className="sm:col-span-2 rounded-xl px-4 py-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 min-h-[90px]"
                          placeholder="الأوراق المطلوبة (كل سطر عنصر)"
                        />
                        <textarea
                          value={a.stepsText}
                          onChange={(e) =>
                            setArticles((prev) => prev.map((p) => (p.id === a.id ? { ...p, stepsText: e.target.value } : p)))
                          }
                          className="sm:col-span-2 rounded-xl px-4 py-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 min-h-[90px]"
                          placeholder="الخطوات (كل سطر خطوة)"
                        />
                        <textarea
                          value={a.tipsText}
                          onChange={(e) =>
                            setArticles((prev) => prev.map((p) => (p.id === a.id ? { ...p, tipsText: e.target.value } : p)))
                          }
                          className="sm:col-span-2 rounded-xl px-4 py-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 min-h-[90px]"
                          placeholder="نصائح (كل سطر نصيحة)"
                        />
                        <input
                          value={a.fees}
                          onChange={(e) =>
                            setArticles((prev) => prev.map((p) => (p.id === a.id ? { ...p, fees: e.target.value } : p)))
                          }
                          className="sm:col-span-2 rounded-xl px-4 py-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800"
                          placeholder="التكلفة"
                        />
                        <input
                          value={a.source}
                          onChange={(e) =>
                            setArticles((prev) => prev.map((p) => (p.id === a.id ? { ...p, source: e.target.value } : p)))
                          }
                          className="sm:col-span-2 rounded-xl px-4 py-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800"
                          placeholder="رابط المصدر الرسمي"
                        />
                        <input
                          value={a.warning}
                          onChange={(e) =>
                            setArticles((prev) => prev.map((p) => (p.id === a.id ? { ...p, warning: e.target.value } : p)))
                          }
                          className="sm:col-span-2 rounded-xl px-4 py-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800"
                          placeholder="تنبيه مهم (اختياري)"
                        />
                      </div>

                      <div className="flex flex-col sm:flex-row gap-2 mt-3">
                        <button
                          disabled={loading}
                          onClick={() => upsertArticle(a)}
                          className="flex-1 rounded-xl py-3 font-bold bg-green-600 text-white disabled:opacity-40"
                        >
                          حفظ التعديل
                        </button>
                        <button
                          disabled={loading}
                          onClick={() => deleteArticle(a.id)}
                          className="flex-1 rounded-xl py-3 font-bold bg-red-600 text-white disabled:opacity-40"
                        >
                          حذف
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
              <div className="flex items-center justify-between gap-3 mb-4">
                <div className="font-bold text-slate-800 dark:text-slate-100">الخدمات الحالية</div>
                <button
                  disabled={loading}
                  onClick={reload}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 font-bold disabled:opacity-40"
                >
                  تحديث
                </button>
              </div>

              {services.length === 0 ? (
                <div className="text-sm text-slate-600 dark:text-slate-300">لا توجد خدمات في قاعدة البيانات بعد.</div>
              ) : (
                <div className="space-y-4">
                  {services.map((s) => (
                    <div key={s.id} className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
                      <div className="text-xs text-slate-500 dark:text-slate-300 mb-2">ID: {s.id}</div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <input
                          value={s.title}
                          onChange={(e) =>
                            setServices((prev) => prev.map((p) => (p.id === s.id ? { ...p, title: e.target.value } : p)))
                          }
                          className="rounded-xl px-4 py-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800"
                          placeholder="اسم الخدمة"
                        />
                        <input
                          value={s.whatsapp ?? ''}
                          onChange={(e) =>
                            setServices((prev) =>
                              prev.map((p) => (p.id === s.id ? { ...p, whatsapp: e.target.value } : p))
                            )
                          }
                          className="rounded-xl px-4 py-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800"
                          placeholder="واتساب للتواصل (اختياري)"
                        />
                        <input
                          value={s.price ?? ''}
                          onChange={(e) => {
                            const v = e.target.value;
                            setServices((prev) =>
                              prev.map((p) =>
                                p.id === s.id ? { ...p, price: v.trim() ? Number(v) : null } : p
                              )
                            );
                          }}
                          className="rounded-xl px-4 py-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800"
                          placeholder="السعر (اختياري)"
                          inputMode="decimal"
                        />
                        <label className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-200">
                          <input
                            type="checkbox"
                            checked={s.active !== false}
                            onChange={(e) =>
                              setServices((prev) => prev.map((p) => (p.id === s.id ? { ...p, active: e.target.checked } : p)))
                            }
                          />
                          فعّالة
                        </label>
                        <textarea
                          value={s.desc}
                          onChange={(e) =>
                            setServices((prev) => prev.map((p) => (p.id === s.id ? { ...p, desc: e.target.value } : p)))
                          }
                          className="sm:col-span-2 rounded-xl px-4 py-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 min-h-[90px]"
                          placeholder="وصف"
                        />
                      </div>

                      <div className="flex flex-col sm:flex-row gap-2 mt-3">
                        <button
                          disabled={loading}
                          onClick={() => upsertService(s)}
                          className="flex-1 rounded-xl py-3 font-bold bg-green-600 text-white disabled:opacity-40"
                        >
                          حفظ التعديل
                        </button>
                        <button
                          disabled={loading}
                          onClick={() => deleteService(s.id)}
                          className="flex-1 rounded-xl py-3 font-bold bg-red-600 text-white disabled:opacity-40"
                        >
                          حذف
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="text-xs text-slate-500 dark:text-slate-300 mt-4">
                سيتم توجيه نموذج الطلب إلى رقم واتساب الخاص بالخدمة إن وُجد، وإلا سيستخدم الرقم الافتراضي.
              </div>
            </div>

            <div className="text-xs text-slate-500 dark:text-slate-300">
              تنبيه أمني: لا تشارك رابط لوحة التحكم، واستخدم حساب Supabase محمي بكلمة مرور قوية.
            </div>
          </div>
        )}
      </div>

      <Footer />
    </main>
  );
}
