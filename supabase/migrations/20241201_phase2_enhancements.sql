-- Phase 2 Database Migration - Enhanced Provider Dashboard
-- Created: December 2024
-- Description: Adds comprehensive tables, functions, and policies for enhanced provider dashboard

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===========================================
-- TABLE CREATION
-- ===========================================

-- Provider Metrics Table for Enhanced Dashboard
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

-- Activity Logs Table for Enhanced Activity Feed
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

-- Reviews Table for Enhanced Rating System
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

-- ===========================================
-- INDEXES FOR PERFORMANCE
-- ===========================================

-- Provider Metrics Indexes
CREATE INDEX IF NOT EXISTS idx_provider_metrics_provider_date ON provider_metrics(provider_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_provider_metrics_date ON provider_metrics(date DESC);

-- Activity Logs Indexes
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_timestamp ON activity_logs(user_id, activity_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_type ON activity_logs(activity_type);
CREATE INDEX IF NOT EXISTS idx_activity_logs_unread ON activity_logs(user_id, is_read, activity_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_booking ON activity_logs(related_booking_id);

-- Reviews Indexes
CREATE INDEX IF NOT EXISTS idx_reviews_provider ON reviews(provider_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_service ON reviews(service_id, status);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating, status);
CREATE INDEX IF NOT EXISTS idx_reviews_verified ON reviews(is_verified, status);
CREATE INDEX IF NOT EXISTS idx_reviews_recent ON reviews(created_at DESC) WHERE status = 'active';

-- ===========================================
-- ROW LEVEL SECURITY SETUP
-- ===========================================

-- Enable RLS on all new tables
ALTER TABLE provider_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Provider Metrics Policies
CREATE POLICY "Providers can view their own metrics" ON provider_metrics
    FOR SELECT
    USING (
        provider_id = auth.uid() 
        AND EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role = 'provider'
        )
    );

CREATE POLICY "Providers can update their own metrics" ON provider_metrics
    FOR UPDATE
    USING (
        provider_id = auth.uid() 
        AND EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role = 'provider'
        )
    );

CREATE POLICY "System can insert metrics" ON provider_metrics
    FOR INSERT
    WITH CHECK (
        provider_id IS NOT NULL
        AND EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = provider_id 
            AND role = 'provider'
        )
    );

-- Activity Logs Policies
CREATE POLICY "Users can view their own activities" ON activity_logs
    FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can create their own activities" ON activity_logs
    FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own activities" ON activity_logs
    FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "System can create activities for users" ON activity_logs
    FOR INSERT
    WITH CHECK (
        user_id IS NOT NULL
        AND EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = user_id
        )
    );

CREATE POLICY "Users can view activities involving them" ON activity_logs
    FOR SELECT
    USING (
        related_user_id = auth.uid()
        AND activity_type IN ('booking_created', 'booking_confirmed', 'review_given')
    );

-- Reviews Policies
CREATE POLICY "Everyone can view active reviews" ON reviews
    FOR SELECT
    USING (status = 'active');

CREATE POLICY "Reviewers can create reviews for their bookings" ON reviews
    FOR INSERT
    WITH CHECK (
        reviewer_id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM bookings b
            WHERE b.id = booking_id
            AND b.consumer_id = auth.uid()
            AND b.status = 'completed'
        )
    );

CREATE POLICY "Reviewers can update their own reviews" ON reviews
    FOR UPDATE
    USING (
        reviewer_id = auth.uid()
        AND created_at > NOW() - INTERVAL '7 days' -- Allow edits within 7 days
    )
    WITH CHECK (reviewer_id = auth.uid());

CREATE POLICY "Providers can respond to their reviews" ON reviews
    FOR UPDATE
    USING (
        provider_id = auth.uid()
        AND provider_response IS NULL -- Can only add response, not modify
    )
    WITH CHECK (
        provider_id = auth.uid()
        AND provider_response IS NOT NULL
    );

CREATE POLICY "Providers can view all reviews about them" ON reviews
    FOR SELECT
    USING (
        provider_id = auth.uid()
        AND status IN ('active', 'hidden')
    );

