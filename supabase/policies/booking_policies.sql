-- Enable RLS on bookings table
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Policy for consumers to view their own bookings
CREATE POLICY "Consumers can view their own bookings" ON bookings
    FOR SELECT
    USING (auth.uid() = consumer_id);

-- Policy for providers to view bookings for their services
CREATE POLICY "Providers can view bookings for their services" ON bookings
    FOR SELECT
    USING (auth.uid() = provider_id);

-- Policy for consumers to create bookings
CREATE POLICY "Consumers can create bookings" ON bookings
    FOR INSERT
    WITH CHECK (auth.uid() = consumer_id);

-- Policy for providers to update booking status
CREATE POLICY "Providers can update booking status" ON bookings
    FOR UPDATE
    USING (auth.uid() = provider_id)
    WITH CHECK (auth.uid() = provider_id); 