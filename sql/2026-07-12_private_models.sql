-- Private Models Gallery
-- Admin-managed image collections shared through expiring secret links.

create extension if not exists pgcrypto;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'private-models',
  'private-models',
  false,
  15728640,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create table if not exists public.model_collections (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  watermark_text text not null default 'موديلس',
  is_active boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.model_assets (
  id uuid primary key default gen_random_uuid(),
  collection_id uuid not null references public.model_collections(id) on delete cascade,
  title text,
  caption text,
  storage_bucket text not null default 'private-models',
  storage_path text not null,
  mime_type text,
  file_size bigint,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (storage_bucket, storage_path)
);

create table if not exists public.model_share_links (
  id uuid primary key default gen_random_uuid(),
  collection_id uuid not null references public.model_collections(id) on delete cascade,
  token_hash text not null unique,
  label text,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  max_views integer,
  view_count integer not null default 0,
  last_viewed_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.model_link_views (
  id uuid primary key default gen_random_uuid(),
  link_id uuid not null references public.model_share_links(id) on delete cascade,
  viewed_at timestamptz not null default now(),
  ip_hash text,
  user_agent text,
  referrer text
);

create index if not exists idx_model_assets_collection_sort
  on public.model_assets(collection_id, sort_order, created_at);

create index if not exists idx_model_share_links_collection
  on public.model_share_links(collection_id, created_at desc);

create index if not exists idx_model_share_links_token_hash
  on public.model_share_links(token_hash);

create index if not exists idx_model_link_views_link
  on public.model_link_views(link_id, viewed_at desc);

create or replace function public.increment_model_link_view_count(p_link_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.model_share_links
  set view_count = view_count + 1,
      last_viewed_at = now()
  where id = p_link_id;
$$;

create or replace function public.touch_model_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_model_collections_touch on public.model_collections;
create trigger trg_model_collections_touch
before update on public.model_collections
for each row execute function public.touch_model_updated_at();

drop trigger if exists trg_model_assets_touch on public.model_assets;
create trigger trg_model_assets_touch
before update on public.model_assets
for each row execute function public.touch_model_updated_at();

alter table public.model_collections enable row level security;
alter table public.model_assets enable row level security;
alter table public.model_share_links enable row level security;
alter table public.model_link_views enable row level security;

-- No public table policies on purpose. Public viewing is handled server-side
-- by /models/[token], after validating the expiring token and creating
-- short-lived signed URLs for private storage objects.
