# لوحة التحكم (Supabase)

هذا المشروع يعمل بـ `output: 'export'` (موقع ثابت). لذلك أي "لوحة تحكم" تحتاج تخزين خارجي.
تم إضافة لوحة تحكم بسيطة تعتمد على Supabase.

## 1) إعداد Supabase

### المتغيرات البيئية
ضع القيم في `.env.local`:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

> هذه القيم "Public" وتُستخدم في المتصفح.

### الجداول المطلوبة
نفّذ SQL التالي في Supabase (SQL Editor):

```sql
create table if not exists public.services (
  id text primary key,
  title text not null,
  desc text not null,
  price numeric null,
  whatsapp text null,
  active boolean not null default true
);

create table if not exists public.site_settings (
  id integer primary key,
  default_whatsapp text null
);

create table if not exists public.site_updates (
  id text primary key,
  type text not null,
  title text not null,
  date text not null,
  content text null,
  active boolean not null default true
);

-- (اختياري) مقالات عبر Supabase (مفيد لاحقاً لتوسيع لوحة التحكم)
create table if not exists public.articles (
  id text primary key,
  title text not null,
  category text not null,
  lastUpdate text not null,
  intro text not null,
  details text not null,
  documents jsonb not null default '[]'::jsonb,
  steps jsonb not null default '[]'::jsonb,
  tips jsonb not null default '[]'::jsonb,
  fees text not null,
  warning text null,
  source text not null,
  active boolean not null default true
);

insert into public.site_settings (id, default_whatsapp)
values (1, null)
on conflict (id) do nothing;
```

### الأمان (مهم)
لوحة التحكم تعتمد على تسجيل دخول Supabase Auth (Email/Password).

- أنشئ مستخدم Admin من Supabase Auth.
- فعّل RLS (Row Level Security) على الجداول.
- أنشئ Policies تسمح بالقراءة العامة للموقع، والكتابة فقط لحساب الأدمن.

ملاحظة: كلمة المرور لا توضع داخل المشروع نهائياً. أنت تضبطها داخل Supabase Auth فقط.

سياسات مقترحة (Public read + Admin write فقط):

```sql
alter table public.services enable row level security;
alter table public.site_settings enable row level security;
alter table public.site_updates enable row level security;
alter table public.articles enable row level security;

-- القراءة للجميع (الموقع)
create policy "services read" on public.services
for select using (true);

create policy "settings read" on public.site_settings
for select using (true);

create policy "updates read" on public.site_updates
for select using (active = true);

create policy "articles read" on public.articles
for select using (active = true);

-- الكتابة للأدمن فقط (لوحة التحكم)
-- يعتمد على بريد الأدمن داخل JWT: auth.jwt() ->> 'email'
create policy "services write admin" on public.services
for all
to authenticated
using ((auth.jwt() ->> 'email') = 'httmth@gmail.com')
with check ((auth.jwt() ->> 'email') = 'httmth@gmail.com');

create policy "settings write admin" on public.site_settings
for all
to authenticated
using ((auth.jwt() ->> 'email') = 'httmth@gmail.com')
with check ((auth.jwt() ->> 'email') = 'httmth@gmail.com');

create policy "updates write admin" on public.site_updates
for all
to authenticated
using ((auth.jwt() ->> 'email') = 'httmth@gmail.com')
with check ((auth.jwt() ->> 'email') = 'httmth@gmail.com');

create policy "articles write admin" on public.articles
for all
to authenticated
using ((auth.jwt() ->> 'email') = 'httmth@gmail.com')
with check ((auth.jwt() ->> 'email') = 'httmth@gmail.com');
```

اقتراح إضافي: من لوحة Supabase (Authentication → Providers) عطّل “Email signups” حتى لا يستطيع أي شخص إنشاء حساب جديد.

## 2) الاستخدام

- افتح صفحة لوحة التحكم: `/admin`
- سجّل الدخول (email/password)
- أضف/عدّل/احذف خدمات
- ضع رقم واتساب خاص لكل خدمة (اختياري)

## 3) سلوك الموقع

- صفحة الخدمات `/services` تحاول تحميل الخدمات من Supabase، وإلا تستخدم القائمة الثابتة.
- صفحة الطلب `/request` عند الإرسال:
  - إذا كانت الخدمة لديها `whatsapp` سيتم الإرسال لهذا الرقم
  - وإلا سيتم الإرسال للرقم الافتراضي من `site_settings`
  - وإلا سيستخدم `NEXT_PUBLIC_WHATSAPP_PHONE`

## 4) التحديثات (زر “تحديثات 2026”)

- زر “تحديثات 2026” يظهر داخل قائمة الموبايل فقط.
- عند نشر خبر جديد في جدول `site_updates` سيظهر تنبيه (نقطة/نبض) بجانب الزر.
- المنطق يعتمد على مقارنة:
  - آخر نسخة تحديثات من Supabase (أحدث `date` + `id`)
  - مع آخر نسخة شاهدها المستخدم المحفوظة في `localStorage`.
