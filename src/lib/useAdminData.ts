'use client';

/**
 * 🔗 Hook لربط بيانات لوحة التحكم بالموقع
 * الإصدار الشامل - يشمل كل الأقسام
 */

import { useState, useEffect, useMemo } from 'react';
import { ARTICLES, ArticleData } from '@/lib/articles';
import { SERVICES_LIST, LATEST_UPDATES, OFFICIAL_SOURCES, FORMS } from '@/lib/data';
import { SECURITY_CODES } from '@/lib/codes';

// ============================================
// 🔑 مفاتيح التخزين
// ============================================

export const STORAGE_KEYS = {
  articles: 'admin_articles_v2',
  services: 'admin_services_v2',
  updates: 'admin_updates_v2',
  codes: 'admin_codes_v2',
  faq: 'admin_faq_v2',
  forms: 'admin_forms_v2',
  sources: 'admin_sources_v2',
};

// ============================================
// 📦 أنواع البيانات
// ============================================

export type AdminArticle = {
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

export type AdminService = {
  id: string;
  title: string;
  desc: string;
  price: number | null;
  whatsapp: string | null;
  active: boolean;
  image?: string;
  imageAlt?: string;

};

export type AdminUpdate = {
  id: string;
  type: string;
  title: string;
  date: string;
  content: string | null;
  active: boolean;
  image?: string;
  imageAlt?: string;

};

export type AdminCode = {
  id: string;
  code: string;
  title: string;
  desc: string;
  category: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'safe';
  active: boolean;
};

export type AdminFAQ = {
  id: string;
  category: string;
  question: string;
  answer: string;
  active: boolean;
};

export type AdminForm = {
  id: string;
  name: string;
  desc: string;
  type: string;
  url: string;
  active: boolean;
};

export type AdminSource = {
  id: string;
  name: string;
  url: string;
  desc: string;
  active: boolean;
};

// ============================================
// 📖 دوال القراءة
// ============================================

function safeGet<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function toArticleData(admin: AdminArticle): ArticleData {
  return {
    title: admin.title,
    category: admin.category,
    lastUpdate: admin.lastUpdate,
    intro: admin.intro,
    details: admin.details,
    documents: admin.documents,
    steps: admin.steps,
    tips: admin.tips,
    fees: admin.fees,
    warning: admin.warning || undefined,
    source: admin.source,
  };
}

// ============================================
// 🪝 Hooks - المقالات
// ============================================

export function useAdminArticles() {
  const [articles, setArticles] = useState<AdminArticle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = safeGet<AdminArticle[]>(STORAGE_KEYS.articles, []);
    
    if (saved.length > 0) {
      setArticles(saved.filter(a => a.active));
    } else {
      const staticArticles: AdminArticle[] = Object.entries(ARTICLES).map(([id, a]) => ({
        id,
        title: a.title,
        category: a.category,
        lastUpdate: a.lastUpdate,
        intro: a.intro,
        details: a.details,
        documents: a.documents || [],
        steps: a.steps || [],
        tips: a.tips || [],
        fees: a.fees,
        warning: a.warning || null,
        source: a.source || '',
        active: true,
        createdAt: a.lastUpdate,
      }));
      setArticles(staticArticles);
    }
    
    setLoading(false);

    const handler = () => {
      const updated = safeGet<AdminArticle[]>(STORAGE_KEYS.articles, []);
      if (updated.length > 0) {
        setArticles(updated.filter(a => a.active));
      }
    };

    window.addEventListener('admin-data-updated', handler);
    window.addEventListener('storage', handler);

    return () => {
      window.removeEventListener('admin-data-updated', handler);
      window.removeEventListener('storage', handler);
    };
  }, []);

  const articlesMap = useMemo(() => {
    const map: Record<string, ArticleData> = {};
    articles.forEach(a => {
      map[a.id] = toArticleData(a);
    });
    return map;
  }, [articles]);

  return { articles, articlesMap, loading };
}

