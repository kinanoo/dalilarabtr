-- إصلاح جداول التحديثات والأسئلة الشائعة وتفعيل الصلاحيات

-- 1. جدول التحديثات (Updates)
create table if not exists updates (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  type text not null, -- news, alert, feature
  content text,
  date text, -- YYYY-MM-DD
  active boolean default true,
  created_at timestamp with time zone default now()
);

-- تفعيل الحماية
alter table updates enable row level security;

-- السماح للجميع (زوار) بالقراءة فقط
create policy "Public Read Updates" on updates for select using (true);

-- السماح للمدير (المسجل دخول) بكل الصلاحيات (إضافة، تعديل، حذف)
-- نقوم بحذف السياسة القديمة إذا وجدت لتجنب التكرار
drop policy if exists "Admin All Updates" on updates;
create policy "Admin All Updates" on updates for all using (auth.role() = 'authenticated');


-- 2. جدول الأسئلة الشائعة (FAQs)
create table if not exists faqs (
  id uuid default uuid_generate_v4() primary key,
  question text not null,
  answer text not null,
  category text default 'general',
  active boolean default true,
  created_at timestamp with time zone default now()
);

-- تفعيل الحماية
alter table faqs enable row level security;

-- السماح للجميع (زوار) بالقراءة فقط
create policy "Public Read FAQs" on faqs for select using (true);

-- السماح للمدير (المسجل دخول) بكل الصلاحيات
drop policy if exists "Admin All FAQs" on faqs;
create policy "Admin All FAQs" on faqs for all using (auth.role() = 'authenticated');

-- 3. صلاحيات إضافية لجدول الصور (Storage) إذا لزم الأمر
-- (عادة ما يتم ضبطها من واجهة Storage، ولكن هذا تذكير)
