import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { NextResponse, type NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { GoogleGenerativeAI, SchemaType, type FunctionDeclarationsTool } from '@google/generative-ai';

// ── All table mappings ──
const TABLE_MAP: Record<string, string> = {
  article: 'articles',
  service: 'service_providers',
  faq: 'faqs',
  code: 'security_codes',
  zone: 'zones',
  update: 'updates',
  banner: 'site_banners',
  scenario: 'consultant_scenarios',
  comment: 'comments',
  review: 'service_reviews',
  member: 'member_profiles',
  source: 'official_sources',
  menu: 'site_menus',
  notification: 'notifications',
  suggestion: 'suggestions',
};

const PK_MAP: Record<string, string> = {
  security_codes: 'code',
};

function pk(table: string) { return PK_MAP[table] || 'id'; }

// ── Arabic search normalizer ──
function normalizeForSearch(term: string): string {
  return term
    .replace(/[اأإآ]/g, '_')
    .replace(/[ةه]/g, '_')
    .replace(/[يى]/g, '_');
}

// ── Categories & Tags ──
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

const CATEGORIES_TEXT = Object.entries(CATEGORY_SLUGS).map(([k]) => k).join(', ');
const TAGS_TEXT = Object.entries(TAG_LABELS).map(([k]) => k).join(', ');

// Resolve English slugs to Arabic for DB queries
function resolveFilters(filters: Record<string, any>): Record<string, any> {
  const resolved = { ...filters };
  if (resolved.category) {
    resolved.category = CATEGORY_SLUGS[resolved.category] || resolved.category;
  }
  if (resolved.tags) {
    resolved.tags = TAG_LABELS[resolved.tags] || resolved.tags;
  }
  return resolved;
}

// ── Content types for tools ──
const CONTENT_TYPES = [
  'article', 'service', 'faq', 'update', 'scenario',
  'code', 'zone', 'banner', 'comment', 'review', 'member', 'source',
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const contentTypeSchema: any = {
  type: SchemaType.STRING,
  format: 'enum',
  enum: CONTENT_TYPES,
};

// ── Gemini Tools ──
const tools: FunctionDeclarationsTool[] = [{
  functionDeclarations: [
    {
      name: 'search_content',
      description: 'Search across all website tables by keyword. Returns matching items with their IDs, titles, and key fields. Use when admin asks to FIND something.',
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          query: { type: SchemaType.STRING, description: 'Search keyword' },
          content_type: { ...contentTypeSchema, description: 'Optional: filter to specific type' },
        },
        required: ['query'],
      },
    },
    {
      name: 'list_content',
      description: 'Fetch recent items from any table. Returns actual data with titles, details, dates. Use when admin asks to SHOW, LIST, or DISPLAY items. Can filter and sort.',
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          content_type: contentTypeSchema,
          limit: { type: SchemaType.NUMBER, description: 'Max items (default 10, max 30)' },
          filters: { type: SchemaType.OBJECT, description: 'Key-value filters', properties: {} },
          sort_field: { type: SchemaType.STRING, description: 'Sort field (default: created_at)' },
          sort_order: { type: SchemaType.STRING, format: 'enum', enum: ['asc', 'desc'], description: 'asc or desc (default: desc)' } as any,
        },
        required: ['content_type'],
      },
    },
    {
      name: 'get_content_details',
      description: 'Get ALL fields of a single item by ID. Use to see full details of one specific record.',
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          id: { type: SchemaType.STRING, description: 'Item ID or code' },
          content_type: contentTypeSchema,
        },
        required: ['id', 'content_type'],
      },
    },
    {
      name: 'count_content',
      description: 'Count total items in a table, optionally filtered. Use when admin asks HOW MANY of something.',
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          content_type: contentTypeSchema,
          filters: { type: SchemaType.OBJECT, description: 'Optional key-value filters', properties: {} },
        },
        required: ['content_type'],
      },
    },
    {
      name: 'count_by_group',
      description: 'Count items grouped by a field. Returns all groups with counts in ONE call. Use for "how many per category/city/status".',
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          content_type: contentTypeSchema,
          group_by: { type: SchemaType.STRING, description: 'Field to group by (category, city, status, type, severity, risk)' },
        },
        required: ['content_type', 'group_by'],
      },
    },
    {
      name: 'get_dashboard_stats',
      description: 'Get full site statistics: total counts of all content types, pending items, recent activity. Use when admin asks for overview, stats, or dashboard summary.',
      parameters: { type: SchemaType.OBJECT, properties: {} },
    },
    {
      name: 'create_article',
      description: 'Create a new article/guide. Auto-generates slug and ID. Status defaults to approved (published).',
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          title: { type: SchemaType.STRING, description: 'Article title in Arabic' },
          category: { type: SchemaType.STRING, description: 'Category slug: residence, kimlik, visa, syrians, housing, work, education, health, official, edevlet, traffic' },
          intro: { type: SchemaType.STRING, description: 'Short intro 1-2 sentences' },
          details: { type: SchemaType.STRING, description: 'Full content in HTML' },
          steps: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING }, description: 'Ordered steps' },
          documents: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING }, description: 'Required documents list' },
          tips: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING }, description: 'Tips and notes' },
          tags: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING }, description: 'Tag slugs from available list' },
          warning: { type: SchemaType.STRING, description: 'Warning text if needed' },
        },
        required: ['title', 'category', 'intro'],
      },
    },
    {
      name: 'create_update',
      description: 'Create a news item or update/alert. Types: news, alert, update.',
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          title: { type: SchemaType.STRING, description: 'Headline' },
          content: { type: SchemaType.STRING, description: 'Full content text' },
          type: { type: SchemaType.STRING, description: 'Type: news, alert, or update. Default: news' },
        },
        required: ['title', 'content'],
      },
    },
    {
      name: 'create_service',
      description: 'Add a new service provider listing.',
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          name: { type: SchemaType.STRING, description: 'Provider name' },
          profession: { type: SchemaType.STRING, description: 'Profession/specialty' },
          category: { type: SchemaType.STRING, description: 'Category: medical, legal, home, transport, education, translation, other' },
          city: { type: SchemaType.STRING, description: 'City name' },
          district: { type: SchemaType.STRING, description: 'District name' },
          phone: { type: SchemaType.STRING, description: 'Phone (Turkish format)' },
          description: { type: SchemaType.STRING, description: 'Service description' },
        },
        required: ['name', 'profession'],
      },
    },
    {
      name: 'update_content',
      description: 'Update specific fields of any existing item. Only updates the fields you specify.',
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          id: { type: SchemaType.STRING, description: 'Item ID' },
          content_type: contentTypeSchema,
          fields: { type: SchemaType.OBJECT, description: 'Fields to update: {title: "new", intro: "new", ...}', properties: {} },
        },
        required: ['id', 'content_type', 'fields'],
      },
    },
    {
      name: 'delete_content',
      description: 'Delete an item. Returns confirmation request. Actual deletion happens after admin confirms.',
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          id: { type: SchemaType.STRING, description: 'Item ID to delete' },
          content_type: contentTypeSchema,
        },
        required: ['id', 'content_type'],
      },
    },
    {
      name: 'toggle_status',
      description: 'Publish or unpublish/hide an item. Changes status/active fields appropriately per content type.',
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          id: { type: SchemaType.STRING, description: 'Item ID' },
          content_type: contentTypeSchema,
          action: { type: SchemaType.STRING, format: 'enum', enum: ['publish', 'unpublish'], description: 'publish or unpublish' } as any,
        },
        required: ['id', 'content_type', 'action'],
      },
    },
    {
      name: 'manage_comments',
      description: 'List, approve, reject, or check pending comments. Use when admin asks about comments or moderation.',
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          action: {
            type: SchemaType.STRING, format: 'enum',
            enum: ['list_pending', 'list_all', 'approve', 'reject'],
            description: 'What to do with comments',
          } as any,
          comment_id: { type: SchemaType.STRING, description: 'Comment ID (required for approve/reject)' },
          limit: { type: SchemaType.NUMBER, description: 'Max comments to return (default 10)' },
        },
        required: ['action'],
      },
    },
    {
      name: 'create_faq',
      description: 'Create a new FAQ entry.',
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          question: { type: SchemaType.STRING, description: 'The question in Arabic' },
          answer: { type: SchemaType.STRING, description: 'The answer in Arabic' },
          category: { type: SchemaType.STRING, description: 'FAQ category' },
        },
        required: ['question', 'answer'],
      },
    },
    {
      name: 'create_code',
      description: 'Create a new security/ban code entry (V-code or G-code).',
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          code: { type: SchemaType.STRING, description: 'Code like V-87 or G-160' },
          title: { type: SchemaType.STRING, description: 'Code title' },
          description: { type: SchemaType.STRING, description: 'What this code means' },
          category: { type: SchemaType.STRING, description: 'Code category' },
          severity: { type: SchemaType.STRING, format: 'enum', enum: ['info', 'warning', 'urgent', 'critical'], description: 'Severity level' } as any,
        },
        required: ['code', 'title', 'description'],
      },
    },
    {
      name: 'create_zone',
      description: 'Create a new forbidden zone/neighborhood entry.',
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          city: { type: SchemaType.STRING, description: 'City name' },
          district: { type: SchemaType.STRING, description: 'District name' },
          neighborhood: { type: SchemaType.STRING, description: 'Neighborhood name' },
          status: { type: SchemaType.STRING, format: 'enum', enum: ['open', 'closed'], description: 'open or closed' } as any,
          notes: { type: SchemaType.STRING, description: 'Additional notes' },
        },
        required: ['city', 'district', 'neighborhood', 'status'],
      },
    },
    {
      name: 'create_scenario',
      description: 'Create a new consultant scenario for the AI legal advisor.',
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          title: { type: SchemaType.STRING, description: 'Scenario title' },
          description: { type: SchemaType.STRING, description: 'Scenario description' },
          category: { type: SchemaType.STRING, description: 'Scenario category' },
          risk: { type: SchemaType.STRING, format: 'enum', enum: ['safe', 'medium', 'high', 'critical'], description: 'Risk level' } as any,
          steps: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING }, description: 'Steps to resolve' },
          docs: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING }, description: 'Required documents' },
          cost: { type: SchemaType.STRING, description: 'Expected cost info' },
          legal: { type: SchemaType.STRING, description: 'Legal basis/reference' },
          tip: { type: SchemaType.STRING, description: 'Key tip for this scenario' },
        },
        required: ['title', 'description'],
      },
    },
    {
      name: 'create_banner',
      description: 'Create a new site banner/alert shown at the top of the website.',
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          content: { type: SchemaType.STRING, description: 'Banner text content' },
          link_text: { type: SchemaType.STRING, description: 'Link button text (optional)' },
          link_url: { type: SchemaType.STRING, description: 'Link URL (optional)' },
          type: { type: SchemaType.STRING, format: 'enum', enum: ['banner', 'alert'], description: 'banner or alert' } as any,
        },
        required: ['content'],
      },
    },
    {
      name: 'query_table',
      description: 'Flexible direct query to ANY database table. Use for advanced operations not covered by other tools.',
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          table: { type: SchemaType.STRING, description: 'Table name: articles, service_providers, faqs, updates, consultant_scenarios, security_codes, zones, site_banners, comments, service_reviews, member_profiles, official_sources, site_menus, notifications, suggestions, content_votes' },
          select: { type: SchemaType.STRING, description: 'Columns to select (default: *)' },
          filters: { type: SchemaType.OBJECT, description: 'Key-value equality filters', properties: {} },
          order_by: { type: SchemaType.STRING, description: 'Column to sort by' },
          ascending: { type: SchemaType.STRING, format: 'enum', enum: ['true', 'false'], description: 'Sort direction' } as any,
          limit: { type: SchemaType.NUMBER, description: 'Max rows (default 20)' },
        },
        required: ['table'],
      },
    },
  ],
}];

