import {
    Stethoscope, Gavel, Wrench, Truck, GraduationCap, Languages, Home,
    FileText, Briefcase, HeartPulse, MapPin, Shield, BookOpen,
    FolderOpen, Building2, Smartphone, ShieldAlert, Calculator,
    UserCheck, Plane, FileCheck, Newspaper, Stamp, CalendarClock,
    ScrollText, Link, BrainCircuit
} from 'lucide-react';

export const SERVICE_CATEGORIES = [
    { id: 'all', name: 'الكل', icon: null },
    { id: 'medical', name: 'طب وصحة', icon: Stethoscope },
    { id: 'legal', name: 'قانون ومحاماة', icon: Gavel },
    { id: 'home', name: 'صيانة ومنزل', icon: Wrench },
    { id: 'transport', name: 'نقل وشحن', icon: Truck },
    { id: 'education', name: 'تعليم وتدريب', icon: GraduationCap },
    { id: 'translation', name: 'ترجمة ونوتر', icon: Languages },
    { id: 'other', name: 'خدمات أخرى', icon: Home },
] as const;

export const NAVIGATION = [
    { name: "الرئيسية", href: "/", icon: Home },
    { name: "المستشار الذكي", href: "/consultant", icon: BrainCircuit },
    { name: "اطلب خدمة", href: "/services", icon: Briefcase },
    { name: "خدمات السوريين", href: "/category/syrians", icon: Building2 },
    { name: "خدمات e-Devlet", href: "/e-devlet-services", icon: Smartphone },
    { name: "دليل الأكواد", href: "/codes", icon: ShieldAlert },
    { name: "الدليل الشامل", href: "/directory", icon: FolderOpen },
    { name: "الإقامات", href: "/category/residence", icon: FileText },
    { name: "المناطق المحظورة", href: "/zones", icon: MapPin },
    { name: "الأسئلة الشائعة", href: "/faq", icon: BookOpen },
    { name: "حاسبة المنع", href: "/ban-calculator", icon: Calculator },
];

export const PRIMARY_NAV = [
    { name: "الرئيسية", href: "/", icon: Home },
    { name: "الخريطة", href: "/map", icon: MapPin },
    { name: "خدمات", href: "/services", icon: Briefcase, isNew: true },
];

export const GUIDES_MENU = [
    { name: "الدليل الشامل", href: "/directory", icon: FolderOpen },
    { name: "خدمات السوريين", href: "/category/syrians", icon: Building2 },
    { name: "خدمات e-Devlet", href: "/e-devlet-services", icon: Smartphone },
    { name: "خدمات الإقامات", href: "/category/residence", icon: FileText },
    { name: "الأسئلة الشائعة", href: "/faq", icon: BookOpen },
    { name: "نماذج جاهزة", href: "/forms", icon: FileText },
    { name: "اطلب خدمة خاصة", href: "/request", icon: ScrollText },
];

export const TOOLS_MENU = [
    { name: "فحص الكملك", href: "/tools/kimlik-check", icon: UserCheck },
    { name: "حاسبة المنع", href: "/ban-calculator", icon: Calculator },
    { name: "حاسبة تكاليف الإقامة", href: "/calculator", icon: Calculator },
    { name: "رموز المنع (الأكواد)", href: "/codes", icon: ShieldAlert },
    { name: "المناطق المحظورة", href: "/zones", icon: MapPin },
    { name: "الصيدليات المناوبة", href: "/tools/pharmacy", icon: HeartPulse },
];

// Deprecated but kept to prevent breaks if referenced
export const TOP_NAVIGATION: any[] = [];

