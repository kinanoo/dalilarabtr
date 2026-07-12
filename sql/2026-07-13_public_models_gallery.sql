-- Public model gallery controls
-- Lets admins choose which private model collections/assets are also shown
-- on the permanent public /models gallery.

alter table public.model_collections
  add column if not exists show_in_gallery boolean not null default false,
  add column if not exists gallery_order integer not null default 0;

alter table public.model_collections
  alter column watermark_text set default '';

alter table public.model_assets
  add column if not exists show_in_gallery boolean not null default true;

create index if not exists idx_model_collections_public_gallery
  on public.model_collections(show_in_gallery, is_active, gallery_order, created_at desc);

create index if not exists idx_model_assets_public_gallery
  on public.model_assets(collection_id, show_in_gallery, is_active, sort_order, created_at);

comment on column public.model_collections.show_in_gallery is
  'If true, active images from this collection may appear on the permanent public /models gallery.';

comment on column public.model_collections.gallery_order is
  'Manual ordering hint for the permanent public /models gallery. Lower values appear first.';

comment on column public.model_assets.show_in_gallery is
  'If true, this active asset may appear on the permanent public /models gallery when its collection is public.';
