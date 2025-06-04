-- Enable RLS on booking_statuses table
ALTER TABLE booking_statuses ENABLE ROW LEVEL SECURITY;

-- Policy for providers to manage booking statuses
CREATE POLICY "Providers can manage booking statuses" ON booking_statuses
    FOR ALL
    USING (EXISTS (
        SELECT 1 FROM bookings
        WHERE bookings.id = booking_statuses.booking_id
        AND bookings.provider_id = auth.uid()
    ))
    WITH CHECK (EXISTS (
        SELECT 1 FROM bookings
        WHERE bookings.id = booking_statuses.booking_id
        AND bookings.provider_id = auth.uid()
    ));

-- Policy for consumers to view booking statuses
CREATE POLICY "Consumers can view booking statuses" ON booking_statuses
    FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM bookings
        WHERE bookings.id = booking_statuses.booking_id
        AND bookings.consumer_id = auth.uid()
    )); 