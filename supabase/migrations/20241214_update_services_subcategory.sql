-- Migration: Update services table to make subcategory NOT NULL
UPDATE services SET subcategory = category WHERE subcategory IS NULL OR subcategory = '';
ALTER TABLE services ALTER COLUMN subcategory SET NOT NULL;