// ── Comprehensive System Prompt ──
const SYSTEM_PROMPT = `You are the intelligent admin assistant for "dalilarabtr.com" (Daleel Al-Arab).
This is a comprehensive guide website for Arabs and Syrians living in Turkey.
You have FULL access to the database and act as a real admin.

CRITICAL: ALWAYS respond in Arabic. The admin speaks Arabic only.

## YOUR BEHAVIOR:
1. You MUST call tools to get data. NEVER say "I need IDs" or "search for it yourself". YOU search.
2. When asked to SHOW/LIST: call list_content or query_table immediately.
3. When asked to FIND/SEARCH: call search_content immediately.
4. When asked HOW MANY: call count_content or count_by_group.
5. When asked for OVERVIEW/STATS: call get_dashboard_stats.
6. When admin says "yes" or confirms: EXECUTE immediately. Never ask again.
7. After getting data: format it nicely in Arabic, show ALL results directly.
8. NEVER ask admin for IDs, search terms, or info you can get with tools.
9. For follow-up questions about items you already found: USE the IDs from your previous tool results (check [Tool context] in history).
10. Be proactive: if admin says something vague, search for it.

## SITE OVERVIEW:
The site has these main sections:
- Knowledge Base: 100+ articles organized by category (residence, visa, kimlik, health, work, education, etc.)
- Service Directory: Vetted service providers (doctors, lawyers, translators, movers)
- AI Consultant: Interactive legal scenario analyzer
- News/Updates: Breaking news and important announcements
- Tools: Ban calculator, cost calculator, code lookup, zone maps, pharmacy finder
- Community: Comments and reviews on articles and services
- Security Codes: V-codes and G-codes (ban/restriction codes)
- Forbidden Zones: Neighborhoods where Syrians cannot register

## DATABASE TABLES:

### articles
Columns: id, slug, title, category (Arabic name), intro, details (HTML), steps (array), documents (array), tips (array), fees, warning, source (URL), image, tags (array of slugs), seo_keywords, status (approved/draft/pending/rejected), created_at, last_update, user_id
Category values stored in Arabic: residence=types of residences, kimlik=kimlik and temporary protection, visa=visas, syrians=syrian services, housing=housing, work=work and investment, education=study, health=health and insurance, official=official transactions, edevlet=e-Devlet services, traffic=traffic and cars

### service_providers
Columns: id, name, profession, description, phone, city, district, category (medical/legal/home/transport/education/translation/other), image, bio, status (pending/approved/rejected), is_verified, user_id, created_at

### updates
Columns: id, type (news/alert/update), title, content, date, active (boolean), image, created_at

### faqs
Columns: id, question, answer, category, active (boolean), created_at

### security_codes (PK is code not id)
Columns: code (e.g. V-87, G-160), title, description, category, severity (info/warning/urgent/critical), active

### zones
Columns: id, city, district, neighborhood, status (open/closed), notes, created_at

### consultant_scenarios
Columns: id, title, description, category, risk (safe/medium/high/critical), steps (array), docs (array), cost, legal, tip, is_active, created_at

### site_banners
Columns: id, content, link_text, link_url, type (banner/alert), is_active, created_at

### comments
Columns: id, entity_type (article/update/service), entity_id, user_id, author_name, content, status (pending/approved/rejected), created_at

### service_reviews
Columns: id, service_id, user_id, rating (1-5), title, content, created_at

### member_profiles
Columns: id, full_name, role (admin/user/moderator), avatar_url, created_at

### official_sources
Columns: id, name, url, description, category, is_official, active, created_at

### site_menus
Columns: id, label, href, location (header/footer), sort_order, is_active, created_at

### content_votes
Columns: id, entity_type, entity_id, user_id, vote_type (up/down), created_at

## CATEGORY SLUGS (article categories - use these for filters):
${CATEGORIES_TEXT}

## TAG SLUGS (article tags):
${TAGS_TEXT}

## STATUS WORKFLOWS:
- Articles: pending -> approved (published) / draft / rejected
- Services: pending -> approved + is_verified=true (published) / rejected
- Updates/FAQs/Codes: active=true (visible) / active=false (hidden)
- Banners: is_active=true/false
- Scenarios: is_active=true/false
- Comments: pending -> approved / rejected
- Zones: status=open / closed

## IMPORTANT NOTES:
- Article categories are stored in Arabic in DB (not English slugs)
- The slug-to-Arabic mapping is automatic in the backend
- security_codes table uses "code" as primary key, not "id"
- When creating articles, choose the best category and tags automatically
- Articles appear on the site at: /article/[slug]
- Services appear at: /services/[id]
- Updates appear at: /updates/[id]
- News ticker on homepage shows updates with type "news"

## RESPONSE FORMAT:
- Use bullet points and structured lists
- Show item titles, IDs, and key info
- For articles: show title, category, status
- For services: show name, profession, city, phone
- For counts: show numbers clearly
- Be concise but complete`;

