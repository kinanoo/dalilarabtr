-- Add subcategory column
ALTER TABLE consultant_scenarios ADD COLUMN IF NOT EXISTS subcategory TEXT DEFAULT 'general';
