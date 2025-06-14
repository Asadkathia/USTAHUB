-- Activity Logs Table for Enhanced Activity Feed (Phase 2)
CREATE TABLE IF NOT EXISTS activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) NOT NULL,
    
    -- Activity details
    activity_type VARCHAR(50) NOT NULL CHECK (activity_type IN (
        'booking_created', 'booking_confirmed', 'booking_completed', 'booking_cancelled',
        'review_received', 'review_given', 'payment_received', 'payment_sent',
        'service_created', 'service_updated', 'service_deleted',
        'profile_updated', 'milestone_reached', 'message_sent', 'message_received'
    )),
    
    title TEXT NOT NULL,
    description TEXT,
    
    -- Related entities
    related_booking_id UUID REFERENCES bookings(id),
    related_service_id UUID REFERENCES services(id),
    related_user_id UUID REFERENCES profiles(id), -- For activities involving other users
    
    -- Activity metadata
    activity_data JSONB, -- Flexible storage for activity-specific data
    amount DECIMAL(10,2), -- For financial activities
    rating INTEGER CHECK (rating >= 1 AND rating <= 5), -- For review activities
    
    -- Status and visibility
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'archived', 'deleted')),
    is_read BOOLEAN DEFAULT false,
    priority VARCHAR(10) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    
    -- Timestamps
    activity_timestamp TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_timestamp ON activity_logs(user_id, activity_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_type ON activity_logs(activity_type);
CREATE INDEX IF NOT EXISTS idx_activity_logs_unread ON activity_logs(user_id, is_read, activity_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_booking ON activity_logs(related_booking_id);

-- Enable RLS
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY; 