-- Create bookings table
CREATE TABLE IF NOT EXISTS public.bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_id UUID REFERENCES public.services(id),
    provider_id UUID REFERENCES public.profiles(id),
    consumer_id UUID REFERENCES public.profiles(id),
    scheduled_date DATE NOT NULL,
    scheduled_time TIME NOT NULL,
    duration_hours DECIMAL NOT NULL,
    location_address TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    special_instructions TEXT,
    estimated_price DECIMAL,
    payment_method TEXT,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create booking_statuses table
CREATE TABLE IF NOT EXISTS public.booking_statuses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID REFERENCES public.bookings(id),
    status TEXT NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_statuses ENABLE ROW LEVEL SECURITY;

-- Create policies for bookings table
CREATE POLICY "Users can view their own bookings"
    ON public.bookings
    FOR SELECT
    USING (
        auth.uid() = consumer_id OR 
        auth.uid() = provider_id
    );

CREATE POLICY "Users can create their own bookings"
    ON public.bookings
    FOR INSERT
    WITH CHECK (
        auth.uid() = consumer_id
    );

CREATE POLICY "Users can update their own bookings"
    ON public.bookings
    FOR UPDATE
    USING (
        auth.uid() = consumer_id OR 
        auth.uid() = provider_id
    );

-- Create policies for booking_statuses table
CREATE POLICY "Users can view statuses of their bookings"
    ON public.booking_statuses
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.bookings
            WHERE bookings.id = booking_statuses.booking_id
            AND (bookings.consumer_id = auth.uid() OR bookings.provider_id = auth.uid())
        )
    );

CREATE POLICY "Users can create statuses for their bookings"
    ON public.booking_statuses
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.bookings
            WHERE bookings.id = booking_statuses.booking_id
            AND (bookings.consumer_id = auth.uid() OR bookings.provider_id = auth.uid())
        )
    );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_bookings_consumer_id ON public.bookings(consumer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_provider_id ON public.bookings(provider_id);
CREATE INDEX IF NOT EXISTS idx_bookings_service_id ON public.bookings(service_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);
CREATE INDEX IF NOT EXISTS idx_booking_statuses_booking_id ON public.booking_statuses(booking_id); 