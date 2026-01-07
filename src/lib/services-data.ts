import { LucideIcon, Stethoscope, Gavel, Wrench, Truck, GraduationCap, Languages, Home } from 'lucide-react';

export interface ServiceProvider {
    id: string;
    name: string;
    profession: string; // e.g., 'طبيب عام', 'محامي', 'نجار'
    category: 'medical' | 'legal' | 'home' | 'transport' | 'education' | 'translation' | 'other';
    city: string; // e.g., 'İstanbul', 'Gaziantep'
    district?: string; // e.g., 'Fatih', 'Şahinbey'
    phone: string;
    rating: number; // 0.0 to 5.0
    reviewCount: number;
    description: string;
    keywords: string[]; // For smart search (synonyms)
    isVerified?: boolean; // Blue tick
    image?: string; // Avatar URL
}

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

// ==============================================================================
// 📌 دليل إضافة البيانات (Data Guide)
// ==============================================================================
// 1. التقييم (Rating):
//    حالياً التقييم "ثابت" وتضعه أنت بناءً على جودة الخدمة.
//    (في المستقبل يمكننا ربطه بقاعدة بيانات لتفعيل تصويت الجمهور الحقيقي).
//
// 2. كرت الفيزيت (Business Card):
//    الخانة `image` مخصصة لرابط صورة الكرت أو صورة شخصية.
//    - إذا تركتها فارغة: تظهر أيقونة "حقيبة" افتراضية.
//    - إذا وضعت رابطاً: تظهر الصورة داخل دائرة الكرت.
//    مثال: image: '/images/my-card.jpg'
// ==============================================================================

// Sample Data (Seed)
export const MOCK_PROVIDERS: ServiceProvider[] = [
    {
        id: '1',
        name: 'د. أحمد السوري',
        profession: 'طبيب أسنان',
        category: 'medical',
        city: 'Istanbul',
        district: 'Basaksehir',
        phone: '905000000001',
        rating: 4.9,
        reviewCount: 154,
        description: 'علاج كافة مشاكل الأسنان، زراعة وتقويم. خبرة 15 سنة في إسطنبول.',
        keywords: ['دكتور', 'اسنان', 'باشاك شهير', 'عيادة'],
        isVerified: true
    },
    {
        id: '2',
        name: 'مكتب الأمان للترجمة',
        profession: 'ترجمة محلفة',
        category: 'translation',
        city: 'Gaziantep',
        district: 'Sahinbey',
        phone: '905000000002',
        rating: 4.8,
        reviewCount: 89,
        description: 'ترجمة وتصديق كافة الوثائق الرسمية، جوازات سفر، شهادات.',
        keywords: ['مترجم', 'نوتر', 'عنتاب', 'غازي عنتاب'],
        isVerified: true
    },
    {
        id: '3',
        name: 'أبو محمد للسباكة',
        profession: 'تمديدات صحية',
        category: 'home',
        city: 'Istanbul',
        district: 'Esenyurt',
        phone: '905000000003',
        rating: 4.5,
        reviewCount: 42,
        description: 'صيانة تمديدات المياة والصرف الصحي، تركيب فلاتر.',
        keywords: ['سباك', 'سمكري', 'صيانة', 'اسنيورت'],
        isVerified: false
    },
    {
        id: '4',
        name: 'المحامي يوسف ديمير',
        profession: 'محامي استشارات',
        category: 'legal',
        city: 'Istanbul',
        district: 'Sisli',
        phone: '905000000004',
        rating: 5.0,
        reviewCount: 210,
        description: 'استشارات قانونية للجنسية والإقامات وتأسيس الشركات.',
        keywords: ['محامي', 'قانون', 'جنسية', 'اقامة'],
        isVerified: true
    },
    {
        id: '5',
        name: 'شركة الفارس للشحن',
        profession: 'شحن دولي',
        category: 'transport',
        city: 'Mersin',
        phone: '905000000005',
        rating: 4.2,
        reviewCount: 30,
        description: 'شحن بضائع وأثاث من مرسين إلى كافة الدول العربية.',
        keywords: ['شحن', 'نقل', 'مرسين'],
        isVerified: true
    },
    {
        id: '6',
        name: 'ابو مازن الشام',
        profession: 'خدمة منزلية وصيانة عامة',
        category: 'home',
        city: 'Istanbul',
        district: 'Fatih',
        phone: '905510156279',
        rating: 5.0,
        reviewCount: 12,
        description: 'فك وتركيب غرف النوم، تصليح وتركيب أبواب، تركيب وتصليح مطابخ. دقة واحترافية في العمل.',
        keywords: ['نجار', 'موبيليا', 'صيانة', 'فك وتركيب'],
        isVerified: true,
        image: '/images/provider-example.png'
    }
];