export const SERVICES_LIST = [
    { id: 'syria-docs', title: "جلب أوراق من سوريا", desc: "إخراج قيد، بيان عائلي، ووثائق رسمية.", icon: ScrollText, color: "bg-green-600" },
    { id: 'flight-booking', title: "حجوزات طيران عالمية", desc: "أرخص الأسعار لكل دول العالم.", icon: Plane, color: "bg-sky-500" },
    { id: 'single-paper', title: "استخراج ورقة عزوبية", desc: "لازمة لتثبيت الزواج في البلدية.", icon: FileCheck, color: "bg-pink-500" },
    { id: 'newspaper-ad', title: "إعلان جريدة (فقدان)", desc: "نشر إعلان فقدان هوية أو جواز.", icon: Newspaper, color: "bg-gray-600" },
    { id: 'translation', title: "ترجمة محلفة ومعتمدة", desc: "ترجمة كافة الوثائق للغات مع تصديق.", icon: Languages, color: "bg-blue-500" },
    { id: 'attestation', title: "تصديق الأوراق", desc: "تسيير معاملات التصديق في الوالي.", icon: Stamp, color: "bg-purple-500" },
    { id: 'appointments', title: "حجز مواعيد قنصلية / تحديث بيانات / سفارات وقنصليات", desc: "حجز مواعيد قنصلية، تحديث بيانات، سفارات وقنصليات.", icon: CalendarClock, color: "bg-red-500" },
    { id: 'insurance', title: "تأمين شامل", desc: "إصدار بوالص التأمين بأفضل الأسعار.", icon: Shield, color: "bg-emerald-500" },
    { id: 'phone-imei', title: "تتريك هواتف (IMEI)", desc: "مساعدة في دفع وتسجيل الهواتف.", icon: Smartphone, color: "bg-teal-600" },
    { id: 'company-setup', title: "تأسيس شركات", desc: "تخليص معاملات التأسيس كاملة.", icon: Building2, color: "bg-indigo-600" },
    { id: 'provinces-paper', title: "تجهيز أوراق الولايات", desc: "خدمات خاصة في الولايات التركية.", icon: MapPin, color: "bg-orange-600" }
];

export const FORMS = [
    { id: 'deportation-objection', name: "اعتراض ترحيل (Word)", type: "DOCX", size: "1 MB", desc: "نموذج اعتراض رسمي على قرار الترحيل (إعادة قسري) أو منع دخول.", url: "https://www.diyarbakirbarosu.org.tr/public/uploads/document/gecici-koruma-basvuru-sahibi-kimlik-iadesi-dilekce-1752759084.docx" },
    { id: 'remove-ban-code', name: "إزالة كود منع (Word)", type: "DOCX", size: "1 MB", desc: "عريضة قانونية لطلب إزالة أكواد المنع الأمنية (G-87, V-160, etc).", url: "https://avys.omu.edu.tr/storage/app/public/tayfun.simsek/108160/G%C3%9CMR%C3%9CK%20Y%C3%96NETMEL%C4%B0%C4%9E%C4%B0%20word.docx" },
    { id: 'rent-contract-pdf', name: "عقد إيجار (PDF)", type: "PDF", size: "2 MB", desc: "نموذج عقد إيجار تركي قياسي (النسخة المعتمدة لدى كتاب العدل).", url: "https://www.akademikhukuk.org/wp-content/uploads/2023/12/Kira-So%CC%88zles%CC%A7mesi-O%CC%88rneg%CC%86i-Kira-Kontrati-O%CC%88rneg%CC%86i-pdf.pdf" },
    { id: 'cancel-deport-word', name: "إلغاء ترحيل (Word)", type: "PDF", size: "1.5 MB", desc: "صيغة دعوى إدارية لطلب إلغاء قرار الترحيل أمام المحكمة.", url: "https://www.secililaydasonmez.av.tr/wp-content/uploads/2024/07/Deport-Sinirdisi-Edilme-Kararinin-Kaldirilmasi-Dava-Dilekcesi-Ornegi-%E2%80%93-1.pdf" },
    { id: 'governor-petition', name: "طلب استرحام (الوالي)", type: "Word", size: "1 MB", desc: "نموذج استرحام لتقديمه لمكتب الوالي لرفع المنع أو استعادة الكملك.", url: "https://drive.usercontent.google.com/download?id=1j2zvLkUMk3Ct_GWBZ5xKqFOCjgxkTpVF&export=download&authuser=0&confirm=t&uuid=5ab87785-3431-4f90-b2ad-d5f99c15de08&at=ANTm3cxp44pdLjLLzxhzukRf2OpV:1767559642031" },
];

