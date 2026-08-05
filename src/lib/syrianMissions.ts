/**
 * Syrian diplomatic missions in Türkiye — single source of truth.
 *
 * Every field here was read off the Syrian Ministry of Foreign Affairs and
 * Expatriates' own missions directory (mofaex.gov.sy/diplomatic-missions,
 * Europe → تركيا) on 2026-08-05. Nothing is inferred, reformatted from a news
 * report, or filled in from a third-party listing site — an address or a phone
 * number that turns out to be wrong costs a family a day of travel and a lost
 * appointment, so the only acceptable source is the ministry that runs them.
 *
 * The addresses are reproduced as the ministry writes them, mixed
 * Latin/Arabic transliteration included. Cleaning them up would look tidier
 * and read differently from what a reader will see on the official page.
 *
 * THERE ARE ONLY TWO. The directory lists no embassy in Ankara and no mission
 * in İzmir, Mersin, Adana, Hatay or anywhere else, despite the May 2025
 * announcement of steps toward an Ankara embassy. That absence is a fact worth
 * publishing, not a gap to be filled — see NO_OTHER_MISSIONS below.
 *
 * When updating: re-read the ministry page, change `verifiedOn`, and leave a
 * field empty rather than carrying over a value the page no longer shows.
 */

export const MISSIONS_SOURCE = 'https://mofaex.gov.sy/diplomatic-missions';
export const MISSIONS_VERIFIED_ON = '2026-08-05';

export type SyrianMission = {
    slug: string;
    city: string;
    /** Full name exactly as the ministry writes it. */
    name: string;
    address: string;
    /** Empty when the ministry publishes no number for that mission. */
    phone: string;
    email: string;
    social: { label: string; url: string }[];
    /** Our own article covering this mission in depth, when we have one. */
    guide?: { href: string; label: string };
    /** Short, attributable note on who the mission was opened to serve. */
    note?: string;
};

export const SYRIAN_MISSIONS: SyrianMission[] = [
    {
        slug: 'istanbul',
        city: 'إسطنبول',
        name: 'القنصلية العامة للجمهورية العربية السورية في إسطنبول',
        address: 'Macka Cad Ralli Ap.No.37 tacvikiye Sisli-Istanbul-Turkey',
        phone: '905071416167',
        email: 'istanbul.consular@mofaex.gov.sy',
        social: [
            { label: 'X', url: 'https://x.com/sycgistanbul' },
            { label: 'إنستغرام', url: 'https://www.instagram.com/sycgistanbul' },
            { label: 'فيسبوك', url: 'https://www.facebook.com/profile.php?id=61588634832910' },
        ],
    },
    {
        slug: 'gaziantep',
        city: 'غازي عنتاب',
        name: 'القنصلية العامة للجمهورية العربية السورية في غازي عنتاب',
        address: 'منطقة Günevler، شارع kemal köker، بلدية şehitkamil، الرمز البريدي 27560',
        // The ministry publishes no phone number for Gaziantep. Left empty on
        // purpose — a number copied from a news article or a directory site is
        // exactly the kind of "helpful" detail that sends people to a dead line.
        phone: '',
        email: 'gaziantep.consular@mofaex.gov.sy',
        social: [
            { label: 'X', url: 'https://x.com/sycgggaziantep' },
            { label: 'فيسبوك', url: 'https://www.facebook.com/share/p/14oz4xE7XUP/' },
        ],
        guide: { href: '/article/syrian-consulate-gaziantep-guide', label: 'دليل قنصلية غازي عنتاب بالتفصيل' },
        note: 'افتُتحت في 11 حزيران/يونيو 2026 بحضور وزير الخارجية، والغرض المعلن تقريب الخدمة من السوريين في ولايات الجنوب.',
    },
];

/**
 * The honest answer to "أين قنصلية مدينتي؟" for every city that is not
 * Istanbul or Gaziantep. Kept as content, not as an empty state, because the
 * question has a real answer and the answer is "there isn't one — go to the
 * nearer of these two".
 */
export const NO_OTHER_MISSIONS = {
    headline: 'لا توجد بعثة سورية في أي مدينة تركية أخرى',
    body:
        'دليل البعثات على موقع وزارة الخارجية والمغتربين السورية يُدرج قنصليتين اثنتين فقط في تركيا: إسطنبول وغازي عنتاب. ' +
        'ولا يُدرج سفارة في أنقرة — رغم الإعلان في أيار/مايو 2025 عن بدء خطوات لفتحها — ولا مكتباً في إزمير أو مرسين أو أضنة أو هاتاي أو أورفا. ' +
        'فإن كنت في أي مدينة أخرى فمعاملتك تُنجَز في إحدى هاتين، والأقرب لك جغرافياً غالباً هي غازي عنتاب إن كنت في الجنوب، وإسطنبول إن كنت في الشمال أو الغرب.',
};

/** +90 507 141 61 67 — grouped for reading, tel: keeps the raw digits. */
export function formatMissionPhone(digits: string): string {
    if (!digits) return '';
    const d = digits.replace(/\D/g, '');
    if (d.length === 12 && d.startsWith('90')) {
        return `+90 ${d.slice(2, 5)} ${d.slice(5, 8)} ${d.slice(8, 10)} ${d.slice(10)}`;
    }
    return `+${d}`;
}
