-- Bilingual (Turkish) columns for security_codes.
--
-- Additive + nullable + idempotent — safe to run on production. Arabic stays
-- the source of truth; these hold the Turkish translation shown when a reader
-- switches the codes pages to Türkçe (/codes?lang=tr, /codes/<CODE>?lang=tr).
-- NULL = fall back to Arabic, so every page keeps working before and while the
-- translations are being filled in.
--
-- Run in Supabase SQL editor. The translations themselves land via a separate,
-- reviewable UPDATE migration (2026-07-02_security_codes_turkish_data.sql).

alter table public.security_codes
  add column if not exists title_tr        text,
  add column if not exists description_tr  text,
  add column if not exists how_to_remove_tr text,
  add column if not exists duration_tr     text;

comment on column public.security_codes.title_tr        is 'Turkish translation of title (nullable → falls back to Arabic in the UI)';
comment on column public.security_codes.description_tr  is 'Turkish translation of description (nullable → falls back to Arabic)';
comment on column public.security_codes.how_to_remove_tr is 'Turkish translation of how_to_remove (nullable → falls back to Arabic)';
comment on column public.security_codes.duration_tr     is 'Turkish translation of duration (nullable → falls back to Arabic)';
