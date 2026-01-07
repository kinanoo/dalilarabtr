-- Add category column to consultant_scenarios
ALTER TABLE consultant_scenarios ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'general';

-- Ensure text search works if vector is used, otherwise simple text list
-- No indices needed for now
