-- ============================================================
-- Trigger: إنشاء member_profiles تلقائياً عند أي تسجيل جديد
-- سواء عبر Email أو Google OAuth
-- ============================================================
-- شغّل هذا الكود مرة واحدة فقط من:
-- Supabase Dashboard → SQL Editor → New Query → Paste → Run
-- ============================================================

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.member_profiles (id, full_name, avatar_url, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url',
    'member'
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

-- إزالة الـ trigger القديم إن وجد ثم إعادة إنشائه
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
