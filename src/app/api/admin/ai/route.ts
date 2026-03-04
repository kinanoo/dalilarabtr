import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { NextResponse, type NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { GoogleGenerativeAI, SchemaType, type FunctionDeclarationsTool } from '@google/generative-ai';

// ── Table mapping (mirrors adminSearch.ts) ──
const TABLE_MAP: Record<string, string> = {
  article: 'articles',
  service: 'service_providers',
  faq: 'faqs',
  code: 'security_codes',
  zone: 'zones',
  update: 'updates',
  banner: 'site_banners',
  scenario: 'consultant_scenarios',
};

const PK_MAP: Record<string, string> = {
  security_codes: 'code',
};

function pk(table: string) { return PK_MAP[table] || 'id'; }

// ── Arabic search normalizer (same as adminSearch.ts) ──
function normalizeForSearch(term: string): string {
  return term
    .replace(/[اأإآ]/g, '_')
    .replace(/[ةه]/g, '_')
    .replace(/[يى]/g, '_');
}

// ── Categories & Tags (from config.ts) ──
const CATEGORY_SLUGS: Record<string, string> = {
  residence: 'أنواع الإقامات',
  kimlik: 'الكملك والحماية المؤقتة',
  visa: 'الفيزا والتأشيرات',
  syrians: 'خدمات السوريين',
  housing: 'السكن والحياة',
  work: 'العمل والاستثمار',
  education: 'الدراسة والتعليم',
  health: 'الصحة والتأمين',
  official: 'معاملات رسمية',
  edevlet: 'خدمات e-Devlet',
  traffic: 'المرور والسيارات',
};

const TAG_LABELS: Record<string, string> = {
  kizilay: 'بطاقة الهلال الأحمر',
  consulate: 'خدمات القنصلية',
  children: 'المواليد والأطفال',
  'travel-permit': 'تصاريح السفر',
  citizenship: 'التجنيس',
  renewal: 'تجديد',
  'driving-license': 'رخصة القيادة',
  fines: 'المخالفات',
  car: 'تسجيل سيارة',
  'family-reunion': 'لمّ الشمل',
  spouse: 'إقامة عائلية',
  'work-permit': 'إذن العمل',
  insurance: 'التأمين',
  schools: 'المدارس',
  scholarships: 'المنح الدراسية',
  'medical-tourism': 'السياحة العلاجية',
  'legal-trouble': 'مشاكل قانونية',
  'lost-docs': 'فقدان الوثائق',
  company: 'الشركات',
};

const CATEGORIES_TEXT = Object.entries(CATEGORY_SLUGS).map(([k, v]) => `${k}: ${v}`).join('\n');
const TAGS_TEXT = Object.entries(TAG_LABELS).map(([k, v]) => `${k}: ${v}`).join('\n');

// ── Content type enum (reused across tools) ──
const CONTENT_TYPES = ['article', 'service', 'faq', 'update', 'scenario', 'code', 'zone', 'banner'];

// ── Gemini tools ──
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const contentTypeSchema: any = {
  type: SchemaType.STRING,
  format: 'enum',
  enum: CONTENT_TYPES,
};

const tools: FunctionDeclarationsTool[] = [{
  functionDeclarations: [
    {
      name: 'search_content',
      description: 'بحث في محتوى الموقع (مقالات، خدمات، أخبار، أسئلة شائعة، سيناريوهات، أكواد، مناطق، بانرات)',
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          query: { type: SchemaType.STRING, description: 'كلمة البحث' },
          content_type: { ...contentTypeSchema, description: 'نوع المحتوى (اختياري — إذا لم يحدد يبحث في الكل)' },
        },
        required: ['query'],
      },
    },
    {
      name: 'get_content_details',
      description: 'جلب تفاصيل عنصر واحد بالكامل عبر الـ id',
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          id: { type: SchemaType.STRING, description: 'معرف العنصر' },
          content_type: contentTypeSchema,
        },
        required: ['id', 'content_type'],
      },
    },
    {
      name: 'delete_content',
      description: 'حذف عنصر من قاعدة البيانات. يجب أن تطلب التأكيد من المستخدم أولاً قبل استخدام هذه الأداة.',
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          id: { type: SchemaType.STRING, description: 'معرف العنصر المراد حذفه' },
          content_type: contentTypeSchema,
        },
        required: ['id', 'content_type'],
      },
    },
    {
      name: 'update_content',
      description: 'تعديل حقول عنصر موجود في قاعدة البيانات',
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          id: { type: SchemaType.STRING, description: 'معرف العنصر' },
          content_type: contentTypeSchema,
          fields: {
            type: SchemaType.OBJECT,
            description: 'الحقول المراد تعديلها مع قيمها الجديدة (مثل {title: "عنوان جديد", intro: "مقدمة جديدة"})',
            properties: {},
          },
        },
        required: ['id', 'content_type', 'fields'],
      },
    },
    {
      name: 'toggle_status',
      description: 'نشر أو إيقاف نشر عنصر (تغيير الحالة)',
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          id: { type: SchemaType.STRING, description: 'معرف العنصر' },
          content_type: contentTypeSchema,
          action: {
            type: SchemaType.STRING,
            format: 'enum',
            enum: ['publish', 'unpublish'],
            description: 'publish للنشر، unpublish للإيقاف',
          } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
        },
        required: ['id', 'content_type', 'action'],
      },
    },
    {
      name: 'create_article',
      description: 'إنشاء مقال جديد في الموقع',
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          title: { type: SchemaType.STRING, description: 'عنوان المقال' },
          category: { type: SchemaType.STRING, description: 'القسم بالعربي (مثل: أنواع الإقامات، الصحة والتأمين)' },
          intro: { type: SchemaType.STRING, description: 'مقدمة قصيرة 1-2 جملة' },
          details: { type: SchemaType.STRING, description: 'تفاصيل المقال (HTML)' },
          steps: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING }, description: 'خطوات' },
          documents: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING }, description: 'وثائق مطلوبة' },
          tips: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING }, description: 'نصائح' },
          tags: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING }, description: 'تاقات (مثل: citizenship, work-permit)' },
          warning: { type: SchemaType.STRING, description: 'تحذير (إن وجد)' },
        },
        required: ['title', 'category', 'intro'],
      },
    },
    {
      name: 'create_update',
      description: 'إنشاء خبر/تحديث جديد',
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          title: { type: SchemaType.STRING, description: 'عنوان الخبر' },
          content: { type: SchemaType.STRING, description: 'محتوى الخبر' },
          type: { type: SchemaType.STRING, description: 'نوع الخبر (خبر، تحذير، تحديث)' },
        },
        required: ['title', 'content'],
      },
    },
    {
      name: 'create_service',
      description: 'إنشاء مزود خدمة جديد',
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          name: { type: SchemaType.STRING, description: 'اسم مقدم الخدمة' },
          profession: { type: SchemaType.STRING, description: 'المهنة' },
          category: { type: SchemaType.STRING, description: 'تصنيف الخدمة' },
          city: { type: SchemaType.STRING, description: 'المدينة' },
          district: { type: SchemaType.STRING, description: 'المنطقة' },
          phone: { type: SchemaType.STRING, description: 'رقم الهاتف' },
          description: { type: SchemaType.STRING, description: 'وصف الخدمة' },
        },
        required: ['name', 'profession'],
      },
    },
    {
      name: 'count_content',
      description: 'عدّ عناصر في جدول معين مع فلاتر اختيارية',
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          content_type: contentTypeSchema,
          filters: {
            type: SchemaType.OBJECT,
            description: 'فلاتر اختيارية (مثل { category: "الصحة والتأمين", status: "approved" })',
            properties: {},
          },
        },
        required: ['content_type'],
      },
    },
  ],
}];

