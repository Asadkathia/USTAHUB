-- 20241216_fix_booking_status_inconsistencies.sql
-- This script fixes inconsistencies between bookings.status and booking_statuses table
-- by ensuring bookings with 'completed' status in booking_statuses are also marked as completed in bookings table

-- Step 1: Find bookings that have 'completed' status in booking_statuses but not in bookings table
WITH completed_in_statuses AS (
  SELECT DISTINCT bs.booking_id
  FROM booking_statuses bs
  WHERE bs.status = 'completed'
),
inconsistent_bookings AS (
  SELECT b.id
  FROM bookings b
  JOIN completed_in_statuses cis ON b.id = cis.booking_id
  WHERE b.status != 'completed'
)

-- Step 2: Update the inconsistent bookings to have 'completed' status
UPDATE bookings
SET 
  status = 'completed',
  updated_at = NOW()
FROM inconsistent_bookings
WHERE bookings.id = inconsistent_bookings.id;

-- Step 3: Log the number of fixed bookings (for audit purposes)
DO $$
DECLARE
  fixed_count INTEGER;
BEGIN
  WITH completed_in_statuses AS (
    SELECT DISTINCT bs.booking_id
    FROM booking_statuses bs
    WHERE bs.status = 'completed'
  ),
  inconsistent_bookings AS (
    SELECT b.id
    FROM bookings b
    JOIN completed_in_statuses cis ON b.id = cis.booking_id
    WHERE b.status != 'completed'
  )
  SELECT COUNT(*) INTO fixed_count FROM inconsistent_bookings;
  
  RAISE NOTICE 'Fixed % inconsistent booking status records', fixed_count;
END $$;

-- Step 4: Create a trigger to ensure consistency in the future
CREATE OR REPLACE FUNCTION sync_booking_status()
RETURNS TRIGGER AS $$
BEGIN
  -- When a 'completed' status is added to booking_statuses, update the bookings table
  IF NEW.status = 'completed' THEN
    UPDATE bookings
    SET status = 'completed', updated_at = NOW()
    WHERE id = NEW.booking_id AND status != 'completed';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop the trigger if it exists
DROP TRIGGER IF EXISTS ensure_booking_status_sync ON booking_statuses;

-- Create the trigger
CREATE TRIGGER ensure_booking_status_sync
AFTER INSERT ON booking_statuses
FOR EACH ROW
EXECUTE FUNCTION sync_booking_status();

-- Add a comment to explain the trigger
COMMENT ON TRIGGER ensure_booking_status_sync ON booking_statuses IS 
'Ensures that when a completed status is added to booking_statuses, the bookings table is updated accordingly'; 