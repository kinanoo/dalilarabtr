import { supabase } from '@/lib/supabaseClient';
import logger from '@/lib/logger';

export type InsightType = 'gap' | 'logic' | 'conflict' | 'quality' | 'review_mismatch' | 'duplication' | 'structure';
export type Severity = 'high' | 'medium' | 'low';

export interface Insight {
    id?: string;
    type: InsightType;
    severity: Severity;
    title: string;
    description: string;
    metadata: any;
    is_resolved?: boolean;
    created_at?: string;
}

export class AnalystEngine {

    static async runFullAnalysis(
        onLog?: (msg: string) => void,
        onInsight?: (insight: Insight) => void
    ): Promise<Insight[]> {
        const log = (msg: string) => {
            if (onLog) onLog(msg);
        };

        const emit = (items: Insight[]) => {
            if (onInsight) {
                items.forEach(item => onInsight(item));
            }
        };

        log("🧠 جاري بدء التحليل الاستراتيجي العميق (Ultimate Scan)...");
        const allInsights: Insight[] = [];

        try {
            // 1. Gap Analysis
            log("📊 1/7: جاري تحليل الفجوات في التغطية الجغرافية...");
            const gaps = await this.analyzeContentGaps();
            if (gaps.length > 0) log(`⚠️ تم رصد ${gaps.length} فجوة في المحتوى.`);
            allInsights.push(...gaps);
            emit(gaps);

            // 2. Logic/Link Analysis
            log("🔗 2/7: جاري فحص سلامة الروابط والمنطق...");
            const links = await this.analyzeLinkLogic();
            if (links.length > 0) log(`⚠️ تم رصد ${links.length} رابط يحتاج مراجعة.`);
            allInsights.push(...links);
            emit(links);

            // 3. Conflict Analysis
            log("⚔️ 3/7: جاري البحث عن تضارب المعلومات في المقالات...");
            const conflicts = await this.analyzeContentConflicts();
            if (conflicts.length > 0) log(`⚠️ تم رصد ${conflicts.length} تضارب في المعلومات.`);
            allInsights.push(...conflicts);
            emit(conflicts);

            // 4. Review Integrity
            log("⭐ 4/7: جاري تحليل التعليقات (الشتائم، الاحتيال، التناقض)...");
            const reviews = await this.analyzeReviews();
            if (reviews.length > 0) log(`⚠️ تم رصد ${reviews.length} مشكلة في التقييمات.`);
            allInsights.push(...reviews);
            emit(reviews);

            // 5. Service Duplication
            log("🕵️‍♂️ 5/7: جاري كشف الخدمات وأرقام الهواتف المكررة...");
            const sDupes = await this.analyzeServiceDuplication();
            if (sDupes.length > 0) log(`⚠️ تم رصد ${sDupes.length} خدمة مكررة.`);
            allInsights.push(...sDupes);
            emit(sDupes);

            // 6. Article Duplication
            log("📑 6/7: جاري كشف المقالات المكررة (العناوين والمحتوى)...");
            const aDupes = await this.analyzeArticleDuplication();
            if (aDupes.length > 0) log(`⚠️ تم رصد ${aDupes.length} مقال مكرر.`);
            allInsights.push(...aDupes);
            emit(aDupes);

            // 7. Structure & Quality
            if (onLog) onLog("💎 7/7: جاري فحص الجودة المنهجية وهيكلية المحتوى...");
            const structureIssues = await this.analyzeContentStructure(onLog);
            if (structureIssues.length > 0) {
                if (onLog) onLog(`⚠️ تم رصد ${structureIssues.length} مشاكل في الجودة.`);
                allInsights.push(...structureIssues);
                emit(structureIssues);
            }

            // Save Reporting
            if (onLog) onLog("💾 جاري حفظ التقرير النهائي... (هذا قد يستغرق بعض الوقت)");
            await this.saveInsights(allInsights, onLog);
            if (onLog) onLog("✅ اكتمل التحليل بنجاح!");

            return allInsights;
        } catch (error) {
            log(`❌ حدث خطأ أثناء التحليل: ${error instanceof Error ? error.message : String(error)}`);
            logger.error("Analysis Failed:", error);
        }

        return allInsights;
    }