// ── Tool execution ──
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
        article: () => searchTable('article', 'articles', ['title', 'intro', 'details'], 'id, slug, title, intro, category, status, created_at'),
        service: () => searchTable('service', 'service_providers', ['name', 'description', 'profession'], 'id, name, profession, city, phone, status'),
        faq: () => searchTable('faq', 'faqs', ['question', 'answer'], 'id, question, category, active'),
        update: () => searchTable('update', 'updates', ['title', 'content'], 'id, title, type, date, active'),
        scenario: () => searchTable('scenario', 'consultant_scenarios', ['title', 'description'], 'id, title, category, is_active'),
        code: () => searchTable('code', 'security_codes', ['code', 'title', 'description'], 'code, title, severity, active'),
        zone: () => searchTable('zone', 'zones', ['city', 'district', 'neighborhood'], 'id, city, district, neighborhood, status'),
        banner: () => searchTable('banner', 'site_banners', ['content', 'link_text'], 'id, content, type, is_active'),
        comment: () => searchTable('comment', 'comments', ['content', 'author_name'], 'id, entity_type, entity_id, author_name, content, status, created_at'),
        review: () => searchTable('review', 'service_reviews', ['title', 'content'], 'id, service_id, rating, title, content'),
        source: () => searchTable('source', 'official_sources', ['name', 'description'], 'id, name, url, category, active'),
      };

      if (content_type && searches[content_type]) {
        results.push(...await searches[content_type]());
      } else {
        // Search main content types (not all to keep it fast)
        const mainTypes = ['article', 'service', 'faq', 'update', 'scenario', 'code'];
        const all = await Promise.all(mainTypes.map(t => searches[t]()));
        all.forEach(r => results.push(...r));
      }

      return { result: { count: results.length, items: results.slice(0, 20) } };
    }

    case 'get_content_details': {
      const { id, content_type } = args;
      const table = TABLE_MAP[content_type];
      if (!table) return { result: { error: 'Invalid content type' } };

      const pkField = pk(table);
      const { data, error } = await serviceClient.from(table).select('*').eq(pkField, id).single();
      if (error) return { result: { error: `Not found: ${error.message}` } };
      return { result: data };
    }

    case 'delete_content': {
      const { id, content_type } = args;
      const table = TABLE_MAP[content_type];
      if (!table) return { result: { error: 'Invalid content type' } };

      const pkField = pk(table);
      const { data: item } = await serviceClient.from(table).select('*').eq(pkField, id).single();
      if (!item) return { result: { error: 'Item not found' } };

      const rec = item as Record<string, any>;
      const title = rec.title || rec.name || rec.question || rec.content || rec.code || id;
      return {
        result: { message: `Will delete: "${title}"`, item },
        action: {
          id: `del-${Date.now()}`,
          type: 'delete',
          contentType: content_type,
          contentId: id,
          table,
          summary: `${content_type}: ${title}`,
        },
      };
    }

    case 'update_content': {
      const { id, content_type, fields } = args;
      const table = TABLE_MAP[content_type];
      if (!table) return { result: { error: 'Invalid content type' } };

      // Resolve category if present
      const resolvedFields = resolveFilters(fields);
      const pkField = pk(table);
      const { data, error } = await serviceClient.from(table).update(resolvedFields).eq(pkField, id).select().single();
      if (error) return { result: { error: `Update failed: ${error.message}` } };
      return { result: { message: 'Updated successfully', updated: data } };
    }

    case 'toggle_status': {
      const { id, content_type, action } = args;
      const table = TABLE_MAP[content_type];
      if (!table) return { result: { error: 'Invalid content type' } };

      const pkField = pk(table);
      let updateFields: Record<string, any>;

      if (content_type === 'article') {
        updateFields = { status: action === 'publish' ? 'approved' : 'draft' };
      } else if (content_type === 'service') {
        updateFields = action === 'publish'
          ? { status: 'approved', is_verified: true }
          : { status: 'draft', is_verified: false };
      } else if (content_type === 'comment') {
        updateFields = { status: action === 'publish' ? 'approved' : 'rejected' };
      } else if (content_type === 'banner') {
        updateFields = { is_active: action === 'publish' };
      } else if (content_type === 'scenario') {
        updateFields = { is_active: action === 'publish' };
      } else {
        updateFields = { active: action === 'publish' };
      }

      const { error } = await serviceClient.from(table).update(updateFields).eq(pkField, id);
      if (error) return { result: { error: `Status change failed: ${error.message}` } };
      return { result: { message: action === 'publish' ? 'Published' : 'Unpublished', id, content_type } };
    }

    case 'create_article': {
      const { title, category, intro, details, steps, documents, tips, tags, warning } = args;
      const slug = title
        .replace(/[\s—–]+/g, '-')
        .replace(/[^\u0600-\u06FFa-zA-Z0-9\-]/g, '')
        .substring(0, 80)
        .toLowerCase() || `article-${Date.now()}`;

      const id = `${slug}-${Date.now().toString(36)}`;
      const categoryArabic = CATEGORY_SLUGS[category] || category;

      const { data, error } = await serviceClient.from('articles').insert({
        id, slug, title, category: categoryArabic, intro,
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

      if (error) return { result: { error: `Create failed: ${error.message}` } };
      return { result: { message: 'Article created', article: data } };
    }

    case 'create_update': {
      const { title, content, type } = args;
      const { data, error } = await serviceClient.from('updates').insert({
        title, content,
        type: type || 'news',
        date: new Date().toISOString().split('T')[0],
        active: true,
      }).select().single();

      if (error) return { result: { error: `Create failed: ${error.message}` } };
      return { result: { message: 'Update created', update: data } };
    }

    case 'create_service': {
      const { name, profession, category, city, district, phone, description } = args;
      const { data, error } = await serviceClient.from('service_providers').insert({
        name, profession,
        category: category || null,
        city: city || null,
        district: district || null,
        phone: phone || null,
        description: description || null,
        status: 'approved',
        is_verified: true,
      }).select().single();

      if (error) return { result: { error: `Create failed: ${error.message}` } };
      return { result: { message: 'Service created', service: data } };
    }

    case 'create_faq': {
      const { question, answer, category } = args;
      const { data, error } = await serviceClient.from('faqs').insert({
        question, answer,
        category: category || null,
        active: true,
      }).select().single();
      if (error) return { result: { error: `Create failed: ${error.message}` } };
      return { result: { message: 'FAQ created', faq: data } };
    }

    case 'create_code': {
      const { code, title, description, category, severity } = args;
      const { data, error } = await serviceClient.from('security_codes').insert({
        code, title, description,
        category: category || null,
        severity: severity || 'info',
        active: true,
      }).select().single();
      if (error) return { result: { error: `Create failed: ${error.message}` } };
      return { result: { message: 'Security code created', code_entry: data } };
    }

    case 'create_zone': {
      const { city, district, neighborhood, status, notes } = args;
      const { data, error } = await serviceClient.from('zones').insert({
        city, district, neighborhood, status,
        notes: notes || null,
      }).select().single();
      if (error) return { result: { error: `Create failed: ${error.message}` } };
      return { result: { message: 'Zone created', zone: data } };
    }

    case 'create_scenario': {
      const { title, description, category, risk, steps, docs, cost, legal, tip } = args;
      const { data, error } = await serviceClient.from('consultant_scenarios').insert({
        title, description,
        category: category || null,
        risk: risk || 'medium',
        steps: steps || [],
        docs: docs || [],
        cost: cost || null,
        legal: legal || null,
        tip: tip || null,
        is_active: true,
      }).select().single();
      if (error) return { result: { error: `Create failed: ${error.message}` } };
      return { result: { message: 'Scenario created', scenario: data } };
    }

    case 'create_banner': {
      const { content, link_text, link_url, type } = args;
      const { data, error } = await serviceClient.from('site_banners').insert({
        content,
        link_text: link_text || null,
        link_url: link_url || null,
        type: type || 'banner',
        is_active: true,
      }).select().single();
      if (error) return { result: { error: `Create failed: ${error.message}` } };
      return { result: { message: 'Banner created', banner: data } };
    }

    case 'count_content': {
      const { content_type, filters } = args;
      const table = TABLE_MAP[content_type];
      if (!table) return { result: { error: 'Invalid content type' } };

      let query = serviceClient.from(table).select('*', { count: 'exact', head: true });
      if (filters) {
        const resolved = resolveFilters(filters);
        for (const [key, value] of Object.entries(resolved)) {
          query = query.eq(key, value as string);
        }
      }

      const { count, error } = await query;
      if (error) return { result: { error: `Count failed: ${error.message}` } };
      return { result: { count, content_type } };
    }

    case 'list_content': {
      const { content_type, limit: rawLimit, filters, sort_field, sort_order } = args;
      const table = TABLE_MAP[content_type];
      if (!table) return { result: { error: 'Invalid content type' } };

      const limit = Math.min(rawLimit || 10, 30);
      const sortBy = sort_field || 'created_at';
      const ascending = sort_order === 'asc';

      const selectMap: Record<string, string> = {
        articles: 'id, slug, title, intro, category, status, tags, created_at, last_update',
        service_providers: 'id, name, profession, city, district, phone, category, status, is_verified, created_at',
        faqs: 'id, question, answer, category, active, created_at',
        updates: 'id, title, content, type, date, active, created_at',
        consultant_scenarios: 'id, title, description, category, risk, is_active, created_at',
        security_codes: 'code, title, description, severity, active',
        zones: 'id, city, district, neighborhood, status, notes',
        site_banners: 'id, content, link_text, link_url, type, is_active',
        comments: 'id, entity_type, entity_id, author_name, content, status, created_at',
        service_reviews: 'id, service_id, rating, title, content, created_at',
        member_profiles: 'id, full_name, role, created_at',
        official_sources: 'id, name, url, category, active',
      };

      let query = serviceClient
        .from(table)
        .select(selectMap[table] || '*')
        .order(sortBy, { ascending })
        .limit(limit);

      if (filters) {
        const resolved = resolveFilters(filters);
        for (const [key, value] of Object.entries(resolved)) {
          query = query.eq(key, value as string);
        }
      }

      const { data, error } = await query;
      if (error) return { result: { error: `List failed: ${error.message}` } };
      return { result: { count: (data || []).length, items: data || [] } };
    }

    case 'count_by_group': {
      const { content_type, group_by } = args;
      const table = TABLE_MAP[content_type];
      if (!table) return { result: { error: 'Invalid content type' } };

      const { data, error } = await serviceClient.from(table).select(group_by);
      if (error) return { result: { error: `Group count failed: ${error.message}` } };

      const counts: Record<string, number> = {};
      for (const row of (data || [])) {
        const val = (row as Record<string, any>)[group_by] || 'unknown';
        counts[val] = (counts[val] || 0) + 1;
      }

      const sorted = Object.entries(counts)
        .sort(([, a], [, b]) => b - a)
        .map(([value, count]) => ({ [group_by]: value, count }));

      return { result: { total: (data || []).length, groups: sorted } };
    }

    case 'get_dashboard_stats': {
      const tables = [
        { name: 'articles', label: 'articles' },
        { name: 'service_providers', label: 'services' },
        { name: 'updates', label: 'updates' },
        { name: 'faqs', label: 'faqs' },
        { name: 'consultant_scenarios', label: 'scenarios' },
        { name: 'security_codes', label: 'codes' },
        { name: 'zones', label: 'zones' },
        { name: 'comments', label: 'comments' },
        { name: 'service_reviews', label: 'reviews' },
        { name: 'member_profiles', label: 'members' },
      ];

      const stats: Record<string, any> = {};

      // Get total counts in parallel
      const counts = await Promise.all(
        tables.map(async (t) => {
          const { count } = await serviceClient.from(t.name).select('*', { count: 'exact', head: true });
          return { label: t.label, count: count || 0 };
        })
      );
      for (const c of counts) stats[c.label] = c.count;

      // Get pending counts
      const [pendingServices, pendingComments, pendingArticles] = await Promise.all([
        serviceClient.from('service_providers').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        serviceClient.from('comments').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        serviceClient.from('articles').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      ]);

      stats.pending = {
        services: pendingServices.count || 0,
        comments: pendingComments.count || 0,
        articles: pendingArticles.count || 0,
      };

      return { result: stats };
    }

    case 'manage_comments': {
      const { action, comment_id, limit: rawLimit } = args;
      const limit = rawLimit || 10;

      if (action === 'list_pending') {
        const { data, error } = await serviceClient
          .from('comments')
          .select('id, entity_type, entity_id, author_name, content, created_at')
          .eq('status', 'pending')
          .order('created_at', { ascending: false })
          .limit(limit);
        if (error) return { result: { error: error.message } };
        return { result: { count: (data || []).length, comments: data } };
      }

      if (action === 'list_all') {
        const { data, error } = await serviceClient
          .from('comments')
          .select('id, entity_type, entity_id, author_name, content, status, created_at')
          .order('created_at', { ascending: false })
          .limit(limit);
        if (error) return { result: { error: error.message } };
        return { result: { count: (data || []).length, comments: data } };
      }

      if ((action === 'approve' || action === 'reject') && comment_id) {
        const newStatus = action === 'approve' ? 'approved' : 'rejected';
        const { error } = await serviceClient
          .from('comments')
          .update({ status: newStatus })
          .eq('id', comment_id);
        if (error) return { result: { error: error.message } };
        return { result: { message: `Comment ${action}d`, comment_id } };
      }

      return { result: { error: 'Invalid action or missing comment_id' } };
    }

    case 'query_table': {
      const { table, select, filters, order_by, ascending, limit: rawLimit } = args;
      const limitVal = Math.min(rawLimit || 20, 50);

      let query = serviceClient.from(table).select(select || '*').limit(limitVal);

      if (filters) {
        for (const [key, value] of Object.entries(filters)) {
          query = query.eq(key, value as string);
        }
      }

      if (order_by) {
        query = query.order(order_by, { ascending: ascending === 'true' });
      }

      const { data, error } = await query;
      if (error) return { result: { error: `Query failed: ${error.message}` } };
      return { result: { count: (data || []).length, rows: data } };
    }

    default:
      return { result: { error: 'Unknown function' } };
  }
}

