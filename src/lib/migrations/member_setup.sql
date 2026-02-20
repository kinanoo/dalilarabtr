-- Enable UUID extension if not exists
create extension if not exists "uuid-ossp";

-- 1. Create 'member_profiles' table linked to auth.users
create table if not exists public.member_profiles (
  id uuid references auth.users not null primary key,
  full_name text,
  avatar_url text,
  role text default 'member', -- member, admin, moderator
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.member_profiles enable row level security;

-- Policy: Everyone can view basic profile info (needed for reviews/comments)
create policy "Public profiles are viewable by everyone"
  on public.member_profiles for select
  using ( true );

-- Policy: Users can update their own profile
create policy "Users can update own profile"
  on public.member_profiles for update
  using ( auth.uid() = id );

-- Policy: Users can insert their own profile
create policy "Users can insert own profile"
  on public.member_profiles for insert
  with check ( auth.uid() = id );

-- 2. Update 'service_providers' table
-- Add user_id (owner) and status
alter table public.service_providers 
add column if not exists user_id uuid references auth.users(id),
add column if not exists status text default 'approved' check (status in ('pending', 'approved', 'rejected', 'draft'));

-- Note: We default to 'approved' for existing legacy data so we don't break the live site.
-- New inserts should explicitly set 'pending'.

-- 3. Update 'articles' table (for News/Ideas)
alter table public.articles
add column if not exists user_id uuid references auth.users(id),
add column if not exists status text default 'approved' check (status in ('pending', 'approved', 'rejected', 'draft'));

-- 4. Create trigger to sync 'is_approved' boolean with 'status' text (Backward Compatibility)
-- For service_providers, we already have 'is_verified' (which is different) but let's assume we might have 'is_approved' or similar.
-- Actually, the Review system has 'is_approved', but service_providers usually just had 'active' or implicit trust.
-- Let's check if 'active' exists in service_providers? The typescript says 'active' is on AdminService type.
-- Let's enable RLS on service_providers if not enabled.

alter table public.service_providers enable row level security;

-- Policy: Public can view APPROVED services
create policy "Public view approved services"
  on public.service_providers for select
  using ( status = 'approved' );

-- Policy: Owners can view their own (even if pending)
create policy "Owners view own services"
  on public.service_providers for select
  using ( auth.uid() = user_id );

-- Policy: Owners can update their own
create policy "Owners update own services"
  on public.service_providers for update
  using ( auth.uid() = user_id );

-- Policy: Owners can insert
create policy "Owners insert services"
  on public.service_providers for insert
  with check ( auth.uid() = user_id );

-- Policy: Admins can do everything (we need a way to define admin, for now assume RLS bypass or separate role check)
-- Ideally, we check member_profiles.role = 'admin'
create policy "Admins full access services"
  on public.service_providers for all
  using ( 
    exists (
      select 1 from public.member_profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Repeat for Articles
alter table public.articles enable row level security;

create policy "Public view approved articles"
  on public.articles for select
  using ( status = 'approved' );

create policy "Owners view own articles"
  on public.articles for select
  using ( auth.uid() = user_id );

create policy "Owners update own articles"
  on public.articles for update
  using ( auth.uid() = user_id );

create policy "Owners insert articles"
  on public.articles for insert
  with check ( auth.uid() = user_id );

