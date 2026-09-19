-- Additive only: these columns preserve every value from the historical Supabase rows.
-- Apply once to databases that already ran 0001 before the columns were added there.
ALTER TABLE preinscriptions ADD COLUMN city TEXT;
ALTER TABLE preinscriptions ADD COLUMN age INTEGER;
ALTER TABLE preinscriptions ADD COLUMN sex TEXT;
ALTER TABLE preinscriptions ADD COLUMN bike_type TEXT;