// ── System prompt ──
const SYSTEM_PROMPT = `أنت المساعد الذكي للوحة تحكم موقع "دليل العرب والسوريين في تركيا" (dalilarabtr.com).
مهمتك تنفيذ أوامر الأدمن على قاعدة البيانات بدقة وسرعة.

القواعد المهمة:
1. دائماً رد بالعربية الفصحى البسيطة
2. قبل أي حذف: ابحث أولاً → اعرض النتائج → اطلب التأكيد → ثم احذف
3. عند إنشاء مقال: اختر القسم (category) والتاقات (tags) المناسبة تلقائياً من القوائم أدناه
4. إذا وجدت أكثر من نتيجة بحث، اعرضها كلها واسأل أيها المطلوب
5. كن مختصراً ومباشراً — لا حشو
6. عند البحث، استخدم كلمات مفتاحية قصيرة ودقيقة
7. لا تنسَ أن slug يتولد تلقائياً عند الإنشاء

الأقسام المتاحة (CATEGORY_SLUGS — slug: اسم عربي):
${CATEGORIES_TEXT}

التاقات المتاحة (TAG_LABELS — slug: اسم عربي):
${TAGS_TEXT}

أنواع المحتوى:
- article: مقالات ودلائل (جدول articles)
- service: مزودي خدمات (جدول service_providers)
- faq: أسئلة شائعة (جدول faqs)
- update: أخبار وتحديثات (جدول updates)
- scenario: سيناريوهات المستشار (جدول consultant_scenarios)
- code: أكواد أمنية (جدول security_codes)
- zone: مناطق محظورة (جدول zones)
- banner: بانرات وتنبيهات (جدول site_banners)

حالة المقالات: approved (منشور) / draft (مسودة) / pending (بانتظار المراجعة) / rejected (مرفوض)
حالة الخدمات: approved + is_verified=true (منشور) / draft (مسودة)
باقي الأنواع: active=true (مفعّل) / active=false (معطّل)`;

