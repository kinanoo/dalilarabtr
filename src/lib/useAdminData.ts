'use client';

/**
 * 🔗 Hook لربط بيانات لوحة التحكم بالموقع (Admin Data Hook) - Refactored with SWR
 * 
 * المبدأ:
 * يستخدم `useResource` (SWR) لجلب البيانات وإدارة الكاش والدمج تلقائياً.
 */

import { useMemo } from 'react';
// import { ARTICLES, ArticleData } from '@/lib/articles'; // REMOVED
import { CATEGORY_SLUGS } from '@/lib/config';
import { SERVICES_LIST, LATEST_UPDATES, OFFICIAL_SOURCES, FORMS, PRIMARY_NAV, NAVIGATION, TOOLS_MENU } from '@/lib/constants';

import {
  AdminArticle, ArticleData, AdminService, AdminUpdate, AdminCode, AdminFAQ,
  AdminSource, AdminForm, AdminMenu, AdminCategory, AdminTool
} from '@/lib/types';
import { useResource, standardMerger } from '@/lib/hooks/useResource';

// ============================================
// 🪝 Hooks - Codes
// ============================================


export function useAdminCodes() {
  // Static Fallback removed - strictly remote
  const { data: codes, loading } = useResource<AdminCode>(
    'codes',
    'security_codes',
    [],
    (statics, remotes) => {
      const transformed: AdminCode[] = remotes.map((d: any) => ({
        id: d.code,
        code: d.code,
        title: d.title,
        desc: d.description,
        category: d.category,
        severity: d.severity as any,
        active: d.active !== false
      }));
      // Just return transformed, no static merge needed if we want fully dynamic
      return transformed;
    }
  );

  return { codes, loading };
}

// ... (Types ignored for brevity in prompt, they match)

// ============================================
// 🪝 Hooks - Articles
// ============================================

// import { STATIC_ARTICLES } from '@/lib/staticArticles'; // REMOVED

export function useAdminArticles() {
  // Static Fallback + DB — only show approved/active articles on public pages
  const { data: articles, loading } = useResource<AdminArticle>(
    'articles',
    'articles',
    [], // No static fallback
    (statics, remotes) => {
      // Filter out pending/inactive articles for public display
      const approved = remotes.filter((a: any) =>
        a.status !== 'pending' && a.is_active !== false
      );
      return standardMerger(statics, approved);
    }
  );

  const articlesMap = useMemo(() => {
    const map: Record<string, ArticleData> = {};
    articles.forEach(a => {
      map[a.id] = {
        title: a.title,
        category: a.category,
        lastUpdate: a.lastUpdate,
        intro: a.intro,
        details: a.details,
        documents: a.documents,
        steps: a.steps,
        tips: a.tips,
        tags: (a as any).tags || [],
        fees: a.fees,
        warning: a.warning ?? undefined,
        source: a.source,
      };
    });
    return map;
  }, [articles]);

  return { articles, articlesMap, loading };
}

// ============================================
// 🪝 Hooks - Services
// ============================================

export function useAdminServices() {
  const staticServices: AdminService[] = useMemo(() => SERVICES_LIST.map(s => ({
    id: s.id,
    title: s.title,
    description: s.desc, // Normalize prop name if needed, but keeping types aligned is better
    desc: s.desc,
    price: null,
    whatsapp: null,
    active: true,
  })), []);

  // Custom merger for Services since DB structure (service_providers) differs slightly from static
  const serviceMerger = (statics: AdminService[], remotes: any[]): AdminService[] => {
    // Transform remote raw data to AdminService first
    const transformedRemotes: AdminService[] = remotes.map((d: any) => ({
      id: d.id,
      title: d.name,
      desc: d.profession + (d.description ? ` - ${d.description.slice(0, 50)}...` : ''),
      description: d.description,
      price: null,
      whatsapp: d.phone,
      active: true,
      image: d.image,
      profession: d.profession,
      city: d.city
    }));
    return standardMerger(statics, transformedRemotes);
  };

  const { data: services, loading } = useResource<AdminService>(
    'services',
    'service_providers', // Table name
    staticServices,
    serviceMerger
  );

  return { services, loading };
}

