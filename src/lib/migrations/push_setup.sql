-- Create table to store push subscriptions
create table if not exists public.push_subscriptions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id), -- Optional: Link to user if logged in
  endpoint text unique not null,
  p256dh text not null,
  auth text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  last_used_at timestamp with time zone default timezone('utc'::text, now())
);

-- Enable RLS
alter table public.push_subscriptions enable row level security;

-- Policies
-- 1. Anyone can insert (subscribe)
create policy "Anyone can subscribe to push"
  on public.push_subscriptions for insert
  with check (true);

-- 2. Users can delete their own subscription (based on endpoint match?) 
-- Since endpoint is unique, let's allow delete if they know the endpoint (or just admin)
create policy "Admins can view subscriptions"
  on public.push_subscriptions for select
  using ( 
    exists (
      select 1 from public.member_profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Create Index
create index if not exists push_subscriptions_user_idx on public.push_subscriptions(user_id);
