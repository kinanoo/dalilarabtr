-- ==========================================
-- ملف إعداد قاعدة البيانات الشامل (Master Setup)
-- مشروع: دليل العرب في تركيا
-- التاريخ: 2025-12-28
-- ==========================================

-- تفعيل الامتدادات الضرورية
create extension if not exists "uuid-ossp";

-- ==========================================
-- 1. جداول الإعدادات العامة
-- ==========================================

-- جدول البنرات (التنبيهات العاجلة)
create table if not exists site_banners (
  id uuid default uuid_generate_v4() primary key,
  content text not null,
  link_url text,
  link_text text,
  is_active boolean default false,
  type text default 'alert',
  created_at timestamp with time zone default now()
);

-- جدول إعدادات الموقع (Singleton)
create table if not exists site_settings (
  id integer primary key default 1,
  hero_title text default 'دليل العرب في تركيا',
  hero_subtitle text default 'بوابتك القانونية والخدمية الأولى',
  hero_cta_primary text default 'المستشار الذكي',
  hero_cta_secondary text default 'ابحث في الخدمات',
  stats_articles text default '+500',
  stats_users text default '+15,000',
  stats_uptime text default '24/7',
  footer_trust_1 text default 'تحديث يومي للبيانات',
  footer_trust_2 text default 'خصوصية مشفرة 100%',
  footer_trust_3 text default 'مراجع قانونية رسمية',
  whatsapp_number text,
  email_address text,
  updated_at timestamp with time zone default now()
);
insert into site_settings (id) values (1) on conflict (id) do nothing;

-- جدول القوائم (Menus)
create table if not exists site_menus (
  id uuid default uuid_generate_v4() primary key,
  label text not null,
  href text not null,
  location text default 'header', -- header, footer, sidebar
  sort_order integer default 0,
  is_active boolean default true,
  icon text,
  created_at timestamp with time zone default now()
);

-- جدول تصنيفات الخدمات (Service Categories)
create table if not exists service_categories (
  slug text primary key,
  title text not null,
  icon text,
  description text,
  sort_order integer default 0,
  is_featured boolean default false,
  active boolean default true,
  created_at timestamp with time zone default now()
);

-- جدول سجل الأدوات (Tools Registry)
create table if not exists tools_registry (
  key text primary key, -- e.g. kimlik-check
  name text,
  route text,
  is_active boolean default true,
  settings jsonb default '{}'::jsonb,
  created_at timestamp with time zone default now()
);

-- ==========================================
-- 2. جداول المحتوى الرئيسي
-- ==========================================

-- جدول مقدمي الخدمات
create table if not exists service_providers (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  slug text unique,
  profession text not null,
  category text not null,
  city text not null,
  district text,
  phone text not null,
  description text,
  bio text,
  address_details text,
  map_location text,
  image text,
  whatsapp text,
  is_verified boolean default false,
  rating_avg numeric default 0,
  review_count integer default 0,
  view_count integer default 0,
  active boolean default true,
  created_at timestamp with time zone default now()
);

-- جدول مراجعات الخدمات
create table if not exists service_reviews (
  id uuid default uuid_generate_v4() primary key,
  provider_id uuid references service_providers(id) on delete cascade,
  client_name text not null,
  rating integer check (rating >= 1 and rating <= 5),
  comment text,
  is_approved boolean default false,
  created_at timestamp with time zone default now()
);

-- جدول المقالات (Articles)
create table if not exists articles (
  id text primary key, -- Slug (مثال: residence-permit)
  title text not null,
  category text not null,
  intro text,
  details text,
  documents text[], -- Array
  steps text[], -- Array
  tips text[], -- Array
  fees text,
  warning text,
  source text,
  image text,
  seo_title text,
  seo_description text,
  seo_keywords text[],
  last_update text,
  active boolean default true,
  created_at timestamp with time zone default now()
);

-- جدول الأكواد الأمنية (Security Codes)
create table if not exists security_codes (
  code text primary key, -- G-87
  category text,
  title text,
  description text,
  severity text default 'medium',
  active boolean default true,
  created_at timestamp with time zone default now()
);

-- جدول المناطق المحظورة (Restricted Zones)
create table if not exists restricted_zones (
  id uuid default uuid_generate_v4() primary key,
  city text not null,
  district text not null,
  neighborhood text not null,
  is_closed boolean default true,
  notes text,
  active boolean default true,
  created_at timestamp with time zone default now()
);

-- جدول المصادر الرسمية
create table if not exists official_sources (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  url text not null,
  description text,
  is_official boolean default true,
  active boolean default true,
  created_at timestamp with time zone default now()
);

-- جدول التحديثات والأخبار
create table if not exists updates (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  type text not null,
  content text,
  date text,
  image text,
  active boolean default true,
  created_at timestamp with time zone default now()
);

-- جدول الأسئلة الشائعة
create table if not exists faqs (
  id uuid default uuid_generate_v4() primary key,
  question text not null,
  answer text not null,
  category text default 'general',
  active boolean default true,
  created_at timestamp with time zone default now()
);

