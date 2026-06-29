-- ============================================================================
-- Service-provider pretty URL slugs
-- Run once in Supabase → SQL Editor.
--
-- What it does:
--   1) gen_service_slug(name, id): builds a url-safe slug from the (Arabic)
--      name — rough 1:1 transliteration to Latin — plus a 6-char id suffix so
--      it's unique. Falls back to "service-<id>" if the name has no usable
--      letters. Never raises (a slug failure must not block a write).
--   2) A BEFORE INSERT/UPDATE trigger that fills `slug` whenever it's empty —
--      so every new or edited provider gets a slug automatically, from any
--      path (member form, admin editor, scripts).
--   3) A one-time backfill for existing rows.
--
-- The app reads `slug || id`, and /services/<x> resolves by slug OR id, so
-- old id-based links keep working after this runs.
-- Safe to re-run (idempotent).
-- ============================================================================

create or replace function public.gen_service_slug(p_name text, p_id uuid)
returns text
language plpgsql
immutable
as $$
declare
  base text;
begin
  base := lower(coalesce(p_name, ''));
  -- rough Arabic -> Latin (1:1; the trailing hamza + diacritics are deleted)
  base := translate(
    base,
    'ابتثجحخدذرزسشصضطظعغفقكلمنهويىةأإآؤئءًٌٍَُِّْ',
    'abttjhkddrzsssdtzagfqklmnhwyaaaiawe'
  );
  base := regexp_replace(base, '[^a-z0-9 -]', '', 'g'); -- drop anything non-latin
  base := regexp_replace(btrim(base), '[ ]+', '-', 'g');
  base := regexp_replace(base, '-+', '-', 'g');
  base := btrim(base, '-');
  if coalesce(base, '') = '' then
    base := 'service';
  end if;
  return left(base || '-' || left(replace(p_id::text, '-', ''), 6), 90);
exception when others then
  return null; -- never block a write
end;
$$;

create or replace function public.set_service_slug()
returns trigger
language plpgsql
as $$
begin
  if new.slug is null or btrim(new.slug) = '' then
    new.slug := public.gen_service_slug(new.name, new.id);
  end if;
  return new;
end;
$$;

drop trigger if exists trg_set_service_slug on public.service_providers;
create trigger trg_set_service_slug
  before insert or update on public.service_providers
  for each row execute function public.set_service_slug();

-- One-time backfill for rows that don't have a slug yet.
update public.service_providers
set slug = public.gen_service_slug(name, id)
where slug is null or btrim(slug) = '';

-- Sanity check (optional): see a few generated slugs.
-- select id, name, slug from public.service_providers order by created_at desc limit 10;
