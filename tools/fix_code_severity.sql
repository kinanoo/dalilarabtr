-- Drop the severity enum constraint if it exists (converting to text is safest for flexibility)
-- First, try to alter the column type to text
ALTER TABLE security_codes ALTER COLUMN severity TYPE TEXT;

-- If there's a constraint, drop it
ALTER TABLE security_codes DROP CONSTRAINT IF EXISTS security_codes_severity_check;
