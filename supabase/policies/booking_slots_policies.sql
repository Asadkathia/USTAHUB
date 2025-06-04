-- Enable RLS on booking_slots table
ALTER TABLE booking_slots ENABLE ROW LEVEL SECURITY;

-- Policy for providers to manage their own booking slots
CREATE POLICY "Providers can manage their own booking slots" ON booking_slots
    FOR ALL
    USING (auth.uid() = provider_id)
    WITH CHECK (auth.uid() = provider_id);

-- Policy for consumers to view available booking slots
CREATE POLICY "Consumers can view available booking slots" ON booking_slots
    FOR SELECT
    USING (true); 