export const OFFICIAL_SOURCES = [
    { name: "بوابة الحكومة الإلكترونية (e-Devlet)", url: "https://www.turkiye.gov.tr", desc: "بوابتك لكل المعاملات الحكومية." },
    { name: "إدارة الهجرة التركية", url: "https://www.goc.gov.tr", desc: "القوانين واللوائح الخاصة بالأجانب." },
    { name: "بوابة الإقامة الإلكترونية (e-ikamet)", url: "https://e-ikamet.goc.gov.tr", desc: "تقديم طلبات الإقامة الأولية والتجديد." },
    { name: "حجز موعد تحديث بيانات الهجرة", url: "https://randevu.goc.gov.tr/#/", desc: "حجز المواعيد الرسمية لدى إدارة الهجرة." },
    { name: "حجز موعد النفوس التركية (NVI)", url: "https://randevu.nvi.gov.tr/#/nvi/randevu-al", desc: "حجز موعد للنفوس (العنوان، النفوس، معاملات متعددة)." },
    { name: "مراحل/استعلام الجنسية التركية", url: "https://vatan.nvi.gov.tr", desc: "الاستعلام الرسمي عن مراحل ومعاملات الجنسية." },
    { name: "مديرية النفوس والجنسية (NVI)", url: "https://www.nvi.gov.tr/", desc: "الموقع الرسمي لمديرية النفوس والجنسية." },
    { name: "التحقق من رقم هوية أجنبي", url: "https://tckimlik.nvi.gov.tr/Modul/YabanciKimlikNoDogrula", desc: "التحقق الرسمي من رقم الهوية للأجانب." },
    { name: "بوابة المدارس (e-Okul)", url: "https://e-okul.meb.gov.tr/", desc: "خدمات متابعة الطلاب في المدارس." },
    { name: "الاستعلام عن إذن العمل", url: "https://izinsorgula.csgb.gov.tr/#/app/giris", desc: "معرفة صلاحية/حالة إذن العمل." },
    { name: "الاستعلام عن طلب الإقامة (طلبات مستمرة)", url: "https://e-ikamet.goc.gov.tr/Ikamet/DevamEdenBasvuruGiris", desc: "الاستعلام الرسمي عن طلبات الإقامة الجارية." },
    { name: "الاستعلام عن الرقم الضريبي", url: "https://intvd.gib.gov.tr/internetvd/template.jsp?page=IVD_VKNO", desc: "خدمة مصلحة الضرائب (GİB) للاستعلام عن الرقم الضريبي." },
    { name: "استخراج سند قيد عائلي", url: "https://www.turkiye.gov.tr/nvi-nufus-kayit-ornegi-belgesi-sorgulama", desc: "خدمة e-Devlet لاستخراج وثيقة القيد." },
    { name: "استخراج وثيقة العنوان (سند إقامة)", url: "https://www.turkiye.gov.tr/nvi-yerlesim-yeri-ve-diger-adres-belgesi-sorgulama", desc: "خدمة e-Devlet لإثبات العنوان الرسمي." },
    { name: "التحقق من IMEI", url: "https://www.turkiye.gov.tr/imei-sorgulama", desc: "خدمة e-Devlet للتحقق من IMEI." },
    { name: "التحقق من الدعاوى القضائية", url: "https://www.turkiye.gov.tr/davalarim", desc: "خدمة e-Devlet لعرض الدعاوى." },
    { name: "كشف خدمة SGK (4A)", url: "https://www.turkiye.gov.tr/4a-hizmet-dokumu", desc: "عرض أيام/تفاصيل الخدمة في التأمينات." },
    { name: "ديون SGK (4B)", url: "https://www.turkiye.gov.tr/4b-borc-durumu", desc: "الاستعلام عن الديون في SGK." },
    { name: "المخالفات المرورية للسيارة", url: "https://www.turkiye.gov.tr/emniyet-arac-plakasina-yazilan-ceza-sorgulama", desc: "الاستعلام عن مخالفات السيارة عبر e-Devlet." },
    { name: "العقارات المسجلة باسمك", url: "https://www.turkiye.gov.tr/tapu-bilgileri-sorgulama", desc: "الاستعلام عن الطابو عبر e-Devlet." },
    { name: "الخطوط المسجلة باسمك", url: "https://www.turkiye.gov.tr/mobil-hat-sorgulama", desc: "الاستعلام عن الخطوط المسجلة باسمك." },
    { name: "القنصلية السورية: تطبيق حجز المواعيد", url: "https://mofaex.gov.sy/eservices-app", desc: "الرابط الرسمي لتطبيق/خدمة المواعيد القنصلية." },
    { name: "الصيدليات المناوبة (إسطنبول)", url: "https://istanbulism.saglik.gov.tr/TR,53947/nobetci-eczane.html", desc: "صفحة رسمية للصيدليات المناوبة." },
    { name: "متابعة إرساليات PTT (عبر e-Devlet)", url: "https://www.turkiye.gov.tr/ptt-gonderi-takip", desc: "تتبع شحنات/إرساليات PTT عبر e-Devlet." },
    { name: "إدارة الهجرة (النسخة العربية)", url: "https://ar.goc.gov.tr/", desc: "الواجهة العربية الرسمية لإدارة الهجرة." }
];

