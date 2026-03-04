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

// Build categories/tags text using ONLY ASCII to avoid ByteString crash
// Format: "slug (Arabic name)" but Arabic is encoded safely
const CATEGORIES_TEXT = Object.entries(CATEGORY_SLUGS).map(([k]) => k).join(', ');
const TAGS_TEXT = Object.entries(TAG_LABELS).map(([k]) => k).join(', ');

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
      description: 'Search website content across all tables (articles, services, FAQs, updates, scenarios, codes, zones, banners)',
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          query: { type: SchemaType.STRING, description: 'Search keyword (Arabic or English)' },
          content_type: { ...contentTypeSchema, description: 'Optional content type filter. If not specified, searches all types.' },
        },
        required: ['query'],
      },
    },
    {
      name: 'get_content_details',
      description: 'Get full details of a single item by its ID',
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          id: { type: SchemaType.STRING, description: 'Item ID' },
          content_type: contentTypeSchema,
        },
        required: ['id', 'content_type'],
      },
    },
    {
      name: 'delete_content',
      description: 'Delete an item from the database. Always search first and ask for confirmation before deleting.',
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          id: { type: SchemaType.STRING, description: 'ID of the item to delete' },
          content_type: contentTypeSchema,
        },
        required: ['id', 'content_type'],
      },
    },
    {
      name: 'update_content',
      description: 'Update specific fields of an existing item in the database',
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          id: { type: SchemaType.STRING, description: 'Item ID' },
          content_type: contentTypeSchema,
          fields: {
            type: SchemaType.OBJECT,
            description: 'Fields to update with new values, e.g. {title: "new title", intro: "new intro"}',
            properties: {},
          },
        },
        required: ['id', 'content_type', 'fields'],
      },
    },
    {
      name: 'toggle_status',
      description: 'Publish or unpublish an item (change its status)',
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          id: { type: SchemaType.STRING, description: 'Item ID' },
          content_type: contentTypeSchema,
          action: {
            type: SchemaType.STRING,
            format: 'enum',
            enum: ['publish', 'unpublish'],
            description: 'publish to make visible, unpublish to hide',
          } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
        },
        required: ['id', 'content_type', 'action'],
      },
    },
    {
      name: 'create_article',
      description: 'Create a new article on the website',
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          title: { type: SchemaType.STRING, description: 'Article title (in Arabic)' },
          category: { type: SchemaType.STRING, description: 'Category slug: residence, kimlik, visa, syrians, housing, work, education, health, official, edevlet, traffic' },
          intro: { type: SchemaType.STRING, description: 'Short intro, 1-2 sentences (in Arabic)' },
          details: { type: SchemaType.STRING, description: 'Article details in HTML (Arabic)' },
          steps: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING }, description: 'Steps array' },
          documents: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING }, description: 'Required documents array' },
          tips: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING }, description: 'Tips array' },
          tags: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING }, description: 'Tags array (e.g. citizenship, work-permit)' },
          warning: { type: SchemaType.STRING, description: 'Warning text if any' },
        },
        required: ['title', 'category', 'intro'],
      },
    },
    {
      name: 'create_update',
      description: 'Create a new news/update item',
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          title: { type: SchemaType.STRING, description: 'News title' },
          content: { type: SchemaType.STRING, description: 'News content' },
          type: { type: SchemaType.STRING, description: 'News type' },
        },
        required: ['title', 'content'],
      },
    },
    {
      name: 'create_service',
      description: 'Create a new service provider',
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          name: { type: SchemaType.STRING, description: 'Provider name' },
          profession: { type: SchemaType.STRING, description: 'Profession' },
          category: { type: SchemaType.STRING, description: 'Service category' },
          city: { type: SchemaType.STRING, description: 'City' },
          district: { type: SchemaType.STRING, description: 'District' },
          phone: { type: SchemaType.STRING, description: 'Phone number' },
          description: { type: SchemaType.STRING, description: 'Service description' },
        },
        required: ['name', 'profession'],
      },
    },
    {
      name: 'count_content',
      description: 'Count items in a table with optional filters',
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          content_type: contentTypeSchema,
          filters: {
            type: SchemaType.OBJECT,
            description: 'Optional filters as key-value pairs, e.g. {category: "...", status: "approved"}',
            properties: {},
          },
        },
        required: ['content_type'],
      },
    },
    {
      name: 'list_content',
      description: 'List/fetch recent items from a table. Use this to SHOW items to the admin. Returns actual data (titles, details). Use instead of count_content when admin wants to SEE items, not just count them.',
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          content_type: contentTypeSchema,
          limit: { type: SchemaType.NUMBER, description: 'Max items to return (default 10, max 20)' },
          filters: {
            type: SchemaType.OBJECT,
            description: 'Optional filters as key-value pairs',
            properties: {},
          },
          sort_field: { type: SchemaType.STRING, description: 'Field to sort by (default: created_at)' },
          sort_order: {
            type: SchemaType.STRING,
            format: 'enum',
            enum: ['asc', 'desc'],
            description: 'Sort ascending or descending (default: desc = newest first)',
          } as any,
        },
        required: ['content_type'],
      },
    },
  ],
}];

