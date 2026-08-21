-- Show the service-provider invitation at most once every seven days per
-- pseudonymous network/browser identity. Raw IP addresses are never stored.

CREATE TABLE IF NOT EXISTS public.service_provider_invite_impressions (
  visitor_hash text PRIMARY KEY CHECK (length(visitor_hash) = 64),
  last_shown_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS service_provider_invite_last_shown_idx
  ON public.service_provider_invite_impressions (last_shown_at);

ALTER TABLE public.service_provider_invite_impressions ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.service_provider_invite_impressions FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.claim_service_provider_invite(p_visitor_hash text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
DECLARE
  claimed_at timestamptz;
BEGIN
  IF p_visitor_hash IS NULL OR length(p_visitor_hash) <> 64 THEN
    RAISE EXCEPTION 'invalid visitor hash';
  END IF;

  -- Keep only the short operational window needed for frequency control.
  DELETE FROM public.service_provider_invite_impressions
  WHERE last_shown_at < now() - interval '14 days';

  INSERT INTO public.service_provider_invite_impressions (visitor_hash, last_shown_at)
  VALUES (p_visitor_hash, now())
  ON CONFLICT (visitor_hash) DO UPDATE
    SET last_shown_at = EXCLUDED.last_shown_at
    WHERE service_provider_invite_impressions.last_shown_at <= now() - interval '7 days'
  RETURNING last_shown_at INTO claimed_at;

  IF FOUND THEN
    RETURN jsonb_build_object(
      'should_show', true,
      'last_shown_at', claimed_at
    );
  END IF;

  SELECT last_shown_at INTO claimed_at
  FROM public.service_provider_invite_impressions
  WHERE visitor_hash = p_visitor_hash;

  RETURN jsonb_build_object(
    'should_show', false,
    'last_shown_at', claimed_at
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.claim_service_provider_invite(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_service_provider_invite(text) TO service_role;
