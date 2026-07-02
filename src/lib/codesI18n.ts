/**
 * Bilingual helpers for the security-codes pages (Arabic + Turkish).
 *
 * The codes ARE Turkish restriction codes (tahdit kodları), so a Turkish reader
 * searching "V-87 kodu ne demek" should land on a Turkish rendering. Arabic is
 * the source; Turkish comes from the *_tr columns and falls back to Arabic when
 * a translation isn't filled in yet. Turkish text is LTR — render it with
 * dir="ltr" even though the site chrome is RTL.
 */

export type Lang = 'ar' | 'tr';

export function normalizeLang(raw: string | string[] | undefined): Lang {
    const v = Array.isArray(raw) ? raw[0] : raw;
    return v === 'tr' ? 'tr' : 'ar';
}

/** The raw DB category strings are a messy AR/EN mix — normalize to clean labels. */
const CATEGORY: Record<string, { ar: string; tr: string }> = {
    'غرامات': { ar: 'غرامات مالية', tr: 'İdari Para Cezası' },
    'إداري': { ar: 'قيود إدارية', tr: 'İdari Tahdit' },
    'منع دخول': { ar: 'منع دخول', tr: 'Giriş Yasağı' },
    'أمن وجرائم': { ar: 'أمن وجرائم', tr: 'Güvenlik ve Suç' },
    'حماية دولية': { ar: 'حماية دولية', tr: 'Uluslararası Koruma' },
    'deportation': { ar: 'ترحيل', tr: 'Sınır Dışı' },
    'مغادرة': { ar: 'سجل مغادرة', tr: 'Çıkış Kaydı' },
    'general': { ar: 'عام', tr: 'Genel' },
    'قديم': { ar: 'أرشيف', tr: 'Arşiv' },
};

export function categoryLabel(cat: string | null | undefined, lang: Lang): string {
    if (!cat) return lang === 'tr' ? 'Genel' : 'عام';
    return CATEGORY[cat]?.[lang] ?? cat;
}

const SEVERITY: Record<string, { ar: string; tr: string }> = {
    critical: { ar: 'خطير جداً', tr: 'Çok Kritik' },
    high: { ar: 'عالي الخطورة', tr: 'Yüksek Risk' },
    medium: { ar: 'متوسط', tr: 'Orta' },
    low: { ar: 'منخفض', tr: 'Düşük' },
    info: { ar: 'معلومة', tr: 'Bilgi' },
    safe: { ar: 'آمن', tr: 'Güvenli' },
};

export function severityLabel(sev: string | null | undefined, lang: Lang): string {
    if (sev && SEVERITY[sev]) return SEVERITY[sev][lang];
    return lang === 'tr' ? 'Belirsiz' : 'غير محدد';
}

/** Pick the Turkish value when lang=tr and it exists, else the Arabic source. */
export function pick(
    row: Record<string, unknown>,
    base: 'title' | 'description' | 'how_to_remove' | 'duration',
    lang: Lang,
): string {
    const ar = (row[base] as string) || '';
    if (lang !== 'tr') return ar;
    const tr = (row[`${base}_tr`] as string) || '';
    return tr || ar;
}

/** Does this row have any Turkish translation yet? (gates the AR/TR toggle) */
export function hasTurkish(row: Record<string, unknown>): boolean {
    return !!(row.title_tr || row.description_tr || row.how_to_remove_tr);
}

/** Counted-noun grammar for "N codes". */
export function codeCount(n: number, lang: Lang): string {
    if (lang === 'tr') return `${n} kod`;
    if (n === 1) return 'كود واحد';
    if (n === 2) return 'كودان';
    if (n <= 10) return `${n} أكواد`;
    return `${n} كوداً`;
}

/** Static UI strings per language. */
export const UI = {
    ar: {
        dir: 'rtl' as const,
        back: 'عودة لكافة الأكواد',
        meaning: 'ماذا يعني هذا الكود؟',
        howRemove: 'كيف ترفع هذا الكود؟',
        duration: 'مدة السريان',
        related: 'أكواد مرتبطة',
        send: 'أرسِل الإجابة على واتساب',
        sendHint: 'بضغطة واحدة — يفتح واتساب والإجابة جاهزة لإرسالها لأصدقائك أو مجموعتك',
        heroTitle: 'كاشف الأكواد الأمنية',
        heroDesc: 'افهم معنى أكواد المنع والحظر وأسبابها وكيفية إزالتها',
        searchPlaceholder: 'اكتب الكود أو ابحث بالوصف... (مثال: V87، منع السفر...)',
        all: 'الكل',
        severityFilter: 'حسب الخطورة',
        noResults: 'لا توجد أكواد مطابقة',
        noResultsHint: 'جرّب كوداً مختلفاً أو كلمات أخرى',
        families: 'عائلات الأكواد',
        familyWord: 'عائلة',
        other: 'أخرى',
        critical: 'الأشدّ خطورة',
        searchResults: 'نتائج البحث',
        disclaimer:
            'هذه المعلومات استرشادية فقط وقد تتغيّر؛ المرجع النهائي هو الجهة الرسمية. لسنا محامين ولا تابعين لأي جهة حكومية، ولا نطلب مالاً ولا نَعِد بنتيجة.',
        source: 'المصدر: دليل العرب والسوريين في تركيا',
    },
    tr: {
        dir: 'ltr' as const,
        back: 'Tüm kodlara dön',
        meaning: 'Bu kod ne anlama gelir?',
        howRemove: 'Bu kod nasıl kaldırılır?',
        duration: 'Geçerlilik süresi',
        related: 'İlgili kodlar',
        send: "Cevabı WhatsApp'ta gönder",
        sendHint: 'Tek dokunuşla WhatsApp açılır, cevap arkadaşına veya grubuna göndermeye hazırdır',
        heroTitle: 'Güvenlik Kodları Rehberi',
        heroDesc: 'Giriş yasağı ve tahdit kodlarının anlamını, nedenlerini ve nasıl kaldırılacağını öğrenin',
        searchPlaceholder: 'Kodu yazın veya açıklamayla arayın... (örn: V87, giriş yasağı...)',
        all: 'Tümü',
        severityFilter: 'Risk düzeyi',
        noResults: 'Eşleşen kod bulunamadı',
        noResultsHint: 'Farklı bir kod veya başka kelimeler deneyin',
        families: 'Kod aileleri',
        familyWord: 'ailesi',
        other: 'Diğer',
        critical: 'En kritik kodlar',
        searchResults: 'Arama sonuçları',
        disclaimer:
            'Bu bilgiler yalnızca yol göstericidir ve değişebilir; nihai kaynak resmî makamdır. Avukat değiliz, hiçbir resmî kuruma bağlı değiliz, para talep etmiyor ve sonuç vaat etmiyoruz.',
        source: "Kaynak: Türkiye'deki Araplar ve Suriyeliler Rehberi",
    },
} as const;