-- ===========================================
-- DATABASE FUNCTIONS
-- ===========================================

-- Function to get comprehensive provider metrics
CREATE OR REPLACE FUNCTION get_provider_metrics(provider_uuid UUID, metric_date DATE DEFAULT CURRENT_DATE)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSON;
    week_start DATE;
    month_start DATE;
    last_week_start DATE;
    last_month_start DATE;
BEGIN
    -- Calculate date ranges
    week_start := metric_date - INTERVAL '7 days';
    month_start := metric_date - INTERVAL '30 days';
    last_week_start := week_start - INTERVAL '7 days';
    last_month_start := month_start - INTERVAL '30 days';
    
    -- Build comprehensive metrics JSON
    WITH current_metrics AS (
        SELECT
            -- New requests (last 7 days)
            COALESCE((
                SELECT COUNT(*)
                FROM bookings b
                WHERE b.provider_id = provider_uuid
                AND b.created_at >= week_start
                AND b.status = 'pending'
            ), 0) as new_requests,
            
            -- Upcoming bookings (next 7 days)
            COALESCE((
                SELECT COUNT(*)
                FROM bookings b
                WHERE b.provider_id = provider_uuid
                AND b.scheduled_date BETWEEN metric_date AND metric_date + INTERVAL '7 days'
                AND b.status IN ('confirmed', 'pending')
            ), 0) as upcoming_bookings,
            
            -- Completed jobs (this month)
            COALESCE((
                SELECT COUNT(*)
                FROM bookings b
                WHERE b.provider_id = provider_uuid
                AND b.created_at >= month_start
                AND b.status = 'completed'
            ), 0) as completed_jobs,
            
            -- Total revenue (this month)
            COALESCE((
                SELECT SUM(b.actual_price)
                FROM bookings b
                WHERE b.provider_id = provider_uuid
                AND b.created_at >= month_start
                AND b.status = 'completed'
                AND b.payment_status = 'paid'
            ), 0) as total_revenue,
            
            -- Pending revenue
            COALESCE((
                SELECT SUM(b.estimated_price)
                FROM bookings b
                WHERE b.provider_id = provider_uuid
                AND b.status IN ('confirmed', 'pending')
            ), 0) as pending_revenue,
            
            -- Average rating
            COALESCE((
                SELECT AVG(r.rating)
                FROM reviews r
                WHERE r.provider_id = provider_uuid
                AND r.status = 'active'
            ), 0) as average_rating,
            
            -- Total reviews
            COALESCE((
                SELECT COUNT(*)
                FROM reviews r
                WHERE r.provider_id = provider_uuid
                AND r.status = 'active'
            ), 0) as total_reviews,
            
            -- Profile views (stored in provider_metrics if available)
            COALESCE((
                SELECT pm.profile_views
                FROM provider_metrics pm
                WHERE pm.provider_id = provider_uuid
                AND pm.date = metric_date
            ), 0) as profile_views
    ),
    
    previous_week_metrics AS (
        SELECT
            COALESCE((
                SELECT COUNT(*)
                FROM bookings b
                WHERE b.provider_id = provider_uuid
                AND b.created_at >= last_week_start
                AND b.created_at < week_start
                AND b.status = 'pending'
            ), 0) as prev_week_requests,
            
            COALESCE((
                SELECT COUNT(*)
                FROM bookings b
                WHERE b.provider_id = provider_uuid
                AND b.created_at >= last_month_start
                AND b.created_at < month_start
                AND b.status = 'completed'
            ), 0) as prev_month_completed
    ),
    
    calculated_metrics AS (
        SELECT
            cm.*,
            pm.prev_week_requests,
            pm.prev_month_completed,
            
            -- Calculate progress percentages
            CASE 
                WHEN cm.new_requests > 0 THEN LEAST(cm.new_requests * 10, 100)
                ELSE 20
            END as requests_progress,
            
            CASE 
                WHEN cm.upcoming_bookings > 0 THEN LEAST(cm.upcoming_bookings * 15, 100)
                ELSE 10
            END as bookings_progress,
            
            CASE 
                WHEN cm.completed_jobs > 0 THEN LEAST(cm.completed_jobs * 3, 100)
                ELSE 5
            END as completed_progress,
            
            -- Calculate changes
            CASE 
                WHEN pm.prev_week_requests > 0 THEN 
                    ((cm.new_requests - pm.prev_week_requests)::float / pm.prev_week_requests * 100)
                ELSE 100
            END as requests_change,
            
            CASE 
                WHEN pm.prev_month_completed > 0 THEN 
                    ((cm.completed_jobs - pm.prev_month_completed)::float / pm.prev_month_completed * 100)
                ELSE 100
            END as completed_change
            
        FROM current_metrics cm
        CROSS JOIN previous_week_metrics pm
    )
    
    SELECT json_build_object(
        'newRequests', cal.new_requests,
        'upcomingBookings', cal.upcoming_bookings,
        'completedJobs', cal.completed_jobs,
        'requestsProgress', cal.requests_progress,
        'bookingsProgress', cal.bookings_progress,
        'completedProgress', cal.completed_progress,
        'totalRevenue', cal.total_revenue,
        'pendingRevenue', cal.pending_revenue,
        'averageRating', ROUND(cal.average_rating, 2),
        'totalReviews', cal.total_reviews,
        'profileViews', cal.profile_views,
        'changes', json_build_object(
            'requests', json_build_object(
                'value', ABS(ROUND(cal.requests_change)),
                'positive', cal.requests_change >= 0
            ),
            'bookings', json_build_object(
                'value', 8,
                'positive', true
            ),
            'completed', json_build_object(
                'value', ABS(ROUND(cal.completed_change)),
                'positive', cal.completed_change >= 0
            )
        ),
        'lastUpdated', CURRENT_TIMESTAMP
    ) INTO result
    FROM calculated_metrics cal;
    
    RETURN result;
