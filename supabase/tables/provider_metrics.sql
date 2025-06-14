-- Provider Metrics Table for Enhanced Dashboard (Phase 2)
CREATE TABLE IF NOT EXISTS provider_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider_id UUID REFERENCES profiles(id) NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    
    -- Core metrics
    new_requests INTEGER DEFAULT 0,
    upcoming_bookings INTEGER DEFAULT 0,
    completed_jobs INTEGER DEFAULT 0,
    cancelled_jobs INTEGER DEFAULT 0,
    
    -- Financial metrics
    total_revenue DECIMAL(10,2) DEFAULT 0,
    pending_revenue DECIMAL(10,2) DEFAULT 0,
    average_job_value DECIMAL(10,2) DEFAULT 0,
    
    -- Performance metrics
    profile_views INTEGER DEFAULT 0,
    conversion_rate DECIMAL(5,2) DEFAULT 0, -- percentage
    average_rating DECIMAL(3,2) DEFAULT 0,
    total_reviews INTEGER DEFAULT 0,
    
    -- Response metrics
    average_response_time INTEGER DEFAULT 0, -- in minutes
    acceptance_rate DECIMAL(5,2) DEFAULT 0, -- percentage
    completion_rate DECIMAL(5,2) DEFAULT 0, -- percentage
    
    -- Growth indicators
    week_over_week_growth DECIMAL(5,2) DEFAULT 0,
    month_over_month_growth DECIMAL(5,2) DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    
    -- Constraints
    UNIQUE(provider_id, date)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_provider_metrics_provider_date ON provider_metrics(provider_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_provider_metrics_date ON provider_metrics(date DESC);

-- Enable RLS
ALTER TABLE provider_metrics ENABLE ROW LEVEL SECURITY; 