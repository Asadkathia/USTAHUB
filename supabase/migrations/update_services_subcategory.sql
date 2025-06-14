-- Migration: Update services table to make subcategory NOT NULL
-- This migration ensures all services have a proper subcategory

-- First, update any existing services that might have NULL subcategory
-- Set subcategory to be the same as category for any NULL values
UPDATE services 
SET subcategory = category 
WHERE subcategory IS NULL OR subcategory = '';

-- Now alter the table to make subcategory NOT NULL
ALTER TABLE services 
ALTER COLUMN subcategory SET NOT NULL;

-- Add a comment to document this change
COMMENT ON COLUMN services.subcategory IS 'Required subcategory field - matches provider primary_service_category'; 