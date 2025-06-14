-- Reviews Table for Enhanced Rating System (Phase 2)
CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID REFERENCES bookings(id) NOT NULL,
    reviewer_id UUID REFERENCES profiles(id) NOT NULL, -- Consumer giving review
    provider_id UUID REFERENCES profiles(id) NOT NULL, -- Provider receiving review
    service_id UUID REFERENCES services(id) NOT NULL,
    
    -- Review content
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title VARCHAR(100),
    review_text TEXT,
    
    -- Review categories (detailed ratings)
    quality_rating INTEGER CHECK (quality_rating >= 1 AND quality_rating <= 5),
    punctuality_rating INTEGER CHECK (punctuality_rating >= 1 AND punctuality_rating <= 5),
    communication_rating INTEGER CHECK (communication_rating >= 1 AND communication_rating <= 5),
    value_rating INTEGER CHECK (value_rating >= 1 AND value_rating <= 5),
    
    -- Review metadata
    is_anonymous BOOLEAN DEFAULT false,
    is_verified BOOLEAN DEFAULT true, -- Verified through completed booking
    helpful_count INTEGER DEFAULT 0,
    not_helpful_count INTEGER DEFAULT 0,
    
    -- Provider response
    provider_response TEXT,
    provider_response_date TIMESTAMP WITH TIME ZONE,
    
    -- Status and moderation
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'hidden', 'flagged', 'deleted')),
    moderation_notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    
    -- Constraints
    UNIQUE(booking_id) -- One review per booking
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_reviews_provider ON reviews(provider_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_service ON reviews(service_id, status);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating, status);
CREATE INDEX IF NOT EXISTS idx_reviews_verified ON reviews(is_verified, status);
CREATE INDEX IF NOT EXISTS idx_reviews_recent ON reviews(created_at DESC) WHERE status = 'active';

-- Enable RLS
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY; 