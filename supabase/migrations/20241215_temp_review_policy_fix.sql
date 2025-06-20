-- Temporary fix for review RLS policy
-- This creates a more permissive policy for testing

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Reviewers can create reviews for their bookings" ON reviews;
DROP POLICY IF EXISTS "Temp reviewers can create reviews" ON reviews;

-- Create a more permissive temporary policy
CREATE POLICY "Temp reviewers can create reviews" ON reviews
    FOR INSERT
    WITH CHECK (
        reviewer_id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM bookings b
            WHERE b.id = booking_id
            AND b.consumer_id = auth.uid()
        )
    );

-- Create the standard policy as well (will be used when the temp one is removed)
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

-- To remove the temporary policy later, run:
-- DROP POLICY IF EXISTS "Temp reviewers can create reviews" ON reviews; 