// ── Live site snapshot — gives Gemini real-time awareness ──
async function fetchSiteSnapshot(serviceClient: any): Promise<string> {
  try {
    const [
      articlesCount, servicesCount, updatesCount, faqsCount,
      scenariosCount, codesCount, zonesCount, commentsCount,
      reviewsCount, membersCount, bannersCount,
      pendingServices, pendingComments, pendingArticles,
      recentArticles, recentUpdates, activeBanners,
    ] = await Promise.all([
      serviceClient.from('articles').select('*', { count: 'exact', head: true }),
      serviceClient.from('service_providers').select('*', { count: 'exact', head: true }),
      serviceClient.from('updates').select('*', { count: 'exact', head: true }),
      serviceClient.from('faqs').select('*', { count: 'exact', head: true }),
      serviceClient.from('consultant_scenarios').select('*', { count: 'exact', head: true }),
      serviceClient.from('security_codes').select('*', { count: 'exact', head: true }),
      serviceClient.from('zones').select('*', { count: 'exact', head: true }),
      serviceClient.from('comments').select('*', { count: 'exact', head: true }),
      serviceClient.from('service_reviews').select('*', { count: 'exact', head: true }),
      serviceClient.from('member_profiles').select('*', { count: 'exact', head: true }),
      serviceClient.from('site_banners').select('*', { count: 'exact', head: true }),
      serviceClient.from('service_providers').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      serviceClient.from('comments').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      serviceClient.from('articles').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      serviceClient.from('articles').select('id, title, category, status, created_at').order('created_at', { ascending: false }).limit(5),
      serviceClient.from('updates').select('id, title, type, date, active').order('created_at', { ascending: false }).limit(5),
      serviceClient.from('site_banners').select('id, content, type, is_active').eq('is_active', true),
    ]);

    const recentArticlesList = (recentArticles.data || [])
      .map((a: any) => `  - "${a.title}" [${a.category}] (${a.status})`)
      .join('\n');

    const recentUpdatesList = (recentUpdates.data || [])
      .map((u: any) => `  - "${u.title}" [${u.type}] (${u.active ? 'active' : 'inactive'})`)
      .join('\n');

    const activeBannersList = (activeBanners.data || [])
      .map((b: any) => `  - "${b.content}" [${b.type}]`)
      .join('\n');

    return `
## LIVE SITE DATA (real-time snapshot):
Total counts: ${articlesCount.count} articles, ${servicesCount.count} services, ${updatesCount.count} updates, ${faqsCount.count} FAQs, ${scenariosCount.count} scenarios, ${codesCount.count} codes, ${zonesCount.count} zones, ${commentsCount.count} comments, ${reviewsCount.count} reviews, ${membersCount.count} members, ${bannersCount.count} banners

Pending items needing attention: ${pendingArticles.count || 0} articles, ${pendingServices.count || 0} services, ${pendingComments.count || 0} comments

Last 5 articles:
${recentArticlesList || '  (none)'}

Last 5 updates:
${recentUpdatesList || '  (none)'}

Active banners:
${activeBannersList || '  (none)'}
`;
  } catch {
    return '\n## LIVE DATA: Could not fetch snapshot.\n';
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

    // ── Auth ──
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
        return NextResponse.json({ reply: `Delete failed: ${error.message}` });
      }
      return NextResponse.json({ reply: `Deleted "${pendingAction.summary}" successfully.` });
    }

    // ── Gemini API ──
    const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ reply: 'GOOGLE_GEMINI_API_KEY not configured.' });
    }

    // Fetch live site snapshot for real-time awareness
    const siteSnapshot = await fetchSiteSnapshot(serviceClient);

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: SYSTEM_PROMPT + siteSnapshot,
      tools,
    });

    // Build chat history with tool context from previous turns
    const history = messages.slice(0, -1).map((m: any) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m._context ? `${m.content}\n\n[Tool context from this turn: ${m._context}]` : m.content }],
    }));

    const chat = model.startChat({ history });
    const lastMessage = messages[messages.length - 1].content;

    let response = await chat.sendMessage(lastMessage);
    let result = response.response;
    let actionToReturn: any = null;
    const toolLog: string[] = [];

    // Process function calls (supports multiple per response)
    let maxIterations = 10;
    while (maxIterations-- > 0) {
      const candidate = result.candidates?.[0];
      const parts = candidate?.content?.parts || [];

      const functionCalls = parts.filter((p: any) => p.functionCall);
      if (functionCalls.length === 0) break;

      const functionResponses: any[] = [];
      for (const fc of functionCalls) {
        const { name, args } = fc.functionCall!;
        const { result: fnResult, action } = await executeFunction(name, args || {}, serviceClient);
        if (action) actionToReturn = action;
        functionResponses.push({
          functionResponse: { name, response: fnResult },
        });
        toolLog.push(`${name}(${JSON.stringify(args)}) => ${JSON.stringify(fnResult).slice(0, 500)}`);
      }

      response = await chat.sendMessage(functionResponses);
      result = response.response;
    }

    const replyText = result.text() || 'Could not process your request.';
    const toolContext = toolLog.length > 0 ? toolLog.join(' | ') : undefined;

    return NextResponse.json({
      reply: replyText,
      ...(actionToReturn && { action: actionToReturn }),
      ...(toolContext && { _context: toolContext }),
    });

  } catch (error: any) {
    console.error('AI Assistant error:', error);
    return NextResponse.json({
      reply: `Error: ${error.message || 'Unknown error'}. Try again.`,
    });
  }
}
