-- Row Level Security Policies for provider_metrics table (Phase 2)

-- Policy for providers to view their own metrics
CREATE POLICY "Providers can view their own metrics" ON provider_metrics
    FOR SELECT
    USING (
        provider_id = auth.uid() 
        AND EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role = 'provider'
        )
    );

-- Policy for providers to update their own metrics
CREATE POLICY "Providers can update their own metrics" ON provider_metrics
    FOR UPDATE
    USING (
        provider_id = auth.uid() 
        AND EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role = 'provider'
        )
    );

-- Policy for system to insert metrics (for automated updates)
CREATE POLICY "System can insert metrics" ON provider_metrics
    FOR INSERT
    WITH CHECK (
        provider_id IS NOT NULL
        AND EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = provider_id 
            AND role = 'provider'
        )
    );

-- Policy for admins to view all metrics (if admin role exists)
-- CREATE POLICY "Admins can view all metrics" ON provider_metrics
--     FOR SELECT
--     USING (
--         EXISTS (
--             SELECT 1 FROM profiles 
--             WHERE id = auth.uid() 
--             AND role = 'admin'
--         )
--     ); 