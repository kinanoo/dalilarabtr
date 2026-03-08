/**
 * 🧠 نظام البحث الذكي (Intelligent Semantic Search)
 * ===================================================
 * 
 * بحث ذكي بدون خلط بين الوثائق المختلفة
 * - كملك ≠ جواز (وثائق منفصلة!)
 * - فقط مترادفات حقيقية
 */

// ============================================
// 📚 قاموس المترادفات العربية (دقيق)
// ============================================

export const ARABIC_SYNONYMS: Record<string, string[]> = {
    // 🆔 الكملك
    'كملك': ['كمليك', 'kimlik', 'الكملك', 'بطاقة الحماية'],
    'كمليك': ['كملك', 'kimlik'],

    // 🔄 نقل / تحويل / قلب
    'نقل': ['تحويل', 'تغيير', 'تبديل', 'اقلب'],
    'تحويل': ['نقل', 'تغيير', 'تبديل', 'اقلب'],
    'اقلب': ['تحويل', 'نقل', 'تبديل', 'تغيير'],

    // 🔢 كود / رموز
    'كود': ['اكواد', 'أكواد', 'code', 'رمز', 'رموز', 'v-87', 'v-160', 'g-87'],
    'اكواد': ['كود', 'code', 'رمز'],
    'رمز': ['رموز', 'كود', 'اشارة'],
    'منع': ['تجميد', 'حظر', 'تقييد'],

    // 🛂 جواز
    'جواز': ['باسبور', 'passport', 'جوازات', 'بسبور'],
    'باسبور': ['جواز', 'passport', 'بسبور'],

    // 📄 هوية
    'هوية': ['هويه', 'إثبات', 'هويات'],
    'بطاقة': ['كارت', 'card', 'بطاقات'],

    // 🔴 ACTIONS
    'ضاع': ['فقد', 'ضيع', 'فقدت', 'ضاعت', 'ضيعت', 'مفقود', 'فقدان'],
    'فقد': ['ضاع', 'ضيع', 'فقدت', 'مفقود', 'فقدان', 'خسارة'],
    'سرق': ['سرقة', 'مسروق'],

    // ✅ إصدار
    'اصدار': ['استخراج', 'طلب', 'إخراج'],
    'تجديد': ['تمديد', 'تحديث'],
    'حصول': ['استخراج', 'الحصول'],

    // 🏠 إقامة
    'إقامة': ['اقامة', 'اقامه', 'oturma', 'سكن', 'اقامات'],
    'اقامة': ['إقامة', 'إقامه', 'اقامات'],

    // 👶 طفل
    'طفل': ['ولد', 'مولود', 'رضيع', 'صغير', 'اطفال', 'أطفال', 'اولاد'],
    'مولود': ['طفل', 'رضيع', 'مواليد'],
    'ابن': ['ولد', 'ابناء', 'أبناء'],

    // 💼 عمل
    'عمل': ['وظيفة', 'شغل', 'عملية', 'اعمال', 'أعمال'],
    'وظيفة': ['عمل', 'شغل', 'وظائف'],
    'اذن': ['إذن', 'تصريح', 'موافقة'],

    // ✈️ سفر
    'سفر': ['رحلة', 'سياحة', 'اجازة', 'travel', 'سفريه'],
    'تقديم': ['طلب', 'تسجيل', 'اصدار'],

    // 🏥 صحة
    'صحة': ['صحي', 'طبي', 'علاج', 'مشفى', 'مستشفى'],
    'تأمين': ['sgk', 'ضمان', 'سيكورتا'],
    'أسنان': ['اسنان', 'dental', 'dentist', 'طبيب أسنان', 'علاج أسنان'],
    'dentist': ['dental', 'طبيب أسنان', 'أسنان', 'اسنان'],

    // 🎓 تعليم
    'تعليم': ['دراسة', 'تعلم', 'مدارس', 'مدرسة', 'جامعة'],
    'دراسة': ['تعليم', 'مدرسة'],

    // 🚗 سيارة
    'سيارة': ['عربية', 'سياره', 'araba', 'سيارات'],
    'رخصة': ['رخصه', 'ehliyet', 'شهادة'],

    // 🏡 سكن
    'شقة': ['منزل', 'daire', 'شقق', 'بيوت'],
    'منزل': ['بيت', 'شقة', 'سكن', 'منازل'],
    'عنوان': ['ادرس', 'adres', 'نفوس', 'nufus', 'سكن'],

    // 💰 مال
    'راتب': ['مرتب', 'أجر', 'رواتب', 'معاش'],
    'فلوس': ['مال', 'نقود', 'اموال'],

    // 👥 عائلة
    'عائلة': ['اسرة', 'أسرة', 'aile', 'عائلات'],
    'زوجة': ['زوجه', 'eş', 'زوجات'],
    'لم': ['شمل', 'جمع'], // لم الشمل

    // 🏦 بنك
    'بنك': ['مصرف', 'bank', 'بنوك'],
    'حساب': ['account', 'hesap', 'رصيد'],
};

