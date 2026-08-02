-- A listing with no approved reviews must not look like it has a 5-star score.

ALTER TABLE public.service_providers
  ALTER COLUMN rating SET DEFAULT 0,
  ALTER COLUMN rating_avg SET DEFAULT 0;

UPDATE public.service_providers
SET
  rating = 0,
  rating_avg = 0,
  updated_at = now()
WHERE coalesce(review_count, 0) = 0
  AND (coalesce(rating, 0) <> 0 OR coalesce(rating_avg, 0) <> 0);
