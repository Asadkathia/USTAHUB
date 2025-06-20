-- 20241217_fix_duplicate_booking_statuses.sql
-- This script fixes issues with duplicate booking statuses and ensures consistency

-- Step 1: Find bookings with both pending_confirmation and completed statuses
WITH booking_status_counts AS (
  SELECT 
    booking_id,
    COUNT(*) as status_count,
    bool_or(status = 'completed') as has_completed,
    bool_or(status = 'pending_confirmation') as has_pending
  FROM booking_statuses
  GROUP BY booking_id
  HAVING COUNT(*) > 1
),
conflicting_bookings AS (
  SELECT 
    booking_id
  FROM booking_status_counts
  WHERE has_completed = true AND has_pending = true
)

-- Step 2: Log the conflicting bookings (for audit)
SELECT 
  b.id as booking_id, 
  b.status as booking_status,
  bs.id as status_id,
  bs.status as status_record,
  bs.created_at
FROM bookings b
JOIN booking_statuses bs ON b.id = bs.booking_id
WHERE b.id IN (SELECT booking_id FROM conflicting_bookings)
ORDER BY b.id, bs.created_at DESC;

-- Step 3: For each booking with both statuses, keep only the most recent one
WITH duplicate_statuses AS (
  SELECT 
    id,
    booking_id,
    status,
    created_at,
    ROW_NUMBER() OVER (PARTITION BY booking_id ORDER BY created_at DESC) as row_num
  FROM booking_statuses
  WHERE booking_id IN (
    SELECT booking_id FROM booking_statuses
    GROUP BY booking_id
    HAVING COUNT(*) > 1
  )
)

-- Delete all but the most recent status record for each booking
DELETE FROM booking_statuses
WHERE id IN (
  SELECT id FROM duplicate_statuses WHERE row_num > 1
);

-- Step 4: Update bookings table to match the most recent status in booking_statuses
WITH latest_statuses AS (
  SELECT DISTINCT ON (booking_id)
    booking_id,
    status
  FROM booking_statuses
  ORDER BY booking_id, created_at DESC
)

UPDATE bookings b
SET 
  status = ls.status,
  updated_at = NOW()
FROM latest_statuses ls
WHERE b.id = ls.booking_id
  AND b.status != ls.status;

-- Step 5: Add an index to improve performance of booking status queries
CREATE INDEX IF NOT EXISTS idx_booking_statuses_booking_id_status
ON booking_statuses(booking_id, status);

-- Step 6: Create a function to clean up duplicate booking statuses periodically
CREATE OR REPLACE FUNCTION cleanup_duplicate_booking_statuses()
RETURNS void AS $$
DECLARE
  cleaned_count INTEGER;
BEGIN
  -- Delete all but the most recent status for each booking
  WITH duplicate_statuses AS (
    SELECT 
      id,
      booking_id,
      ROW_NUMBER() OVER (PARTITION BY booking_id, status ORDER BY created_at DESC) as row_num
    FROM booking_statuses
  )
  DELETE FROM booking_statuses
  WHERE id IN (
    SELECT id FROM duplicate_statuses WHERE row_num > 1
  );
  
  GET DIAGNOSTICS cleaned_count = ROW_COUNT;
  RAISE NOTICE 'Cleaned up % duplicate booking status records', cleaned_count;
END;
$$ LANGUAGE plpgsql; 