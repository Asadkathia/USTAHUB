-- Enable RLS on services table
ALTER TABLE services ENABLE ROW LEVEL SECURITY;

-- Policy for providers to manage their own services
CREATE POLICY "Providers can manage their own services" ON services
    FOR ALL
    USING (auth.uid() = provider_id)
    WITH CHECK (auth.uid() = provider_id);

-- Policy for consumers to view services
CREATE POLICY "Consumers can view services" ON services
    FOR SELECT
    USING (true); 