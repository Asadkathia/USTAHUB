CREATE TABLE IF NOT EXISTS bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_id UUID REFERENCES services(id) NOT NULL,
    consumer_id UUID REFERENCES profiles(id) NOT NULL,
    provider_id UUID REFERENCES profiles(id) NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
    booking_date TIMESTAMP WITH TIME ZONE NOT NULL,
    -- Enhanced booking fields from Phase 2
    scheduled_date DATE NOT NULL,
    scheduled_time TIME NOT NULL,
    duration_hours DECIMAL(3,1) DEFAULT 1.0,
    location_address TEXT NOT NULL,
    customer_phone VARCHAR(15),
    customer_email VARCHAR(100),
    special_instructions TEXT,
    estimated_price DECIMAL(10,2),
    actual_price DECIMAL(10,2),
    payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
    payment_method VARCHAR(20) CHECK (payment_method IN ('cash', 'online', 'card')),
    created_by_consumer BOOLEAN DEFAULT true,
    booking_reference VARCHAR(20) UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
); 