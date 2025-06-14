-- Row Level Security Policies for activity_logs table (Phase 2)

-- Policy for users to view their own activity logs
CREATE POLICY "Users can view their own activities" ON activity_logs
    FOR SELECT
    USING (user_id = auth.uid());

-- Policy for users to insert their own activity logs
CREATE POLICY "Users can create their own activities" ON activity_logs
    FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- Policy for users to update their own activity logs (mark as read, etc.)
CREATE POLICY "Users can update their own activities" ON activity_logs
    FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Policy for system to create activity logs for any user (triggered functions)
CREATE POLICY "System can create activities for users" ON activity_logs
    FOR INSERT
    WITH CHECK (
        user_id IS NOT NULL
        AND EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = user_id
        )
    );

-- Policy for users to view activities where they are the related user
CREATE POLICY "Users can view activities involving them" ON activity_logs
    FOR SELECT
    USING (
        related_user_id = auth.uid()
        AND activity_type IN ('booking_created', 'booking_confirmed', 'review_given')
    ); 