// ============================================
// 🎯 سياقات البحث (بدون خلط)
// ============================================

export const SEARCH_CONTEXTS: Array<{
    keywords: string[];
    relatedTopics: string[];
    boost: number;
}> = [
        {
            keywords: ['ضاع', 'فقد', 'سرق', 'ضيع', 'مفقود'],
            relatedTopics: ['بدل', 'تعويض', 'استخراج'],
            boost: 8,
        },
        {
            keywords: ['تجديد', 'تمديد'],
            relatedTopics: ['موعد', 'استمارة'],
            boost: 6,
        },
        {
            keywords: ['طفل', 'مولود'],
            relatedTopics: ['تسجيل', 'إضافة'],
            boost: 5,
        },
    ];

// ============================================
// 🔍 توسيع الاستعلام
// ============================================

export function expandQueryWithSynonyms(query: string): string[] {
    const words = query
        .toLowerCase()
        .split(/\s+/)
        .filter(Boolean);

    const expanded = new Set<string>();

    words.forEach(word => expanded.add(word));

    words.forEach(word => {
        const synonyms = ARABIC_SYNONYMS[word] || [];
        synonyms.forEach(syn => expanded.add(syn));
    });

    return Array.from(expanded);
}

// ============================================
// 🧠 فهم السياق
// ============================================

export function detectSearchContext(query: string): {
    matchedContext: typeof SEARCH_CONTEXTS[0] | null;
    suggestedKeywords: string[];
} {
    const normalized = query.toLowerCase();

    for (const context of SEARCH_CONTEXTS) {
        const hasKeyword = context.keywords.some(kw => normalized.includes(kw));
        if (hasKeyword) {
            return {
                matchedContext: context,
                suggestedKeywords: context.relatedTopics,
            };
        }
    }

    return {
        matchedContext: null,
        suggestedKeywords: [],
    };
}

// ============================================
// ⚡ البحث الذكي
// ============================================

// ============================================
// 🗑️ كلمات الحشو (Stop Words) - يجب تجاهلها
// ============================================
const NOISE_WORDS = new Set([
    // Intent / desire words
    'بدي', 'اريد', 'ابي', 'ابغى', 'عايز', 'لازم', 'ضروري',
    'بدنا', 'بدك', 'بدكم', 'بدهم', 'لازمني', 'لازمنا', 'لازمك',
    'عايزه', 'عايزين', 'محتاجين', 'محتاجه', 'ابيه', 'ابغاه',
    // Question / how words
    'كيف', 'طريقة', 'شرح', 'هل', 'يوجد', 'ممكن', 'لو', 'سمحت',
    'شو', 'ما', 'هو', 'هي', 'ماهو', 'ماهي', 'كم', 'متى', 'اين', 'وين', 'ليش', 'لماذا',
    // Pronouns
    'انا', 'نحن', 'انت', 'انتم', 'هم', 'هن',
    // Prepositions / connectors
    'عند', 'عندي', 'لي', 'لنا', 'في', 'من', 'على', 'الي', 'الى',
    'بخصوص', 'موضوع', 'عن', 'حول',
    'علي', 'عليا', 'إلي', 'بي', 'بنا', 'فيه', 'فيها', 'لك', 'لكي',
    // Conversational filler (Syrian/Lebanese/Gulf dialect)
    'اعطيني', 'اعطني', 'خبرني', 'عرفني', 'قلي', 'قولي', 'وريني', 'دلني',
    'معرفة', 'معرفه', 'معنى', 'يعني', 'رابط',
    'رح', 'راح', 'بس', 'خلاص', 'طيب', 'يلا',
]);

