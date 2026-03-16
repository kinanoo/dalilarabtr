'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  CheckCircle, AlertTriangle, FileText, RefreshCw, ShieldAlert, Lightbulb,
  ArrowLeft, Gavel, HeartPulse, Plane, Building2, GraduationCap, Scale,
  Landmark, FileCheck, Wallet, Home, ChevronRight, Briefcase, Printer, Users, Baby, Search, X, MessageCircle, Mail
} from 'lucide-react';

import ToolSchema from '@/components/ToolSchema';
import PageHero from '@/components/PageHero';
import ShareMenu from '@/components/ShareMenu';
import BookmarkButton from '@/components/BookmarkButton';
import CommentsClient from '@/components/comments/CommentsClient';
import UniversalComments from '@/components/community/UniversalComments';


import { useAdminScenarios } from '@/lib/useAdminData';
import { fetchRemoteArticleDataById } from '@/lib/remoteData';
import { getOfficialSourceUrls, isAllowedOfficialUrl } from '@/lib/externalLinks';
import { SITE_CONFIG } from '@/lib/config';

import type { Article, PlanResult } from '@/lib/types';
import { supabase } from '@/lib/supabaseClient';
import { CONSULTANT_SCENARIOS } from '@/lib/consultant-scenarios';

type Props = {
  initialComments?: any[]; // Keep any for comments flexible
};

const mapArticleToPlan = (article: Article, key: string, scenario: PlanResult): PlanResult => {
  // Use the scenario object as the base
  const staticBase = scenario;

  // Parse risk from warning string if present
  let dynamicRisk: 'safe' | 'medium' | 'high' | 'critical' = 'medium';
  if (article.warning) {
    const w = article.warning.toLowerCase();
    if (w.includes('critical')) dynamicRisk = 'critical';
    else if (w.includes('high')) dynamicRisk = 'high';
    else if (w.includes('safe')) dynamicRisk = 'safe';
  } else {
    dynamicRisk = staticBase.risk || 'medium';
  }

  return {
    id: staticBase.id,
    title: article.title || staticBase.title,
    risk: dynamicRisk,
    desc: article.intro?.replace(/<[^>]*>/g, '') || staticBase.desc || (staticBase as any).description || '',
    steps: article.steps?.length ? article.steps : (staticBase.steps || []),
    docs: article.documents?.length ? article.documents : (staticBase.docs || []),
    cost: article.fees || staticBase.cost || '',
    legal: article.source || staticBase.legal || '',
    tip: (article.tips && article.tips[0]) || staticBase.tip || '',
    lastUpdate: article.lastUpdate || staticBase.lastUpdate,
    link: staticBase.link,
    articleId: staticBase.articleId,
    kbQuery: staticBase.kbQuery,
    sources: staticBase.sources
  };
};