// ── System prompt (English to avoid ByteString encoding issues) ──
const SYSTEM_PROMPT = `You are the AI assistant for the admin panel of "dalilarabtr.com" - a guide for Arabs and Syrians in Turkey.
Your job is to execute admin commands on the database.

CRITICAL: Always respond in Arabic. The admin speaks Arabic only.

## MOST IMPORTANT RULES - TOOL USAGE:
- You MUST call tools/functions to get data. NEVER say "I need IDs" or "use search to find them". YOU must search.
- When admin asks to SHOW or LIST items: call list_content immediately. Do NOT call count_content first.
- When admin asks to FIND or SEARCH: call search_content immediately with a keyword.
- When admin asks HOW MANY / COUNT: call count_content.
- When admin says "yes" or confirms: execute the action immediately using the appropriate tool. Do NOT ask again.
- ALWAYS call at least one tool before responding. Never respond with just text if you can call a tool instead.
- After getting tool results, format the data nicely in Arabic and show it directly.
- NEVER ask the user to provide IDs, search terms, or other info that you can get yourself with tools.

## Action rules:
- Before DELETE: search first, show the item, ask confirmation. Then delete after admin confirms.
- When creating articles: auto-select category and tags from the available lists.
- If multiple results: show all with numbers and ask which one.
- Be concise. Show data in structured format.

## Category slugs (use these as category values):
${CATEGORIES_TEXT}

## Tag slugs (use these as tag values):
${TAGS_TEXT}

## Content types:
article, service, faq, update, scenario, code, zone, banner

## Status values:
Article: approved (published) / draft / pending / rejected
Service: approved + is_verified=true (published) / draft
Others: active=true or is_active=true (enabled) / false (disabled)`;

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

      // Map category slug to Arabic name if needed
      const categoryArabic = CATEGORY_SLUGS[category] || category;

      const { data, error } = await serviceClient.from('articles').insert({
        id,
        slug,
        title,
        category: categoryArabic,
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
      if (!table) return { result: { error: 'Invalid content type' } };

      let query = serviceClient.from(table).select('*', { count: 'exact', head: true });
      if (filters) {
        for (const [key, value] of Object.entries(filters)) {
          query = query.eq(key, value as string);
        }
      }

      const { count, error } = await query;
      if (error) return { result: { error: `Count failed: ${error.message}` } };
      return { result: { count, content_type, filters } };
    }

    case 'list_content': {
      const { content_type, limit: rawLimit, filters, sort_field, sort_order } = args;
      const table = TABLE_MAP[content_type];
      if (!table) return { result: { error: 'Invalid content type' } };

      const limit = Math.min(rawLimit || 10, 20);
      const sortBy = sort_field || 'created_at';
      const ascending = sort_order === 'asc';

      const selectMap: Record<string, string> = {
        articles: 'id, slug, title, intro, category, status, created_at, last_update',
        service_providers: 'id, name, profession, city, phone, status, created_at',
        faqs: 'id, question, answer, category, active',
        updates: 'id, title, content, type, date, active',
        consultant_scenarios: 'id, title, description, category, is_active',
        security_codes: 'code, title, description, severity, active',
        zones: 'id, city, district, neighborhood, status',
        site_banners: 'id, content, type, is_active',
      };

      let query = serviceClient
        .from(table)
        .select(selectMap[table] || '*')
        .order(sortBy, { ascending })
        .limit(limit);

      if (filters) {
        for (const [key, value] of Object.entries(filters)) {
          query = query.eq(key, value as string);
        }
      }

      const { data, error } = await query;
      if (error) return { result: { error: `List failed: ${error.message}` } };
      return { result: { count: (data || []).length, items: data || [] } };
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

    // Loop to handle function calls (including multiple per response)
    let maxIterations = 8;
    while (maxIterations-- > 0) {
      const candidate = result.candidates?.[0];
      const parts = candidate?.content?.parts || [];

      // Collect ALL function calls in this response
      const functionCalls = parts.filter((p: any) => p.functionCall);
      if (functionCalls.length === 0) break;

      // Execute all function calls
      const functionResponses: any[] = [];
      for (const fc of functionCalls) {
        const { name, args } = fc.functionCall!;
        const { result: fnResult, action } = await executeFunction(name, args || {}, serviceClient);
        if (action) actionToReturn = action;
        functionResponses.push({
          functionResponse: { name, response: fnResult },
        });
      }

      // Send all function results back to Gemini
      response = await chat.sendMessage(functionResponses);
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
