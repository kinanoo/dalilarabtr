/**
 * Populate security codes with detailed how_to_remove, duration, and related_codes
 * Data extracted from official TAHDİT KODLARINA İLİŞKİN GENELGE (2022)
 *
 * Run: npx tsx scripts/populate_code_details.ts
 * Prerequisite: Run enhance_security_codes.sql in Supabase SQL Editor first
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

interface CodeDetails {
    how_to_remove: string;
    duration: string;
    related_codes: string[];
}

// =============================================
// Data from PDF: TAHDİT KODLARINA İLİŞKİN GENELGE
// =============================================

const codeData: Record<string, CodeDetails> = {

    // ========== Ç CODES (Entry Bans - Giriş Yasakları) ==========

    'Ç101': {
        how_to_remove: 'الحصول على فيزا خاصة (Özel Meşruhatlı Vize) من القنصلية التركية بعد التقديم عبر إدارة الهجرة العامة، ودفع الغرامة المترتبة عند الوصول للحدود. يُرفع الحظر تلقائياً من قبل شرطة الحدود.',
        duration: '3 أشهر',
        related_codes: ['V-137', 'N-120'],
    },
    'Ç102': {
        how_to_remove: 'الحصول على فيزا خاصة (Özel Meşruhatlı Vize) من القنصلية التركية + دفع الغرامة عند الحدود. يُرفع تلقائياً.',
        duration: '6 أشهر',
        related_codes: ['V-137', 'N-120'],
    },
    'Ç103': {
        how_to_remove: 'الحصول على فيزا خاصة (Özel Meşruhatlı Vize) من القنصلية التركية + دفع الغرامة عند الحدود. يُرفع تلقائياً.',
        duration: 'سنة واحدة',
        related_codes: ['V-137', 'N-120'],
    },
    'Ç104': {
        how_to_remove: 'الحصول على فيزا خاصة (Özel Meşruhatlı Vize) من القنصلية التركية + دفع الغرامة عند الحدود. يُرفع تلقائياً.',
        duration: 'سنتان',
        related_codes: ['V-137', 'N-120'],
    },
    'Ç105': {
        how_to_remove: 'الحصول على فيزا خاصة (Özel Meşruhatlı Vize) من القنصلية التركية + دفع الغرامة عند الحدود. يُرفع تلقائياً.',
        duration: '5 سنوات',
        related_codes: ['V-137', 'N-120'],
    },
    'Ç113': {
        how_to_remove: 'يُرفع فقط بقرار من المديرية العامة للهجرة (Genel Müdürlük) أو بعد انتهاء مدة الحظر والحصول على فيزا خاصة.',
        duration: '5 سنوات',
        related_codes: ['N-135'],
    },
    'Ç114': {
        how_to_remove: 'في حال صدور حكم بالبراءة من التهمة المنسوبة، تُرفع جميع القيود المترتبة. وإلا ينتظر انتهاء المدة + فيزا خاصة.',
        duration: 'سنتان',
        related_codes: [],
    },
    'Ç115': {
        how_to_remove: 'في حال البراءة من التهمة تُرفع جميع القيود. المديرية العامة قد تضيف كود G و/أو N حسب نوع الجريمة.',
        duration: 'سنتان',
        related_codes: [],
    },
    'Ç116': {
        how_to_remove: 'انتظار انتهاء مدة الحظر + الحصول على فيزا خاصة من القنصلية.',
        duration: '5 سنوات',
        related_codes: [],
    },
    'Ç117': {
        how_to_remove: 'انتظار انتهاء مدة الحظر + الحصول على فيزا خاصة من القنصلية.',
        duration: 'سنة واحدة',
        related_codes: ['N-119'],
    },
    'Ç118': {
        how_to_remove: 'الحصول على تقرير طبي من مستشفى حكومي يثبت عدم حمل المرض المعدي. أو تقرير من مستشفى خارجي مصدّق بختم أبوستيل من السفارة.',
        duration: '5 سنوات',
        related_codes: [],
    },
    'Ç119': {
        how_to_remove: 'دفع الغرامة المترتبة على صاحب العمل والعامل.',
        duration: 'حتى دفع الغرامة',
        related_codes: ['N-119'],
    },
    'Ç120': {
        how_to_remove: 'دفع غرامة تجاوز الفيزا/الإقامة.',
        duration: 'حتى دفع الغرامة',
        related_codes: ['N-120'],
    },
    'Ç129': {
        how_to_remove: 'مراجعة المديرية العامة للهجرة.',
        duration: 'غير محدد',
        related_codes: [],
    },
    'Ç135': {
        how_to_remove: 'دفع غرامة الدخول/الخروج غير القانوني.',
        duration: 'حتى دفع الغرامة',
        related_codes: ['N-135'],
    },
    'Ç136': {
        how_to_remove: 'سداد نفقات الترحيل المترتبة.',
        duration: 'حتى السداد',
        related_codes: ['N-136'],
    },
    'Ç137': {
        how_to_remove: 'دفع غرامة تجاوز المهلة الممنوحة.',
        duration: 'حتى دفع الغرامة',
        related_codes: ['V-137', 'N-96'],
    },
    'Ç138': {
        how_to_remove: 'مراجعة المديرية العامة للهجرة.',
        duration: 'غير محدد',
        related_codes: [],
    },
    'Ç141': {
        how_to_remove: 'لا يمكن رفعه بفيزا خاصة حتى لو حصل عليها. يُرفع فقط بقرار من المديرية العامة للهجرة.',
        duration: '5 سنوات',
        related_codes: [],
    },
    'Ç149': {
        how_to_remove: 'لا يمكن رفعه بفيزا خاصة. يُرفع فقط بقرار من المديرية العامة للهجرة. للمشمولين بالحماية المؤقتة الراغبين بالعودة الطوعية: يُضاف عبر مديرية المحافظة.',
        duration: '5 سنوات',
        related_codes: [],
    },
    'Ç150': {
        how_to_remove: 'إذا أثبت الشخص أن استخدام الوثيقة المزورة تم بدون إرادته وقدّم مستندات مقبولة، يُرفع الكود.',
        duration: '5 سنوات',
        related_codes: [],
    },
    'Ç151': {
        how_to_remove: 'انتظار انتهاء مدة الحظر + فيزا خاصة. لا يُضاف Ç-114 أو Ç-115 إذا لم يكن متورطاً في جرائم أخرى.',
        duration: '5 سنوات',
        related_codes: [],
    },
    'Ç152': {
        how_to_remove: 'يُرفع بقرار من المديرية العامة للهجرة بعد انتهاء المدة.',
        duration: 'سنة واحدة',
        related_codes: [],
    },
    'Ç166': {
        how_to_remove: 'انتظار انتهاء مدة الحظر + الحصول على فيزا خاصة من القنصلية.',
        duration: 'سنة واحدة',
        related_codes: ['V-163'],
    },
    'Ç167': {
        how_to_remove: 'الحصول على فيزا خاصة (Özel Meşruhatlı Vize) + دفع الغرامة عند الحدود. يُرفع تلقائياً.',
        duration: 'شهر واحد',
        related_codes: ['N-120'],
    },
    'Ç179': {
        how_to_remove: 'انتظار انتهاء مدة الحظر + فيزا خاصة.',
        duration: '5 سنوات',
        related_codes: [],
    },
    'Ç184': {
        how_to_remove: 'مراجعة المديرية العامة للهجرة.',
        duration: 'غير محدد',
        related_codes: [],
    },

    // ========== G CODES (Security Entry Bans - only Genel Müdürlük) ==========

    'G26': {
        how_to_remove: 'فقط المديرية العامة للهجرة (Genel Müdürlük) تستطيع رفعه. يمكن السماح بدخول مؤقت بتعليمات خطية من المديرية مع إبقاء الكود.',
        duration: 'غير محدد — بقرار المديرية العامة',
        related_codes: [],
    },
    'G34': {
        how_to_remove: 'فقط المديرية العامة للهجرة تستطيع رفعه.',
        duration: 'غير محدد — بقرار المديرية العامة',
        related_codes: [],
    },
    'G42': {
        how_to_remove: 'فقط المديرية العامة للهجرة تستطيع رفعه.',
        duration: 'غير محدد — بقرار المديرية العامة',
        related_codes: [],
    },
    'G43': {
        how_to_remove: 'فقط المديرية العامة للهجرة تستطيع رفعه.',
        duration: 'غير محدد — بقرار المديرية العامة',
        related_codes: [],
    },
    'G48': {
        how_to_remove: 'فقط المديرية العامة للهجرة تستطيع رفعه.',
        duration: 'غير محدد — بقرار المديرية العامة',
        related_codes: [],
    },
    'G55': {
        how_to_remove: 'فقط المديرية العامة للهجرة تستطيع رفعه.',
        duration: 'غير محدد — بقرار المديرية العامة',
        related_codes: [],
    },
    'G58': {
        how_to_remove: 'فقط المديرية العامة للهجرة تستطيع رفعه.',
        duration: 'غير محدد — بقرار المديرية العامة',
        related_codes: [],
    },
    'G64': {
        how_to_remove: 'فقط المديرية العامة للهجرة تستطيع رفعه.',
        duration: 'غير محدد — بقرار المديرية العامة',
        related_codes: [],
    },
    'G65': {
        how_to_remove: 'فقط المديرية العامة للهجرة تستطيع رفعه.',
        duration: 'غير محدد — بقرار المديرية العامة',
        related_codes: [],
    },
    'G66': {
        how_to_remove: 'فقط المديرية العامة للهجرة تستطيع رفعه.',
        duration: 'غير محدد — بقرار المديرية العامة',
        related_codes: [],
    },
    'G67': {
        how_to_remove: 'فقط المديرية العامة للهجرة تستطيع رفعه.',
        duration: 'غير محدد — بقرار المديرية العامة',
        related_codes: [],
    },
    'G78': {
        how_to_remove: 'فقط المديرية العامة للهجرة تستطيع رفعه.',
        duration: 'غير محدد — بقرار المديرية العامة',
        related_codes: [],
    },
    'G82': {
        how_to_remove: 'فقط المديرية العامة للهجرة تستطيع رفعه.',
        duration: 'غير محدد — بقرار المديرية العامة',
        related_codes: [],
    },
    'G87': {
        how_to_remove: 'فقط المديرية العامة للهجرة تستطيع رفعه. يمكن السماح بدخول مؤقت بتعليمات خطية خاصة.',
        duration: 'غير محدد — بقرار المديرية العامة',
        related_codes: [],
    },
    'G89': {
        how_to_remove: 'فقط المديرية العامة للهجرة تستطيع رفعه.',
        duration: 'غير محدد — بقرار المديرية العامة',
        related_codes: [],
    },
    'G99': {
        how_to_remove: 'فقط المديرية العامة للهجرة تستطيع رفعه.',
        duration: 'غير محدد — بقرار المديرية العامة',
        related_codes: [],
    },
    'G208': {
        how_to_remove: 'فقط المديرية العامة للهجرة تستطيع رفعه.',
        duration: 'غير محدد — بقرار المديرية العامة',
        related_codes: [],
    },

    // ========== N CODES (Prior Authorization + Administrative Fines) ==========

    // EK-3: Crime-type prior authorization codes
    'N26': {
        how_to_remove: 'الحصول على فيزا خاصة (Özel Meşruhatlı Vize) من القنصلية بعد الاستيذان من المديرية العامة. الكود يبقى لكن يُسمح بالدخول.',
        duration: 'غير محدد',
        related_codes: ['G26'],
    },
    'N34': {
        how_to_remove: 'الحصول على فيزا خاصة من القنصلية بعد الاستيذان من المديرية العامة.',
        duration: 'غير محدد',
        related_codes: ['G34'],
    },
    'N42': {
        how_to_remove: 'الحصول على فيزا خاصة من القنصلية بعد الاستيذان من المديرية العامة.',
        duration: 'غير محدد',
        related_codes: ['G42'],
    },
    'N43': {
        how_to_remove: 'الحصول على فيزا خاصة من القنصلية بعد الاستيذان من المديرية العامة.',
        duration: 'غير محدد',
        related_codes: ['G43'],
    },
    'N48': {
        how_to_remove: 'الحصول على فيزا خاصة من القنصلية بعد الاستيذان من المديرية العامة.',
        duration: 'غير محدد',
        related_codes: ['G48'],
    },
    'N58': {
        how_to_remove: 'الحصول على فيزا خاصة من القنصلية بعد الاستيذان من المديرية العامة.',
        duration: 'غير محدد',
        related_codes: ['G58'],
    },
    'N64': {
        how_to_remove: 'الحصول على فيزا خاصة من القنصلية بعد الاستيذان من المديرية العامة.',
        duration: 'غير محدد',
        related_codes: ['G64'],
    },
    'N65': {
        how_to_remove: 'الحصول على فيزا خاصة من القنصلية بعد الاستيذان من المديرية العامة.',
        duration: 'غير محدد',
        related_codes: ['G65'],
    },
    'N66': {
        how_to_remove: 'الحصول على فيزا خاصة من القنصلية بعد الاستيذان من المديرية العامة.',
        duration: 'غير محدد',
        related_codes: ['G66'],
    },
    'N67': {
        how_to_remove: 'الحصول على فيزا خاصة من القنصلية بعد الاستيذان من المديرية العامة.',
        duration: 'غير محدد',
        related_codes: ['G67'],
    },
    'N78': {
        how_to_remove: 'الحصول على فيزا خاصة من القنصلية بعد الاستيذان من المديرية العامة.',
        duration: 'غير محدد',
        related_codes: ['G78'],
    },
    'N82': {
        how_to_remove: 'الحصول على فيزا خاصة من القنصلية بعد الاستيذان من المديرية العامة.',
        duration: 'غير محدد',
        related_codes: ['G82'],
    },
    'N87': {
        how_to_remove: 'الحصول على فيزا خاصة من القنصلية بعد الاستيذان من المديرية العامة.',
        duration: 'غير محدد',
        related_codes: ['G87'],
    },
    'N98': {
        how_to_remove: 'يتعلق بضحايا الاتجار بالبشر. يُدار من المديرية العامة.',
        duration: 'غير محدد',
        related_codes: [],
    },
    'N99': {
        how_to_remove: 'الحصول على فيزا خاصة من القنصلية بعد الاستيذان من المديرية العامة.',
        duration: 'غير محدد',
        related_codes: ['G99'],
    },
    'N137': {
        how_to_remove: 'مراجعة المديرية المحلية للهجرة.',
        duration: 'غير محدد',
        related_codes: ['V-137'],
    },

    // EK-4: Administrative fine codes
    'N95': {
        how_to_remove: 'دفع الغرامة. يُرفع تلقائياً عند الدفع في بوابة الحدود أو عبر المديرية المحلية.',
        duration: 'حتى دفع الغرامة',
        related_codes: [],
    },
    'N96': {
        how_to_remove: 'دفع غرامة عدم المغادرة خلال المهلة المحددة. يُرفع عند الدفع.',
        duration: 'حتى دفع الغرامة',
        related_codes: ['V-137'],
    },
    'N97': {
        how_to_remove: 'دفع غرامة عدم الإبلاغ عن تغيير العنوان. يُرفع عند الدفع ويُرفع معه V-71.',
        duration: 'حتى دفع الغرامة',
        related_codes: ['V-71'],
    },
    'N119': {
        how_to_remove: 'دفع غرامة العمل بدون إذن عمل. يُرفع عند الدفع.',
        duration: 'حتى دفع الغرامة',
        related_codes: ['Ç117'],
    },
    'N120': {
        how_to_remove: 'دفع غرامة تجاوز الفيزا/الإقامة/إذن العمل. يُرفع تلقائياً عند الدفع في بوابة الحدود.',
        duration: 'حتى دفع الغرامة',
        related_codes: ['V-69', 'V-84', 'V-88'],
    },
    'N135': {
        how_to_remove: 'دفع غرامة الدخول/الخروج غير القانوني.',
        duration: 'حتى دفع الغرامة',
        related_codes: ['Ç113'],
    },
    'N136': {
        how_to_remove: 'سداد نفقات السفر/الترحيل المترتبة على الدولة.',
        duration: 'حتى السداد',
        related_codes: [],
    },
    'N168': {
        how_to_remove: 'دفع الغرامة المترتبة على مخالفة البند (ç) من المادة 102.',
        duration: 'حتى دفع الغرامة',
        related_codes: ['V-160'],
    },
    'N169': {
        how_to_remove: 'دفع غرامة عدم الالتزام بالتعليمات الإدارية المحددة من الوزارة.',
        duration: 'حتى دفع الغرامة',
        related_codes: ['V-165', 'V-173'],
    },
    'N170': {
        how_to_remove: 'دفع الغرامة المترتبة. ملاحظة: إذا أُدخل الكود والأجنبي خارج تركيا فلا يؤثر على وضعه.',
        duration: 'حتى دفع الغرامة',
        related_codes: [],
    },
    'N171': {
        how_to_remove: 'دفع الغرامة المترتبة على عدم الالتزام بالتدابير البديلة للاحتجاز الإداري.',
        duration: 'حتى دفع الغرامة',
        related_codes: ['V-144', 'V-160'],
    },
    'N172': {
        how_to_remove: 'سداد نفقات السفر المتعلقة بالعودة الطوعية.',
        duration: 'حتى السداد',
        related_codes: ['V-145'],
    },

    // ========== O CODES (Administrative Tracking - Asylum) ==========

    'O100': {
        how_to_remove: 'انتهاء المدة المحددة (سنة واحدة). يمكن التقدم بطلب حماية دولية جديد.',
        duration: 'سنة واحدة',
        related_codes: [],
    },
    'O176': {
        how_to_remove: 'انتهاء المدة المحددة (3 سنوات). يمكن التقدم بطلب حماية دولية جديد.',
        duration: '3 سنوات',
        related_codes: [],
    },
    'O177': {
        how_to_remove: 'انتهاء المدة المحددة (5 سنوات). يمكن التقدم بطلب حماية دولية جديد.',
        duration: '5 سنوات',
        related_codes: [],
    },
    'O199': {
        how_to_remove: 'مراجعة المديرية العامة للهجرة.',
        duration: 'غير محدد',
        related_codes: [],
    },

    // ========== V CODES (Administrative Tracking) ==========

    'V68': {
        how_to_remove: 'مراجعة المديرية المحلية (İl Müdürlüğü). تُفحص الملفات الأرشيفية — إذا لم يُعثر على مشكلة أمنية غير الزواج الصوري، يُرفع V-68 ويُضاف V-70. عند تقديم طلب إقامة، تُقيّم الحالة من جديد.',
        duration: 'غير محدد — حتى المراجعة',
        related_codes: ['V-70'],
    },
    'V69': {
        how_to_remove: 'عند المغادرة: تُسلّم وثيقة الإقامة لشرطة الحدود ويُرفع الكود. عند تجاوز المدة: تُحسب غرامة Ç حسب مدة التجاوز + N-120 لغير الدافعين. عند طلب إقامة جديدة: يُرفع من المديرية المحلية.',
        duration: 'حتى المغادرة أو التسوية',
        related_codes: ['N-120'],
    },
    'V70': {
        how_to_remove: 'إذا أثبت التحقيق أن الزواج حقيقي وهادف لتأسيس أسرة، يُرفع الكود. عند المغادرة: يُعامل حسب القواعد العامة.',
        duration: 'حتى إثبات صحة الزواج',
        related_codes: ['V-68'],
    },
    'V71': {
        how_to_remove: 'دفع غرامة عدم الإبلاغ عن تغيير العنوان (N-97). بعد الدفع يُرفع V-71 و N-97 معاً ويُعالج طلب الإقامة.',
        duration: 'حتى دفع الغرامة',
        related_codes: ['N-97'],
    },
    'V74': {
        how_to_remove: 'يُضاف بعد تسجيل طلب الخروج. يُدار من المديرية المحلية والوزارة/الولاية.',
        duration: 'غير محدد',
        related_codes: [],
    },
    'V77': {
        how_to_remove: 'مراجعة المديرية المحلية للهجرة.',
        duration: 'غير محدد',
        related_codes: [],
    },
    'V84': {
        how_to_remove: 'التقدم بطلب إقامة خلال 10 أيام من الدخول المشروط. عند الحصول على الإقامة يُرفع الكود. إذا لم يُتقدم: يُبلّغ بالمغادرة ويُستبدل بـ V-157.',
        duration: '10 أيام من الدخول',
        related_codes: ['V-157', 'N-120'],
    },
    'V87': {
        how_to_remove: 'عند الرغبة بالعودة لتركيا: تُقدّم مراجعة للمديرية المحلية التي يتواجد فيها الشخص وتُقيّم الحالة. يُرفع بقرار المديرية المحلية.',
        duration: 'غير محدد',
        related_codes: [],
    },
    'V88': {
        how_to_remove: 'عند المغادرة: تُسلّم وثيقة العمل لشرطة الحدود ويُرفع الكود. عند تجاوز المدة: تُحسب غرامة Ç + N-120. عند طلب إقامة/عمل جديد: يُرفع من المديرية.',
        duration: 'حتى المغادرة أو التسوية',
        related_codes: ['N-120'],
    },
    'V89': {
        how_to_remove: 'يُدار من المديرية المحلية في المحافظة التي تم استلام الشخص فيها.',
        duration: 'غير محدد',
        related_codes: [],
    },
    'V91': {
        how_to_remove: 'الحصول على إذن خروج من المديرية المحلية للمشمولين بالحماية المؤقتة.',
        duration: 'مستمر — يتطلب إذن',
        related_codes: [],
    },
    'V92': {
        how_to_remove: 'تصحيح التسجيل المكرر من قبل المديرية المحلية.',
        duration: 'حتى التصحيح',
        related_codes: [],
    },
    'V137': {
        how_to_remove: 'المغادرة خلال المهلة المحددة + دفع الغرامة. يُرفع تلقائياً من شرطة الحدود عند الخروج. في حال تجاوز المهلة: يُضاف N-96 + كود Ç حسب مدة التجاوز.',
        duration: 'حسب المهلة الممنوحة',
        related_codes: ['N-96', 'N-120', 'Ç101', 'Ç102', 'Ç103', 'Ç104', 'Ç105'],
    },
    'V144': {
        how_to_remove: 'الالتزام بالتدابير البديلة للاحتجاز الإداري (المادة 57/A). عند عدم الالتزام أو الهروب: يُضاف V-160 + N-171. عند الخروج الطوعي: يُرفع من شرطة الحدود.',
        duration: 'حسب قرار المحكمة',
        related_codes: ['V-160', 'N-171'],
    },
    'V145': {
        how_to_remove: 'يُضاف عند إتمام إجراءات العودة الطوعية. يُدار من المديرية المحلية.',
        duration: 'دائم — سجل',
        related_codes: ['N-172'],
    },
    'V146': {
        how_to_remove: 'يُوضع من المديرية المحلية أو العامة. عند الوصول للحدود: يتم التواصل مع الجهة الأمنية المذكورة في الملاحظات.',
        duration: 'غير محدد',
        related_codes: ['V-147'],
    },
    'V147': {
        how_to_remove: 'مثل V-146. يتم التواصل مع الجهة الأمنية المذكورة في ملاحظات الكود.',
        duration: 'غير محدد',
        related_codes: ['V-146'],
    },
    'V148': {
        how_to_remove: 'مراجعة المديرية المحلية عند مغادرة مركز الإيواء المؤقت.',
        duration: 'مدة الإقامة في المركز',
        related_codes: [],
    },
    'V153': {
        how_to_remove: 'يُرفع بقرار من المديرية العامة بعد انتهاء قرار المحكمة الدستورية.',
        duration: 'حسب قرار المحكمة',
        related_codes: [],
    },
    'V154': {
        how_to_remove: 'يوقف الترحيل مؤقتاً. يُرفع عند صدور حكم نهائي من المحكمة الإدارية.',
        duration: 'حتى الحكم النهائي',
        related_codes: [],
    },
    'V155': {
        how_to_remove: 'يُرفع بقرار من المديرية العامة بعد انتهاء قرار المحكمة الأوروبية لحقوق الإنسان.',
        duration: 'حسب قرار المحكمة',
        related_codes: [],
    },
    'V156': {
        how_to_remove: 'سداد أتعاب المحاماة المترتبة.',
        duration: 'حتى السداد',
        related_codes: [],
    },
    'V157': {
        how_to_remove: 'لا يمنع الدخول والخروج — عند المغادرة يُرفع تلقائياً. إذا لم يغادر خلال 10 أيام: يُضاف كود Ç حسب المدة + N-120 لغير الدافعين.',
        duration: '10 أيام',
        related_codes: ['N-120'],
    },
    'V158': {
        how_to_remove: 'عند الرغبة بالدخول: يُعامل كـ"يولكو غير مقبول" ويُوجّه للحصول على فيزا.',
        duration: 'غير محدد',
        related_codes: [],
    },
    'V159': {
        how_to_remove: 'يُضاف من شرطة الحدود لمن يدخل تركيا بغرض العبور لدولة ثالثة.',
        duration: 'مؤقت — لحين العبور',
        related_codes: [],
    },
    'V160': {
        how_to_remove: 'يُرفع عند القبض على الشخص أو حضوره طوعاً. إذا صدر قرار ترحيل بموجب المادة 54(i): يُرفع من المديرية المنفّذة.',
        duration: 'حتى العثور على الشخص',
        related_codes: ['N-168', 'N-171'],
    },
    'V161': {
        how_to_remove: 'يُرفع بقرار من المديرية العامة بعد انتهاء قرار المحكمة الدستورية.',
        duration: 'حسب قرار المحكمة',
        related_codes: [],
    },
    'V162': {
        how_to_remove: 'عند الخروج الطوعي: يُرفع من شرطة الحدود ويُعامل حسب القواعد العامة. عند ظهور سبب جديد لاحتجاز إداري: يُرفع ويُصدر قرار جديد.',
        duration: 'حتى المغادرة أو قرار جديد',
        related_codes: [],
    },
    'V163': {
        how_to_remove: 'يُضاف من شرطة الحدود للفحص التفصيلي. بعد إتمام الفحص: يُرفع أو يُتخذ إجراء مناسب.',
        duration: 'مؤقت — لحين الفحص',
        related_codes: ['Ç166'],
    },
    'V164': {
        how_to_remove: 'يُرفع بعد إتمام الترحيل الفعلي من قبل المديرية المحلية المنفّذة.',
        duration: 'دائم — سجل ترحيل',
        related_codes: [],
    },
    'V165': {
        how_to_remove: 'يُعامل حسب المادة 8 من نظام الحماية المؤقتة. غرامة إدارية لغير الدافعين تُسجّل كـ N-169.',
        duration: 'غير محدد',
        related_codes: ['N-169'],
    },
    'V173': {
        how_to_remove: 'التسجيل للحماية المؤقتة أو المغادرة قبل انتهاء فترة الإذن المؤقت. عند عدم المغادرة أو عدم التسجيل: يُضاف N-169.',
        duration: 'مدة الإذن المؤقت',
        related_codes: ['N-169'],
    },
    'V174': {
        how_to_remove: 'المغادرة بعد انتهاء العلاج. عند الترحيل: يُعامل حسب الإجراءات القانونية.',
        duration: 'مدة العلاج',
        related_codes: [],
    },
    'V175': {
        how_to_remove: 'للمشمولين بالحماية المؤقتة الراغبين بالدخول والخروج من/إلى سوريا. يُدار من شرطة الحدود.',
        duration: 'مستمر',
        related_codes: [],
    },
    'V177': {
        how_to_remove: 'مراجعة المديرية العامة للهجرة.',
        duration: 'غير محدد',
        related_codes: [],
    },
    'V181': {
        how_to_remove: 'مراجعة المديرية المحلية للهجرة.',
        duration: 'غير محدد',
        related_codes: ['V-145'],
    },
    'V198': {
        how_to_remove: 'مراجعة المديرية المحلية للهجرة.',
        duration: 'غير محدد',
        related_codes: [],
    },
    'V210': {
        how_to_remove: 'مراجعة المديرية العامة للهجرة.',
        duration: 'مؤقت',
        related_codes: [],
    },
    'V215': {
        how_to_remove: 'مراجعة المديرية المحلية أو العامة للهجرة.',
        duration: 'غير محدد',
        related_codes: [],
    },
    'V224': {
        how_to_remove: 'مراجعة وزارة العمل أو المديرية المحلية.',
        duration: 'غير محدد',
        related_codes: [],
    },
    'V228': {
        how_to_remove: 'لا يمكن التراجع عادةً. يُسجّل كحالة سحب طوعي لطلب الحماية.',
        duration: 'دائم — سجل',
        related_codes: [],
    },

    // ========== Other ==========

    'A99': {
        how_to_remove: 'مراجعة المحكمة المختصة.',
        duration: 'حسب قرار المحكمة',
        related_codes: [],
    },
    'K113': {
        how_to_remove: 'مراجعة الجهات الأمنية المختصة.',
        duration: 'غير محدد',
        related_codes: [],
    },
};

async function populate() {
    console.log('Populating security codes with detailed data...');
    console.log(`Total codes to update: ${Object.keys(codeData).length}`);

    let success = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const [code, details] of Object.entries(codeData)) {
        const { error } = await supabase
            .from('security_codes')
            .update({
                how_to_remove: details.how_to_remove,
                duration: details.duration,
                related_codes: details.related_codes.length > 0 ? details.related_codes : null,
            })
            .eq('code', code);

        if (error) {
            failed++;
            errors.push(`${code}: ${error.message}`);
        } else {
            success++;
        }
    }

    console.log(`\nResults:`);
    console.log(`  ✅ Updated: ${success}`);
    console.log(`  ❌ Failed: ${failed}`);

    if (errors.length > 0) {
        console.log(`\nErrors:`);
        errors.forEach(e => console.log(`  ${e}`));
    }

    // Verify a sample
    const { data: sample } = await supabase
        .from('security_codes')
        .select('code, how_to_remove, duration, related_codes')
        .in('code', ['Ç101', 'V137', 'N120', 'G87'])
        .limit(4);

    if (sample) {
        console.log('\nSample verification:');
        sample.forEach(s => {
            console.log(`  ${s.code}: how_to_remove=${s.how_to_remove?.slice(0, 50)}... | duration=${s.duration} | related=${s.related_codes?.join(', ') || 'none'}`);
        });
    }
}

populate();