export default function ConsultantClient({ initialComments = [] }: Props) {
  const { scenarios, loading: scenariosLoading } = useAdminScenarios();

  // Create a map for quick lookup by ID
  const SCENARIOS = useMemo(() => {
    const map: Record<string, PlanResult> = { ...CONSULTANT_SCENARIOS };
    scenarios.forEach(s => map[s.id] = s);
    return map;
  }, [scenarios]);

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  // ... rest of state
  const [answers, setAnswers] = useState({ q1: '', q2: '', q3: '' });
  const [result, setResult] = useState<PlanResult | null>(null);
  const [activeTab, setActiveTab] = useState<'steps' | 'docs' | 'info'>('steps');

  const [detailLink, setDetailLink] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const searchResults = useMemo(() => {
    const q = searchQuery.trim();
    if (q.length < 2) return [];
    const lower = q.toLowerCase();
    return Object.values(SCENARIOS)
      .filter(s => {
        const title = (s.title || '').toLowerCase();
        const desc = (s.desc || '').toLowerCase();
        return title.includes(lower) || desc.includes(lower);
      })
      .slice(0, 8);
  }, [searchQuery, SCENARIOS]);

  const shownResult = useMemo<PlanResult | null>(() => {
    if (!result) return null;

    const rawArticleId = (result.articleId || '').trim();
    const rawLink = (result.link || '').trim();

    const articleId = (() => {
      if (rawArticleId) return rawArticleId;
      if (!rawLink.startsWith('/article/')) return '';
      const after = rawLink.slice('/article/'.length);
      const clean = after.split(/[?#]/)[0] || '';
      try { return decodeURIComponent(clean).trim(); } catch { return clean.trim(); }
    })();

    if (!articleId) return result;

    return {
      ...result,
      link: articleId ? `/article/${articleId}` : result.link,
      articleId
    };
  }, [result]);

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      if (!shownResult) {
        if (mounted) setDetailLink(null);
        return;
      }

      const rawArticleId = (shownResult.articleId || '').trim();
      const rawLink = (shownResult.link || '').trim();

      const candidateArticleId = (() => {
        if (rawArticleId) return rawArticleId;
        if (!rawLink.startsWith('/article/')) return '';
        const after = rawLink.slice('/article/'.length);
        const clean = after.split(/[?#]/)[0] || '';
        try { return decodeURIComponent(clean).trim(); } catch { return clean.trim(); }
      })();

      // 1) Articles: show only if remote exists
      if (candidateArticleId) {
        // ALWAYS use remote fetch now to check existence
        const remote = await fetchRemoteArticleDataById(candidateArticleId).catch(() => null);
        if (!mounted) return;
        if (remote) setDetailLink(`/article/${candidateArticleId}`);
        else setDetailLink(null);
        return;
      }

      // 2) Internal pages
      if (rawLink.startsWith('/')) {
        if (mounted) setDetailLink(rawLink);
        return;
      }

      // 3) External/invalid
      if (mounted) setDetailLink(null);
    };

    run();
    return () => {
      mounted = false;
    };
  }, [shownResult]);

  // Use simple kb search if results are available locally for now? 
  // We removed searchKnowledgeBase, so relatedHits is removed or needs new logic.
  // For now, we skip "relatedHits" or implement it if critical. 
  // Previous truncate edit removed the import. I will omit "relatedHits" to avoid errors.



  // ...

  const loadScenario = async (key: string) => {
    setLoading(true);

    // 1. Fetch Dynamic from New DB Table (Primary Source)
    if (!supabase) return;
    const { data: scenarioData, error } = await supabase
      .from('consultant_scenarios')
      .select('*')
      .eq('id', key)
      .single();

    if (scenarioData) {
      setResult({
        id: scenarioData.id,
        title: scenarioData.title,
        risk: scenarioData.risk as any,
        desc: scenarioData.description,
        steps: scenarioData.steps || [],
        docs: scenarioData.docs || [],
        cost: scenarioData.cost || '',
        legal: scenarioData.legal || '',
        tip: scenarioData.tip || '',
        lastUpdate: scenarioData.updated_at,
        link: scenarioData.link,
        articleId: scenarioData.article_id,
        kbQuery: scenarioData.kb_query,
        sources: scenarioData.sources || []
      });
    } else {
      // 2. Fallback to Old Article Fetch or Static (Legacy Support)
      const dynamicData = await fetchRemoteArticleDataById(key).catch(() => null);
      if (dynamicData) {
        const emptyScenario: PlanResult = { id: key, title: '', risk: 'medium', desc: '', steps: [], docs: [], cost: '', legal: '', tip: '', lastUpdate: '', link: '', articleId: '', kbQuery: '', sources: [] };
        setResult(mapArticleToPlan(dynamicData, key, emptyScenario));
      } else if (SCENARIOS[key]) {
        setResult(SCENARIOS[key]);
      } else {
        // Not found anywhere
        setResult(null);
      }
    }

    setLoading(false);
    setStep(4);

    // Update browser URL for deep linking and sharing
    if (typeof window !== 'undefined') {
      const newUrl = `/consultant?scenario=${key}`;
      window.history.replaceState({}, '', newUrl);
    }
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let scenarioKey: string | null = null;
    try {
      scenarioKey = new URLSearchParams(window.location.search).get('scenario');
    } catch {
      scenarioKey = null;
    }

    if (!scenarioKey) return;
    // Removed strict check: if (!SCENARIOS[scenarioKey]) return; 

    loadScenario(scenarioKey);
    setActiveTab('steps');
  }, []);

  const processLogic = (key: string) => {
    // Check if key is actually a direct URL (simple heuristic)
    if (key.startsWith('/') || key.startsWith('http')) {
      window.location.href = key;
      return;
    }
    loadScenario(key);
  };

  // All scenario IDs hardcoded in the JSX below — excluded from dynamic results to prevent duplicates
  const HARDCODED_IDS = useMemo(() => new Set([
    // syrian
    'syrian-lost-id', 'syrian-move-kimlik', 'syrian-fix-address', 'syrian-update-data',
    'syrian-travel-medical', 'syrian-travel-visit', 'syrian-leaving-turkey', 'syrian-syria-visit-risk', 'syria-visit-official',
    'syrian-citizenship', 'syrian-return-code', 'protection-status-2026', 'syria-mass-return-2025',
    'syrian-marriage', 'syrian-marriage-not-registered', 'syrian-newborn',
    'syrian-child-school-no-kimlik', 'syrian-denklik',
    'syrian-bank-kimlik-yellow', 'syrian-property-ownership',
    // tourist
    'tourist-new', 'tourist-extension', 'tourist-convert-kimlik',
    'tourist-reject', 'tourist-overstay', 'tourist-bank-open',
    // investor
    'investor-citizen', 'investor-residence',
    // student
    'student-residence', 'student-work-rights', 'student-turkiye-burslari',
    'student-denklik', 'student-highschool-denklik', 'student-transcript', 'student-yos', 'student-tomer',
    // worker
    'work-permit-employee', 'work-permit-company', 'work-permit-cost', 'work-sgk',
    'company-setup', 'company-monthly-obligations', 'company-closure',
    // daily
    'daily-edevlet', 'daily-enabiz', 'daily-family-doctor', 'daily-family-doctor-change',
    'daily-uyap', 'daily-kades', 'daily-address', 'daily-nvi-appointment', 'daily-goc-appointment',
    'daily-mhrs-booking', 'daily-mobile-lines-check', 'daily-citizenship-status', 'daily-ptt-services',
    'daily-bank-open', 'daily-notary', 'daily-fast', 'daily-paypal', 'daily-crypto',
    'daily-credit-score', 'daily-booking-block', 'daily-sworn-translator', 'daily-uets', 'daily-tax-number',
    'bank-block', 'debt-check',
    'daily-lost-driving-license', 'daily-driving-license-exchange', 'daily-vehicle-inspection', 'daily-utility-dispute', 'daily-unhcr-document',
    'housing-rent-increase', 'housing-deposit', 'housing-eviction', 'housing-tahliye-undertaking',
    'legal-deport', 'legal-divorce', 'daily-cimer',
    // emergency
    'emergency-detention', 'emergency-police-station', 'emergency-undocumented',
    // family
    'family-aile-ikamet',
  ]), []);

  // Filter dynamic scenarios — only exact category+subcategory match, excluding hardcoded IDs
  const getDynamicScenarios = (cat: string, sub: string) => {
    return scenarios.filter(s => {
      if ((s as any).is_active === false) return false;
      if (HARDCODED_IDS.has(s.id)) return false;
      return (s as any).category === cat && (s as any).subcategory === sub;
    });
  };

  const reset = () => {
    setStep(1);
    setAnswers({ q1: '', q2: '', q3: '' });
    setResult(null);
    setActiveTab('steps');
    // Reset URL back to /consultant
    if (typeof window !== 'undefined') {
      window.history.replaceState({}, '', '/consultant');
    }
  };

  return (
    <main className="flex flex-col min-h-screen overflow-x-hidden">
      <ToolSchema tool="consultant" />
      {/* Header — compact hero */}
      <div className="relative">
        <PageHero
          title={
            <>
              المستشار{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">الشامل</span>
            </>
          }
          description="تشخيص دقيق لأكثر من 80 حالة قانونية وخدمية"
          icon={<Briefcase className="w-8 h-8 md:w-10 md:h-10 text-emerald-400" />}
          className="!py-8 sm:!py-10 !pb-14 sm:!pb-16"
          titleClassName="text-2xl sm:text-3xl md:text-4xl tracking-tight leading-snug"
          descriptionClassName="text-primary-100/70 text-sm md:text-base leading-relaxed"
        />
      </div>

      {/* Main Content — overlaps hero */}
      <div className="w-full max-w-full lg:max-w-6xl mx-auto px-2 sm:px-4 -mt-8 sm:-mt-10 relative z-20 pb-8">
        <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-[2rem] lg:rounded-[2.5rem] shadow-2xl ring-1 ring-black/5 dark:ring-white/5 overflow-hidden flex flex-col relative min-h-[50vh]">
          {step > 1 && (
            <button
              onClick={() => setStep((s) => Math.max(1, s - 1))}
              className="absolute top-4 left-4 z-10 p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              title="عودة للخطوة السابقة"
            >
              <ArrowLeft size={20} />
            </button>
          )}

          {/* Progress Bar */}
          <div className="bg-slate-50 dark:bg-slate-800 h-2 w-full">
            <motion.div className="h-full bg-gradient-to-r from-emerald-500 to-cyan-600" initial={{ width: 0 }} animate={{ width: `${(step / 3) * 100}%` }} />
          </div>

          <div className="px-3 sm:px-5 md:px-10 pt-4 sm:pt-5 md:pt-6 pb-4 sm:pb-6 flex-grow flex flex-col justify-start">
            <AnimatePresence mode="wait">
              {/* Step 1 */}
              {step === 1 && (
                <motion.div key="q1" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-4 sm:space-y-6">
                  <div className="text-center space-y-1">
                    <span className="text-emerald-600 font-bold text-[10px] sm:text-xs tracking-widest uppercase">الخطوة 1 من 3</span>
                    <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-slate-800 dark:text-slate-100">من أنت؟ (الصفة القانونية)</h2>
                  </div>

                  {/* Search Bar */}
                  <div className="relative max-w-md mx-auto w-full">
                    <div className="relative">
                      <Search size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="ابحث مباشرة... (مثال: ترحيل، إقامة، بنك)"
                        className="w-full pr-10 pl-10 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                        dir="rtl"
                      />
                      {searchQuery && (
                        <button
                          onClick={() => setSearchQuery('')}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                        >
                          <X size={16} />
                        </button>
                      )}
                    </div>

                    {searchResults.length > 0 && (
                      <div className="absolute top-full mt-2 w-full bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xl z-30 max-h-[320px] overflow-y-auto">
                        {searchResults.map((s) => (
                          <button
                            key={s.id}
                            onClick={() => {
                              setSearchQuery('');
                              processLogic(s.id);
                            }}
                            className="w-full text-right px-4 py-3 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 border-b border-slate-100 dark:border-slate-800 last:border-0 transition-colors"
                          >
                            <span className="block font-bold text-sm text-slate-800 dark:text-slate-100">{s.title}</span>
                            <span className="block text-[11px] text-slate-400 mt-0.5 line-clamp-1">{s.desc}</span>
                          </button>
                        ))}
                      </div>
                    )}
                    {searchQuery.length >= 2 && searchResults.length === 0 && (
                      <div className="absolute top-full mt-2 w-full bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xl z-30 px-4 py-3 text-center text-sm text-slate-400">
                        لا توجد نتائج — جرّب كلمة أخرى أو اختر من القائمة أدناه
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                    {[
                      { id: 'syrian', icon: '🪪', t: 'سوري (كملك)', d: 'حماية مؤقتة', accent: 'emerald' },
                      { id: 'tourist', icon: '✈️', t: 'سائح / إقامة', d: 'إقامات قصيرة', accent: 'blue' },
                      { id: 'investor', icon: '🏢', t: 'مستثمر', d: 'عقار / جنسية', accent: 'amber' },
                      { id: 'student', icon: '🎓', t: 'طالب', d: 'جامعة / تومر', accent: 'violet' },
                      { id: 'worker', icon: '💼', t: 'عامل / شركة', d: 'إذن عمل', accent: 'cyan' },
                      { id: 'daily', icon: '⚡', t: 'خدمات يومية', d: 'نوتير / بنك', accent: 'orange' },
                      { id: 'emergency', icon: '🚨', t: 'مشكلة طارئة', d: 'ترحيل / احتجاز', accent: 'rose' },
                      { id: 'family', icon: '👨‍👩‍👧', t: 'عائلة مقيمة', d: 'زواج / أطفال', accent: 'pink' },
                    ].map((b) => (
                      <button
                        key={b.id}
                        onClick={() => {
                          setAnswers({ ...answers, q1: b.id });
                          setStep(2);
                        }}
                        className="group relative p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-emerald-400 dark:hover:border-emerald-600 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 flex flex-col items-center gap-1.5 sm:gap-2 bg-white dark:bg-slate-950 text-center"
                      >
                        <div className="text-2xl sm:text-3xl group-hover:scale-110 transition-transform duration-200">{b.icon}</div>
                        <div>
                          <span className="block font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-100 leading-tight">{b.t}</span>
                          <span className="block text-[10px] sm:text-[11px] text-slate-400 mt-0.5">{b.d}</span>
                        </div>
                        <div className="absolute inset-0 rounded-xl sm:rounded-2xl bg-gradient-to-t from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Step 2 */}
              {step === 2 && (
                <motion.div key="q2" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="space-y-4 sm:space-y-6">
                  <div className="text-center space-y-1">
                    <span className="text-emerald-600 font-bold text-[10px] sm:text-xs tracking-widest uppercase">الخطوة 2 من 3</span>
                    <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-slate-800 dark:text-slate-100">ما هو المجال؟</h2>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 max-w-full sm:max-w-2xl mx-auto">
                    {answers.q1 === 'syrian' && (
                      <>
                        <Btn text="أوراق (كملك/فقدان/نقل)" icon={<FileText />} onClick={() => { setAnswers({ ...answers, q2: 'docs' }); setStep(3); }} />
                        <Btn text="سفر (إذن/خروج)" icon={<Plane />} onClick={() => { setAnswers({ ...answers, q2: 'travel' }); setStep(3); }} />
                        <Btn text="أحوال مدنية (زواج/ولادة)" icon={<HeartPulse />} onClick={() => { setAnswers({ ...answers, q2: 'civil' }); setStep(3); }} />
                        <Btn text="وضع قانوني (جنسية)" icon={<ShieldAlert />} onClick={() => { setAnswers({ ...answers, q2: 'status' }); setStep(3); }} />
                        <Btn text="تعليم ومدارس" icon={<GraduationCap />} onClick={() => { setAnswers({ ...answers, q2: 'education' }); setStep(3); }} />
                        <Btn text="بنوك وحسابات" icon={<Landmark />} onClick={() => { setAnswers({ ...answers, q2: 'bank' }); setStep(3); }} />
                        <Btn text="عنوان وسكن" icon={<Home />} onClick={() => { setAnswers({ ...answers, q2: 'housing' }); setStep(3); }} />
                        <Btn text="عمل وإذن عمل" icon={<Briefcase />} onClick={() => { setAnswers({ ...answers, q2: 'work' }); setStep(3); }} />
                        <Btn text="عقار/تملك للسوريين" icon={<Building2 />} onClick={() => { setAnswers({ ...answers, q2: 'property' }); setStep(3); }} />
                      </>
                    )}
                    {answers.q1 === 'tourist' && (
                      <>
                        <Btn text="إقامة (تقديم/تجديد/تحويل)" icon={<FileText />} onClick={() => { setAnswers({ ...answers, q2: 'res' }); setStep(3); }} />
                        <Btn text="مخالفات (رفض/كسر فيزا)" icon={<AlertTriangle />} onClick={() => { setAnswers({ ...answers, q2: 'prob' }); setStep(3); }} />
                        <Btn text="بنوك وحياة يومية" icon={<Landmark />} onClick={() => { setAnswers({ ...answers, q2: 'life' }); setStep(3); }} />
                        <Btn text="عنوان ونفوس" icon={<Home />} onClick={() => { setAnswers({ ...answers, q2: 'address' }); setStep(3); }} />
                        <Btn text="مواعيد ومعاملات الهجرة" icon={<ChevronRight />} onClick={() => { setAnswers({ ...answers, q2: 'goc' }); setStep(3); }} />
                        <Btn text="صحة (MHRS/طبيب عائلة)" icon={<HeartPulse />} onClick={() => { setAnswers({ ...answers, q2: 'health' }); setStep(3); }} />
                        <Btn text="سكن وإيجارات" icon={<Home />} onClick={() => { setAnswers({ ...answers, q2: 'housing' }); setStep(3); }} />
                        <Btn text="تبليغات وشكاوى" icon={<ShieldAlert />} onClick={() => { setAnswers({ ...answers, q2: 'official' }); setStep(3); }} />
                      </>
                    )}
                    {answers.q1 === 'investor' && (
                      <>
                        <Btn text="الجنسية التركية" icon={<ShieldAlert />} onClick={() => { setAnswers({ ...answers, q2: 'cit' }); setStep(3); }} />
                        <Btn text="الإقامة العقارية" icon={<Home />} onClick={() => { setAnswers({ ...answers, q2: 'res' }); setStep(3); }} />
                        <Btn text="تأسيس الشركات" icon={<Briefcase />} onClick={() => { setAnswers({ ...answers, q2: 'comp' }); setStep(3); }} />
                        <Btn text="بنوك وديون" icon={<Wallet />} onClick={() => { setAnswers({ ...answers, q2: 'fin' }); setStep(3); }} />
                        <Btn text="تبليغات/قضايا (UYAP/UETS)" icon={<Gavel />} onClick={() => { setAnswers({ ...answers, q2: 'legal' }); setStep(3); }} />
                      </>
                    )}
                    {answers.q1 === 'student' && (
                      <>
                        <Btn text="إقامة الطالب" icon={<FileText />} onClick={() => { setAnswers({ ...answers, q2: 'res' }); setStep(3); }} />
                        <Btn text="الدراسة والشهادات" icon={<GraduationCap />} onClick={() => { setAnswers({ ...answers, q2: 'study' }); setStep(3); }} />
                        <Btn text="عنوان ونفوس" icon={<Home />} onClick={() => { setAnswers({ ...answers, q2: 'address' }); setStep(3); }} />
                        <Btn text="صحة (MHRS/طبيب عائلة)" icon={<HeartPulse />} onClick={() => { setAnswers({ ...answers, q2: 'health' }); setStep(3); }} />
                        <Btn text="بنوك وديون" icon={<Wallet />} onClick={() => { setAnswers({ ...answers, q2: 'fin' }); setStep(3); }} />
                        <Btn text="تبليغات وشكاوى" icon={<ShieldAlert />} onClick={() => { setAnswers({ ...answers, q2: 'official' }); setStep(3); }} />
                      </>
                    )}
                    {answers.q1 === 'worker' && (
                      <>
                        <Btn text="إذن العمل والتأمين (SGK)" icon={<Briefcase />} onClick={() => { setAnswers({ ...answers, q2: 'permit' }); setStep(3); }} />
                        <Btn text="تأسيس/إدارة شركة" icon={<Building2 />} onClick={() => { setAnswers({ ...answers, q2: 'company' }); setStep(3); }} />
                        <Btn text="ضرائب ومحاسبة" icon={<Wallet />} onClick={() => { setAnswers({ ...answers, q2: 'tax' }); setStep(3); }} />
                        <Btn text="قضايا وتبليغات (UYAP/UETS)" icon={<Scale />} onClick={() => { setAnswers({ ...answers, q2: 'legal' }); setStep(3); }} />
                      </>
                    )}
                    {answers.q1 === 'daily' && (
                      <>
                        <Btn text="حكومي (إي دولات/نفوس)" icon={<Landmark />} onClick={() => { setAnswers({ ...answers, q2: 'gov' }); setStep(3); }} />
                        <Btn text="مالي (بنوك/نوتير)" icon={<Wallet />} onClick={() => { setAnswers({ ...answers, q2: 'fin' }); setStep(3); }} />
                        <Btn text="مشاكل قانونية وسكن" icon={<Gavel />} onClick={() => { setAnswers({ ...answers, q2: 'prob' }); setStep(3); }} />
                        <Btn text="صحة (MHRS/طبيب عائلة)" icon={<HeartPulse />} onClick={() => { setAnswers({ ...answers, q2: 'health' }); setStep(3); }} />
                        <Btn text="ديون/قضايا (فحص سريع)" icon={<ShieldAlert />} onClick={() => { setAnswers({ ...answers, q2: 'debt' }); setStep(3); }} />
                      </>
                    )}
                    {answers.q1 === 'emergency' && (
                      <>
                        <Btn text="تجاوز مدة الفيزا / رفض إقامة" icon={<AlertTriangle />} onClick={() => { setAnswers({ ...answers, q2: 'overstay' }); setStep(3); }} />
                        <Btn text="ترحيل أو احتجاز" icon={<ShieldAlert />} onClick={() => { setAnswers({ ...answers, q2: 'deport' }); setStep(3); }} />
                        <Btn text="عنف أو تهديد" icon={<HeartPulse />} onClick={() => { setAnswers({ ...answers, q2: 'violence' }); setStep(3); }} />
                        <Btn text="بدون أوراق / وضع غير نظامي" icon={<FileText />} onClick={() => { setAnswers({ ...answers, q2: 'docs' }); setStep(3); }} />
                      </>
                    )}
                    {answers.q1 === 'family' && (
                      <>
                        <Btn text="إقامة الأسرة (Aile İkamet)" icon={<Users />} onClick={() => { setAnswers({ ...answers, q2: 'residence' }); setStep(3); }} />
                        <Btn text="أحوال مدنية (زواج/ولادة/طلاق)" icon={<HeartPulse />} onClick={() => { setAnswers({ ...answers, q2: 'civil' }); setStep(3); }} />
                        <Btn text="تعليم الأطفال والمدارس" icon={<GraduationCap />} onClick={() => { setAnswers({ ...answers, q2: 'children' }); setStep(3); }} />
                        <Btn text="صحة الأسرة" icon={<HeartPulse />} onClick={() => { setAnswers({ ...answers, q2: 'health' }); setStep(3); }} />
                        <Btn text="سكن وإيجارات" icon={<Home />} onClick={() => { setAnswers({ ...answers, q2: 'housing' }); setStep(3); }} />
                      </>
                    )}
                  </div>

                  <button onClick={() => setStep(1)} className="text-slate-400 font-bold block mx-auto mt-4 hover:text-slate-600 dark:hover:text-slate-200 transition flex items-center gap-2">
                    <ArrowLeft size={16} /> عودة للخلف
                  </button>
                </motion.div>
              )}

              {/* Step 3 */}
              {step === 3 && !loading && (
                <motion.div key="q3" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="space-y-3 sm:space-y-5">
                  <div className="text-center space-y-1">
                    <span className="text-emerald-600 font-bold text-[10px] sm:text-xs tracking-widest uppercase">الخطوة الأخيرة</span>
                    <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-slate-800 dark:text-slate-100">حدد الطلب بدقة:</h2>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 max-w-full sm:max-w-2xl mx-auto">
                    {/* Syrian Submenus */}
                    {answers.q1 === 'syrian' && answers.q2 === 'docs' && (
                      <>
                        <BtnSmall text="فقدت الكملك (بدل ضائع)" onClick={() => processLogic('syrian-lost-id')} />
                        <BtnSmall text="نقل الكملك لولاية أخرى" onClick={() => processLogic('syrian-move-kimlik')} />
                        <BtnSmall text="إزالة كود تجميد العنوان (V-160)" onClick={() => processLogic('syrian-fix-address')} />
                        <BtnSmall text="تثبيت/تحديث عنوان نفوس" onClick={() => processLogic('daily-address')} />
                        {getDynamicScenarios('syrian', 'docs').map(s => (
                          <BtnSmall key={s.id} text={s.title} onClick={() => processLogic(s.id)} />
                        ))}
                      </>
                    )}
                    {answers.q1 === 'syrian' && answers.q2 === 'travel' && (
                      <>
                        <div className="col-span-1 sm:col-span-2 bg-amber-50 dark:bg-amber-950/30 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-amber-100 dark:border-amber-900/40 text-right">
                          <div className="flex items-center justify-end gap-2 mb-2">
                            <span className="font-black text-amber-900 dark:text-amber-100 text-sm sm:text-base">مهم قبل اختيار نوع إذن السفر</span>
                            <AlertTriangle size={18} className="text-amber-600 flex-shrink-0" />
                          </div>
                          <p className="text-xs sm:text-sm font-bold text-amber-900/90 dark:text-amber-100/90 leading-relaxed">
                            للولايات المفتوحة: غالباً التقديم العادي يكون عبر خيار "زيارة (Ziyaret)".
                            للولايات المحظورة/الحساسة: لا يحق السفر عادةً إلا بمبررات قوية موثّقة.
                          </p>
                          <p className="mt-2 text-[10px] sm:text-xs font-bold text-amber-800 dark:text-amber-200 leading-relaxed">
                            أمثلة ولايات محظورة/حساسة: أنقرة، أنطاليا، بورصة، إسطنبول، إزمير...
                          </p>
                        </div>
                        <BtnSmall text="إذن سفر (طبي)" onClick={() => processLogic('syrian-travel-medical')} />
                        <BtnSmall text="إذن سفر (زيارة)" onClick={() => processLogic('syrian-travel-visit')} />
                        <BtnSmall text="الخروج من تركيا والعودة (كملك)" onClick={() => processLogic('syrian-leaving-turkey')} />
                        <BtnSmall text="السفر إلى سوريا والعودة (مخاطر)" onClick={() => processLogic('syrian-syria-visit-risk')} />
                        <BtnSmall text="زيارة سوريا بالكملك (الإجراء الرسمي)" onClick={() => processLogic('syria-visit-official')} />
                        {getDynamicScenarios('syrian', 'travel').map(s => (
                          <BtnSmall key={s.id} text={s.title} onClick={() => processLogic(s.id)} />
                        ))}
                      </>
                    )}
                    {answers.q1 === 'syrian' && answers.q2 === 'status' && (
                      <>
                        <BtnSmall text="الجنسية الاستثنائية" onClick={() => processLogic('syrian-citizenship')} />
                        <BtnSmall text="إزالة كود العودة (V-87)" onClick={() => processLogic('syrian-return-code')} />
                        <BtnSmall text="مستقبل الحماية المؤقتة بعد 2026" onClick={() => processLogic('protection-status-2026')} />
                        <BtnSmall text="العودة الجماعية لسوريا (بعد 2024)" onClick={() => processLogic('syria-mass-return-2025')} />
                        {getDynamicScenarios('syrian', 'status').map(s => (
                          <BtnSmall key={s.id} text={s.title} onClick={() => processLogic(s.id)} />
                        ))}
                      </>
                    )}
                    {answers.q1 === 'syrian' && answers.q2 === 'civil' && (
                      <>
                        <BtnSmall text="تثبيت زواج (كملك)" onClick={() => processLogic('syrian-marriage')} />
                        <BtnSmall text="زواج غير مسجل/مشاكل تسجيل" onClick={() => processLogic('syrian-marriage-not-registered')} />
                        <BtnSmall text="تسجيل مولود جديد" onClick={() => processLogic('syrian-newborn')} />
                        {getDynamicScenarios('syrian', 'civil').map(s => (
                          <BtnSmall key={s.id} text={s.title} onClick={() => processLogic(s.id)} />
                        ))}
                      </>
                    )}
                    {answers.q1 === 'syrian' && answers.q2 === 'education' && (
                      <>
                        <BtnSmall text="طفلي لا يذهب للمدرسة (لا يوجد كملك)" onClick={() => processLogic('syrian-child-school-no-kimlik')} />
                        <BtnSmall text="معادلة شهادة (Denklik)" onClick={() => processLogic('syrian-denklik')} />
                        {getDynamicScenarios('syrian', 'education').map(s => (
                          <BtnSmall key={s.id} text={s.title} onClick={() => processLogic(s.id)} />
                        ))}
                      </>
                    )}
                    {answers.q1 === 'syrian' && answers.q2 === 'bank' && (
                      <>
                        <BtnSmall text="فتح حساب بنكي مع كملك/بطاقة صفراء" onClick={() => processLogic('syrian-bank-kimlik-yellow')} />
                        <BtnSmall text="فتح حساب بنكي (إجراءات عامة)" onClick={() => processLogic('daily-bank-open')} />
                        <BtnSmall text="رفع حجز/تجميد حساب بنكي" onClick={() => processLogic('bank-block')} />
                        {getDynamicScenarios('syrian', 'bank').map(s => (
                          <BtnSmall key={s.id} text={s.title} onClick={() => processLogic(s.id)} />
                        ))}
                      </>
                    )}
                    {answers.q1 === 'syrian' && answers.q2 === 'housing' && (
                      <>
                        <BtnSmall text="تثبيت/تحديث عنوان نفوس" onClick={() => processLogic('daily-address')} />
                        <BtnSmall text="استرداد التأمين (الوديعة)" onClick={() => processLogic('housing-deposit')} />
                        <BtnSmall text="خلاف مع المالك/زيادة الإيجار" onClick={() => processLogic('housing-rent-increase')} />
                        <BtnSmall text="دعوى/إخلاء" onClick={() => processLogic('housing-eviction')} />
                        {getDynamicScenarios('syrian', 'housing').map(s => (
                          <BtnSmall key={s.id} text={s.title} onClick={() => processLogic(s.id)} />
                        ))}
                      </>
                    )}
                    {answers.q1 === 'syrian' && answers.q2 === 'work' && (
                      <>
                        <BtnSmall text="إذن عمل (موظف)" onClick={() => processLogic('work-permit-employee')} />
                        <BtnSmall text="إذن عمل عبر شركة (صاحب شركة)" onClick={() => processLogic('work-permit-company')} />
                        <BtnSmall text="جدول رسوم إذن العمل 2026" onClick={() => processLogic('work-permit-cost')} />
                        {getDynamicScenarios('syrian', 'work').map(s => (
                          <BtnSmall key={s.id} text={s.title} onClick={() => processLogic(s.id)} />
                        ))}
                      </>
                    )}
                    {answers.q1 === 'syrian' && answers.q2 === 'property' && (
                      <>
                        <BtnSmall text="تملك عقار للسوريين (القواعد العامة)" onClick={() => processLogic('syrian-property-ownership')} />
                        {getDynamicScenarios('syrian', 'property').map(s => (
                          <BtnSmall key={s.id} text={s.title} onClick={() => processLogic(s.id)} />
                        ))}
                      </>
                    )}

                    {/* Tourist Submenus */}
                    {answers.q1 === 'tourist' && answers.q2 === 'res' && (
                      <>
                        <BtnSmall text="تقديم أول مرة" onClick={() => processLogic('tourist-new')} />
                        <BtnSmall text="تجديد إقامة" onClick={() => processLogic('tourist-extension')} />
                        <BtnSmall text="تحويل كملك لإقامة" onClick={() => processLogic('tourist-convert-kimlik')} />
                        <BtnSmall text="تثبيت/تحديث عنوان نفوس" onClick={() => processLogic('daily-address')} />
                        <BtnSmall text="حجز موعد الهجرة" onClick={() => processLogic('daily-goc-appointment')} />
                        {getDynamicScenarios('tourist', 'res').map(s => (
                          <BtnSmall key={s.id} text={s.title} onClick={() => processLogic(s.id)} />
                        ))}
                      </>
                    )}
                    {answers.q1 === 'tourist' && answers.q2 === 'prob' && (
                      <>
                        <BtnSmall text="تم الرفض (التبليغ)" onClick={() => processLogic('tourist-reject')} />
                        <BtnSmall text="كسرت الفيزا (Overstay)" onClick={() => processLogic('tourist-overstay')} />
                        <BtnSmall text="قرار ترحيل (Deport)" onClick={() => processLogic('legal-deport')} />
                        {getDynamicScenarios('tourist', 'prob').map(s => (
                          <BtnSmall key={s.id} text={s.title} onClick={() => processLogic(s.id)} />
                        ))}
                      </>
                    )}
                    {answers.q1 === 'tourist' && answers.q2 === 'life' && (
                      <>
                        <BtnSmall text="فتح حساب بنكي" onClick={() => processLogic('tourist-bank-open')} />
                        <BtnSmall text="رفع حجز/تجميد حساب بنكي" onClick={() => processLogic('bank-block')} />
                        <BtnSmall text="فحص الديون (GSS/İcra)" onClick={() => processLogic('debt-check')} />
                        {getDynamicScenarios('tourist', 'life').map(s => (
                          <BtnSmall key={s.id} text={s.title} onClick={() => processLogic(s.id)} />
                        ))}
                      </>
                    )}
                    {answers.q1 === 'tourist' && answers.q2 === 'address' && (
                      <>
                        <BtnSmall text="تثبيت/تحديث عنوان نفوس" onClick={() => processLogic('daily-address')} />
                        <BtnSmall text="حجز موعد نفوس (NVI)" onClick={() => processLogic('daily-nvi-appointment')} />
                        {getDynamicScenarios('tourist', 'address').map(s => (
                          <BtnSmall key={s.id} text={s.title} onClick={() => processLogic(s.id)} />
                        ))}
                      </>
                    )}
                    {answers.q1 === 'tourist' && answers.q2 === 'goc' && (
                      <>
                        <BtnSmall text="حجز موعد الهجرة" onClick={() => processLogic('daily-goc-appointment')} />
                        <BtnSmall text="UETS (تبليغ إلكتروني)" onClick={() => processLogic('daily-uets')} />
                        {getDynamicScenarios('tourist', 'goc').map(s => (
                          <BtnSmall key={s.id} text={s.title} onClick={() => processLogic(s.id)} />
                        ))}
                      </>
                    )}
                    {answers.q1 === 'tourist' && answers.q2 === 'health' && (
                      <>
                        <BtnSmall text="حجز موعد مشفى (MHRS)" onClick={() => processLogic('daily-mhrs-booking')} />
                        <BtnSmall text="اختيار طبيب العائلة" onClick={() => processLogic('daily-family-doctor')} />
                        <BtnSmall text="تغيير طبيب العائلة" onClick={() => processLogic('daily-family-doctor-change')} />
                        {getDynamicScenarios('tourist', 'health').map(s => (
                          <BtnSmall key={s.id} text={s.title} onClick={() => processLogic(s.id)} />
                        ))}
                      </>
                    )}
                    {answers.q1 === 'tourist' && answers.q2 === 'housing' && (
                      <>
                        <BtnSmall text="خلاف مع المالك/زيادة الإيجار" onClick={() => processLogic('housing-rent-increase')} />
                        <BtnSmall text="استرداد التأمين (الوديعة)" onClick={() => processLogic('housing-deposit')} />
                        <BtnSmall text="دعوى/إخلاء" onClick={() => processLogic('housing-eviction')} />
                        <BtnSmall text="تعهد إخلاء (Tahliye Taahhüdü)" onClick={() => processLogic('housing-tahliye-undertaking')} />
                        {getDynamicScenarios('tourist', 'housing').map(s => (
                          <BtnSmall key={s.id} text={s.title} onClick={() => processLogic(s.id)} />
                        ))}
                      </>
                    )}
                    {answers.q1 === 'tourist' && answers.q2 === 'official' && (
                      <>
                        <BtnSmall text="UETS (تبليغ إلكتروني)" onClick={() => processLogic('daily-uets')} />
                        <BtnSmall text="CIMER (شكوى/استعلام)" onClick={() => processLogic('daily-cimer')} />
                        <BtnSmall text="UYAP (متابعة قضايا/تنفيذ)" onClick={() => processLogic('daily-uyap')} />
                        {getDynamicScenarios('tourist', 'official').map(s => (
                          <BtnSmall key={s.id} text={s.title} onClick={() => processLogic(s.id)} />
                        ))}
                      </>
                    )}

                    {/* Investor Submenus */}
                    {answers.q1 === 'investor' && answers.q2 === 'cit' && (
                      <>
                        <BtnSmall text="جنسية 400 ألف" onClick={() => processLogic('investor-citizen')} />
                        <BtnSmall text="متابعة ملف الجنسية" onClick={() => processLogic('daily-citizenship-status')} />
                        {getDynamicScenarios('investor', 'cit').map(s => (
                          <BtnSmall key={s.id} text={s.title} onClick={() => processLogic(s.id)} />
                        ))}
                      </>
                    )}
                    {answers.q1 === 'investor' && answers.q2 === 'res' && (
                      <>
                        <BtnSmall text="إقامة عقارية 200 ألف" onClick={() => processLogic('investor-residence')} />
                        {getDynamicScenarios('investor', 'res').map(s => (
                          <BtnSmall key={s.id} text={s.title} onClick={() => processLogic(s.id)} />
                        ))}
                      </>
                    )}
                    {answers.q1 === 'investor' && answers.q2 === 'comp' && (
                      <>
                        <BtnSmall text="تأسيس شركة" onClick={() => processLogic('company-setup')} />
                        <BtnSmall text="الالتزامات الشهرية (ضرائب/محاسب/SGK)" onClick={() => processLogic('company-monthly-obligations')} />
                        <BtnSmall text="إغلاق/تصفية شركة" onClick={() => processLogic('company-closure')} />
                        {getDynamicScenarios('investor', 'comp').map(s => (
                          <BtnSmall key={s.id} text={s.title} onClick={() => processLogic(s.id)} />
                        ))}
                      </>
                    )}
                    {answers.q1 === 'investor' && answers.q2 === 'fin' && (
                      <>
                        <BtnSmall text="فحص الديون (GSS/İcra)" onClick={() => processLogic('debt-check')} />
                        <BtnSmall text="رفع حجز/تجميد حساب بنكي" onClick={() => processLogic('bank-block')} />
                        <BtnSmall text="FAST (تحويلات سريعة)" onClick={() => processLogic('daily-fast')} />
                        <BtnSmall text="تقييم/نقطة الائتمان" onClick={() => processLogic('daily-credit-score')} />
                        {getDynamicScenarios('investor', 'fin').map(s => (
                          <BtnSmall key={s.id} text={s.title} onClick={() => processLogic(s.id)} />
                        ))}
                      </>
                    )}
                    {answers.q1 === 'investor' && answers.q2 === 'legal' && (
                      <>
                        <BtnSmall text="UETS (تبليغ إلكتروني)" onClick={() => processLogic('daily-uets')} />
                        <BtnSmall text="UYAP (متابعة قضايا/تنفيذ)" onClick={() => processLogic('daily-uyap')} />
                        <BtnSmall text="CIMER (شكوى/استعلام)" onClick={() => processLogic('daily-cimer')} />
                        {getDynamicScenarios('investor', 'legal').map(s => (
                          <BtnSmall key={s.id} text={s.title} onClick={() => processLogic(s.id)} />
                        ))}
                      </>
                    )}

                    {/* Student Submenus */}
                    {answers.q1 === 'student' && answers.q2 === 'res' && (
                      <>
                        <BtnSmall text="إقامة الطالب" onClick={() => processLogic('student-residence')} />
                        <BtnSmall text="حق العمل للطالب" onClick={() => processLogic('student-work-rights')} />
                        <BtnSmall text="منح Türkiye Bursları" onClick={() => processLogic('student-turkiye-burslari')} />
                        {getDynamicScenarios('student', 'res').map(s => (
                          <BtnSmall key={s.id} text={s.title} onClick={() => processLogic(s.id)} />
                        ))}
                      </>
                    )}
                    {answers.q1 === 'student' && answers.q2 === 'study' && (
                      <>
                        <BtnSmall text="تعديل شهادة (Denklik)" onClick={() => processLogic('student-denklik')} />
                        <BtnSmall text="معادلة شهادة الثانوية (Denklik)" onClick={() => processLogic('student-highschool-denklik')} />
                        <BtnSmall text="استخراج كشف درجات (Transcript)" onClick={() => processLogic('student-transcript')} />
                        <BtnSmall text="امتحان اليوس" onClick={() => processLogic('student-yos')} />
                        <BtnSmall text="تومر (TÖMER)" onClick={() => processLogic('student-tomer')} />
                        <BtnSmall text="معادلة شهادة للسوريين" onClick={() => processLogic('syrian-denklik')} />
                        {getDynamicScenarios('student', 'study').map(s => (
                          <BtnSmall key={s.id} text={s.title} onClick={() => processLogic(s.id)} />
                        ))}
                      </>
                    )}
                    {answers.q1 === 'student' && answers.q2 === 'address' && (
                      <>
                        <BtnSmall text="تثبيت/تحديث عنوان نفوس" onClick={() => processLogic('daily-address')} />
                        <BtnSmall text="حجز موعد نفوس (NVI)" onClick={() => processLogic('daily-nvi-appointment')} />
                        {getDynamicScenarios('student', 'address').map(s => (
                          <BtnSmall key={s.id} text={s.title} onClick={() => processLogic(s.id)} />
                        ))}
                      </>
                    )}
                    {answers.q1 === 'student' && answers.q2 === 'health' && (
                      <>
                        <BtnSmall text="حجز موعد مشفى (MHRS)" onClick={() => processLogic('daily-mhrs-booking')} />
                        <BtnSmall text="اختيار طبيب العائلة" onClick={() => processLogic('daily-family-doctor')} />
                        <BtnSmall text="تغيير طبيب العائلة" onClick={() => processLogic('daily-family-doctor-change')} />
                        {getDynamicScenarios('student', 'health').map(s => (
                          <BtnSmall key={s.id} text={s.title} onClick={() => processLogic(s.id)} />
                        ))}
                      </>
                    )}
                    {answers.q1 === 'student' && answers.q2 === 'fin' && (
                      <>
                        <BtnSmall text="فحص الديون (GSS/İcra)" onClick={() => processLogic('debt-check')} />
                        <BtnSmall text="رفع حجز/تجميد حساب بنكي" onClick={() => processLogic('bank-block')} />
                        {getDynamicScenarios('student', 'fin').map(s => (
                          <BtnSmall key={s.id} text={s.title} onClick={() => processLogic(s.id)} />
                        ))}
                      </>
                    )}
                    {answers.q1 === 'student' && answers.q2 === 'official' && (
                      <>
                        <BtnSmall text="UETS (تبليغ إلكتروني)" onClick={() => processLogic('daily-uets')} />
                        <BtnSmall text="CIMER (شكوى/استعلام)" onClick={() => processLogic('daily-cimer')} />
                        {getDynamicScenarios('student', 'official').map(s => (
                          <BtnSmall key={s.id} text={s.title} onClick={() => processLogic(s.id)} />
                        ))}
                      </>
                    )}

                    {/* Worker Submenus */}
                    {answers.q1 === 'worker' && answers.q2 === 'permit' && (
                      <>
                        <BtnSmall text="إذن عمل (موظف)" onClick={() => processLogic('work-permit-employee')} />
                        <BtnSmall text="إذن عمل (صاحب شركة)" onClick={() => processLogic('work-permit-company')} />
                        <BtnSmall text="جدول رسوم إذن العمل 2026" onClick={() => processLogic('work-permit-cost')} />
                        <BtnSmall text="تسجيل SGK" onClick={() => processLogic('work-sgk')} />
                        {getDynamicScenarios('worker', 'permit').map(s => (
                          <BtnSmall key={s.id} text={s.title} onClick={() => processLogic(s.id)} />
                        ))}
                      </>
                    )}
                    {answers.q1 === 'worker' && answers.q2 === 'company' && (
                      <>
                        <BtnSmall text="تأسيس شركة" onClick={() => processLogic('company-setup')} />
                        <BtnSmall text="الالتزامات الشهرية" onClick={() => processLogic('company-monthly-obligations')} />
                        <BtnSmall text="إغلاق/تصفية شركة" onClick={() => processLogic('company-closure')} />
                        {getDynamicScenarios('worker', 'company').map(s => (
                          <BtnSmall key={s.id} text={s.title} onClick={() => processLogic(s.id)} />
                        ))}
                      </>
                    )}
                    {answers.q1 === 'worker' && answers.q2 === 'tax' && (
                      <>
                        <BtnSmall text="الرقم الضريبي" onClick={() => processLogic('daily-tax-number')} />
                        <BtnSmall text="الالتزامات الشهرية" onClick={() => processLogic('company-monthly-obligations')} />
                        {getDynamicScenarios('worker', 'tax').map(s => (
                          <BtnSmall key={s.id} text={s.title} onClick={() => processLogic(s.id)} />
                        ))}
                      </>
                    )}
                    {answers.q1 === 'worker' && answers.q2 === 'legal' && (
                      <>
                        <BtnSmall text="UETS (تبليغ إلكتروني)" onClick={() => processLogic('daily-uets')} />
                        <BtnSmall text="UYAP (متابعة قضايا)" onClick={() => processLogic('daily-uyap')} />
                        {getDynamicScenarios('worker', 'legal').map(s => (
                          <BtnSmall key={s.id} text={s.title} onClick={() => processLogic(s.id)} />
                        ))}
                      </>
                    )}

                    {/* Daily Services Submenus */}
                    {answers.q1 === 'daily' && answers.q2 === 'gov' && (
                      <>
                        <BtnSmall text="e-Devlet (التسجيل/الدخول)" onClick={() => processLogic('daily-edevlet')} />
                        <BtnSmall text="e-Nabız (الوصول للملف الصحي)" onClick={() => processLogic('daily-enabiz')} />
                        <BtnSmall text="اختيار طبيب العائلة" onClick={() => processLogic('daily-family-doctor')} />
                        <BtnSmall text="تغيير طبيب العائلة" onClick={() => processLogic('daily-family-doctor-change')} />
                        <BtnSmall text="UYAP (متابعة قضايا)" onClick={() => processLogic('daily-uyap')} />
                        <BtnSmall text="KADES (بلاغ عنف)" onClick={() => processLogic('daily-kades')} />
                        <BtnSmall text="تثبيت نفوس (عنوان)" onClick={() => processLogic('daily-address')} />
                        <BtnSmall text="حجز موعد نفوس (NVI)" onClick={() => processLogic('daily-nvi-appointment')} />
                        <BtnSmall text="حجز موعد الهجرة" onClick={() => processLogic('daily-goc-appointment')} />
                        <BtnSmall text="حجز موعد مشفى (MHRS)" onClick={() => processLogic('daily-mhrs-booking')} />
                        <BtnSmall text="التحقق من الخطوط المسجلة باسمي" onClick={() => processLogic('daily-mobile-lines-check')} />
                        <BtnSmall text="متابعة ملف الجنسية" onClick={() => processLogic('daily-citizenship-status')} />
                        <BtnSmall text="خدمات بريد PTT" onClick={() => processLogic('daily-ptt-services')} />
                        {getDynamicScenarios('daily', 'gov').map(s => (
                          <BtnSmall key={s.id} text={s.title} onClick={() => processLogic(s.id)} />
                        ))}
                      </>
                    )}
                    {answers.q1 === 'daily' && answers.q2 === 'fin' && (
                      <>
                        <BtnSmall text="فتح حساب بنكي" onClick={() => processLogic('daily-bank-open')} />
                        <BtnSmall text="تصديق نوتير" onClick={() => processLogic('daily-notary')} />
                        <BtnSmall text="رفع حجز البنك" onClick={() => processLogic('bank-block')} />
                        <BtnSmall text="FAST (تحويلات سريعة)" onClick={() => processLogic('daily-fast')} />
                        <BtnSmall text="PayPal (بدائل/وضع تركيا)" onClick={() => processLogic('daily-paypal')} />
                        <BtnSmall text="العملات الرقمية (قواعد عامة)" onClick={() => processLogic('daily-crypto')} />
                        <BtnSmall text="تقييم/نقطة الائتمان" onClick={() => processLogic('daily-credit-score')} />
                        <BtnSmall text="حظر الحجز/Booking (إشكالات)" onClick={() => processLogic('daily-booking-block')} />
                        <BtnSmall text="الترجمة المحلفة (Yeminli Tercüman)" onClick={() => processLogic('daily-sworn-translator')} />
                        {getDynamicScenarios('daily', 'fin').map(s => (
                          <BtnSmall key={s.id} text={s.title} onClick={() => processLogic(s.id)} />
                        ))}
                      </>
                    )}
                    {answers.q1 === 'daily' && answers.q2 === 'prob' && (
                      <>
                        <BtnSmall text="قرار ترحيل (Deport)" onClick={() => processLogic('legal-deport')} />
                        <BtnSmall text="خلاف مع المالك" onClick={() => processLogic('housing-rent-increase')} />
                        <BtnSmall text="استرداد التأمين" onClick={() => processLogic('housing-deposit')} />
                        <BtnSmall text="بدل فاقد رخصة قيادة" onClick={() => processLogic('daily-lost-driving-license')} />
                        <BtnSmall text="استبدال رخصة قيادة أجنبية" onClick={() => processLogic('daily-driving-license-exchange')} />
                        <BtnSmall text="فحص المركبات والتأمين" onClick={() => processLogic('daily-vehicle-inspection')} />
                        <BtnSmall text="اعتراض على فاتورة (كهرباء/ماء/غاز)" onClick={() => processLogic('daily-utility-dispute')} />
                        <BtnSmall text="وثيقة UNHCR (المفوضية)" onClick={() => processLogic('daily-unhcr-document')} />
                        <BtnSmall text="دعوى طلاق" onClick={() => processLogic('legal-divorce')} />
                        <BtnSmall text="دعوى إخلاء" onClick={() => processLogic('housing-eviction')} />
                        {getDynamicScenarios('daily', 'prob').map(s => (
                          <BtnSmall key={s.id} text={s.title} onClick={() => processLogic(s.id)} />
                        ))}
                      </>
                    )}
                    {answers.q1 === 'daily' && answers.q2 === 'health' && (
                      <>
                        <BtnSmall text="حجز موعد مشفى (MHRS)" onClick={() => processLogic('daily-mhrs-booking')} />
                        <BtnSmall text="اختيار طبيب العائلة" onClick={() => processLogic('daily-family-doctor')} />
                        <BtnSmall text="تغيير طبيب العائلة" onClick={() => processLogic('daily-family-doctor-change')} />
                        {getDynamicScenarios('daily', 'health').map(s => (
                          <BtnSmall key={s.id} text={s.title} onClick={() => processLogic(s.id)} />
                        ))}
                      </>
                    )}
                    {answers.q1 === 'daily' && answers.q2 === 'debt' && (
                      <>
                        <BtnSmall text="فحص الديون (GSS/İcra)" onClick={() => processLogic('debt-check')} />
                        <BtnSmall text="UYAP (قضايا/تنفيذ)" onClick={() => processLogic('daily-uyap')} />
                        <BtnSmall text="رفع حجز/تجميد حساب بنكي" onClick={() => processLogic('bank-block')} />
                        {getDynamicScenarios('daily', 'debt').map(s => (
                          <BtnSmall key={s.id} text={s.title} onClick={() => processLogic(s.id)} />
                        ))}
                      </>
                    )}

                    {/* Emergency Submenus */}
                    {answers.q1 === 'emergency' && answers.q2 === 'overstay' && (
                      <>
                        <BtnSmall text="كسرت الفيزا (Overstay) — الغرامات وحظر الدخول" onClick={() => processLogic('tourist-overstay')} />
                        <BtnSmall text="رفض إقامة — كيف أطعن؟" onClick={() => processLogic('tourist-reject')} />
                        <BtnSmall text="إزالة كود العودة V-87 (سوريين)" onClick={() => processLogic('syrian-return-code')} />
                        {getDynamicScenarios('emergency', 'overstay').map(s => (
                          <BtnSmall key={s.id} text={s.title} onClick={() => processLogic(s.id)} />
                        ))}
                      </>
                    )}
                    {answers.q1 === 'emergency' && answers.q2 === 'deport' && (
                      <>
                        <BtnSmall text="صدر بحقي قرار ترحيل" onClick={() => processLogic('legal-deport')} />
                        <BtnSmall text="محتجز في مركز ترحيل (GGM)" onClick={() => processLogic('emergency-detention')} />
                        <BtnSmall text="تم استدعائي/احتجازي في الشرطة" onClick={() => processLogic('emergency-police-station')} />
                        {getDynamicScenarios('emergency', 'deport').map(s => (
                          <BtnSmall key={s.id} text={s.title} onClick={() => processLogic(s.id)} />
                        ))}
                      </>
                    )}
                    {answers.q1 === 'emergency' && answers.q2 === 'violence' && (
                      <>
                        <BtnSmall text="بلاغ عنف عائلي (KADES)" onClick={() => processLogic('daily-kades')} />
                        <BtnSmall text="دعوى طلاق (عنف/إكراه)" onClick={() => processLogic('legal-divorce')} />
                        <BtnSmall text="إخلاء قسري من المالك" onClick={() => processLogic('housing-eviction')} />
                        {getDynamicScenarios('emergency', 'violence').map(s => (
                          <BtnSmall key={s.id} text={s.title} onClick={() => processLogic(s.id)} />
                        ))}
                      </>
                    )}
                    {answers.q1 === 'emergency' && answers.q2 === 'docs' && (
                      <>
                        <BtnSmall text="أنا بدون أوراق — ماذا أفعل؟" onClick={() => processLogic('emergency-undocumented')} />
                        <BtnSmall text="وثيقة المفوضية (UNHCR)" onClick={() => processLogic('daily-unhcr-document')} />
                        <BtnSmall text="فقدت الكملك (بدل ضائع)" onClick={() => processLogic('syrian-lost-id')} />
                        <BtnSmall text="بدل فاقد رخصة قيادة" onClick={() => processLogic('daily-lost-driving-license')} />
                        {getDynamicScenarios('emergency', 'docs').map(s => (
                          <BtnSmall key={s.id} text={s.title} onClick={() => processLogic(s.id)} />
                        ))}
                      </>
                    )}

                    {/* Family Submenus */}
                    {answers.q1 === 'family' && answers.q2 === 'residence' && (
                      <>
                        <BtnSmall text="إقامة الأسرة (Aile İkamet İzni)" onClick={() => processLogic('family-aile-ikamet')} />
                        <BtnSmall text="تقديم إقامة سياحية (أول مرة)" onClick={() => processLogic('tourist-new')} />
                        <BtnSmall text="تجديد إقامة سياحية" onClick={() => processLogic('tourist-extension')} />
                        {getDynamicScenarios('family', 'residence').map(s => (
                          <BtnSmall key={s.id} text={s.title} onClick={() => processLogic(s.id)} />
                        ))}
                      </>
                    )}
                    {answers.q1 === 'family' && answers.q2 === 'civil' && (
                      <>
                        <BtnSmall text="تثبيت زواج" onClick={() => processLogic('syrian-marriage')} />
                        <BtnSmall text="زواج غير مسجل / مشاكل تسجيل" onClick={() => processLogic('syrian-marriage-not-registered')} />
                        <BtnSmall text="تسجيل مولود جديد" onClick={() => processLogic('syrian-newborn')} />
                        <BtnSmall text="دعوى طلاق" onClick={() => processLogic('legal-divorce')} />
                        {getDynamicScenarios('family', 'civil').map(s => (
                          <BtnSmall key={s.id} text={s.title} onClick={() => processLogic(s.id)} />
                        ))}
                      </>
                    )}
                    {answers.q1 === 'family' && answers.q2 === 'children' && (
                      <>
                        <BtnSmall text="تسجيل طفل في المدرسة (بدون كملك)" onClick={() => processLogic('syrian-child-school-no-kimlik')} />
                        <BtnSmall text="معادلة شهادة الثانوية" onClick={() => processLogic('student-highschool-denklik')} />
                        <BtnSmall text="معادلة شهادة للسوريين" onClick={() => processLogic('syrian-denklik')} />
                        <BtnSmall text="معادلة شهادة جامعية (YÖK)" onClick={() => processLogic('student-denklik')} />
                        {getDynamicScenarios('family', 'children').map(s => (
                          <BtnSmall key={s.id} text={s.title} onClick={() => processLogic(s.id)} />
                        ))}
                      </>
                    )}
                    {answers.q1 === 'family' && answers.q2 === 'health' && (
                      <>
                        <BtnSmall text="حجز موعد مشفى (MHRS)" onClick={() => processLogic('daily-mhrs-booking')} />
                        <BtnSmall text="اختيار طبيب العائلة" onClick={() => processLogic('daily-family-doctor')} />
                        <BtnSmall text="تغيير طبيب العائلة" onClick={() => processLogic('daily-family-doctor-change')} />
                        <BtnSmall text="e-Nabız (الملف الصحي)" onClick={() => processLogic('daily-enabiz')} />
                        {getDynamicScenarios('family', 'health').map(s => (
                          <BtnSmall key={s.id} text={s.title} onClick={() => processLogic(s.id)} />
                        ))}
                      </>
                    )}
                    {answers.q1 === 'family' && answers.q2 === 'housing' && (
                      <>
                        <BtnSmall text="تثبيت/تحديث عنوان نفوس" onClick={() => processLogic('daily-address')} />
                        <BtnSmall text="خلاف مع المالك / زيادة إيجار" onClick={() => processLogic('housing-rent-increase')} />
                        <BtnSmall text="استرداد التأمين (الوديعة)" onClick={() => processLogic('housing-deposit')} />
                        <BtnSmall text="إخلاء / تعهد إخلاء" onClick={() => processLogic('housing-eviction')} />
                        <BtnSmall text="اعتراض على فاتورة (كهرباء/ماء/غاز)" onClick={() => processLogic('daily-utility-dispute')} />
                        {getDynamicScenarios('family', 'housing').map(s => (
                          <BtnSmall key={s.id} text={s.title} onClick={() => processLogic(s.id)} />
                        ))}
                      </>
                    )}
                  </div>

                  <button onClick={() => setStep(2)} className="text-slate-400 font-bold block mx-auto mt-4 hover:text-slate-600 dark:hover:text-slate-200 transition flex items-center gap-2">
                    <ArrowLeft size={16} /> عودة للخلف
                  </button>
                </motion.div>
              )}

              {/* Step 4 - Results */}
              {step === 4 && !shownResult && (
                <div className="flex flex-col items-center justify-center py-12 text-center animate-in fade-in">
                  <div className="bg-slate-100 dark:bg-slate-800 p-6 rounded-full mb-6">
                    <Briefcase size={48} className="text-slate-400" />
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">
                    عذراً، هذا التشخيص غير متوفر حالياً
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400 max-w-md mb-8">
                    نحن نعمل على إضافة المزيد من السيناريوهات القانونية والخدمية بشكل مستمر. يرجى المحاولة لاحقاً أو اختيار حالة أخرى.
                  </p>
                  <button
                    onClick={reset}
                    className="px-6 py-3 rounded-xl bg-emerald-500 text-white font-bold hover:bg-emerald-600 transition flex items-center gap-2"
                  >
                    <ArrowLeft size={18} />
                    عودة للبدء
                  </button>
                </div>
              )}

              {step === 4 && shownResult && (
                <motion.div key="res" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col h-full">
                  <div className="mb-6 sm:mb-8 text-center bg-slate-50 dark:bg-slate-800 p-4 sm:p-6 rounded-xl sm:rounded-3xl border border-slate-100 dark:border-slate-700 relative">
                    {/* Tools for Result Card */}


                    <div
                      className={`inline-flex items-center gap-2 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-bold mb-3 sm:mb-4 ${shownResult.risk === 'safe' ? 'bg-green-100 text-green-700' :
                        shownResult.risk === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                          shownResult.risk === 'high' ? 'bg-orange-100 text-orange-700' :
                            'bg-red-100 text-red-700 animate-pulse'
                        }`}
                    >
                      {shownResult.risk === 'safe' ? <CheckCircle size={14} /> : <AlertTriangle size={14} />}
                      {shownResult.risk === 'safe' ? 'إجراء روتيني' :
                        shownResult.risk === 'medium' ? 'يتطلب انتباهاً' :
                          shownResult.risk === 'high' ? 'خطورة عالية' : 'وضع حرج جداً'}
                    </div>

                    <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-800 dark:text-slate-100 mb-2">{shownResult.title}</h2>
                    <p className="text-slate-500 dark:text-slate-300 max-w-2xl mx-auto mb-4 text-sm sm:text-base">{shownResult.desc}</p>

                    {/* Tools for Result Card (Relocated - Adaptive Glass Style) */}
                    <div className="flex justify-center flex-wrap items-center gap-2 mb-4">
                      <BookmarkButton
                        id={shownResult.articleId || 'consultant-tool'}
                        variant="subtle"
                      />
                      <ShareMenu
                        title={shownResult.title}
                        text={`تشخيص المستشار القانوني: ${shownResult.title}`}
                        url={`${SITE_CONFIG.siteUrl}/consultant?scenario=${shownResult.id || ''}`}
                        variant="subtle"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          try { window.print(); } catch { }
                        }}
                        className="bg-slate-900/5 hover:bg-slate-900/10 dark:bg-white/10 dark:hover:bg-white/20 px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 backdrop-blur-md border border-slate-900/5 dark:border-white/10 text-slate-600 dark:text-slate-200"
                      >
                        <Printer size={14} /> <span>طباعة</span>
                      </button>
                    </div>
                  </div>

                  <div className="flex bg-slate-100 dark:bg-slate-800 p-1 sm:p-1.5 rounded-xl sm:rounded-2xl mb-6 sm:mb-8">
                    <TabBtn active={activeTab === 'steps'} onClick={() => setActiveTab('steps')} icon={<CheckCircle size={16} />} text="الخطة" />
                    <TabBtn active={activeTab === 'docs'} onClick={() => setActiveTab('docs')} icon={<FileText size={16} />} text="الأوراق" />
                    <TabBtn active={activeTab === 'info'} onClick={() => setActiveTab('info')} icon={<ShieldAlert size={16} />} text="القانون" />
                  </div>

                  <div className="flex-grow min-h-[250px] sm:min-h-[300px]">
                    {activeTab === 'steps' && (
                      <div className="space-y-3 sm:space-y-4 animate-in fade-in">
                        {shownResult.steps.map((s, i) => (
                          <div key={i} className="flex gap-3 sm:gap-4 p-3 sm:p-5 bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl sm:rounded-2xl shadow-sm">
                            <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary-700 text-white flex items-center justify-center font-bold flex-shrink-0 text-xs sm:text-sm">{i + 1}</span>
                            <p className="text-slate-700 dark:text-slate-200 font-bold pt-0.5 sm:pt-1 text-sm sm:text-base">{s}</p>
                          </div>
                        ))}
                        {shownResult.tip && (
                          <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-amber-100 dark:border-amber-900/40 mt-4 sm:mt-6">
                            <h3 className="font-bold text-amber-900 dark:text-amber-100 mb-2 flex items-center gap-2 text-sm sm:text-base">
                              <Lightbulb size={18} /> نصيحة الخبير
                            </h3>
                            <p className="text-amber-800 dark:text-amber-200 text-xs sm:text-sm font-medium">{shownResult.tip}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {activeTab === 'docs' && (
                      <div className="space-y-4 animate-in fade-in">
                        <div className="bg-white dark:bg-slate-950 p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-slate-100 dark:border-slate-800">
                          <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2 text-sm sm:text-base">
                            <FileCheck size={18} className="text-emerald-500" /> المستندات المطلوبة
                          </h3>
                          <div className="flex flex-wrap gap-2">
                            {shownResult.docs.map((d, i) => (
                              <span key={i} className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200">
                                {d}
                              </span>
                            ))}
                          </div>
                        </div>
                        {shownResult.cost && (
                          <div className="bg-emerald-50 dark:bg-emerald-950/30 p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-emerald-100 dark:border-emerald-900/40 flex flex-col sm:flex-row sm:justify-between gap-2">
                            <h3 className="font-bold text-emerald-900 dark:text-emerald-100 text-sm sm:text-base">التكلفة:</h3>
                            <p className="text-xl sm:text-2xl font-black text-emerald-600">{shownResult.cost}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {activeTab === 'info' && (
                      <div className="space-y-4 animate-in fade-in">
                        <div className="bg-slate-50 dark:bg-slate-950 p-4 sm:p-5 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-800">
                          <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-2 flex gap-2 text-sm sm:text-base">
                            <Scale size={18} /> السند القانوني
                          </h3>
                          <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm font-mono break-words">{shownResult.legal}</p>
                        </div>

                        {(shownResult.lastUpdate || (shownResult.sources && shownResult.sources.some((s) => isAllowedOfficialUrl(s.url)))) && (
                          <div className="bg-white dark:bg-slate-950 p-4 sm:p-5 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-800">
                            {shownResult.lastUpdate && (
                              <div className="mb-4">
                                <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-1 text-sm sm:text-base">آخر تحديث</h3>
                                <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm">{shownResult.lastUpdate}</p>
                              </div>
                            )}

                            {shownResult.sources && shownResult.sources.some((s) => isAllowedOfficialUrl(s.url)) && (
                              <div>
                                <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-2 text-sm sm:text-base">مصادر ومراجع</h3>
                                <div className="space-y-2">
                                  {shownResult.sources.filter((s) => isAllowedOfficialUrl(s.url)).map((s, i) => (
                                    <a
                                      key={i}
                                      href={s.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="block text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-400 break-words"
                                    >
                                      {s.label}
                                    </a>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="mt-8 border-t border-slate-100 dark:border-slate-800 pt-8 space-y-6">
                    <UniversalComments entityType="scenario" entityId={shownResult.id} />
                  </div>

                  {/* إخلاء مسؤولية */}
                  <div className="mt-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-relaxed">
                      <strong>تنبيه:</strong> المعلومات الواردة هنا لأغراض توجيهية فقط ولا تُشكّل استشارة قانونية رسمية.
                      القوانين والرسوم تتغير دورياً — تحقق دائماً من الجهة الرسمية المختصة قبل اتخاذ أي إجراء.{' '}
                      <a href="/disclaimer" className="underline hover:text-slate-600 dark:hover:text-slate-300 transition-colors">إخلاء المسؤولية الكامل</a>
                    </p>
                  </div>

                  {/* Email CTA */}
                  <div className="mt-8 p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800/40">
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-3 flex items-center gap-2">
                      <MessageCircle size={18} className="text-emerald-600" />
                      هل تحتاج مساعدة شخصية؟
                    </p>
                    <a
                      href={`mailto:${SITE_CONFIG.email}?subject=${encodeURIComponent(`استشارة: ${shownResult.title}`)}&body=${encodeURIComponent(`السلام عليكم، أحتاج مساعدة بخصوص:\n${shownResult.title}\n${SITE_CONFIG.siteUrl}/consultant?scenario=${shownResult.id}\n\n`)}`}
                      className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl font-bold transition-colors w-full text-sm"
                    >
                      <Mail size={18} />
                      تواصل معنا عبر البريد الإلكتروني
                    </a>
                  </div>

                  <div className="flex flex-col sm:flex-row justify-center pt-8 mt-auto border-t border-slate-100 dark:border-slate-800 gap-3 sm:gap-4">
                    <button onClick={reset} className="flex items-center justify-center gap-2 text-slate-400 hover:text-slate-600 font-bold py-3 order-2 sm:order-1">
                      <RefreshCw size={18} /> استشارة جديدة
                    </button>
                    {detailLink && (
                      <Link href={detailLink} className="flex items-center justify-center gap-2 bg-primary-700 text-white px-6 py-3 rounded-xl font-bold hover:bg-primary-600 order-1 sm:order-2">
                        <FileText size={18} /> قراءة التفاصيل
                      </Link>
                    )}
                  </div>
                </motion.div>
              )}

              {loading && (
                <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center py-16 sm:py-20">
                  <RefreshCw className="animate-spin mx-auto text-emerald-500 mb-4 sm:mb-6" size={40} />
                  <h3 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-100">جاري تحليل البيانات...</h3>
                </motion.div>
              )}
            </AnimatePresence>
          </div>


        </div>
      </div>
    </main>
  );
}

function Btn({ text, icon, onClick }: { text: string; icon: ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-emerald-400 dark:hover:border-emerald-600 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 text-right font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-950 flex items-center gap-3 group"
    >
      <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/40 transition-colors flex-shrink-0">{icon}</div>
      <span className="flex-grow text-sm sm:text-base">{text}</span>
      <ChevronRight size={16} className="text-slate-300 dark:text-slate-600 group-hover:text-emerald-500 group-hover:translate-x-[-2px] transition-all flex-shrink-0" />
    </button>
  );
}

function BtnSmall({ text, onClick }: { text: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full p-2.5 sm:p-3 rounded-lg sm:rounded-xl border border-slate-200 dark:border-slate-800 hover:border-emerald-400 dark:hover:border-emerald-600 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 hover:-translate-y-0.5 transition-all duration-200 text-right font-bold text-slate-700 dark:text-slate-300 text-xs sm:text-sm bg-white dark:bg-slate-950 flex justify-between items-center group"
    >
      <span>{text}</span>
      <ChevronRight size={14} className="text-slate-300 dark:text-slate-600 group-hover:text-emerald-500 group-hover:translate-x-[-2px] transition-all" />
    </button>
  );
}

function TabBtn({ active, onClick, icon, text }: { active: boolean; onClick: () => void; icon: ReactNode; text: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex items-center justify-center gap-2 py-2 sm:py-3 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold transition-all ${active ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
        }`}
    >
      {icon}
      {text}
    </button>
  );
}
