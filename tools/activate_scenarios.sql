-- Add is_active column if it doesn't exist
ALTER TABLE consultant_scenarios ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Update all to true ensuring visibility
UPDATE consultant_scenarios SET is_active = true;