-- جدول آراء العملاء العامة (للموقع نفسه)
create table if not exists site_testimonials (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  role text,
  location text,
  content text not null,
  rating integer default 5,
  is_active boolean default true,
  created_at timestamp with time zone default now()
);

-- جدول اقتراحات المحتوى
create table if not exists content_suggestions (
  id uuid default uuid_generate_v4() primary key,
  suggestion_text text not null,
  user_name text,
  contact_info text,
  article_id text,
  status text default 'pending', -- pending, approved, rejected
  created_at timestamp with time zone default now()
);

-- ==========================================
-- 3. تفعيل الحماية (RLS) وسياسات الأمان
-- ==========================================

-- دالة مساعدة لتفعيل RLS وإنشاء السياسات لجميع الجداول
do $$
declare
  t text;
  tables text[] := array[
    'site_banners', 'site_settings', 'service_providers', 'service_reviews',
    'articles', 'security_codes', 'restricted_zones', 'official_sources',
    'updates', 'faqs', 'site_testimonials', 'content_suggestions',
    'site_menus', 'service_categories', 'tools_registry'
  ];
begin
  foreach t in array tables loop
    -- 1. تفعيل RLS
    execute format('alter table %I enable row level security', t);
    
    -- 2. سياسة القراءة العامة (Public Read)
    -- نحذف السياسة القديمة للتأكد من عدم التكرار
    execute format('drop policy if exists "Public Read %I" on %I', t, t);
    execute format('create policy "Public Read %I" on %I for select using (true)', t, t);
    
    -- 3. سياسة المدير الكاملة (Admin All Access)
    execute format('drop policy if exists "Admin All %I" on %I', t, t);
    execute format('create policy "Admin All %I" on %I for all using (auth.role() = ''authenticated'')', t, t);
  end loop;
  
  -- استثناء: إضافة سياسة "إضافة مراجعة" للجميع (لأن الزوار يمكنهم التقييم)
  drop policy if exists "Public Insert Reviews" on service_reviews;
  create policy "Public Insert Reviews" on service_reviews for insert with check (true);
  
  -- استثناء: إضافة سياسة "إضافة اقتراح" للجميع
  drop policy if exists "Public Insert Suggestions" on content_suggestions;
  create policy "Public Insert Suggestions" on content_suggestions for insert with check (true);
end $$;


-- ==========================================
-- 4. إعداد التخزين (Storage)
-- ==========================================
-- ملاحظة: هذا يتطلب تفعيل storage extension اذا لم يكن مفعلا، لكن عادة هو مفعل.

-- إنشاء Bucket للخدمات (Providers)
insert into storage.buckets (id, name, public)
values ('providers', 'providers', true)
on conflict (id) do nothing;

-- سياسات تخزين للخدمات
drop policy if exists "Public Access Providers" on storage.objects;
create policy "Public Access Providers"
  on storage.objects for select
  using ( bucket_id = 'providers' );

drop policy if exists "Admin Upload Providers" on storage.objects;
create policy "Admin Upload Providers"
  on storage.objects for insert
  with check ( bucket_id = 'providers' and auth.role() = 'authenticated' );

drop policy if exists "Admin Update Providers" on storage.objects;
create policy "Admin Update Providers"
  on storage.objects for update
  using ( bucket_id = 'providers' and auth.role() = 'authenticated' );

drop policy if exists "Admin Delete Providers" on storage.objects;
create policy "Admin Delete Providers"
  on storage.objects for delete
  using ( bucket_id = 'providers' and auth.role() = 'authenticated' );


-- ==========================================
-- 5. دوال وتريغرات (Triggers)
-- ==========================================


-- تحديث تقييم مقدم الخدمة تلقائياً
create or replace function update_service_rating()
returns trigger as $$
begin
  update service_providers
  set 
    rating_avg = (select coalesce(avg(rating), 0) from service_reviews where provider_id = new.provider_id and is_approved = true),
    review_count = (select count(*) from service_reviews where provider_id = new.provider_id and is_approved = true)
  where id = new.provider_id;
  return new;
end;
$$ language plpgsql;

drop trigger if exists on_review_change on service_reviews;
create trigger on_review_change
after insert or update or delete on service_reviews
for each row execute function update_service_rating();

-- ==========================================
-- 6. تحديثات الهيكل (Schema Migrations) - هام جداً
-- ==========================================
-- هذه الأوامر تضمن إضافة الأعمدة الناقصة حتى لو الجداول موجودة مسبقاً

-- تحديث جدول المقالات (Articles)
alter table articles add column if not exists seo_title text;
alter table articles add column if not exists seo_description text;
alter table articles add column if not exists seo_keywords text[];
alter table articles add column if not exists image text;

-- تحديث جدول مقدمي الخدمات (Service Providers)
alter table service_providers add column if not exists active boolean default true;
alter table service_providers add column if not exists is_verified boolean default false;
alter table service_providers add column if not exists slug text unique;

-- إضافة قيد فريد (Unique Constraint) على رقم الهاتف لضمان عمل upsert بشكل صحيح
alter table service_providers drop constraint if exists service_providers_phone_unique;
alter table service_providers add constraint service_providers_phone_unique unique (phone);