// ============================================
// 🪝 Hooks - Updates
// ============================================

export function useAdminUpdates() {
  const staticUpdates: AdminUpdate[] = useMemo(() => LATEST_UPDATES.map(u => ({
    id: String(u.id),
    type: u.type as any,
    title: u.title,
    date: u.date,
    content: u.content || null,
    active: true,
  })), []);

  const updateMerger = (statics: AdminUpdate[], remotes: any[]): AdminUpdate[] => {
    const transformed: AdminUpdate[] = remotes.map((d: any) => ({
      id: d.id,
      type: d.type,
      title: d.title,
      date: d.date || (d.created_at ? d.created_at.split('T')[0] : ''),
      content: d.content,
      active: d.active !== false,
      image: d.image
    }));
    // FIX: Do not merge statics. Return DB data only to prevent duplicates/ghosts.
    // const merged = standardMerger(statics, transformed);
    return transformed.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  const { data: updates, loading } = useResource<AdminUpdate>(
    'updates',
    'updates',
    staticUpdates,
    updateMerger
  );

  return { updates, loading };
}

// ============================================
// 🪝 Hooks - Codes
// ============================================

// useAdminCodes moved to top

// ============================================
// 🪝 Hooks - FAQ
// ============================================

export function useAdminFAQ() {
  const { data: faq, loading } = useResource<AdminFAQ>(
    'faq',
    'faqs',
    [], // No static FAQs defined in old file logic, so empty
    (s, r) => r.map((d: any) => ({
      id: d.id,
      question: d.question,
      answer: d.answer,
      category: d.category,
      active: d.active !== false
    }))
  );

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
// 🪝 Hooks - Sources
// ============================================

export function useAdminSources() {
  const staticSources: AdminSource[] = useMemo(() => OFFICIAL_SOURCES.map((s, i) => ({
    id: `source-${i}`,
    name: s.name,
    url: s.url,
    desc: s.desc,
    active: true,
    is_official: true
  })), []);

  const sourceMerger = (statics: AdminSource[], remotes: any[]): AdminSource[] => {
    const transformed: AdminSource[] = remotes.map((d: any) => ({
      id: d.id,
      name: d.name,
      url: d.url,
      desc: d.description,
      active: d.active !== false,
      is_official: d.is_official
    }));
    // Append strategy instead of by-ID override for sources usually
    return [...statics, ...transformed];
  };

  const { data: sources, loading } = useResource<AdminSource>(
    'sources',
    'official_sources',
    staticSources,
    sourceMerger
  );

  return { sources, loading };
}

// ============================================
// 🪝 Hooks - Forms
// ============================================

export function useAdminForms() {
  // Currently purely static as per old implementation
  const staticForms: AdminForm[] = useMemo(() => FORMS.map(f => ({
    id: f.id,
    name: f.name,
    desc: f.desc,
    type: f.type,
    url: f.url,
    active: true
  })), []);

  // Pass null table name to skip fetching
  const { data: forms, loading } = useResource<AdminForm>(
    'forms',
    null,
    staticForms,
    (s) => s
  );

  return { forms, loading };
}

// ============================================
// 🪝 Hooks - Menus
// ============================================

export function useAdminMenus() {
  const staticMenus = useMemo(() => {
    const h = PRIMARY_NAV.map((item, idx) => ({
      id: `menu-h-${idx}`, label: item.name, href: item.href, location: 'header', sortOrder: idx, active: true
    }));
    const f = NAVIGATION.map((item, idx) => ({
      id: `menu-f-${idx}`, label: item.name, href: item.href, location: 'footer', sortOrder: idx, active: true
    }));
    return [...h, ...f];
  }, []);

  const menuMerger = (statics: AdminMenu[], remotes: any[]): AdminMenu[] => {
    if (remotes.length === 0) return statics;
    return remotes.map((d: any) => ({
      id: d.id,
      label: d.label,
      href: d.href,
      location: d.location,
      sortOrder: d.sort_order,
      active: d.is_active !== false
    }));
  };

  const { data: menus, loading } = useResource<AdminMenu>(
    'menus',
    'site_menus',
    staticMenus,
    menuMerger
  );

  return { menus, loading };
}

// ============================================
// 🪝 Hooks - Categories
// ============================================

export function useAdminCategories() {
  const staticCats = useMemo(() => Object.entries(CATEGORY_SLUGS).map(([slug, title]) => ({
    slug, title, description: '', active: true
  })), []);

  // Merger logic: if DB has data, use it (it likely has all categories), else static fallback
  // Note: The generic hook standardMerger expects ID. Here we have 'slug'.
  // We'll write a custom simple selection:
  const catMerger = (statics: AdminCategory[], remotes: any[]): AdminCategory[] => {
    if (remotes && remotes.length > 0) {
      return remotes.map((d: any) => ({
        slug: d.slug,
        title: d.title,
        description: d.description || '',
        active: d.active !== false
      }));
    }
    return statics;
  };

  // We pass 'dummy' ID type by asserting generic, or just ignore ID constraint since we use custom merger
  // AdminCategory doesn't have 'id', so we cast strictly in useResource usage if strict
  // For simplicity, we can just use any casting or adapt type.
  // The generic useResource expects T extends {id: string}. AdminCategory has slug.
  // Let's cheat slightly and add id computed property or just use 'as any' for this special case.
  const { data: categories, loading } = useResource<AdminCategory & { id: string }>(
    'categories',
    'service_categories',
    staticCats.map(c => ({ ...c, id: c.slug })),
    catMerger as any
  );

  return { categories, loading };
}

// ============================================
// 🪝 Hooks - Tools
// ============================================

export function useAdminTools() {
  const staticTools = useMemo(() => TOOLS_MENU.map(t => ({
    key: t.href, name: t.name, route: t.href, active: true, id: t.href // Add ID for compliance
  })), []);

  const toolMerger = (statics: any[], remotes: any[]): any[] => {
    if (remotes && remotes.length > 0) {
      return remotes.map((d: any) => ({
        key: d.key, name: d.name, route: d.route, active: d.is_active !== false, id: d.key
      }));
    }
    return statics;
  };

  const { data: tools, loading } = useResource<AdminTool & { id: string }>(
    'tools',
    'tools_registry',
    staticTools,
    toolMerger
  );

  return { tools, loading };
}

// ============================================
// 🪝 Single Article (Kept as is or refactored? Refactoring with SWR is trickier for dynamic args)
// ============================================

// useSWR supports dynamic keys: key = slug ? ['article', slug] : null
import useSWR from 'swr';
import { supabase } from '@/lib/supabaseClient';

export function useAdminArticle(slug: string) {
  const fetcher = async () => {
    if (!slug) return null;
    const normalizedSlug = normalizeId(slug);

    let foundArticle: ArticleData | null = null;
    // 1. Static - REMOVED
    // if (ARTICLES[normalizedSlug]) {
    //   foundArticle = ARTICLES[normalizedSlug];
    // }
    // 2. DB
    if (supabase) {
      const { data } = await supabase.from('articles').select('*').eq('id', normalizedSlug).single();
      if (data) {
        foundArticle = {
          title: data.title,
          category: data.category,
          lastUpdate: data.created_at ? data.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
          intro: data.intro || '',
          details: data.details || '',
          documents: data.documents || [],
          steps: data.steps || [],
          tips: data.tips || [],
          fees: data.fees || '',
          warning: data.warning || null,
          source: data.source || '',
          image: data.image
        };
      }
    }
    return foundArticle;
  };

  const { data: articleData, isLoading } = useSWR(slug ? ['article', slug] : null, fetcher, {
    revalidateOnFocus: false
  });

  return { articleData, loading: isLoading };
}

// ============================================
// 🪝 Hooks - Scenarios (Consultant)
// ============================================

import { PlanResult } from '@/lib/types';

export function useAdminScenarios() {
  const { data: scenarios, loading } = useResource<PlanResult>(
    'scenarios',
    'consultant_scenarios',
    [],
    (statics, remotes) => remotes // No merger needed for now, DB is source of truth
  );

  return { scenarios, loading };
}

// ============================================
// 🛠️ Utils
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

export function normalizeId(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\u0600-\u06FF\-]/g, '');
}
