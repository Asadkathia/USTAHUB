// Database Utility Functions for UstaHub
// Support for Phase 2 Enhanced Provider Dashboard

// Sample data management for new providers
async function initializeSampleDataForProvider(providerId) {
    try {

        
        // Check if provider already has data
        const existingMetrics = await window.supabase
            .from('provider_metrics')
            .select('id')
            .eq('provider_id', providerId)
            .limit(1);
            
        if (existingMetrics.data && existingMetrics.data.length > 0) {

            return;
        }
        
        // Create initial provider metrics entry
        await createInitialProviderMetrics(providerId);
        
        // Create welcome activity
        await createWelcomeActivity(providerId);
        

        
    } catch (error) {

    }
}

// Create initial provider metrics
async function createInitialProviderMetrics(providerId) {
    const { data, error } = await window.supabase
        .from('provider_metrics')
        .insert([{
            provider_id: providerId,
            date: new Date().toISOString().split('T')[0],
            new_requests: 0,
            upcoming_bookings: 0,
            completed_jobs: 0,
            cancelled_jobs: 0,
            total_revenue: 0,
            pending_revenue: 0,
            average_job_value: 0,
            profile_views: Math.floor(Math.random() * 50) + 10, // Random initial views
            conversion_rate: 0,
            average_rating: 0,
            total_reviews: 0,
            average_response_time: 0,
            acceptance_rate: 100, // Start with 100%
            completion_rate: 100, // Start with 100%
            week_over_week_growth: 0,
            month_over_month_growth: 0
        }]);
        
    if (error) {

        throw error;
    }
    
    return data;
}

// Create welcome activity for new providers
async function createWelcomeActivity(providerId) {
    const { data, error } = await window.supabase.rpc('create_activity_log', {
        user_uuid: providerId,
        activity_type_param: 'profile_updated',
        title_param: 'Welcome to UstaHub!',
        description_param: 'Your provider profile has been created. Complete your profile to start receiving bookings.',
        related_booking_uuid: null,
        related_service_uuid: null,
        related_user_uuid: null,
        amount_param: null,
        rating_param: null,
        activity_data_param: JSON.stringify({
            milestone: 'profile_created',
            next_steps: ['Add services', 'Upload photos', 'Set availability']
        })
    });
    
    if (error) {

        throw error;
    }
    
    return data;
}

// Update provider metrics based on new activities
async function updateProviderMetricsFromActivity(providerId, activityType, amount = null) {
    try {
        const today = new Date().toISOString().split('T')[0];
        
        // Get current metrics
        const { data: currentMetrics } = await window.supabase
            .from('provider_metrics')
            .select('*')
            .eq('provider_id', providerId)
            .eq('date', today)
            .single();
            
        if (!currentMetrics) {
            // Create new metrics entry for today
            await createInitialProviderMetrics(providerId);
            return;
        }
        
        // Update metrics based on activity type
        const updates = {};
        
        switch (activityType) {
            case 'booking_created':
                updates.new_requests = (currentMetrics.new_requests || 0) + 1;
                if (amount) {
                    updates.pending_revenue = (currentMetrics.pending_revenue || 0) + amount;
                }
                break;
                
            case 'booking_confirmed':
                updates.upcoming_bookings = (currentMetrics.upcoming_bookings || 0) + 1;
                break;
                
            case 'booking_completed':
                updates.completed_jobs = (currentMetrics.completed_jobs || 0) + 1;
                updates.upcoming_bookings = Math.max((currentMetrics.upcoming_bookings || 0) - 1, 0);
                if (amount) {
                    updates.total_revenue = (currentMetrics.total_revenue || 0) + amount;
                    updates.pending_revenue = Math.max((currentMetrics.pending_revenue || 0) - amount, 0);
                }
                break;
                
            case 'booking_cancelled':
                updates.cancelled_jobs = (currentMetrics.cancelled_jobs || 0) + 1;
                updates.upcoming_bookings = Math.max((currentMetrics.upcoming_bookings || 0) - 1, 0);
                if (amount) {
                    updates.pending_revenue = Math.max((currentMetrics.pending_revenue || 0) - amount, 0);
                }
                break;
                
            case 'review_received':
                updates.total_reviews = (currentMetrics.total_reviews || 0) + 1;
                break;
                
            case 'payment_received':
                if (amount) {
                    updates.total_revenue = (currentMetrics.total_revenue || 0) + amount;
                }
                break;
        }
        
        if (Object.keys(updates).length > 0) {
            updates.updated_at = new Date().toISOString();
            
            const { error } = await window.supabase
                .from('provider_metrics')
                .update(updates)
                .eq('provider_id', providerId)
                .eq('date', today);
                
            if (error) {
                // Handle error silently
            }
        }
        
    } catch (error) {

    }
}