export function useAdminArticle(id: string) {
  const [article, setArticle] = useState<AdminArticle | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = safeGet<AdminArticle[]>(STORAGE_KEYS.articles, []);
    const found = saved.find(a => a.id === id && a.active);
    
    if (found) {
      setArticle(found);
    } else if (ARTICLES[id]) {
      const a = ARTICLES[id];
      setArticle({
        id,
        title: a.title,
        category: a.category,
        lastUpdate: a.lastUpdate,
        intro: a.intro,
        details: a.details,
        documents: a.documents || [],
        steps: a.steps || [],
        tips: a.tips || [],
        fees: a.fees,
        warning: a.warning || null,
        source: a.source || '',
        active: true,
        createdAt: a.lastUpdate,
      });
    }
    
    setLoading(false);
  }, [id]);

  const articleData = article ? toArticleData(article) : null;

  return { article, articleData, loading };
}

// ============================================
// 🪝 Hooks - الخدمات
// ============================================

export function useAdminServices() {
  const [services, setServices] = useState<AdminService[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = safeGet<AdminService[]>(STORAGE_KEYS.services, []);
    
    if (saved.length > 0) {
      setServices(saved.filter(s => s.active));
    } else {
      const staticServices: AdminService[] = SERVICES_LIST.map(s => ({
        id: s.id,
        title: s.title,
        desc: s.desc,
        price: null,
        whatsapp: null,
        active: true,
      }));
      setServices(staticServices);
    }
    
    setLoading(false);

    const handler = () => {
      const updated = safeGet<AdminService[]>(STORAGE_KEYS.services, []);
      if (updated.length > 0) {
        setServices(updated.filter(s => s.active));
      }
    };

    window.addEventListener('admin-data-updated', handler);
    window.addEventListener('storage', handler);

    return () => {
      window.removeEventListener('admin-data-updated', handler);
      window.removeEventListener('storage', handler);
    };
  }, []);

  return { services, loading };
}

// ============================================
// 🪝 Hooks - الأخبار
// ============================================

export function useAdminUpdates() {
  const [updates, setUpdates] = useState<AdminUpdate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = safeGet<AdminUpdate[]>(STORAGE_KEYS.updates, []);
    
    if (saved.length > 0) {
      setUpdates(saved.filter(u => u.active).sort((a, b) => b.date.localeCompare(a.date)));
    } else {
      const staticUpdates: AdminUpdate[] = LATEST_UPDATES.map(u => ({
        id: String(u.id),
        type: u.type,
        title: u.title,
        date: u.date,
        content: u.content || null,
        active: true,
      }));
      setUpdates(staticUpdates);
    }
    
    setLoading(false);

    const handler = () => {
      const updated = safeGet<AdminUpdate[]>(STORAGE_KEYS.updates, []);
      if (updated.length > 0) {
        setUpdates(updated.filter(u => u.active).sort((a, b) => b.date.localeCompare(a.date)));
      }
    };

    window.addEventListener('admin-data-updated', handler);
    window.addEventListener('storage', handler);

    return () => {
      window.removeEventListener('admin-data-updated', handler);
      window.removeEventListener('storage', handler);
    };
  }, []);

  return { updates, loading };
}

// ============================================
// 🪝 Hooks - الأكواد الأمنية
// ============================================

export function useAdminCodes() {
  const [codes, setCodes] = useState<AdminCode[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = safeGet<AdminCode[]>(STORAGE_KEYS.codes, []);
    
    if (saved.length > 0) {
      setCodes(saved.filter(c => c.active));
    } else {
      const staticCodes: AdminCode[] = SECURITY_CODES.map((c, i) => ({
        id: `code-${i}`,
        code: c.code,
        title: c.title,
        desc: c.desc,
        category: c.category,
        severity: c.severity,
        active: true,
      }));
      setCodes(staticCodes);
    }
    
    setLoading(false);

    const handler = () => {
      const updated = safeGet<AdminCode[]>(STORAGE_KEYS.codes, []);
      if (updated.length > 0) {
        setCodes(updated.filter(c => c.active));
      }
    };

    window.addEventListener('admin-data-updated', handler);
    window.addEventListener('storage', handler);

    return () => {
      window.removeEventListener('admin-data-updated', handler);
      window.removeEventListener('storage', handler);
    };
  }, []);

  return { codes, loading };
}

