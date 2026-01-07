-- 1. جدول البنرات (التنبيهات العاجلة)
create table if not exists site_banners (
  id uuid default uuid_generate_v4() primary key,
  content text not null, -- نص التنبيه
  link_url text, -- رابط التنبيه (اختياري)
  link_text text, -- نص الزر (اقرأ المزيد)
  is_active boolean default false, -- هل مفعل أم لا
  type text default 'alert', -- نوع التنبيه (alert, info, warning)
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 2. جدول آراء العملاء (Testimonials)
create table if not exists site_testimonials (
  id uuid default uuid_generate_v4() primary key,
  name text not null, -- اسم العميل
  role text, -- صفته (مثلا: طالب، مقيم)
  location text, -- موقعه (اسطنبول)
  content text not null, -- نص الرأي
  rating integer default 5, -- التقييم (1-5)
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 3. جدول إعدادات الموقع العامة (Hero, Footer, Contact)
-- هذا الجدول سيكون فيه صف واحد فقط (Singleton) نحدثه دائما
create table if not exists site_settings (
  id integer primary key default 1,
  
  -- Hero Section
  hero_title text default 'دليل العرب في تركيا',
  hero_subtitle text default 'بوابتك القانونية والخدمية الأولى',
  hero_cta_primary text default 'المستشار الذكي',
  hero_cta_secondary text default 'ابحث في الخدمات',
  
  -- Stats (أرقام الهيرو)
  stats_articles text default '+500',
  stats_users text default '+15,000',
  stats_uptime text default '24/7',
  
  -- Footer Links & Badges
  footer_trust_1 text default 'تحديث يومي للبيانات',
  footer_trust_2 text default 'خصوصية مشفرة 100%',
  footer_trust_3 text default 'مراجع قانونية رسمية',
  
  -- Contact Info
  whatsapp_number text,
  email_address text,
  
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- إدخال بيانات افتراضية للإعدادات
insert into site_settings (id) values (1) on conflict (id) do nothing;

-- 4. جدول مقدمي الخدمات (Service Providers) - Enhanced
-- ملاحظة: إذا كان الجدول موجوداً، ستحتاج لإضافة الأعمدة يدوياً أو حذفه وإنشائه
create table if not exists service_providers (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  slug text unique, -- للرابط المختصر (SEO Friendly)
  profession text not null, -- المهنة (طبيب، محامي)
  category text not null, -- التصنيف (health, legal)
  city text not null,
  district text,
  phone text not null,
  
  -- حقول جديدة للبروفايل الغني
  description text, -- وصف مختصر
  bio text, -- نبذة تفصيلية
  address_details text, -- تفاصيل العنوان
  map_location text, -- رابط جوجل ماب
  image text, -- صورة شخصية او شعار
  
  -- التواصل والتوثيق
  whatsapp text, -- رقم واتساب (لزر التواصل المباشر)
  is_verified boolean default false, -- شارة التوثيق الزرقاء
  
  -- التقييمات
  rating_avg numeric default 0, -- متوسط التقييم
  review_count integer default 0, -- عدد المقيّمين
  view_count integer default 0, -- عدد المشاهدات
  
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 5. جدول مراجعات الخدمات (Reviews)
create table if not exists service_reviews (
  id uuid default uuid_generate_v4() primary key,
  provider_id uuid references service_providers(id) on delete cascade,
  client_name text not null, -- اسم العميل
  rating integer check (rating >= 1 and rating <= 5),
  comment text,
  is_approved boolean default false, -- يتطلب موافقة الأدمن للنشر
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- دالة لتحديث التقييم تلقائياً عند إضافة مراجعة
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

-- التريغير (Trigger)
drop trigger if exists on_review_change on service_reviews;
create trigger on_review_change
after insert or update or delete on service_reviews
for each row execute function update_service_rating();
