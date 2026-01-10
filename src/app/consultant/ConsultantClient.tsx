'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  CheckCircle, AlertTriangle, FileText, RefreshCw, ShieldAlert, Lightbulb,
  ArrowLeft, Gavel, HeartPulse, Plane, Building2, GraduationCap, Scale,
  Landmark, FileCheck, Wallet, Home, ChevronRight, Briefcase, Printer
} from 'lucide-react';

import ToolSchema from '@/components/ToolSchema';
import PageHero from '@/components/PageHero';
import ShareMenu from '@/components/ShareMenu';
import BookmarkButton from '@/components/BookmarkButton';
import CommentsClient from '@/components/comments/CommentsClient';
import UniversalComments from '@/components/community/UniversalComments';
import ContentHelpfulWidget from '@/components/community/ContentHelpfulWidget';

import { useAdminScenarios } from '@/lib/useAdminData';
import { fetchRemoteArticleDataById } from '@/lib/remoteData';
import { getOfficialSourceUrls, isAllowedOfficialUrl } from '@/lib/externalLinks';
import { SITE_CONFIG } from '@/lib/config';
import type { Article, PlanResult } from '@/lib/types'; // Use types from types.ts
import { supabase } from '@/lib/supabaseClient';

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
    desc: article.intro || staticBase.desc || (staticBase as any).description || '',
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
    const map: Record<string, PlanResult> = {};
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

  const shownResult = useMemo<PlanResult | null>(() => {
    if (!result) return null;

    const rawArticleId = (result.articleId || '').trim();
    const rawLink = (result.link || '').trim();

    const articleId = (() => {
      if (rawArticleId) return rawArticleId;
      if (!rawLink.startsWith('/article/')) return '';
      const after = rawLink.slice('/article/'.length);
      const clean = after.split(/[?#]/)[0] || '';
      return decodeURIComponent(clean).trim();
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
        return decodeURIComponent(clean).trim();
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

  // Filter dynamic scenarios
  const getDynamicScenarios = (cat: string, sub: string) => {
    return scenarios.filter(s =>
      (s as any).category === cat &&
      (s as any).subcategory === sub &&
      (s as any).is_active !== false
    );
  };

  const reset = () => {
    setStep(1);
    setAnswers({ q1: '', q2: '', q3: '' });
    setResult(null);
    setActiveTab('steps');
  };

  return (
    <main className="flex flex-col min-h-screen overflow-x-hidden">
      <ToolSchema tool="consultant" />
      {/* Header */}
      <div className="relative">
        <PageHero
          title={
            <>
              المستشار{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">الشامل</span>
            </>
          }
          description="النظام الخبير: تشخيص دقيق لأكثر من 200 حالة قانونية وخدمية."
          icon={<Briefcase className="w-9 h-9 md:w-14 md:h-14 text-emerald-400" />}
          titleClassName="text-4xl sm:text-5xl md:text-7xl tracking-tight leading-snug pb-1"
          descriptionClassName="text-primary-100/80 leading-relaxed"
        />
      </div>

      {/* Main Content */}
      <div className="w-full max-w-full lg:max-w-6xl mx-auto px-2 sm:px-4 mt-8 relative z-20 pb-8">
        <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-[2rem] lg:rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden flex flex-col relative min-h-[60vh]">
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

          <div className="px-3 sm:px-6 md:px-12 pt-4 sm:pt-6 md:pt-8 pb-4 sm:pb-6 md:pb-8 flex-grow flex flex-col justify-start">
            <AnimatePresence mode="wait">
              {/* Step 1 */}
              {step === 1 && (
                <motion.div key="q1" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6 sm:space-y-10">
                  <div className="text-center space-y-2">
                    <span className="text-emerald-600 font-bold text-xs sm:text-sm tracking-widest uppercase">الخطوة 1 من 3</span>
                    <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-800 dark:text-slate-100">من أنت؟ (الصفة القانونية)</h2>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4 md:gap-5">
                    {[
                      { id: 'syrian', icon: '🪪', t: 'سوري (كملك)', d: 'حماية مؤقتة' },
                      { id: 'tourist', icon: '✈️', t: 'سائح / إقامة', d: 'إقامات قصيرة' },
                      { id: 'investor', icon: '🏢', t: 'مستثمر', d: 'عقار / جنسية' },
                      { id: 'student', icon: '🎓', t: 'طالب', d: 'جامعة / تومر' },
                      { id: 'worker', icon: '💼', t: 'عامل / شركة', d: 'إذن عمل' },
                      { id: 'daily', icon: '⚡', t: 'خدمات يومية', d: 'نوتير / بنك' },
                    ].map((b) => (
                      <button
                        key={b.id}
                        onClick={() => {
                          setAnswers({ ...answers, q1: b.id });
                          setStep(2);
                        }}
                        className="group relative p-3 sm:p-5 md:p-6 rounded-xl sm:rounded-2xl md:rounded-3xl border border-slate-100 dark:border-slate-800 hover:border-emerald-500 hover:shadow-xl transition-all duration-300 flex flex-col items-center gap-2 sm:gap-4 bg-white dark:bg-slate-950 overflow-hidden text-center"
                      >
                        <div className="text-2xl sm:text-3xl md:text-4xl mb-0 sm:mb-1 group-hover:scale-110 transition-transform duration-300">{b.icon}</div>
                        <div>
                          <span className="block font-bold text-sm sm:text-base md:text-lg text-slate-800 dark:text-slate-100 mb-0.5 sm:mb-1">{b.t}</span>
                          <span className="block text-[10px] sm:text-xs text-slate-400 font-medium">{b.d}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Step 2 */}
              {step === 2 && (
                <motion.div key="q2" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="space-y-6 sm:space-y-8">
                  <div className="text-center space-y-2">
                    <span className="text-emerald-600 font-bold text-xs sm:text-sm tracking-widest uppercase">الخطوة 2 من 3</span>
                    <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-800 dark:text-slate-100">ما هو المجال؟</h2>
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
                  </div>

                  <button onClick={() => setStep(1)} className="text-slate-400 font-bold block mx-auto mt-4 hover:text-slate-600 dark:hover:text-slate-200 transition flex items-center gap-2">
                    <ArrowLeft size={16} /> عودة للخلف
                  </button>
                </motion.div>
              )}

              {/* Step 3 */}
              {step === 3 && (
                <motion.div key="q3" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="space-y-4 sm:space-y-6">
                  <div className="text-center space-y-2">
                    <span className="text-emerald-600 font-bold text-xs sm:text-sm tracking-widest uppercase">الخطوة الأخيرة</span>
                    <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-800 dark:text-slate-100">حدد الطلب بدقة:</h2>
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
                        {getDynamicScenarios('syrian', 'travel').map(s => (
                          <BtnSmall key={s.id} text={s.title} onClick={() => processLogic(s.id)} />
                        ))}
                      </>
                    )}
                    {answers.q1 === 'syrian' && answers.q2 === 'status' && (
                      <>
                        <BtnSmall text="الجنسية الاستثنائية" onClick={() => processLogic('syrian-citizenship')} />
                        <BtnSmall text="إزالة كود العودة (V-87)" onClick={() => processLogic('syrian-return-code')} />
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
                      </>
                    )}
                    {answers.q1 === 'syrian' && answers.q2 === 'education' && (
                      <>
                        <BtnSmall text="طفلي لا يذهب للمدرسة (لا يوجد كملك)" onClick={() => processLogic('syrian-child-school-no-kimlik')} />
                        <BtnSmall text="معادلة شهادة (Denklik)" onClick={() => processLogic('syrian-denklik')} />
                      </>
                    )}
                    {answers.q1 === 'syrian' && answers.q2 === 'bank' && (
                      <>
                        <BtnSmall text="فتح حساب بنكي مع كملك/بطاقة صفراء" onClick={() => processLogic('syrian-bank-kimlik-yellow')} />
                        <BtnSmall text="فتح حساب بنكي (إجراءات عامة)" onClick={() => processLogic('daily-bank-open')} />
                        <BtnSmall text="رفع حجز/تجميد حساب بنكي" onClick={() => processLogic('bank-block')} />
                      </>
                    )}
                    {answers.q1 === 'syrian' && answers.q2 === 'housing' && (
                      <>
                        <BtnSmall text="تثبيت/تحديث عنوان نفوس" onClick={() => processLogic('daily-address')} />
                        <BtnSmall text="استرداد التأمين (الوديعة)" onClick={() => processLogic('housing-deposit')} />
                        <BtnSmall text="خلاف مع المالك/زيادة الإيجار" onClick={() => processLogic('housing-rent-increase')} />
                        <BtnSmall text="دعوى/إخلاء" onClick={() => processLogic('housing-eviction')} />
                      </>
                    )}
                    {answers.q1 === 'syrian' && answers.q2 === 'work' && (
                      <>
                        <BtnSmall text="إذن عمل (موظف)" onClick={() => processLogic('work-permit-employee')} />
                        <BtnSmall text="إذن عمل عبر شركة (صاحب شركة)" onClick={() => processLogic('work-permit-company')} />
                        <BtnSmall text="تكلفة إذن العمل 2025" onClick={() => processLogic('work-permit-cost')} />
                      </>
                    )}
                    {answers.q1 === 'syrian' && answers.q2 === 'property' && (
                      <>
                        <BtnSmall text="تملك عقار للسوريين (القواعد العامة)" onClick={() => processLogic('syrian-property-ownership')} />
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
                      </>
                    )}
                    {answers.q1 === 'tourist' && answers.q2 === 'prob' && (
                      <>
                        <BtnSmall text="تم الرفض (التبليغ)" onClick={() => processLogic('tourist-reject')} />
                        <BtnSmall text="كسرت الفيزا (Overstay)" onClick={() => processLogic('tourist-overstay')} />
                        <BtnSmall text="قرار ترحيل (Deport)" onClick={() => processLogic('legal-deport')} />
                      </>
                    )}
                    {answers.q1 === 'tourist' && answers.q2 === 'life' && (
                      <>
                        <BtnSmall text="فتح حساب بنكي" onClick={() => processLogic('tourist-bank-open')} />
                        <BtnSmall text="رفع حجز/تجميد حساب بنكي" onClick={() => processLogic('bank-block')} />
                        <BtnSmall text="فحص الديون (GSS/İcra)" onClick={() => processLogic('debt-check')} />
                      </>
                    )}
                    {answers.q1 === 'tourist' && answers.q2 === 'address' && (
                      <>
                        <BtnSmall text="تثبيت/تحديث عنوان نفوس" onClick={() => processLogic('daily-address')} />
                        <BtnSmall text="حجز موعد نفوس (NVI)" onClick={() => processLogic('daily-nvi-appointment')} />
                      </>
                    )}
                    {answers.q1 === 'tourist' && answers.q2 === 'goc' && (
                      <>
                        <BtnSmall text="حجز موعد الهجرة" onClick={() => processLogic('daily-goc-appointment')} />
                        <BtnSmall text="UETS (تبليغ إلكتروني)" onClick={() => processLogic('daily-uets')} />
                      </>
                    )}
                    {answers.q1 === 'tourist' && answers.q2 === 'health' && (
                      <>
                        <BtnSmall text="حجز موعد مشفى (MHRS)" onClick={() => processLogic('daily-mhrs-booking')} />
                        <BtnSmall text="اختيار طبيب العائلة" onClick={() => processLogic('daily-family-doctor')} />
                        <BtnSmall text="تغيير طبيب العائلة" onClick={() => processLogic('daily-family-doctor-change')} />
                      </>
                    )}
                    {answers.q1 === 'tourist' && answers.q2 === 'housing' && (
                      <>
                        <BtnSmall text="خلاف مع المالك/زيادة الإيجار" onClick={() => processLogic('housing-rent-increase')} />
                        <BtnSmall text="استرداد التأمين (الوديعة)" onClick={() => processLogic('housing-deposit')} />
                        <BtnSmall text="دعوى/إخلاء" onClick={() => processLogic('housing-eviction')} />
                        <BtnSmall text="تعهد إخلاء (Tahliye Taahhüdü)" onClick={() => processLogic('housing-tahliye-undertaking')} />
                      </>
                    )}
                    {answers.q1 === 'tourist' && answers.q2 === 'official' && (
                      <>
                        <BtnSmall text="UETS (تبليغ إلكتروني)" onClick={() => processLogic('daily-uets')} />
                        <BtnSmall text="CIMER (شكوى/استعلام)" onClick={() => processLogic('daily-cimer')} />
                        <BtnSmall text="UYAP (متابعة قضايا/تنفيذ)" onClick={() => processLogic('daily-uyap')} />
                      </>
                    )}

                    {/* Investor Submenus */}
                    {answers.q1 === 'investor' && answers.q2 === 'cit' && <BtnSmall text="جنسية 400 ألف" onClick={() => processLogic('investor-citizen')} />}
                    {answers.q1 === 'investor' && answers.q2 === 'res' && <BtnSmall text="إقامة عقارية 200 ألف" onClick={() => processLogic('investor-residence')} />}
                    {answers.q1 === 'investor' && answers.q2 === 'cit' && <BtnSmall text="متابعة ملف الجنسية" onClick={() => processLogic('daily-citizenship-status')} />}
                    {answers.q1 === 'investor' && answers.q2 === 'comp' && (
                      <>
                        <BtnSmall text="تأسيس شركة" onClick={() => processLogic('company-setup')} />
                        <BtnSmall text="الالتزامات الشهرية (ضرائب/محاسب/SGK)" onClick={() => processLogic('company-monthly-obligations')} />
                        <BtnSmall text="إغلاق/تصفية شركة" onClick={() => processLogic('company-closure')} />
                      </>
                    )}
                    {answers.q1 === 'investor' && answers.q2 === 'fin' && (
                      <>
                        <BtnSmall text="فحص الديون (GSS/İcra)" onClick={() => processLogic('debt-check')} />
                        <BtnSmall text="رفع حجز/تجميد حساب بنكي" onClick={() => processLogic('bank-block')} />
                        <BtnSmall text="FAST (تحويلات سريعة)" onClick={() => processLogic('daily-fast')} />
                        <BtnSmall text="تقييم/نقطة الائتمان" onClick={() => processLogic('daily-credit-score')} />
                      </>
                    )}
                    {answers.q1 === 'investor' && answers.q2 === 'legal' && (
                      <>
                        <BtnSmall text="UETS (تبليغ إلكتروني)" onClick={() => processLogic('daily-uets')} />
                        <BtnSmall text="UYAP (متابعة قضايا/تنفيذ)" onClick={() => processLogic('daily-uyap')} />
                        <BtnSmall text="CIMER (شكوى/استعلام)" onClick={() => processLogic('daily-cimer')} />
                      </>
                    )}

                    {/* Student Submenus */}
                    {answers.q1 === 'student' && answers.q2 === 'res' && <BtnSmall text="إقامة الطالب" onClick={() => processLogic('student-residence')} />}
                    {answers.q1 === 'student' && answers.q2 === 'study' && (
                      <>
                        <BtnSmall text="تعديل شهادة (Denklik)" onClick={() => processLogic('student-denklik')} />
                        <BtnSmall text="معادلة شهادة الثانوية (Denklik)" onClick={() => processLogic('student-highschool-denklik')} />
                        <BtnSmall text="استخراج كشف درجات (Transcript)" onClick={() => processLogic('student-transcript')} />
                        <BtnSmall text="امتحان اليوس" onClick={() => processLogic('student-yos')} />
                        <BtnSmall text="تومر (TÖMER)" onClick={() => processLogic('student-tomer')} />
                      </>
                    )}
                    {answers.q1 === 'student' && answers.q2 === 'address' && (
                      <>
                        <BtnSmall text="تثبيت/تحديث عنوان نفوس" onClick={() => processLogic('daily-address')} />
                        <BtnSmall text="حجز موعد نفوس (NVI)" onClick={() => processLogic('daily-nvi-appointment')} />
                      </>
                    )}
                    {answers.q1 === 'student' && answers.q2 === 'health' && (
                      <>
                        <BtnSmall text="حجز موعد مشفى (MHRS)" onClick={() => processLogic('daily-mhrs-booking')} />
                        <BtnSmall text="اختيار طبيب العائلة" onClick={() => processLogic('daily-family-doctor')} />
                        <BtnSmall text="تغيير طبيب العائلة" onClick={() => processLogic('daily-family-doctor-change')} />
                      </>
                    )}
                    {answers.q1 === 'student' && answers.q2 === 'fin' && (
                      <>
                        <BtnSmall text="فحص الديون (GSS/İcra)" onClick={() => processLogic('debt-check')} />
                        <BtnSmall text="رفع حجز/تجميد حساب بنكي" onClick={() => processLogic('bank-block')} />
                      </>
                    )}
                    {answers.q1 === 'student' && answers.q2 === 'official' && (
                      <>
                        <BtnSmall text="UETS (تبليغ إلكتروني)" onClick={() => processLogic('daily-uets')} />
                        <BtnSmall text="CIMER (شكوى/استعلام)" onClick={() => processLogic('daily-cimer')} />
                      </>
                    )}

                    {/* Worker Submenus */}
                    {answers.q1 === 'worker' && answers.q2 === 'permit' && (
                      <>
                        <BtnSmall text="إذن عمل (موظف)" onClick={() => processLogic('work-permit-employee')} />
                        <BtnSmall text="إذن عمل (صاحب شركة)" onClick={() => processLogic('work-permit-company')} />
                        <BtnSmall text="تكلفة إذن العمل 2025" onClick={() => processLogic('work-permit-cost')} />
                        <BtnSmall text="تسجيل SGK" onClick={() => processLogic('work-sgk')} />
                      </>
                    )}
                    {answers.q1 === 'worker' && answers.q2 === 'company' && (
                      <>
                        <BtnSmall text="تأسيس شركة" onClick={() => processLogic('company-setup')} />
                        <BtnSmall text="الالتزامات الشهرية" onClick={() => processLogic('company-monthly-obligations')} />
                        <BtnSmall text="إغلاق/تصفية شركة" onClick={() => processLogic('company-closure')} />
                      </>
                    )}
                    {answers.q1 === 'worker' && answers.q2 === 'tax' && (
                      <>
                        <BtnSmall text="الرقم الضريبي" onClick={() => processLogic('daily-tax-number')} />
                        <BtnSmall text="الالتزامات الشهرية" onClick={() => processLogic('company-monthly-obligations')} />
                      </>
                    )}
                    {answers.q1 === 'worker' && answers.q2 === 'legal' && (
                      <>
                        <BtnSmall text="UETS (تبليغ إلكتروني)" onClick={() => processLogic('daily-uets')} />
                        <BtnSmall text="UYAP (متابعة قضايا)" onClick={() => processLogic('daily-uyap')} />
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
                      </>
                    )}
                    {answers.q1 === 'daily' && answers.q2 === 'prob' && (
                      <>
                        <BtnSmall text="قرار ترحيل (Deport)" onClick={() => processLogic('legal-deport')} />
                        <BtnSmall text="خلاف مع المالك" onClick={() => processLogic('housing-rent-increase')} />
                        <BtnSmall text="استرداد التأمين" onClick={() => processLogic('housing-deposit')} />
                        <BtnSmall text="بدل فاقد رخصة قيادة" onClick={() => processLogic('daily-lost-driving-license')} />
                        <BtnSmall text="دعوى طلاق" onClick={() => processLogic('legal-divorce')} />
                        <BtnSmall text="دعوى إخلاء" onClick={() => processLogic('housing-eviction')} />
                      </>
                    )}
                    {answers.q1 === 'daily' && answers.q2 === 'health' && (
                      <>
                        <BtnSmall text="حجز موعد مشفى (MHRS)" onClick={() => processLogic('daily-mhrs-booking')} />
                        <BtnSmall text="اختيار طبيب العائلة" onClick={() => processLogic('daily-family-doctor')} />
                        <BtnSmall text="تغيير طبيب العائلة" onClick={() => processLogic('daily-family-doctor-change')} />
                      </>
                    )}
                    {answers.q1 === 'daily' && answers.q2 === 'debt' && (
                      <>
                        <BtnSmall text="فحص الديون (GSS/İcra)" onClick={() => processLogic('debt-check')} />
                        <BtnSmall text="UYAP (قضايا/تنفيذ)" onClick={() => processLogic('daily-uyap')} />
                        <BtnSmall text="رفع حجز/تجميد حساب بنكي" onClick={() => processLogic('bank-block')} />
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
                        url={shownResult.articleId ? `${SITE_CONFIG.siteUrl}/article/${shownResult.articleId}` : `${SITE_CONFIG.siteUrl}/consultant`}
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
                    <ContentHelpfulWidget entityType="scenario" entityId={shownResult.id} />
                    <UniversalComments entityType="scenario" entityId={shownResult.id} title="مجتمع المستشار" />
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

              {step === 3 && loading && (
                <div className="text-center py-16 sm:py-20 animate-pulse">
                  <RefreshCw className="animate-spin mx-auto text-emerald-500 mb-4 sm:mb-6" size={40} />
                  <h3 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-100">جاري تحليل البيانات...</h3>
                </div>
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
      className="w-full p-3 sm:p-4 md:p-5 rounded-xl sm:rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 hover:shadow-lg transition-all duration-300 text-right font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-950 flex items-center gap-3 sm:gap-4 group"
    >
      <div className="p-2 sm:p-3 rounded-full bg-slate-50 dark:bg-slate-900 text-slate-400 dark:text-slate-400 group-hover:bg-white dark:group-hover:bg-slate-900 group-hover:text-emerald-500 transition-colors flex-shrink-0">{icon}</div>
      <span className="flex-grow text-sm sm:text-base">{text}</span>
      <ChevronRight size={18} className="text-slate-300 dark:text-slate-600 group-hover:text-emerald-500 transition-colors flex-shrink-0" />
    </button>
  );
}

function BtnSmall({ text, onClick }: { text: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full p-2.5 sm:p-3.5 rounded-lg sm:rounded-xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 transition-all text-right font-bold text-slate-700 dark:text-slate-300 text-xs sm:text-sm bg-white dark:bg-slate-950 flex justify-between items-center group"
    >
      <span>{text}</span>
      <ChevronRight size={14} className="text-slate-300 dark:text-slate-600 group-hover:text-emerald-500" />
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
