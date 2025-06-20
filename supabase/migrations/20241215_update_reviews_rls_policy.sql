-- Update RLS policy for reviews to handle service completion flow
-- This migration updates the reviews table RLS policy to allow review creation
-- for bookings that are in 'pending_confirmation' status as well as 'completed'

-- Drop the existing policy
DROP POLICY IF EXISTS "Reviewers can create reviews for their bookings" ON reviews;

-- Create the updated policy
CREATE POLICY "Reviewers can create reviews for their bookings" ON reviews
    FOR INSERT
    WITH CHECK (
        reviewer_id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM bookings b
            WHERE b.id = booking_id
            AND b.consumer_id = auth.uid()
            AND b.status IN ('completed', 'pending_confirmation')
            AND b.completed_by_provider = true
        )
    );

-- Also ensure we have proper indexes for performance
CREATE INDEX IF NOT EXISTS idx_bookings_consumer_status_provider_completion 
ON bookings (consumer_id, status, completed_by_provider) 
WHERE status IN ('completed', 'pending_confirmation'); 