// ── Tool execution functions ──
// serviceClient typed as any because we use dynamic table names
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function executeFunction(
  name: string,
  args: Record<string, any>,
  serviceClient: any
): Promise<{ result: any; action?: any }> {
  switch (name) {
    case 'search_content': {
      const { query, content_type } = args;
      const sqlTerm = `%${normalizeForSearch(query)}%`;
      const results: any[] = [];

      const searchTable = async (type: string, table: string, searchFields: string[], selectFields: string) => {
        const orFilter = searchFields.map(f => `${f}.ilike.${sqlTerm}`).join(',');
        const { data } = await serviceClient.from(table).select(selectFields).or(orFilter).limit(10);
        return (data || []).map((item: any) => ({ ...item, _type: type, _table: table }));
      };

      const searches: Record<string, () => Promise<any[]>> = {
        article: () => searchTable('article', 'articles', ['title', 'intro', 'details'], 'id, slug, title, intro, category, status'),
        service: () => searchTable('service', 'service_providers', ['name', 'description', 'profession'], 'id, name, profession, city, phone, status'),
        faq: () => searchTable('faq', 'faqs', ['question', 'answer'], 'id, question, category, active'),
        update: () => searchTable('update', 'updates', ['title', 'content'], 'id, title, type, active'),
        scenario: () => searchTable('scenario', 'consultant_scenarios', ['title', 'description'], 'id, title, category, is_active'),
        code: () => searchTable('code', 'security_codes', ['code', 'title', 'description'], 'code, title, severity, active'),
        zone: () => searchTable('zone', 'zones', ['city', 'district', 'neighborhood'], 'id, city, district, neighborhood, status'),
        banner: () => searchTable('banner', 'site_banners', ['content', 'link_text'], 'id, content, type, is_active'),
      };

      if (content_type && searches[content_type]) {
        results.push(...await searches[content_type]());
      } else {
        const all = await Promise.all(Object.values(searches).map(fn => fn()));
        all.forEach(r => results.push(...r));
      }

      return { result: { count: results.length, items: results.slice(0, 15) } };
    }

    case 'get_content_details': {
      const { id, content_type } = args;
      const table = TABLE_MAP[content_type];
      if (!table) return { result: { error: 'نوع محتوى غير صالح' } };

      const pkField = pk(table);
      const { data, error } = await serviceClient.from(table).select('*').eq(pkField, id).single();
      if (error) return { result: { error: `لم يتم العثور على العنصر: ${error.message}` } };
      return { result: data };
    }

    case 'delete_content': {
      const { id, content_type } = args;
      const table = TABLE_MAP[content_type];
      if (!table) return { result: { error: 'نوع محتوى غير صالح' } };

      const pkField = pk(table);

      // First fetch the item to show what will be deleted
      const { data: item } = await serviceClient.from(table).select('*').eq(pkField, id).single();
      if (!item) return { result: { error: 'العنصر غير موجود' } };

      // Return confirmation action
      const rec = item as Record<string, any>;
      const title = rec.title || rec.name || rec.question || rec.content || rec.code || id;
      return {
        result: { message: `سيتم حذف: "${title}"`, item },
        action: {
          id: `del-${Date.now()}`,
          type: 'delete',
          contentType: content_type,
          contentId: id,
          table,
          summary: `حذف ${content_type}: ${title}`,
        },
      };
    }

    case 'update_content': {
      const { id, content_type, fields } = args;
      const table = TABLE_MAP[content_type];
      if (!table) return { result: { error: 'نوع محتوى غير صالح' } };

      const pkField = pk(table);
      const { data, error } = await serviceClient.from(table).update(fields).eq(pkField, id).select().single();
      if (error) return { result: { error: `فشل التعديل: ${error.message}` } };
      return { result: { message: 'تم التعديل بنجاح', updated: data } };
    }

    case 'toggle_status': {
      const { id, content_type, action } = args;
      const table = TABLE_MAP[content_type];
      if (!table) return { result: { error: 'نوع محتوى غير صالح' } };

      const pkField = pk(table);
      let updateFields: Record<string, any>;

      if (content_type === 'article') {
        updateFields = { status: action === 'publish' ? 'approved' : 'draft' };
      } else if (content_type === 'service') {
        updateFields = action === 'publish'
          ? { status: 'approved', is_verified: true }
          : { status: 'draft', is_verified: false };
      } else {
        const activeField = content_type === 'banner' ? 'is_active' : 'active';
        updateFields = { [activeField]: action === 'publish' };
        if (content_type === 'scenario') {
          updateFields = { is_active: action === 'publish' };
        }
      }

      const { error } = await serviceClient.from(table).update(updateFields).eq(pkField, id);
      if (error) return { result: { error: `فشل تغيير الحالة: ${error.message}` } };
      return { result: { message: action === 'publish' ? 'تم النشر بنجاح' : 'تم إيقاف النشر' } };
    }

    case 'create_article': {
      const { title, category, intro, details, steps, documents, tips, tags, warning } = args;
      const slug = title
        .replace(/[\s—–]+/g, '-')
        .replace(/[^\u0600-\u06FFa-zA-Z0-9\-]/g, '')
        .substring(0, 80)
        .toLowerCase() || `article-${Date.now()}`;

      const id = `${slug}-${Date.now().toString(36)}`;

      const { data, error } = await serviceClient.from('articles').insert({
        id,
        slug,
        title,
        category,
        intro,
        details: details || null,
        steps: steps || [],
        documents: documents || [],
        tips: tips || [],
        tags: tags || [],
        warning: warning || null,
        status: 'approved',
        last_update: new Date().toISOString().split('T')[0],
        created_at: new Date().toISOString(),
      }).select().single();

      if (error) return { result: { error: `فشل الإنشاء: ${error.message}` } };
      return { result: { message: 'تم إنشاء المقال بنجاح', article: data } };
    }

    case 'create_update': {
      const { title, content, type } = args;
      const { data, error } = await serviceClient.from('updates').insert({
        title,
        content,
        type: type || 'خبر',
        date: new Date().toISOString().split('T')[0],
        active: true,
      }).select().single();

      if (error) return { result: { error: `فشل الإنشاء: ${error.message}` } };
      return { result: { message: 'تم إنشاء الخبر بنجاح', update: data } };
    }

    case 'create_service': {
      const { name, profession, category, city, district, phone, description } = args;
      const { data, error } = await serviceClient.from('service_providers').insert({
        name,
        profession,
        category: category || null,
        city: city || null,
        district: district || null,
        phone: phone || null,
        description: description || null,
        status: 'approved',
        is_verified: true,
      }).select().single();

      if (error) return { result: { error: `فشل الإنشاء: ${error.message}` } };
      return { result: { message: 'تم إنشاء مزود الخدمة بنجاح', service: data } };
    }

    case 'count_content': {
      const { content_type, filters } = args;
      const table = TABLE_MAP[content_type];
      if (!table) return { result: { error: 'نوع محتوى غير صالح' } };

      let query = serviceClient.from(table).select('*', { count: 'exact', head: true });
      if (filters) {
        for (const [key, value] of Object.entries(filters)) {
          query = query.eq(key, value as string);
        }
      }

      const { count, error } = await query;
      if (error) return { result: { error: `فشل العدّ: ${error.message}` } };
      return { result: { count, content_type, filters } };
    }

    default:
      return { result: { error: 'دالة غير معروفة' } };
  }
}

