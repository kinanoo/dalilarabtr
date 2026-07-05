'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import {
    Star, Search, Loader2, Megaphone, Save, ExternalLink, BadgeCheck,
    Coins, Trash2, Sparkles, TrendingUp, Info,
} from 'lucide-react';
import Link from 'next/link';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import ProviderAvatar from '@/components/services/ProviderAvatar';
import { canonicalCity } from '@/lib/turkishCities';
import logger from '@/lib/logger';

type Provider = {
    id: string; name: string; profession: string | null; city: string | null;
    image: string | null; is_verified: boolean | null; is_featured: boolean | null;
};

type SponsorBanner = {
    id?: string; content: string; link_url: string; link_text: string; is_active: boolean;
};

const EMPTY_BANNER: SponsorBanner = { content: '', link_url: '', link_text: 'زيارة', is_active: true };

export default function MonetizationPage() {
    // ── Featured providers ──────────────────────────────────────────────
    const [providers, setProviders] = useState<Provider[]>([]);
    const [loadingP, setLoadingP] = useState(true);
    const [search, setSearch] = useState('');
    const [savingId, setSavingId] = useState<string | null>(null);

    // ── Sponsor banner ──────────────────────────────────────────────────
    const [banner, setBanner] = useState<SponsorBanner>(EMPTY_BANNER);
    const [loadingB, setLoadingB] = useState(true);
    const [savingB, setSavingB] = useState(false);

    const loadProviders = useCallback(async () => {
        if (!supabase) return;
        setLoadingP(true);
        const { data, error } = await supabase
            .from('service_providers')
            .select('id, name, profession, city, image, is_verified, is_featured')
            .eq('status', 'approved')
            .order('is_featured', { ascending: false })
            .order('name', { ascending: true })
            .limit(1000);
        if (error) { logger.error('load providers', error); toast.error('تعذّر تحميل مزوّدي الخدمات'); }
        setProviders((data as Provider[]) || []);
        setLoadingP(false);
    }, []);

    const loadBanner = useCallback(async () => {
        if (!supabase) return;
        setLoadingB(true);
        const { data } = await supabase
            .from('site_banners')
            .select('id, content, link_url, link_text, is_active')
            .eq('type', 'sponsor')
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();
        if (data) setBanner({ id: data.id, content: data.content || '', link_url: data.link_url || '', link_text: data.link_text || 'زيارة', is_active: !!data.is_active });
        setLoadingB(false);
    }, []);

    useEffect(() => { loadProviders(); loadBanner(); }, [loadProviders, loadBanner]);

    const toggleFeatured = async (p: Provider) => {
        if (!supabase) return;
        const next = !p.is_featured;
        setSavingId(p.id);
        // Optimistic
        setProviders((prev) => prev.map((x) => (x.id === p.id ? { ...x, is_featured: next } : x)));
        const { error } = await supabase.from('service_providers').update({ is_featured: next }).eq('id', p.id);
        setSavingId(null);
        if (error) {
            setProviders((prev) => prev.map((x) => (x.id === p.id ? { ...x, is_featured: !next } : x)));
            toast.error('فشل الحفظ: ' + error.message);
        } else {
            toast.success(next ? `تم تمييز «${p.name}» ⭐` : `أُلغي تمييز «${p.name}»`);
        }
    };

    const featuredCount = providers.filter((p) => p.is_featured).length;

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return providers;
        return providers.filter((p) =>
            [p.name, p.profession, p.city].some((f) => f && String(f).toLowerCase().includes(q))
        );
    }, [providers, search]);

    const saveBanner = async () => {
        if (!supabase) return;
        if (!banner.content.trim()) { toast.error('اكتب نصّ الإعلان أولاً'); return; }
        setSavingB(true);
        const payload = {
            content: banner.content.trim(),
            link_url: banner.link_url.trim() || null,
            link_text: banner.link_text.trim() || 'زيارة',
            type: 'sponsor',
            is_active: banner.is_active,
        };
        // If this sponsor banner is being activated, deactivate other banners so
        // only one shows at a time (the front-end renders a single active banner).
        if (banner.is_active) {
            await supabase.from('site_banners').update({ is_active: false }).neq('id', banner.id || '00000000-0000-0000-0000-000000000000');
        }
        const res = banner.id
            ? await supabase.from('site_banners').update(payload).eq('id', banner.id)
            : await supabase.from('site_banners').insert([payload]);
        setSavingB(false);
        if (res.error) { toast.error('فشل الحفظ: ' + res.error.message); return; }
        toast.success('تم حفظ البانر الراعي ✅');
        loadBanner();
    };

    const deleteBanner = async () => {
        if (!supabase || !banner.id) { setBanner(EMPTY_BANNER); return; }
        if (!confirm('حذف البانر الراعي نهائياً؟')) return;
        setSavingB(true);
        const { error } = await supabase.from('site_banners').delete().eq('id', banner.id);
        setSavingB(false);
        if (error) { toast.error('فشل الحذف: ' + error.message); return; }
        toast.success('حُذف البانر');
        setBanner(EMPTY_BANNER);
    };

    return (
        <div className="max-w-5xl mx-auto pb-24">
            <AdminPageHeader
                eyebrow="الربح"
                title="الربح والإعلانات"
                subtitle="فعّل الخدمات المميّزة المدفوعة وأدر البانر الراعي — تحكّم كامل، بلا أكواد."
                icon={Coins}
                theme="amber"
            />

            {/* Quick explainer */}
            <div className="mx-4 sm:mx-0 mb-6 flex items-start gap-3 rounded-2xl border border-amber-200 dark:border-amber-900/40 bg-amber-50/60 dark:bg-amber-950/20 p-4">
                <Info size={18} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
                    مصدرا دخلك: <strong>خدمات مميّزة</strong> (المزوّد يدفع شهرياً ليظهر بأعلى نتائج الخدمات مع شارة ⭐)،
                    و<strong>بانر راعٍ</strong> (شريط إعلاني أعلى الموقع). فعّل ما تشاء متى شئت من هنا، وألغِه بضغطة.
                </p>
            </div>

            {/* ── Section A: Featured providers ── */}
            <section className="mx-4 sm:mx-0 mb-8 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
                <div className="flex items-center justify-between gap-3 p-5 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-l from-amber-50/60 to-transparent dark:from-amber-950/20">
                    <div className="flex items-center gap-3">
                        <span className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                            <Star size={20} className="text-amber-500 fill-amber-400" />
                        </span>
                        <div>
                            <h2 className="font-black text-slate-900 dark:text-slate-100">الخدمات المميّزة (مدفوعة)</h2>
                            <p className="text-xs text-slate-500 dark:text-slate-400">فعّل التمييز للمزوّد بعد أن يدفع — يظهر بأعلى /services مع شارة ⭐</p>
                        </div>
                    </div>
                    <span className="shrink-0 inline-flex items-center gap-1.5 bg-amber-500 text-white text-sm font-black px-3 py-1.5 rounded-full">
                        <TrendingUp size={14} /> {featuredCount} مميّز
                    </span>
                </div>

                <div className="p-4">
                    <div className="relative mb-3">
                        <Search size={16} className="absolute start-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="ابحث باسم المزوّد أو المهنة أو المدينة..."
                            className="w-full ps-10 pe-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-amber-400/40"
                        />
                    </div>

                    {loadingP ? (
                        <div className="flex items-center justify-center py-12"><Loader2 size={28} className="animate-spin text-amber-500" /></div>
                    ) : filtered.length === 0 ? (
                        <p className="text-center text-sm text-slate-500 py-10">لا يوجد مزوّدون مطابقون.</p>
                    ) : (
                        <div className="space-y-2 max-h-[520px] overflow-y-auto pe-1">
                            {filtered.map((p) => (
                                <div key={p.id} className={`flex items-center gap-3 rounded-2xl border p-3 transition-colors ${
                                    p.is_featured
                                        ? 'border-amber-300 dark:border-amber-700/60 bg-amber-50/50 dark:bg-amber-950/20'
                                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
                                }`}>
                                    <ProviderAvatar name={p.name} image={p.image} className="w-11 h-11 rounded-xl shrink-0" />
                                    <div className="min-w-0 flex-1">
                                        <p className="font-black text-sm text-slate-900 dark:text-slate-100 line-clamp-1 flex items-center gap-1">
                                            {p.name}
                                            {p.is_verified && <BadgeCheck size={14} className="text-blue-500 shrink-0" />}
                                        </p>
                                        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 line-clamp-1">
                                            {p.profession}{p.city ? ` · ${canonicalCity(p.city) || p.city}` : ''}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => toggleFeatured(p)}
                                        disabled={savingId === p.id}
                                        className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black transition-all disabled:opacity-50 ${
                                            p.is_featured
                                                ? 'bg-amber-500 text-white shadow-sm shadow-amber-500/40 hover:bg-amber-600'
                                                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-300 hover:bg-amber-100 dark:hover:bg-amber-900/30 hover:text-amber-600'
                                        }`}
                                    >
                                        {savingId === p.id
                                            ? <Loader2 size={14} className="animate-spin" />
                                            : <Star size={14} className={p.is_featured ? 'fill-white' : ''} />}
                                        {p.is_featured ? 'مميّز' : 'تمييز'}
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* ── Section B: Sponsor banner ── */}
            <section className="mx-4 sm:mx-0 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
                <div className="flex items-center gap-3 p-5 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-l from-emerald-50/60 to-transparent dark:from-emerald-950/20">
                    <span className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                        <Megaphone size={20} className="text-emerald-600" />
                    </span>
                    <div>
                        <h2 className="font-black text-slate-900 dark:text-slate-100">البانر الراعي (إعلان مدفوع)</h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400">شريط «برعاية» أعلى الموقع — يظهر بانر واحد فعّال في كل مرّة</p>
                    </div>
                </div>

                <div className="p-5 space-y-4">
                    {loadingB ? (
                        <div className="flex items-center justify-center py-8"><Loader2 size={24} className="animate-spin text-emerald-500" /></div>
                    ) : (
                        <>
                            {/* Live preview */}
                            {banner.content && (
                                <div className="rounded-xl overflow-hidden">
                                    <div className="bg-gradient-to-l from-emerald-700 via-emerald-600 to-teal-700 text-white px-4 py-2.5 flex items-center gap-2 text-sm">
                                        <Sparkles size={15} className="shrink-0" />
                                        <span className="font-extrabold">برعاية:</span>
                                        <span className="flex-1 line-clamp-1">{banner.content}</span>
                                        {banner.link_url && <span className="bg-white/20 px-2.5 py-1 rounded-full text-xs font-bold shrink-0">{banner.link_text || 'زيارة'}</span>}
                                    </div>
                                    <p className="text-[11px] text-slate-400 mt-1 px-1">معاينة مباشرة</p>
                                </div>
                            )}

                            <label className="block">
                                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 block">نصّ الإعلان</span>
                                <textarea
                                    value={banner.content}
                                    onChange={(e) => setBanner({ ...banner, content: e.target.value })}
                                    placeholder="مثال: مكتب المحامي س. للاستشارات القانونية للعرب في إسطنبول — استشارة أولى مجاناً."
                                    className="w-full min-h-[70px] px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
                                />
                            </label>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <label className="block sm:col-span-2">
                                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 block">رابط الراعي</span>
                                    <input
                                        dir="ltr"
                                        value={banner.link_url}
                                        onChange={(e) => setBanner({ ...banner, link_url: e.target.value })}
                                        placeholder="https://wa.me/90... أو https://..."
                                        className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
                                    />
                                </label>
                                <label className="block">
                                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 block">نصّ الزرّ</span>
                                    <input
                                        value={banner.link_text}
                                        onChange={(e) => setBanner({ ...banner, link_text: e.target.value })}
                                        placeholder="زيارة"
                                        className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
                                    />
                                </label>
                            </div>

                            {/* Active toggle */}
                            <button
                                onClick={() => setBanner({ ...banner, is_active: !banner.is_active })}
                                className="flex items-center gap-3 w-full rounded-xl border border-slate-200 dark:border-slate-700 p-3 text-right"
                            >
                                <span className={`relative w-11 h-6 rounded-full transition-colors ${banner.is_active ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`}>
                                    <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${banner.is_active ? 'right-0.5' : 'right-[22px]'}`} />
                                </span>
                                <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
                                    {banner.is_active ? 'ظاهر للزوّار الآن' : 'مخفيّ (غير نشط)'}
                                </span>
                            </button>

                            <div className="flex items-center justify-between gap-3 pt-1">
                                {banner.id ? (
                                    <button onClick={deleteBanner} disabled={savingB} className="inline-flex items-center gap-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 px-4 py-2.5 rounded-xl font-bold text-sm disabled:opacity-50">
                                        <Trash2 size={16} /> حذف
                                    </button>
                                ) : <span />}
                                <button onClick={saveBanner} disabled={savingB} className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl font-black text-sm shadow-lg shadow-emerald-600/20 active:scale-95 disabled:opacity-50">
                                    {savingB ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} حفظ البانر
                                </button>
                            </div>

                            <Link href="/admin/banners" className="inline-flex items-center gap-1 text-xs font-bold text-slate-400 hover:text-emerald-600">
                                <ExternalLink size={12} /> إدارة كل البانرات (تنبيهات/تحذيرات) في صفحة البنرات
                            </Link>
                        </>
                    )}
                </div>
            </section>
        </div>
    );
}