// ============================================
// ✂️ الجذوع الشائعة (Basic Stemming)
// ============================================
// تحويل "كملكي/كملكنا/بالكملك" -> "كملك"
function getWrodStem(word: string): string {
    let stem = word;

    // Remove prefixes (ال, ب, ف, ك, ل) - Be careful with short words
    if (stem.startsWith('ال') && stem.length > 4) stem = stem.substring(2);
    if (stem.startsWith('بال') && stem.length > 5) stem = stem.substring(3);
    if (stem.startsWith('لل') && stem.length > 4) stem = stem.substring(2); // للكملك -> كملك
    if (stem.startsWith('ل') && stem.length > 4 && !stem.startsWith('لم')) stem = stem.substring(1); // لإقامة -> إقامة (avoid 'لم', 'لماذا' if not stopped)

    // Remove suffixes (ي, نا, هم, كم, ة, ات, ين)
    if (stem.endsWith('ي') && stem.length > 3) stem = stem.slice(0, -1);
    if (stem.endsWith('نا') && stem.length > 4) stem = stem.slice(0, -2);
    if (stem.endsWith('هم') && stem.length > 4) stem = stem.slice(0, -2);
    if (stem.endsWith('كم') && stem.length > 4) stem = stem.slice(0, -2);
    if (stem.endsWith('ة') && stem.length > 3) stem = stem.slice(0, -1); // سيارة -> سيار (useful for fuzzy)
    if (stem.endsWith('ه') && stem.length > 3) stem = stem.slice(0, -1); // سياره -> سيار

    return stem;
}

// ============================================
// ⚡ البحث الذكي (المحدث)
// ============================================

export function intelligentTokenize(query: string): {
    originalTokens: string[];
    expandedTokens: string[];
    contextKeywords: string[];
} {
    // 1. Clean & Normalize
    const cleanWords = query
        .toLowerCase()
        .replace(/[^\u0600-\u06FF\s0-9a-zA-Z]/g, '') // Keep Arabic, English, Numbers
        .split(/\s+/)
        .filter(w => w.length > 1)
        .filter(w => !NOISE_WORDS.has(w)); // Remove noise: "بدي" removed here

    // 2. Stemming (Root Extraction)
    // "كملكي" -> "كملك"
    const stemmedWords = cleanWords.map(w => getWrodStem(w));

    // 3. Synonym Expansion on STEMS
    const expanded = new Set<string>();
    stemmedWords.forEach(word => {
        // Add original stem
        expanded.add(word);

        // Add exact Synonyms
        const synonyms = ARABIC_SYNONYMS[word] || [];
        synonyms.forEach(syn => expanded.add(syn));

        // In case the dictionary has the UN-STEMMED version (fallback)
        // e.g. if 'سيارة' is in dict but we stemmed to 'سيار'
    });

    // Also checking unstemmed synonyms just in case
    cleanWords.forEach(word => {
        const synonyms = ARABIC_SYNONYMS[word] || [];
        synonyms.forEach(syn => expanded.add(syn));
    });

    const { suggestedKeywords } = detectSearchContext(query);

    return {
        originalTokens: stemmedWords, // We search for STEMS now
        expandedTokens: Array.from(expanded),
        contextKeywords: suggestedKeywords,
    };
}
