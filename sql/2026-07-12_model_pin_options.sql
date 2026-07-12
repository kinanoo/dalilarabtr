-- Model gallery PIN and viewer options
-- Stores PIN hashes only; never store the plain PIN value.

alter table public.model_collections
  add column if not exists access_pin_hash text,
  add column if not exists pin_hint text,
  add column if not exists default_link_minutes integer not null default 43200;

alter table public.model_assets
  add column if not exists access_pin_hash text,
  add column if not exists pin_hint text;

comment on column public.model_collections.access_pin_hash is
  'Optional collection-level PIN hash. Null means the collection opens without PIN.';

comment on column public.model_assets.access_pin_hash is
  'Optional asset-level PIN hash. Null means the image opens without PIN.';

comment on column public.model_collections.default_link_minutes is
  'Default main-link lifetime used when auto-generating a collection link.';

alter table public.model_collections
  drop constraint if exists model_collections_default_link_minutes_check;

alter table public.model_collections
  add constraint model_collections_default_link_minutes_check
  check (default_link_minutes between 5 and 43200);
