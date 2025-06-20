-- 20241218_comprehensive_booking_status_fix.sql
-- This script provides a comprehensive fix for all booking status issues

-- Step 1: Create a temporary table to log actions for auditing
CREATE TEMP TABLE booking_status_fixes (
  booking_id UUID,
  action TEXT,
  details TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Step 2: Remove duplicate booking_statuses entries (keep only the most recent for each booking_id + status combination)
WITH duplicate_statuses AS (
  SELECT 
    id,
    booking_id,
    status,
    created_at,
    ROW_NUMBER() OVER (PARTITION BY booking_id, status ORDER BY created_at DESC) as row_num
  FROM booking_statuses
)
INSERT INTO booking_status_fixes (booking_id, action, details)
SELECT 
  booking_id, 
  'DELETED_DUPLICATE_STATUS', 
  'Deleted duplicate ' || status || ' status record with ID ' || id
FROM duplicate_statuses 
WHERE row_num > 1;

-- Delete the duplicate records
DELETE FROM booking_statuses
WHERE id IN (
  SELECT id FROM (
    SELECT 
      id,
      ROW_NUMBER() OVER (PARTITION BY booking_id, status ORDER BY created_at DESC) as row_num
    FROM booking_statuses
  ) sub
  WHERE row_num > 1
);

-- Step 3: Find bookings with conflicting statuses (both pending_confirmation and completed in booking_statuses)
WITH booking_status_counts AS (
  SELECT 
    booking_id,
    bool_or(status = 'completed') as has_completed,
    bool_or(status = 'pending_confirmation') as has_pending
  FROM booking_statuses
  GROUP BY booking_id
),
conflicting_bookings AS (
  SELECT 
    booking_id
  FROM booking_status_counts
  WHERE has_completed = true AND has_pending = true
)
INSERT INTO booking_status_fixes (booking_id, action, details)
SELECT 
  cb.booking_id, 
  'CONFLICTING_STATUSES', 
  'Booking has both completed and pending_confirmation statuses'
FROM conflicting_bookings cb;

-- Step 4: For bookings with conflicting statuses, keep only the completed status (it's the final state)
WITH conflicting_bookings AS (
  SELECT 
    bs1.booking_id
  FROM booking_statuses bs1
  JOIN booking_statuses bs2 ON bs1.booking_id = bs2.booking_id
  WHERE bs1.status = 'completed' AND bs2.status = 'pending_confirmation'
)
DELETE FROM booking_statuses
WHERE id IN (
  SELECT bs.id
  FROM booking_statuses bs
  JOIN conflicting_bookings cb ON bs.booking_id = cb.booking_id
  WHERE bs.status = 'pending_confirmation'
);

-- Step 5: Update bookings table to match the most recent status in booking_statuses
WITH latest_statuses AS (
  SELECT DISTINCT ON (booking_id)
    booking_id,
    status,
    created_at
  FROM booking_statuses
  ORDER BY booking_id, created_at DESC
)
INSERT INTO booking_status_fixes (booking_id, action, details)
SELECT 
  b.id, 
  'UPDATED_BOOKING_STATUS', 
  'Updated booking status from ' || b.status || ' to ' || ls.status
FROM bookings b
JOIN latest_statuses ls ON b.id = ls.booking_id
WHERE b.status != ls.status;

-- Update the bookings table
UPDATE bookings b
SET 
  status = ls.status,
  updated_at = NOW()
FROM (
  SELECT DISTINCT ON (booking_id)
    booking_id,
    status
  FROM booking_statuses
  ORDER BY booking_id, created_at DESC
) ls
WHERE b.id = ls.booking_id
  AND b.status != ls.status;

-- Step 6: Find bookings with status in bookings table but no corresponding record in booking_statuses
INSERT INTO booking_status_fixes (booking_id, action, details)
SELECT 
  b.id, 
  'MISSING_STATUS_RECORD', 
  'Booking has status ' || b.status || ' but no corresponding record in booking_statuses'
FROM bookings b
LEFT JOIN booking_statuses bs ON b.id = bs.booking_id AND b.status = bs.status
WHERE bs.id IS NULL;

-- Add missing status records
INSERT INTO booking_statuses (booking_id, status, notes)
SELECT 
  b.id, 
  b.status, 
  'Automatically added to fix missing status record'
FROM bookings b
LEFT JOIN booking_statuses bs ON b.id = bs.booking_id AND b.status = bs.status
WHERE bs.id IS NULL;

-- Step 7: Create a trigger to maintain consistency between bookings and booking_statuses
CREATE OR REPLACE FUNCTION maintain_booking_status_consistency()
RETURNS TRIGGER AS $$
BEGIN
  -- When a new status is added to booking_statuses
  IF TG_OP = 'INSERT' THEN
    -- Update the bookings table with the new status
    UPDATE bookings
    SET 
      status = NEW.status,
      updated_at = NOW()
    WHERE id = NEW.booking_id AND status != NEW.status;
  
  -- When a booking status is updated
  ELSIF TG_OP = 'UPDATE' THEN
    -- If the status in bookings doesn't match the latest in booking_statuses
    IF EXISTS (
      SELECT 1 FROM bookings 
      WHERE id = NEW.booking_id AND status != NEW.status
    ) THEN
      UPDATE bookings
      SET 
        status = NEW.status,
        updated_at = NOW()
      WHERE id = NEW.booking_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop the trigger if it exists
DROP TRIGGER IF EXISTS maintain_booking_status_consistency_trigger ON booking_statuses;

-- Create the trigger
CREATE TRIGGER maintain_booking_status_consistency_trigger
AFTER INSERT OR UPDATE ON booking_statuses
FOR EACH ROW
EXECUTE FUNCTION maintain_booking_status_consistency();

-- Step 8: Create a function to clean up booking statuses periodically
CREATE OR REPLACE FUNCTION cleanup_booking_statuses()
RETURNS void AS $$
DECLARE
  cleaned_count INTEGER;
BEGIN
  -- Remove duplicate status records
  WITH duplicate_statuses AS (
    SELECT 
      id,
      ROW_NUMBER() OVER (PARTITION BY booking_id, status ORDER BY created_at DESC) as row_num
    FROM booking_statuses
  )
  DELETE FROM booking_statuses
  WHERE id IN (
    SELECT id FROM duplicate_statuses WHERE row_num > 1
  );
  
  GET DIAGNOSTICS cleaned_count = ROW_COUNT;
  RAISE NOTICE 'Cleaned up % duplicate booking status records', cleaned_count;
  
  -- Ensure bookings table matches the latest status in booking_statuses
  UPDATE bookings b
  SET 
    status = ls.status,
    updated_at = NOW()
  FROM (
    SELECT DISTINCT ON (booking_id)
      booking_id,
      status
    FROM booking_statuses
    ORDER BY booking_id, created_at DESC
  ) ls
  WHERE b.id = ls.booking_id
    AND b.status != ls.status;
    
  GET DIAGNOSTICS cleaned_count = ROW_COUNT;
  RAISE NOTICE 'Updated % bookings to match their latest status', cleaned_count;
END;
$$ LANGUAGE plpgsql;

-- Step 9: Output the results of the fixes
SELECT action, COUNT(*) as count
FROM booking_status_fixes
GROUP BY action
ORDER BY count DESC;

-- Output details of what was fixed
SELECT * FROM booking_status_fixes
ORDER BY timestamp DESC; 