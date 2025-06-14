-- Row Level Security Policies for reviews table (Phase 2)

-- Policy for consumers to view all active reviews
CREATE POLICY "Everyone can view active reviews" ON reviews
    FOR SELECT
    USING (status = 'active');

-- Policy for reviewers to create reviews for their own bookings
CREATE POLICY "Reviewers can create reviews for their bookings" ON reviews
    FOR INSERT
    WITH CHECK (
        reviewer_id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM bookings b
            WHERE b.id = booking_id
            AND b.consumer_id = auth.uid()
            AND b.status = 'completed'
        )
    );

-- Policy for reviewers to update their own reviews (within time limit)
CREATE POLICY "Reviewers can update their own reviews" ON reviews
    FOR UPDATE
    USING (
        reviewer_id = auth.uid()
        AND created_at > NOW() - INTERVAL '7 days' -- Allow edits within 7 days
    )
    WITH CHECK (reviewer_id = auth.uid());

-- Policy for providers to respond to reviews about them
CREATE POLICY "Providers can respond to their reviews" ON reviews
    FOR UPDATE
    USING (
        provider_id = auth.uid()
        AND provider_response IS NULL -- Can only add response, not modify
    )
    WITH CHECK (
        provider_id = auth.uid()
        AND provider_response IS NOT NULL
    );

-- Policy for providers to view reviews about them (including hidden ones)
CREATE POLICY "Providers can view all reviews about them" ON reviews
    FOR SELECT
    USING (
        provider_id = auth.uid()
        AND status IN ('active', 'hidden')
    ); 