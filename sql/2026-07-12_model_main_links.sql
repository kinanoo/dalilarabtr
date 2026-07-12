-- Model gallery main links
-- Adds one reusable random link per collection, with safe rotation support.

alter table public.model_share_links
  add column if not exists token text,
  add column if not exists link_kind text not null default 'temporary';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'model_share_links_kind_check'
      and conrelid = 'public.model_share_links'::regclass
  ) then
    alter table public.model_share_links
      add constraint model_share_links_kind_check
      check (link_kind in ('temporary', 'main'));
  end if;
end $$;

create unique index if not exists idx_model_share_links_token_value
  on public.model_share_links(token)
  where token is not null;

create index if not exists idx_model_share_links_kind_collection
  on public.model_share_links(collection_id, link_kind, created_at desc);

create unique index if not exists ux_model_share_links_active_main
  on public.model_share_links(collection_id)
  where link_kind = 'main' and revoked_at is null;

comment on column public.model_share_links.token is
  'Plain token for admin copy/reuse only. Public validation still uses token_hash.';

comment on column public.model_share_links.link_kind is
  'temporary = one-off shared link, main = current reusable collection link.';
