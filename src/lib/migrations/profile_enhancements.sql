-- ===================================================================
-- Profile Enhancements — add bio, city, updated_at to member_profiles
-- Run in: Supabase Dashboard → SQL Editor
-- ===================================================================

-- A. Add optional profile fields
ALTER TABLE public.member_profiles
  ADD COLUMN IF NOT EXISTS bio TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- B. Auto-update updated_at on profile changes
CREATE OR REPLACE FUNCTION update_member_profile_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_member_profile_timestamp ON public.member_profiles;
CREATE TRIGGER update_member_profile_timestamp
  BEFORE UPDATE ON public.member_profiles
  FOR EACH ROW EXECUTE FUNCTION update_member_profile_updated_at();

-- C. Allow users to see their own reviews (including pending)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE policyname = 'users_read_own_reviews' AND tablename = 'service_reviews'
    ) THEN
        CREATE POLICY "users_read_own_reviews" ON service_reviews
            FOR SELECT USING (auth.uid() = user_id);
    END IF;
END $$;
