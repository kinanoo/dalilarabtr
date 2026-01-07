-- 1. Relax severity to TEXT to avoid enum errors
ALTER TABLE security_codes ALTER COLUMN severity TYPE TEXT;
ALTER TABLE security_codes DROP CONSTRAINT IF EXISTS security_codes_severity_check;

-- 2. Add 'effect' column if missing
ALTER TABLE security_codes ADD COLUMN IF NOT EXISTS effect TEXT;

-- 3. ensure description exists (it should, but just in case)
ALTER TABLE security_codes ADD COLUMN IF NOT EXISTS description TEXT;

-- 4. ensure category exists
ALTER TABLE security_codes ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'general';

-- 5. ensure active exists
ALTER TABLE security_codes ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true;