// Enhanced activity creation with metrics update
async function createActivityWithMetricsUpdate(userId, activityType, title, description, relatedBookingId = null, relatedServiceId = null, relatedUserId = null, amount = null, rating = null, activityData = null) {
    try {
        // Create the activity log
        const activityId = await createActivityLog(
            userId, activityType, title, description, 
            relatedBookingId, relatedServiceId, relatedUserId, 
            amount, rating, activityData
        );
        
        // Update provider metrics if applicable
        if (activityType.includes('booking_') || activityType.includes('payment_') || activityType.includes('review_')) {
            await updateProviderMetricsFromActivity(userId, activityType, amount);
        }
        
        return activityId;
        
    } catch (error) {

        return null;
    }
}

// Bulk operations for data management
async function bulkCreateSampleBookings(providerId, count = 5) {
    try {
        const sampleBookings = [];
        const serviceNames = ['Plumbing Repair', 'Electrical Work', 'House Cleaning', 'Handyman Service', 'Gardening'];
        const statuses = ['completed', 'upcoming', 'pending'];
        
        for (let i = 0; i < count; i++) {
            const randomDays = Math.floor(Math.random() * 30) + 1;
            const bookingDate = new Date();
            bookingDate.setDate(bookingDate.getDate() - randomDays);
            
            sampleBookings.push({
                provider_id: providerId,
                service_name: serviceNames[i % serviceNames.length],
                status: statuses[Math.floor(Math.random() * statuses.length)],
                estimated_price: Math.floor(Math.random() * 200) + 50,
                actual_price: Math.floor(Math.random() * 200) + 50,
                scheduled_date: bookingDate.toISOString(),
                created_at: bookingDate.toISOString()
            });
        }
        
        // Note: This would require a bookings table to exist

        return sampleBookings;
        
    } catch (error) {

        return [];
    }
}

// Database health check
async function checkDatabaseHealth() {
    try {

        
        // Check if new tables exist
        const tables = ['provider_metrics', 'activity_logs', 'reviews'];
        const healthReport = {
            tablesExist: {},
            functionsExist: {},
            policiesExist: {},
            overall: 'healthy'
        };
        
        // Check tables
        for (const table of tables) {
            try {
                const { data, error } = await window.supabase
                    .from(table)
                    .select('id')
                    .limit(1);
                    
                healthReport.tablesExist[table] = !error;
            } catch (e) {
                healthReport.tablesExist[table] = false;
                healthReport.overall = 'issues_detected';
            }
        }
        
        // Check functions
        const functions = ['get_provider_metrics', 'get_provider_activities', 'create_activity_log'];
        for (const func of functions) {
            try {
                // Test function call with dummy data
                const { error } = await window.supabase.rpc(func, {});
                healthReport.functionsExist[func] = !error || error.message.includes('required');
            } catch (e) {
                healthReport.functionsExist[func] = false;
                healthReport.overall = 'issues_detected';
            }
        }
        

        return healthReport;
        
    } catch (error) {

        return { overall: 'error', error: error.message };
    }
}

// Export functions for use in dashboard
window.DatabaseUtils = {
    initializeSampleDataForProvider,
    createInitialProviderMetrics,
    createWelcomeActivity,
    updateProviderMetricsFromActivity,
    createActivityWithMetricsUpdate,
    bulkCreateSampleBookings,
    checkDatabaseHealth
};

 