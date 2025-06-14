-- Function to get comprehensive provider metrics (Phase 2)
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