export const QUICK_ACTIONS = [
    { title: "المستشار الذكي", desc: "أداة التشخيص القانوني الشامل", icon: BrainCircuit, href: "/consultant" },
    { title: "الدليل الشامل", desc: "دليل الخدمات والمواقع الهامة", icon: FolderOpen, href: "/directory" },
    { title: "فحص الكملك", desc: "تأكد من صلاحية القيد (TC)", icon: UserCheck, href: "/tools/kimlik-check" },
    { title: "الأكواد الأمنية", desc: "افحص رموز المنع (V-87, G-87...)", icon: ShieldAlert, href: "/codes" },
    { title: "المناطق المحظورة", desc: "خريطة الأحياء المغلقة للسوريين", icon: MapPin, href: "/zones" },
    { title: "حساب المنع", desc: "حاسبة مدة منع الدخول", icon: Calculator, href: "/ban-calculator" },
    { title: "النماذج الجاهزة", desc: "عقود واستمارات مترجمة", icon: FileText, href: "/forms" },
    { title: "الصيدليات المناوبة", desc: "بوابة e-Devlet الرسمية", icon: HeartPulse, href: "/tools/pharmacy" },
    { title: "روابط هامة", desc: "أهم المواقع الخدمية والمنظمات", icon: Link, href: "/important-links" },
];

const RAW_UPDATES = [
    { id: 101, type: "اقتصاد", title: "الحد الأدنى للأجور 2026: 28,075 ليرة (صافي)", date: "2025-12-23", content: "زيادة 27% وتدخل حيز التنفيذ في 1 يناير 2026." },
    { id: 102, type: "صحة", title: "إلزام السوريين بالتأمين الصحي العام (GSS) وإيقاف المجاني", date: "2026-01-01", content: "بدءاً من 2026 يتوجب على السوريين (كيملك) استخراج GSS." },
    { id: 103, type: "قانون", title: "صاحب العمل مسؤول عن نفقات ترحيل العامل المخالف وعائلته", date: "2026-01-23", content: "قانون جديد يُلزم صاحب العمل بتكاليف الترحيل." },
    { id: 104, type: "سفر", title: "فتح المعابر البرية لحملة الإقامات (وليس الكيملك)", date: "2026-01-02", content: "السماح بالدخول والخروج البري للمقيمين رسمياً." },
    { id: 1, type: "هام", title: "القنصلية السورية تحصر الدفع بالدولار الجديد", date: "2025-12-10", content: "تم رفض الدولار القديم." },
    { id: 2, type: "استثمار", title: "تأكيدات الجنسية عبر العقار (400 ألف دولار)", date: "2025-11-01", content: "تنبيه: المبلغ للجنسية فقط." },
    { id: 3, type: "اقتصاد", title: "زيادة رسوم الجواز التركي 40%", date: "2025-10-01", content: "اعتباراً من العام الجديد." },
    { id: 4, type: "خدمات مالية", title: "عودة كرت بابارا للعمل", date: "2025-12-18", content: "رفع الحظر عن منصة بابارا." },
];

export const LATEST_UPDATES = [...RAW_UPDATES].sort((a, b) => {
    return new Date(b.date).getTime() - new Date(a.date).getTime();
});

export const UPDATES_STORAGE_KEY = 'daleel.lastSeenUpdatesVersion.v1';

export const LATEST_UPDATES_VERSION = (() => {
    const versions = (LATEST_UPDATES || []).map((u) => {
        const date = u.date || '0000-00-00';
        const id = String(u.id ?? 0).padStart(6, '0');
        return `${date}-${id}`;
    });
    versions.sort();
    return versions.at(-1) || '0000-00-00-000000';
})();