// ── Main handler ──
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages, pendingAction } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'missing_messages' }, { status: 400 });
    }

    // ── Auth (same pattern as delete-record) ──
    const serviceClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const cookieStore = await cookies();
    const authClient = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll() {},
        },
      }
    );

    const { data: { user } } = await authClient.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }

    const { data: profile } = await serviceClient
      .from('member_profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }

    // ── Handle confirmed pending action ──
    if (pendingAction?.confirmed && pendingAction.table && pendingAction.contentId) {
      const pkField = pk(pendingAction.table);
      const { error } = await serviceClient
        .from(pendingAction.table)
        .delete()
        .eq(pkField, pendingAction.contentId);

      if (error) {
        return NextResponse.json({ reply: `فشل الحذف: ${error.message}` });
      }
      return NextResponse.json({ reply: `تم حذف "${pendingAction.summary}" بنجاح.` });
    }

    // ── Gemini API ──
    const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ reply: 'مفتاح Gemini API غير موجود. أضفه في GOOGLE_GEMINI_API_KEY.' });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      systemInstruction: SYSTEM_PROMPT,
      tools,
    });

    // Build chat history
    const history = messages.slice(0, -1).map((m: any) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    const chat = model.startChat({ history });
    const lastMessage = messages[messages.length - 1].content;

    // Send message and handle function calls
    let response = await chat.sendMessage(lastMessage);
    let result = response.response;
    let actionToReturn: any = null;

    // Loop to handle multiple function calls
    let maxIterations = 5;
    while (maxIterations-- > 0) {
      const candidate = result.candidates?.[0];
      const parts = candidate?.content?.parts || [];

      const functionCall = parts.find((p: any) => p.functionCall);
      if (!functionCall?.functionCall) break;

      const { name, args } = functionCall.functionCall;
      const { result: fnResult, action } = await executeFunction(name, args || {}, serviceClient);

      if (action) actionToReturn = action;

      // Send function result back to Gemini
      response = await chat.sendMessage([{
        functionResponse: {
          name,
          response: fnResult,
        },
      }]);
      result = response.response;
    }

    const replyText = result.text() || 'لم أتمكن من معالجة طلبك. حاول مرة أخرى.';

    return NextResponse.json({
      reply: replyText,
      ...(actionToReturn && { action: actionToReturn }),
    });

  } catch (error: any) {
    console.error('AI Assistant error:', error);
    return NextResponse.json({
      reply: `حدث خطأ: ${error.message || 'خطأ غير معروف'}. حاول مرة أخرى.`,
    });
  }
}