// ============================================
// 🪝 Hooks - الأسئلة الشائعة
// ============================================

export function useAdminFAQ() {
  const [faq, setFaq] = useState<AdminFAQ[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = safeGet<AdminFAQ[]>(STORAGE_KEYS.faq, []);
    
    if (saved.length > 0) {
      setFaq(saved.filter(f => f.active));
    }
    // لا يوجد fallback ثابت هنا - سيُحمّل من الملف الأصلي إذا لزم
    
    setLoading(false);

    const handler = () => {
      const updated = safeGet<AdminFAQ[]>(STORAGE_KEYS.faq, []);
      if (updated.length > 0) {
        setFaq(updated.filter(f => f.active));
      }
    };

    window.addEventListener('admin-data-updated', handler);
    window.addEventListener('storage', handler);

    return () => {
      window.removeEventListener('admin-data-updated', handler);
      window.removeEventListener('storage', handler);
    };
  }, []);

  // تجميع الأسئلة حسب التصنيف
  const faqByCategory = useMemo(() => {
    const grouped: Record<string, AdminFAQ[]> = {};
    faq.forEach(f => {
      if (!grouped[f.category]) grouped[f.category] = [];
      grouped[f.category].push(f);
    });
    return grouped;
  }, [faq]);

  return { faq, faqByCategory, loading };
}

// ============================================
// 🪝 Hooks - النماذج
// ============================================

export function useAdminForms() {
  const [forms, setForms] = useState<AdminForm[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = safeGet<AdminForm[]>(STORAGE_KEYS.forms, []);
    
    if (saved.length > 0) {
      setForms(saved.filter(f => f.active));
    } else {
      const staticForms: AdminForm[] = FORMS.map((f, i) => ({
        id: `form-${i}`,
        name: f.name,
        desc: f.desc,
        type: f.type,
        url: (f as any).url || '',
        active: true,
      }));
      setForms(staticForms);
    }
    
    setLoading(false);

    const handler = () => {
      const updated = safeGet<AdminForm[]>(STORAGE_KEYS.forms, []);
      if (updated.length > 0) {
        setForms(updated.filter(f => f.active));
      }
    };

    window.addEventListener('admin-data-updated', handler);
    window.addEventListener('storage', handler);

    return () => {
      window.removeEventListener('admin-data-updated', handler);
      window.removeEventListener('storage', handler);
    };
  }, []);

  return { forms, loading };
}

// ============================================
// 🪝 Hooks - المصادر الرسمية
// ============================================

export function useAdminSources() {
  const [sources, setSources] = useState<AdminSource[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = safeGet<AdminSource[]>(STORAGE_KEYS.sources, []);
    
    if (saved.length > 0) {
      setSources(saved.filter(s => s.active));
    } else {
      const staticSources: AdminSource[] = OFFICIAL_SOURCES.map((s, i) => ({
        id: `source-${i}`,
        name: s.name,
        url: s.url,
        desc: s.desc,
        active: true,
      }));
      setSources(staticSources);
    }
    
    setLoading(false);

    const handler = () => {
      const updated = safeGet<AdminSource[]>(STORAGE_KEYS.sources, []);
      if (updated.length > 0) {
        setSources(updated.filter(s => s.active));
      }
    };

    window.addEventListener('admin-data-updated', handler);
    window.addEventListener('storage', handler);

    return () => {
      window.removeEventListener('admin-data-updated', handler);
      window.removeEventListener('storage', handler);
    };
  }, []);

  return { sources, loading };
}

// ============================================
// 🛠️ دوال مساعدة
// ============================================

export function isNewContent(dateStr: string): boolean {
  if (!dateStr) return false;
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  return diffDays <= 7;
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