    static normalizeArabic(text: string): string {
        if (!text) return "";
        return text
            .replace(/[أإآ]/g, 'ا')
            .replace(/[ى]/g, 'ي')
            .replace(/ة/g, 'ه')
            .replace(/[\u064B-\u065F]/g, '')
            .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "") // Remove punctuation
            .replace(/\s+/g, ' ') // Collapse spaces
            .toLowerCase()
            .trim();
    }

    // --- 1. Gap Analysis ---
    static async analyzeContentGaps(): Promise<Insight[]> {
        const insights: Insight[] = [];
        if (!supabase) return [];
        // Fixed: Use 'service_providers' instead of 'services'
        const { data: services } = await supabase
            .from('service_providers')
            .select('city, category')
            .not('city', 'is', null)
            .not('category', 'is', null);

        if (!services) return [];

        const map: Record<string, Set<string>> = {};
        const cities = new Set<string>();
        const cats = new Set<string>();
        services.forEach(s => {
            const c = s.city.trim(), t = s.category.trim();
            if (!map[c]) map[c] = new Set();
            map[c].add(t);
            cities.add(c);
            cats.add(t);
        });

        cities.forEach(city => {
            if (map[city].size < 3) return;
            cats.forEach(cat => {
                if (!map[city].has(cat)) {
                    insights.push({
                        type: 'gap', severity: 'medium', title: `فجوة استراتيجية: ${city}`,
                        description: `المدينة نشطة لكنها تفتقر خدمات "${cat}".`,
                        metadata: { city, category: cat }
                    });
                }
            });
        });
        return insights.slice(0, 50);
    }

    // --- 2. Link Logic ---
    static async analyzeLinkLogic(): Promise<Insight[]> {
        const insights: Insight[] = [];
        if (!supabase) return [];
        const { data: articles } = await supabase.from('articles').select('id, title, content');
        if (!articles) return [];

        const semanticRules = [
            { id: 'permit_job', keywords: ['اذن', 'سفر'], badUrls: ['job', 'work'], msg: 'رابط "إذن سفر" يوجه لوظائف' },
            { id: 'job_permit', keywords: ['عمل', 'توظيف'], badUrls: ['travel', 'permit'], msg: 'رابط "وظيفة" يوجه لإذن سفر' },
            { id: 'geo', keywords: ['اسطنبول'], badUrls: ['ankara', 'izmir'], msg: 'رابط "إسطنبول" يوجه لمدينة أخرى' }
        ];

        articles.forEach(a => {
            if (!a.content) return;
            const linkRegex = /\[(.*?)\]\((.*?)\)/g;
            let m;
            while ((m = linkRegex.exec(a.content)) !== null) {
                const [_, anchor, url] = m;
                if (!url || url.length < 2 || url === '#') {
                    insights.push({ type: 'logic', severity: 'low', title: `رابط مكسور: ${a.title}`, description: `النص "${anchor}" لا يحتوي رابطاً صالحاً.`, metadata: { articleId: a.id } });
                    continue;
                }
                const nAnc = this.normalizeArabic(anchor);
                const nUrl = url.toLowerCase();
                semanticRules.forEach(r => {
                    if (r.keywords.some(k => nAnc.includes(this.normalizeArabic(k))) && r.badUrls.some(b => nUrl.includes(b))) {
                        insights.push({ type: 'logic', severity: 'high', title: `خطأ منطقي: ${a.title}`, description: `رابط "${anchor}" يوجه لـ ${url} (${r.msg}).`, metadata: { articleId: a.id } });
                    }
                });
            }
        });
        return insights;
    }

    // --- 3. Conflict Analysis ---
    static async analyzeContentConflicts(): Promise<Insight[]> {
        const insights: Insight[] = [];
        if (!supabase) return [];
        const { data: articles } = await supabase.from('articles').select('id, title, content');
        if (!articles) return [];

        const rules = [
            { pair: ['يوجد', 'لا يوجد'], ctx: ['اذن سفر', 'حجز', 'موعد'] },
            { pair: ['مسموح', 'ممنوع'], ctx: ['نقل', 'سفر'] },
            { pair: ['مجاني', 'مدفوع'], ctx: ['علاج', 'تعليم'] }
        ];

        rules.forEach(r => {
            const [pos, neg] = r.pair;
            const nPos = this.normalizeArabic(pos);
            const nNeg = this.normalizeArabic(neg);

            r.ctx.forEach(ctx => {
                const nCtx = this.normalizeArabic(ctx);
                const getTxt = (a: any) => this.normalizeArabic(a.title + " " + (a.content || ""));

                const gNeg = articles.filter(a => { const t = getTxt(a); return t.includes(nCtx) && t.includes(nNeg); });
                const gPos = articles.filter(a => {
                    const t = getTxt(a);
                    const hasNeg = t.includes(nNeg);
                    if (nNeg.includes(nPos)) return t.includes(nCtx) && t.includes(nPos) && !hasNeg;
                    return t.includes(nCtx) && t.includes(nPos);
                });

                if (gPos.length > 0 && gNeg.length > 0) {
                    const posIds = new Set(gPos.map(a => a.id));
                    const distinctNeg = gNeg.filter(b => !posIds.has(b.id));
                    if (distinctNeg.length > 0) {
                        insights.push({
                            type: 'conflict', severity: 'high', title: `تضارب: ${ctx}`,
                            description: `مقالات تقول "${pos}" وأخرى "${neg}".`,
                            metadata: { context: ctx }
                        });
                    }
                }
            });
        });
        return insights;
    }

    // --- 4. Review Integrity ---
    static async analyzeReviews(): Promise<Insight[]> {
        const insights: Insight[] = [];
        if (!supabase) return [];
        const { data: reviews } = await supabase.from('service_reviews').select('*');
        if (!reviews) return [];

        const badWords = [
            'سيء', 'نصاب', 'احتيال', 'سرقة', 'كاذب', 'لا انصح', 'زبالة', 'حقير',
            'فاشل', 'حرامي', 'غشاش', 'نصب', 'واسطة', 'رشوة', 'سيئه', 'سيئة',
            'كلب', 'حمار', 'تفاهة', 'مزور', 'خداع', 'وقح', 'قذر'
        ];
        const goodWords = ['ممتاز', 'رائع', 'شكرا', 'انصح به', 'محترف', 'أمين', 'مبدع', 'خلوق'];

        reviews.forEach(r => {
            const txt = this.normalizeArabic(r.comment || "");
            const detectedBad = badWords.filter(w => txt.includes(this.normalizeArabic(w)));

            if (detectedBad.length > 0) {
                insights.push({
                    type: 'review_mismatch', severity: 'high',
                    title: `تعليق مسيء أو احتيالي`,
                    description: `يحتوي التعليق على ألفاظ: [${detectedBad.join(', ')}].`,
                    metadata: { reviewId: r.id }
                });
            } else if (r.rating === 1) {
                const detectedGood = goodWords.filter(w => txt.includes(this.normalizeArabic(w)));
                if (detectedGood.length > 0) {
                    insights.push({
                        type: 'review_mismatch', severity: 'medium', title: `تقييم 1 نجوم مع مدح`,
                        description: `المستخدم يمدح [${detectedGood.join(', ')}] لكنه وضع نجمة واحدة.`,
                        metadata: { reviewId: r.id }
                    });
                }
            }
        });
        return insights;
    }

    // --- 5. Service Duplication ---
    static async analyzeServiceDuplication(): Promise<Insight[]> {
        const insights: Insight[] = [];
        if (!supabase) return [];
        const { data: services } = await supabase.from('service_providers').select('id, name, city, phone');
        if (!services) return [];

        const map: Record<string, any[]> = {};
        services.forEach(s => {
            if (!s.phone) return;
            const p = s.phone.replace(/\s+/g, '').replace(/-/g, '').trim();
            if (p.length > 5) {
                if (!map[p]) map[p] = [];
                map[p].push(s);
            }
        });

        Object.entries(map).forEach(([phone, list]) => {
            if (list.length > 1) {
                const names = new Set(list.map(i => i.name));
                const cities = new Set(list.map(i => i.city));
                if (names.size > 1) {
                    insights.push({
                        type: 'duplication', severity: 'high', title: `رقم هاتف مشترك لخدمات مختلفة`,
                        description: `الرقم ${phone} مستخدم لـ: [${Array.from(names).join(', ')}].`,
                        metadata: { phone }
                    });
                } else if (cities.size === 1) {
                    insights.push({
                        type: 'duplication', severity: 'medium', title: `تكرار مطابق للخدمة`,
                        description: `الخدمة "${list[0].name}" مكررة في نفس المدينة.`,
                        metadata: { phone }
                    });
                }
            }
        });
        return insights;
    }

    // --- 6. Article Duplication (New!) ---
    static async analyzeArticleDuplication(): Promise<Insight[]> {
        const insights: Insight[] = [];
        if (!supabase) return [];
        const { data: articles } = await supabase.from('articles').select('id, title, content');
        if (!articles || articles.length === 0) return [];

        const titleMap: Record<string, any[]> = {};

        articles.forEach(a => {
            // Normalize title heavily to find "near duplicates" (e.g. "How to X" vs "how to x ")
            const normTitle = this.normalizeArabic(a.title);
            if (!titleMap[normTitle]) titleMap[normTitle] = [];
            titleMap[normTitle].push(a);
        });

        Object.entries(titleMap).forEach(([title, list]) => {
            if (list.length > 1) {
                insights.push({
                    type: 'duplication',
                    severity: 'medium',
                    title: `مقال مكرر: ${list[0].title}`,
                    description: `تم العثور على ${list.length} مقالات بنفس العنوان تقريباً. يفضل دمجها لتقوية SEO.`,
                    metadata: { ids: list.map(a => a.id), count: list.length }
                });
            }
        });

        return insights;
    }

    // --- 7. Content Structure & Quality (New!) ---
    // --- 7. Content Structure & Quality (New!) ---
    static async analyzeContentStructure(onLog?: (msg: string) => void): Promise<Insight[]> {
        const insights: Insight[] = [];
        if (!supabase) return [];

        // Check Services Quality
        // Check Services Quality
        const { data: services } = await supabase.from('service_providers').select('*');
        if (services) {
            services.forEach(s => {
                if (!s.image || s.image.length < 5) {
                    const msg = `خدمة بلا صور: ${s.name}`;
                    if (onLog) onLog(`⚠️ ${msg}`);
                    insights.push({ type: 'structure', severity: 'low', title: msg, description: `الخدمات بلا صور تفقد ثقة الزوار.`, metadata: { serviceId: s.id } });
                }
                if (!s.map_location) {
                    const msg = `خدمة بلا موقع: ${s.name}`;
                    if (onLog) onLog(`⚠️ ${msg}`);
                    insights.push({ type: 'structure', severity: 'medium', title: msg, description: `يجب إضافة رابط خرائط جوجل.`, metadata: { serviceId: s.id } });
                }
            });
        }

        // Check Article Methodology (IMPROVED to aggregate all fields)
        const { data: articles } = await supabase.from('articles').select('id, title, content, intro, details, steps, tips, source');
        if (articles) {
            articles.forEach(a => {
                // Aggregate all content fields to measure "real" length
                let fullText = (a.content || "") + " " + (a.intro || "") + " " + (a.details || "");

                // Add steps and tips arrays
                if (Array.isArray(a.steps)) fullText += " " + a.steps.join(" ");
                if (Array.isArray(a.tips)) fullText += " " + a.tips.join(" ");

                // 1. Thin Content
                if (fullText.length < 150) { // Lower threshold slightly given structure
                    const msg = `مقال ضعيف/قصير: ${a.title} (${fullText.length} chars)`;
                    if (onLog) onLog(`⚠️ ${msg}`);
                    insights.push({ type: 'structure', severity: 'high', title: msg, description: `المحتوى الكلي قصير جداً.`, metadata: { articleId: a.id } });
                }

                // 2. Lack of Formatting (Headers)
                const hasStructure =
                    (Array.isArray(a.steps) && a.steps.length > 0) ||
                    (Array.isArray(a.tips) && a.tips.length > 0) ||
                    (a.details && a.details.length > 100);

                if (!hasStructure && !fullText.includes('#') && !fullText.includes('<h')) {
                    const msg = `مقال بلا هيكلية: ${a.title}`;
                    if (onLog) onLog(`⚠️ ${msg}`);
                    insights.push({ type: 'structure', severity: 'medium', title: msg, description: `المقال يحتاج إلى تقسيم (Steps/Tips) أو عناوين فرعية.`, metadata: { articleId: a.id } });
                }

                // 3. No References/Sources mentioned?
                const isLegal = a.title.includes('قانون') || a.title.includes('إقامة') || a.title.includes('جنسية');
                const hasSource = (a.source && a.source.length > 5) || fullText.includes('رابط') || fullText.includes('مصدر') || fullText.includes('http');
                if (isLegal && !hasSource) {
                    const msg = `مقال قانوني بلا مصدر: ${a.title}`;
                    if (onLog) onLog(`⚠️ ${msg}`);
                    insights.push({ type: 'quality', severity: 'medium', title: msg, description: `المقالات القانونية يجب أن تحتوي على رابط للمصدر الرسمي.`, metadata: { articleId: a.id } });
                }
            });
        }

        return insights;
    }

    static async saveInsights(insights: Insight[], onLog?: (msg: string) => void) {
        if (!supabase) return;

        const targetTypes = ['gap', 'logic', 'conflict', 'quality', 'review_mismatch', 'duplication', 'structure'];

        // 1. Get existing "Resolved/Ignored" insights to preserve them
        const { data: resolvedRows } = await supabase
            .from('analyst_insights')
            .select('type, title, metadata')
            .eq('is_resolved', true)
            .in('type', targetTypes);

        const resolvedSet = new Set(resolvedRows?.map(r => `${r.type}|${r.title}|${JSON.stringify(r.metadata)}`) || []);

        // 2. Delete ONLY "Unresolved" insights (wiping the slate for new analysis)
        await supabase
            .from('analyst_insights')
            .delete()
            .in('type', targetTypes)
            .eq('is_resolved', false);

        // 3. Filter out new insights that match resolved ones
        const finalInsightsToInsert = insights.filter(insight => {
            const sig = `${insight.type}|${insight.title}|${JSON.stringify(insight.metadata)}`;
            return !resolvedSet.has(sig);
        });

        if (onLog) {
            onLog(`💾 تم العثور على ${insights.length} ملاحظة.`);
            if (insights.length !== finalInsightsToInsert.length) {
                onLog(`♻️ تم استبعاد ${insights.length - finalInsightsToInsert.length} ملاحظة (تم حلها سابقاً).`);
            }
            if (finalInsightsToInsert.length > 0) {
                onLog(`📥 جاري حفظ ${finalInsightsToInsert.length} ملاحظة جديدة...`);
            } else {
                onLog(`✨ لا توجد ملاحظات جديدة للحفظ.`);
            }
        }

        // 4. Insert the new batch
        if (finalInsightsToInsert.length > 0) {
            const chunked = [];
            const size = 50;
            for (let i = 0; i < finalInsightsToInsert.length; i += size) {
                chunked.push(finalInsightsToInsert.slice(i, i + size));
            }
            for (const batch of chunked) {
                const { error } = await supabase.from('analyst_insights').insert(batch);
                if (error) logger.error("Error saving batch:", error);
            }
        }
    }
}