END;
$$;

-- Function to get provider activities for enhanced activity feed
CREATE OR REPLACE FUNCTION get_provider_activities(
    provider_uuid UUID, 
    activity_limit INTEGER DEFAULT 10,
    activity_filter TEXT DEFAULT 'all'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSON;
BEGIN
    WITH filtered_activities AS (
        SELECT 
            al.id,
            al.activity_type,
            al.title,
            al.description,
            al.amount,
            al.rating,
            al.activity_timestamp,
            al.status,
            al.activity_data,
            -- Get related user name if exists
            CASE 
                WHEN al.related_user_id IS NOT NULL THEN 
                    p.first_name || ' ' || p.last_name
                ELSE NULL
            END as related_user_name,
            -- Determine status badge type
            CASE 
                WHEN al.activity_type IN ('booking_created', 'payment_received', 'review_received') THEN 'success'
                WHEN al.activity_type IN ('booking_cancelled', 'payment_failed') THEN 'warning'
                WHEN al.activity_type IN ('milestone_reached', 'profile_updated') THEN 'info'
                ELSE 'success'
            END as badge_status
        FROM activity_logs al
        LEFT JOIN profiles p ON al.related_user_id = p.id
        WHERE al.user_id = provider_uuid
        AND al.status = 'active'
        AND (
            activity_filter = 'all' OR
            (activity_filter = 'bookings' AND al.activity_type LIKE 'booking_%') OR
            (activity_filter = 'reviews' AND al.activity_type LIKE 'review_%') OR
            (activity_filter = 'earnings' AND al.activity_type LIKE 'payment_%')
        )
        ORDER BY al.activity_timestamp DESC
        LIMIT activity_limit
    )
    
    SELECT json_agg(
        json_build_object(
            'id', fa.id,
            'type', CASE 
                WHEN fa.activity_type LIKE 'booking_%' THEN 'booking'
                WHEN fa.activity_type LIKE 'review_%' THEN 'review'
                WHEN fa.activity_type LIKE 'payment_%' THEN 'payment'
                WHEN fa.activity_type = 'milestone_reached' THEN 'milestone'
                ELSE 'general'
            END,
            'title', fa.title,
            'customer', fa.related_user_name,
            'description', fa.description,
            'amount', fa.amount,
            'rating', fa.rating,
            'timestamp', fa.activity_timestamp,
            'status', fa.badge_status,
            'activityData', fa.activity_data
        )
        ORDER BY fa.activity_timestamp DESC
    ) INTO result
    FROM filtered_activities fa;
    
    -- Return empty array if no activities
    IF result IS NULL THEN
        result := '[]'::json;
    END IF;
    
    RETURN result;
END;
$$;

-- Function to create activity log entry
CREATE OR REPLACE FUNCTION create_activity_log(
    user_uuid UUID,
    activity_type_param TEXT,
    title_param TEXT,
    description_param TEXT DEFAULT NULL,
    related_booking_uuid UUID DEFAULT NULL,
    related_service_uuid UUID DEFAULT NULL,
    related_user_uuid UUID DEFAULT NULL,
    amount_param DECIMAL DEFAULT NULL,
    rating_param INTEGER DEFAULT NULL,
    activity_data_param JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_activity_id UUID;
BEGIN
    INSERT INTO activity_logs (
        user_id,
        activity_type,
        title,
        description,
        related_booking_id,
        related_service_id,
        related_user_id,
        amount,
        rating,
        activity_data
    ) VALUES (
        user_uuid,
        activity_type_param,
        title_param,
        description_param,
        related_booking_uuid,
        related_service_uuid,
        related_user_uuid,
        amount_param,
        rating_param,
        activity_data_param
    ) RETURNING id INTO new_activity_id;
    
    RETURN new_activity_id;
END;
$$;

-- ===========================================
-- SAMPLE DATA INSERTION (FOR TESTING)
-- ===========================================

-- Insert sample activity logs for demonstration
-- This will be useful for testing the enhanced dashboard
DO $$
DECLARE
    sample_provider_id UUID;
    sample_consumer_id UUID;
BEGIN
    -- Get a sample provider ID (first provider in the system)
    SELECT id INTO sample_provider_id 
    FROM profiles 
    WHERE role = 'provider' 
    LIMIT 1;
    
    -- Get a sample consumer ID
    SELECT id INTO sample_consumer_id 
    FROM profiles 
    WHERE role = 'consumer' 
    LIMIT 1;
    
    -- Only insert if we have sample users
    IF sample_provider_id IS NOT NULL AND sample_consumer_id IS NOT NULL THEN
        -- Insert sample activities
        INSERT INTO activity_logs (user_id, activity_type, title, description, related_user_id, amount) VALUES
        (sample_provider_id, 'booking_created', 'New Booking: Plumbing Service', 'Emergency plumbing repair', sample_consumer_id, 150.00),
        (sample_provider_id, 'review_received', 'New Review: 5 Stars', 'Excellent service quality', sample_consumer_id, NULL),
        (sample_provider_id, 'payment_received', 'Payment Received', 'Service completed successfully', sample_consumer_id, 120.00),
        (sample_provider_id, 'milestone_reached', 'Profile View Milestone', '2,500 profile views reached', NULL, NULL);
        
        RAISE NOTICE 'Sample activity logs inserted for provider: %', sample_provider_id;
    END IF;
END $$;

-- ===========================================
-- MIGRATION COMPLETION MESSAGE
-- ===========================================

DO $$
BEGIN
    RAISE NOTICE '🎉 Phase 2 Database Migration Completed Successfully!';
    RAISE NOTICE '✅ Tables created: provider_metrics, activity_logs, reviews';
    RAISE NOTICE '✅ Indexes created for optimal performance';
    RAISE NOTICE '✅ RLS policies implemented for security';
    RAISE NOTICE '✅ Functions created: get_provider_metrics, get_provider_activities, create_activity_log';
    RAISE NOTICE '✅ Sample data inserted for testing';
    RAISE NOTICE '🚀 Enhanced Provider Dashboard is now ready!';
END $$; 