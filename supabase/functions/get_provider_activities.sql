-- Function to get provider activities for enhanced activity feed (Phase 2)
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