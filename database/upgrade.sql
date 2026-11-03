-- =====================================================================
-- VELOUR upgrade: adds the columns the Lovable design needs.
-- Safe to run more than once (every line uses IF NOT EXISTS).
-- =====================================================================
ALTER TABLE hotels ADD COLUMN IF NOT EXISTS slug TEXT;
ALTER TABLE hotels ADD COLUMN IF NOT EXISTS tagline TEXT;
ALTER TABLE hotels ADD COLUMN IF NOT EXISTS region TEXT;
ALTER TABLE hotels ADD COLUMN IF NOT EXISTS country TEXT NOT NULL DEFAULT 'South Africa';
ALTER TABLE hotels ADD COLUMN IF NOT EXISTS lat NUMERIC(9,6);
ALTER TABLE hotels ADD COLUMN IF NOT EXISTS lng NUMERIC(9,6);
ALTER TABLE hotels ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;
ALTER TABLE hotels ADD COLUMN IF NOT EXISTS property_type TEXT;
ALTER TABLE hotels ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
ALTER TABLE hotels ADD COLUMN IF NOT EXISTS facilities TEXT[] DEFAULT '{}';
ALTER TABLE hotels ADD COLUMN IF NOT EXISTS policies TEXT;

ALTER TABLE hotel_images ADD COLUMN IF NOT EXISTS caption TEXT;
ALTER TABLE hotel_images ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE hotel_images ADD COLUMN IF NOT EXISTS display_order INT NOT NULL DEFAULT 0;

ALTER TABLE rooms ADD COLUMN IF NOT EXISTS image_path TEXT;
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS amenities TEXT[] DEFAULT '{}';

CREATE UNIQUE INDEX IF NOT EXISTS idx_hotels_slug_unique ON hotels (slug);
