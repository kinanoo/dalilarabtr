-- Add active column if it doesn't exist
ALTER TABLE faqs ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true;

-- Update all to true ensuring visibility
UPDATE faqs SET active = true;
