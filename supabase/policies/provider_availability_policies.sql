-- Enable RLS on provider_availability table
ALTER TABLE provider_availability ENABLE ROW LEVEL SECURITY;

-- Policy for providers to manage their own availability
CREATE POLICY "Providers can manage their own availability" ON provider_availability
    FOR ALL
    USING (auth.uid() = provider_id)
    WITH CHECK (auth.uid() = provider_id);

-- Policy for consumers to view provider availability
CREATE POLICY "Consumers can view provider availability" ON provider_availability
    FOR SELECT
    USING (true); 