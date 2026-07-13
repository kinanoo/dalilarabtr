-- Password configuration for the protected /models gallery.
-- The password is stored only as a keyed HMAC digest generated server-side.

create extension if not exists pgcrypto;

create table if not exists public.models_gallery_settings (
  id smallint primary key default 1 check (id = 1),
  password_digest text not null check (password_digest ~ '^[a-f0-9]{64}$'),
  password_version uuid not null default gen_random_uuid(),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);

alter table public.models_gallery_settings enable row level security;

-- No browser-facing policies: only authenticated server routes using the
-- service role may read or change this setting.
revoke all on table public.models_gallery_settings from anon, authenticated;
grant all on table public.models_gallery_settings to service_role;

comment on table public.models_gallery_settings is
  'Private singleton configuration for the password-protected /models gallery.';
