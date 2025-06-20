/**
 * Provider Bookings Manager
 * Handles loading, displaying, and managing bookings for service providers
 */

class ProviderBookingsManager {
    constructor() {
        this.bookings = [];
        this.historyBookings = [];
        this.reviews = [];
        this.currentUser = null;
        this.filters = {
            status: 'all',
            historyStatus: 'completed',
            dateRange: 'all'
        };
        this.initialized = false;
    }

    /**
     * Initialize the bookings manager
     */
    async init() {
        try {
            if (this.initialized) return;
            
            // Get current user
            const { data: { user } } = await window.supabase.auth.getUser();
            if (!user) {
                console.error('User not authenticated');
                return;
            }
            
            this.currentUser = user;
            
            // Initial load
            await this.loadBookings();
            await this.loadBookingHistory();
            await this.loadReviews();
            await this.loadUserProfile();
            
            // Set up event listeners
            this.setupEventListeners();
            
            // Set up periodic refresh (every 2 minutes)
            setInterval(() => {
                this.loadBookings();
                this.loadBookingHistory();
                this.loadReviews();
            }, 2 * 60 * 1000);
            
            this.initialized = true;
            console.log('✅ Provider Bookings Manager initialized');
        } catch (error) {
            console.error('Error initializing Provider Bookings Manager:', error);
        }
    }

    /**
     * Load active bookings from Supabase (excluding completed and cancelled)
     */
    async loadBookings() {
        try {
            if (!this.currentUser) return;

            // Fetch active bookings only (pending, confirmed)
            const { data: bookings, error } = await window.supabase
                .from('bookings')
                .select(`
                    *,
                    consumer:consumer_id (
                        email,
                        first_name,
                        last_name
                    ),
                    service:service_id (
                        title,
                        price
                    )
                `)
                .eq('provider_id', this.currentUser.id)
                .in('status', ['pending', 'confirmed', 'pending_confirmation'])
                .order('created_at', { ascending: false });

            if (error) throw error;

            this.bookings = bookings || [];
            
            // Update UI
            this.updateDashboardMetrics();
            this.renderBookingsList();
            
            return this.bookings;
        } catch (error) {
            console.error('Error loading provider bookings:', error);
            return [];
        }
    }

    /**
     * Load booking history (completed and cancelled)
     */
    async loadBookingHistory() {
        try {
            if (!this.currentUser) {
                console.log('No current user for booking history');
                return;
            }

            console.log('Loading booking history for provider:', this.currentUser.id);

            // Get date filter
            const dateFilter = this.getDateFilter();
            console.log('Date filter:', dateFilter);
            
            // First try a simple query to see if ANY bookings exist for this provider
            const { data: allBookings, error: allError } = await window.supabase
                .from('bookings')
                .select('id, status, updated_at')
                .eq('provider_id', this.currentUser.id);
                
            if (allError) {
                console.error('Error getting all bookings:', allError);
            } else {
                console.log('Total bookings for provider:', allBookings?.length || 0);
                const statusBreakdown = allBookings?.map(b => ({ 
                    id: b.id.substring(0, 8), 
                    status: b.status, 
                    updated_at: b.updated_at 
                }));
                console.log('All booking statuses:', statusBreakdown);
                
                // Count by status
                const statusCounts = {};
                allBookings?.forEach(b => {
                    statusCounts[b.status] = (statusCounts[b.status] || 0) + 1;
                });
                console.log('Status counts:', statusCounts);
            }
            
            let query = window.supabase
                .from('bookings')
                .select(`
                    *,
                    consumer:consumer_id (
                        email,
                        first_name,
                        last_name
                    ),
                    service:service_id (
                        title,
                        price
                    )
                `)
                .eq('provider_id', this.currentUser.id)
                .in('status', ['completed', 'cancelled'])
                .order('updated_at', { ascending: false });

            // Apply date filter if not "all"
            if (dateFilter) {
                query = query.gte('updated_at', dateFilter);
                console.log('Applied date filter:', dateFilter);
            }

            const { data: historyBookings, error } = await query;

            if (error) {
                console.error('Database error loading history:', error);
                throw error;
            }

            console.log('Raw history bookings from database:', historyBookings);
            console.log('Number of history bookings found:', historyBookings?.length || 0);

            this.historyBookings = historyBookings || [];
            this.renderHistoryList();
            
            return this.historyBookings;
        } catch (error) {
            console.error('Error loading booking history:', error);
            return [];
        }
    }

    /**
     * Load provider reviews
     */
    async loadReviews() {
        try {
            if (!this.currentUser) return;

            const { data: reviews, error } = await window.supabase
                .from('reviews')
                .select(`
                    *,
                    reviewer:reviewer_id (
                        first_name,
                        last_name
                    ),
                    booking:booking_id (
                        scheduled_date
                    ),
                    service:service_id (
                        title
                    )
                `)
                .eq('provider_id', this.currentUser.id)
                .eq('status', 'active')
                .order('created_at', { ascending: false });

            if (error) throw error;

            this.reviews = reviews || [];
            this.renderReviewsList();
            this.updateReviewStats();
            
            return this.reviews;
        } catch (error) {
            console.error('Error loading reviews:', error);
            return [];
        }
    }

    /**
     * Load user profile data
     */
    async loadUserProfile() {
        try {
            if (!this.currentUser) return;

            const { data: profile, error } = await window.supabase
                .from('profiles')
                .select('*')
                .eq('id', this.currentUser.id)
                .single();

            if (error) throw error;

            // Populate settings form
            this.populateProfileForm(profile);
            
        } catch (error) {
            console.error('Error loading user profile:', error);
        }
    }

    /**
     * Get date filter based on selection
     */
    getDateFilter() {
        const dateRange = this.filters.dateRange;
        const now = new Date();
        
        switch (dateRange) {
            case 'last-week':
                const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                return lastWeek.toISOString();
            case 'last-month':
                const lastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                return lastMonth.toISOString();
            case 'last-3-months':
                const last3Months = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
                return last3Months.toISOString();
            case 'last-year':
                const lastYear = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
                return lastYear.toISOString();
            default:
                return null;
        }
    }

    /**
     * Update dashboard metrics based on bookings
     */
    updateDashboardMetrics() {
        try {
            // Calculate metrics from active bookings only
            const metrics = {
                requests: this.bookings.filter(b => b.status === 'pending').length,
                upcoming: this.bookings.filter(b => b.status === 'confirmed').length,
                completed: this.historyBookings.filter(b => b.status === 'completed').length
            };

            // Update metric displays
            const statsRequests = document.getElementById('stat-requests');
            const statsBookings = document.getElementById('stat-bookings');
            const statsCompleted = document.getElementById('stat-completed');
            
            if (statsRequests) statsRequests.textContent = metrics.requests;
            if (statsBookings) statsBookings.textContent = metrics.upcoming;
            if (statsCompleted) statsCompleted.textContent = metrics.completed;

            // Update progress bars
            const requestsProgress = document.getElementById('requests-progress');
            const bookingsProgress = document.getElementById('bookings-progress');
            const completedProgress = document.getElementById('completed-progress');
            
            if (requestsProgress) requestsProgress.style.width = Math.min(metrics.requests * 10, 100) + '%';
            if (bookingsProgress) bookingsProgress.style.width = Math.min(metrics.upcoming * 15, 100) + '%';
            if (completedProgress) completedProgress.style.width = Math.min(metrics.completed * 3, 100) + '%';
        } catch (error) {
            console.error('Error updating dashboard metrics:', error);
        }
    }

    /**
     * Render bookings list in the UI
     */
    renderBookingsList() {
        try {
            const container = document.getElementById('bookings-list');
            if (!container) return;

            // Filter bookings based on current filter
            const filteredBookings = this.filters.status === 'all' 
                ? this.bookings 
                : this.bookings.filter(b => b.status === this.filters.status);

            if (filteredBookings.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-calendar-times fa-3x"></i>
                        <h5>No Bookings Found</h5>
                        <p>You don't have any ${this.filters.status !== 'all' ? this.filters.status : ''} bookings at the moment.</p>
                    </div>
                `;
                return;
            }

            container.innerHTML = filteredBookings.map(booking => `
                <div class="booking-card" data-booking-id="${booking.id}">
                    <div class="booking-header">
                        <h5>${booking.service?.title || booking.service_name || 'Service Booking'}</h5>
                        <span class="badge bg-${this.getStatusColor(booking.status)}">${booking.status}</span>
                    </div>
                    <div class="booking-details">
                        <p>
                            <i class="fas fa-user"></i> 
                            ${booking.consumer ? `${booking.consumer.first_name} ${booking.consumer.last_name}` : 'Customer'}
                        </p>
                        <p>
                            <i class="fas fa-calendar"></i> 
                            ${new Date(booking.scheduled_date).toLocaleDateString()}
                        </p>
                        <p>
                            <i class="fas fa-clock"></i> 
                            ${booking.scheduled_time || 'Time TBD'}
                        </p>
                        <p>
                            <i class="fas fa-map-marker-alt"></i> 
                            ${booking.location_address || 'Location TBD'}
                        </p>
                        ${booking.estimated_price ? `
                            <p>
                                <i class="fas fa-dollar-sign"></i> 
                                ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(booking.estimated_price)}
                            </p>
                        ` : ''}
                    </div>
                    <div class="booking-actions">
                        ${this.getBookingActions(booking)}
                    </div>
                </div>
            `).join('');

            // Add event listeners for actions
            this.attachBookingEventListeners();
        } catch (error) {
            console.error('Error rendering bookings list:', error);
        }
    }

    /**
     * Set up event listeners for booking filters and actions
     */
    setupEventListeners() {
        // Set up booking filters
        const filterButtons = document.querySelectorAll('.booking-filters .filter-btn');
        if (filterButtons.length > 0) {
            filterButtons.forEach(btn => {
                btn.addEventListener('click', () => {
                    // Update active filter
                    filterButtons.forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    
                    // Update filter and re-render
                    this.filters.status = btn.getAttribute('data-status');
                    this.renderBookingsList();
                });
            });
        }

        // Set up history filters
        const historyFilterButtons = document.querySelectorAll('.history-filters .filter-btn');
        if (historyFilterButtons.length > 0) {
            historyFilterButtons.forEach(btn => {
                btn.addEventListener('click', () => {
                    // Update active filter
                    historyFilterButtons.forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    
                    // Update filter and re-render
                    this.filters.historyStatus = btn.getAttribute('data-status');
                    this.renderHistoryList();
                });
            });
        }

        // Set up date range filter
        const dateFilter = document.getElementById('history-date-filter');
        if (dateFilter) {
            dateFilter.addEventListener('change', () => {
                this.filters.dateRange = dateFilter.value;
                this.loadBookingHistory();
            });
        }

        // Set up section navigation
        const navLinks = document.querySelectorAll('.dashboard-sidebar .nav-link');
        if (navLinks.length > 0) {
            navLinks.forEach(link => {
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    
                    // Update active section
                    navLinks.forEach(l => l.classList.remove('active'));
                    link.classList.add('active');
                    
                    // Show corresponding section
                    const sectionId = link.getAttribute('data-section');
                    this.showSection(sectionId);
                });
            });
        }

        // Set up profile settings form
        const profileForm = document.getElementById('profile-settings-form');
        if (profileForm) {
            profileForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleProfileUpdate(e);
            });
        }

        // Set up notification settings form
        const notificationForm = document.getElementById('notification-settings-form');
        if (notificationForm) {
            notificationForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleNotificationUpdate(e);
            });
        }

        // Set up security action buttons
        const changePasswordBtn = document.getElementById('change-password-btn');
        if (changePasswordBtn) {
            changePasswordBtn.addEventListener('click', () => this.handleChangePassword());
        }

        const downloadDataBtn = document.getElementById('download-data-btn');
        if (downloadDataBtn) {
            downloadDataBtn.addEventListener('click', () => this.handleDownloadData());
        }

        const deleteAccountBtn = document.getElementById('delete-account-btn');
        if (deleteAccountBtn) {
            deleteAccountBtn.addEventListener('click', () => this.handleDeleteAccount());
        }
    }

    /**
     * Show a specific dashboard section
     */
    showSection(sectionId) {
        // Hide all sections
        document.querySelectorAll('.dashboard-section').forEach(section => {
            section.classList.remove('active');
        });
        
        // Show selected section
        const targetSection = document.getElementById(`${sectionId}-section`);
        if (targetSection) {
            targetSection.classList.add('active');
            
            // Load section-specific data if needed
            if (sectionId === 'bookings') {
                this.loadBookings();
            } else if (sectionId === 'history') {
                console.log('Switching to history section, loading booking history...');
                this.loadBookingHistory();
            } else if (sectionId === 'reviews') {
                this.loadReviews();
            } else if (sectionId === 'settings') {
                this.loadUserProfile();
            }
        }
    }

    /**
     * Get color for booking status
     */
    getStatusColor(status) {
        const colors = {
            pending: 'warning',
            confirmed: 'primary',
            completed: 'success',
            cancelled: 'danger'
        };
        return colors[status] || 'secondary';
    }

    /**
     * Get action buttons based on booking status
     */
    getBookingActions(booking) {
        switch (booking.status) {
            case 'pending':
                return `
                    <button class="btn btn-sm btn-success" onclick="window.providerBookingsManager.handleBookingAction('confirm', '${booking.id}')">
                        <i class="fas fa-check"></i> Confirm
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="window.providerBookingsManager.handleBookingAction('reject', '${booking.id}')">
                        <i class="fas fa-times"></i> Reject
                    </button>
                `;
            case 'confirmed':
                return `
                    <button class="btn btn-sm btn-success" onclick="window.providerBookingsManager.handleBookingAction('complete', '${booking.id}')">
                        <i class="fas fa-check-double"></i> Mark Complete
                    </button>
                    <button class="btn btn-sm btn-warning" onclick="window.providerBookingsManager.handleBookingAction('reschedule', '${booking.id}')">
                        <i class="fas fa-calendar-alt"></i> Reschedule
                    </button>
                `;
            case 'completed':
                return `
                    <button class="btn btn-sm btn-primary" onclick="window.providerBookingsManager.handleBookingAction('view', '${booking.id}')">
                        <i class="fas fa-eye"></i> View Details
                    </button>
                `;
            default:
                return '';
        }
    }

    /**
     * Attach event listeners to booking action buttons
     */
    attachBookingEventListeners() {
        // Event listeners are handled through inline onclick attributes
        // to avoid issues with dynamic content
    }

    /**
     * Handle booking actions (confirm, reject, complete, etc.)
     */
    async handleBookingAction(action, bookingId) {
        try {
            console.log(`Handling booking action: ${action} for booking ${bookingId}`);
            const booking = this.bookings.find(b => b.id === bookingId);
            if (!booking) {
                console.error('Booking not found:', bookingId);
                return;
            }

            switch (action) {
                case 'confirm':
                    await window.supabase
                        .from('bookings')
                        .update({ status: 'confirmed' })
                        .eq('id', bookingId);
                    
                    showToast('Booking confirmed successfully', 'success');
                    break;
                    
                case 'reject':
                    await window.supabase
                        .from('bookings')
                        .update({ status: 'cancelled' })
                        .eq('id', bookingId);
                    
                    showToast('Booking rejected', 'info');
                    break;
                    
                case 'complete':
                    // Show completion modal if available
                    if (window.serviceCompletionManager && window.serviceCompletionManager.showCompletionModal) {
                        console.log('Calling serviceCompletionManager.showCompletionModal with booking:', booking);
                        window.serviceCompletionManager.showCompletionModal(booking);
                    } else {
                        console.warn('serviceCompletionManager not available, using direct completion');
                        // Direct completion using booking_statuses tracking
                        try {
                            // CRITICAL FIX: First check if there's already a pending_confirmation status record
                            console.log('🔍 Checking for existing pending_confirmation status record...');
                            const { data: existingStatusRecords, error: checkStatusError } = await window.supabase
                                .from('booking_statuses')
                                .select('*')
                                .eq('booking_id', bookingId)
                                .eq('status', 'pending_confirmation')
                                .order('created_at', { ascending: false })
                                .limit(1);
                                
                            if (checkStatusError) {
                                console.error('❌ Error checking existing status records:', checkStatusError);
                                // Continue with the process even if the check fails
                            } else if (existingStatusRecords && existingStatusRecords.length > 0) {
                                console.log('⚠️ Pending confirmation status record already exists, skipping status record creation');
                                
                                // Just update the bookings table to match
                                const { error: updateError } = await window.supabase
                                    .from('bookings')
                                    .update({
                                        status: 'pending_confirmation',
                                        actual_price: booking.estimated_price || 0,
                                        updated_at: new Date().toISOString()
                                    })
                                    .eq('id', bookingId);
                                
                                if (updateError) throw updateError;
                            } else {
                                // Add status record to booking_statuses for tracking FIRST
                                const { error: statusError } = await window.supabase
                                    .from('booking_statuses')
                                    .insert({
                                        booking_id: bookingId,
                                        status: 'pending_confirmation',
                                        notes: 'Service marked as completed directly'
                                    });
                                    
                                if (statusError) {
                                    console.warn('Could not add status record:', statusError);
                                    // Don't fail if booking_statuses insert fails
                                }
                                
                                // Then update booking status
                                const { error: updateError } = await window.supabase
                                    .from('bookings')
                                    .update({
                                        status: 'pending_confirmation',
                                        actual_price: booking.estimated_price || 0,
                                        updated_at: new Date().toISOString()
                                    })
                                    .eq('id', bookingId);
                                
                                if (updateError) throw updateError;
                            }
                            
                            showToast('Service marked as completed. Waiting for customer confirmation.', 'success');
                        } catch (error) {
                            console.error('Error completing booking:', error);
                            showToast('Error completing service', 'error');
                        }
                    }
                    break;
                    
                case 'reschedule':
                    // Show reschedule modal (to be implemented)
                    showToast('Reschedule functionality coming soon', 'info');
                    break;
                    
                case 'view':
                    // Show booking details (to be implemented)
                    showToast('Viewing booking details', 'info');
                    break;
            }
            
            // Enhanced refresh with proper timing and error handling
            await this.refreshAfterAction(action);
            
        } catch (error) {
            console.error('Error handling booking action:', error);
            showToast('Error updating booking', 'error');
        }
    }

    /**
     * Enhanced refresh after booking actions with proper timing
     */
    async refreshAfterAction(action) {
        try {
            console.log('Refreshing dashboard after action:', action);
            
            // Always reload bookings first
            await this.loadBookings();
            
            // For actions that may result in history changes, reload history with delay
            if (['complete', 'reject'].includes(action)) {
                console.log('Action may affect history, scheduling history reload');
                
                // Reload immediately
                await this.loadBookingHistory();
                
                // Reload again after a delay to catch database propagation
                setTimeout(async () => {
                    console.log('Secondary history reload after database propagation');
                    await this.loadBookingHistory();
                    this.updateDashboardMetrics();
                }, 2000);
                
                // Final reload after longer delay for safety
                setTimeout(async () => {
                    console.log('Final history reload for confirmation');
                    await this.loadBookingHistory();
                    this.updateDashboardMetrics();
                }, 5000);
            }
            
            // Update metrics immediately
            this.updateDashboardMetrics();
            
            console.log('Dashboard refresh completed');
        } catch (error) {
            console.error('Error refreshing dashboard after action:', error);
        }
    }

    /**
     * Navigate to the bookings section
     */
    navigateToBookings() {
        // Update active nav link
        const navLinks = document.querySelectorAll('.dashboard-sidebar .nav-link');
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('data-section') === 'bookings') {
                link.classList.add('active');
            }
        });
        
        // Show bookings section
        this.showSection('bookings');
    }

    /**
     * Render booking history list
     */
    renderHistoryList() {
        try {
            const container = document.getElementById('history-list');
            if (!container) {
                console.error('History list container not found');
                return;
            }

            console.log('Rendering history list with', this.historyBookings.length, 'total bookings');
            console.log('Current history filter:', this.filters.historyStatus);

            // Filter history based on current filter
            const filteredHistory = this.filters.historyStatus === 'all' 
                ? this.historyBookings 
                : this.historyBookings.filter(b => b.status === this.filters.historyStatus);

            console.log('Filtered history bookings:', filteredHistory.length);

            if (filteredHistory.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-history fa-3x"></i>
                        <h5>No History Found</h5>
                        <p>You don't have any ${this.filters.historyStatus !== 'all' ? this.filters.historyStatus : ''} bookings in your history.</p>
                    </div>
                `;
                return;
            }

            container.innerHTML = filteredHistory.map(booking => `
                <div class="history-card" data-booking-id="${booking.id}">
                    <div class="history-header">
                        <h5>${booking.service?.title || booking.service_name || 'Service Booking'}</h5>
                        <div class="history-meta">
                            <span class="badge bg-${this.getStatusColor(booking.status)}">${booking.status}</span>
                            <span class="completion-date">${new Date(booking.updated_at).toLocaleDateString()}</span>
                        </div>
                    </div>
                    <div class="history-details">
                        <div class="row">
                            <div class="col-md-6">
                                <p><i class="fas fa-user"></i> ${booking.consumer ? `${booking.consumer.first_name} ${booking.consumer.last_name}` : 'Customer'}</p>
                                <p><i class="fas fa-calendar"></i> ${new Date(booking.scheduled_date).toLocaleDateString()}</p>
                                ${booking.scheduled_time ? `<p><i class="fas fa-clock"></i> ${booking.scheduled_time}</p>` : ''}
                            </div>
                            <div class="col-md-6">
                                ${booking.location_address ? `<p><i class="fas fa-map-marker-alt"></i> ${booking.location_address}</p>` : ''}
                                ${booking.actual_price ? `<p><i class="fas fa-dollar-sign"></i> ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(booking.actual_price)}</p>` : ''}
                                ${booking.completion_notes ? `<p><i class="fas fa-note-sticky"></i> ${booking.completion_notes}</p>` : ''}
                            </div>
                        </div>
                    </div>
                    ${booking.status === 'completed' ? `
                        <div class="history-actions">
                            <button class="btn btn-sm btn-outline-primary" onclick="window.providerBookingsManager.viewBookingDetails('${booking.id}')">
                                <i class="fas fa-eye"></i> View Details
                            </button>
                        </div>
                    ` : ''}
                </div>
            `).join('');
        } catch (error) {
            console.error('Error rendering history list:', error);
        }
    }

    /**
     * Render reviews list
     */
    renderReviewsList() {
        try {
            const container = document.getElementById('reviews-list');
            if (!container) return;

            if (this.reviews.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-star fa-3x"></i>
                        <h5>No Reviews Yet</h5>
                        <p>Complete some bookings to start receiving customer reviews.</p>
                    </div>
                `;
                return;
            }

            container.innerHTML = this.reviews.map(review => `
                <div class="review-card">
                    <div class="review-header">
                        <div class="reviewer-info">
                            <h6>${review.reviewer ? `${review.reviewer.first_name} ${review.reviewer.last_name}` : 'Anonymous Customer'}</h6>
                            <span class="review-date">${new Date(review.created_at).toLocaleDateString()}</span>
                        </div>
                        <div class="rating">
                            ${this.generateStarRating(review.rating)}
                        </div>
                    </div>
                    <div class="review-body">
                        <p class="service-name"><i class="fas fa-cog"></i> ${review.service?.title || 'Service'}</p>
                        ${review.review_text ? `<p class="review-text">"${review.review_text}"</p>` : ''}
                        ${review.provider_response ? `
                            <div class="provider-response">
                                <h6><i class="fas fa-reply"></i> Your Response:</h6>
                                <p>"${review.provider_response}"</p>
                            </div>
                        ` : `
                            <button class="btn btn-sm btn-outline-primary" onclick="window.providerBookingsManager.respondToReview('${review.id}')">
                                <i class="fas fa-reply"></i> Respond
                            </button>
                        `}
                    </div>
                </div>
            `).join('');
        } catch (error) {
            console.error('Error rendering reviews list:', error);
        }
    }

    /**
     * Update review statistics
     */
    updateReviewStats() {
        try {
            if (this.reviews.length === 0) {
                const avgRatingEl = document.getElementById('avg-rating');
                const totalReviewsEl = document.getElementById('total-reviews');
                const starsEl = document.getElementById('avg-rating-stars');
                
                if (avgRatingEl) avgRatingEl.textContent = '0.0';
                if (totalReviewsEl) totalReviewsEl.textContent = '0';
                if (starsEl) starsEl.innerHTML = this.generateStarRating(0);
                return;
            }

            // Calculate average rating
            const avgRating = this.reviews.reduce((sum, review) => sum + review.rating, 0) / this.reviews.length;
            
            // Update display
            const avgRatingEl = document.getElementById('avg-rating');
            const totalReviewsEl = document.getElementById('total-reviews');
            const starsEl = document.getElementById('avg-rating-stars');
            
            if (avgRatingEl) avgRatingEl.textContent = avgRating.toFixed(1);
            if (totalReviewsEl) totalReviewsEl.textContent = this.reviews.length;
            if (starsEl) starsEl.innerHTML = this.generateStarRating(avgRating);
        } catch (error) {
            console.error('Error updating review stats:', error);
        }
    }

    /**
     * Generate star rating HTML
     */
    generateStarRating(rating) {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;
        const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
        
        let starsHtml = '';
        
        // Full stars
        for (let i = 0; i < fullStars; i++) {
            starsHtml += '<i class="fas fa-star text-warning"></i>';
        }
        
        // Half star
        if (hasHalfStar) {
            starsHtml += '<i class="fas fa-star-half-alt text-warning"></i>';
        }
        
        // Empty stars
        for (let i = 0; i < emptyStars; i++) {
            starsHtml += '<i class="far fa-star text-muted"></i>';
        }
        
        return starsHtml;
    }

    /**
     * Populate profile form with user data
     */
    populateProfileForm(profile) {
        try {
            if (!profile) return;
            
            const fields = {
                'first-name': profile.first_name,
                'last-name': profile.last_name,
                'email': profile.email,
                'phone': profile.phone,
                'bio': profile.bio
            };
            
            Object.entries(fields).forEach(([fieldId, value]) => {
                const field = document.getElementById(fieldId);
                if (field && value) {
                    field.value = value;
                }
            });
        } catch (error) {
            console.error('Error populating profile form:', error);
        }
    }

    /**
     * Handle profile update
     */
    async handleProfileUpdate(e) {
        try {
            const formData = new FormData(e.target);
            const profileData = {
                first_name: formData.get('firstName'),
                last_name: formData.get('lastName'),
                phone: formData.get('phone'),
                bio: formData.get('bio')
            };

            const { error } = await window.supabase
                .from('profiles')
                .update(profileData)
                .eq('id', this.currentUser.id);

            if (error) throw error;

            this.showToast('Profile updated successfully', 'success');
        } catch (error) {
            console.error('Error updating profile:', error);
            this.showToast('Error updating profile', 'error');
        }
    }

    /**
     * Handle notification settings update
     */
    async handleNotificationUpdate(e) {
        try {
            const formData = new FormData(e.target);
            const notificationSettings = {
                email_notifications: formData.has('email-notifications'),
                booking_notifications: formData.has('booking-notifications'),
                review_notifications: formData.has('review-notifications'),
                marketing_notifications: formData.has('marketing-notifications')
            };

            // Update user settings in the database
            const { error } = await window.supabase
                .from('user_settings')
                .upsert({
                    user_id: this.currentUser.id,
                    ...notificationSettings,
                    updated_at: new Date().toISOString()
                });

            if (error) throw error;

            this.showToast('Notification preferences saved', 'success');
        } catch (error) {
            console.error('Error updating notification settings:', error);
            this.showToast('Error saving preferences', 'error');
        }
    }

    /**
     * Handle change password
     */
    handleChangePassword() {
        this.showToast('Password change functionality will be implemented', 'info');
    }

    /**
     * Handle download data
     */
    async handleDownloadData() {
        try {
            // Collect user data
            const userData = {
                profile: await this.getUserProfile(),
                bookings: [...this.bookings, ...this.historyBookings],
                reviews: this.reviews
            };

            // Create and download JSON file
            const dataStr = JSON.stringify(userData, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(dataBlob);
            
            const link = document.createElement('a');
            link.href = url;
            link.download = `ustahub-data-${new Date().toISOString().split('T')[0]}.json`;
            link.click();
            
            URL.revokeObjectURL(url);
            this.showToast('Data downloaded successfully', 'success');
        } catch (error) {
            console.error('Error downloading data:', error);
            this.showToast('Error downloading data', 'error');
        }
    }

    /**
     * Handle delete account
     */
    handleDeleteAccount() {
        if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
            this.showToast('Account deletion functionality will be implemented', 'info');
        }
    }

    /**
     * Get user profile data
     */
    async getUserProfile() {
        try {
            const { data, error } = await window.supabase
                .from('profiles')
                .select('*')
                .eq('id', this.currentUser.id)
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error getting user profile:', error);
            return null;
        }
    }

    /**
     * Respond to a review
     */
    async respondToReview(reviewId) {
        const response = prompt('Enter your response to this review:');
        if (!response) return;

        try {
            const { error } = await window.supabase
                .from('reviews')
                .update({ provider_response: response })
                .eq('id', reviewId)
                .eq('provider_id', this.currentUser.id);

            if (error) throw error;

            this.showToast('Response added successfully', 'success');
            this.loadReviews(); // Refresh reviews
        } catch (error) {
            console.error('Error responding to review:', error);
            this.showToast('Error adding response', 'error');
        }
    }

    /**
     * View booking details
     */
    viewBookingDetails(bookingId) {
        // Find booking in either active or history
        const booking = this.bookings.find(b => b.id === bookingId) || 
                       this.historyBookings.find(b => b.id === bookingId);
        
        if (booking) {
            // Create a simple modal or detailed view
            this.showToast(`Viewing details for booking: ${booking.service?.title || 'Service'}`, 'info');
            // TODO: Implement detailed booking modal
        }
    }

    /**
     * Show toast notification
     */
    showToast(message, type = 'info') {
        // Use existing showToast function if available, otherwise create basic notification
        if (typeof window.showToast === 'function') {
            window.showToast(message, type);
        } else {
            console.log(`${type.toUpperCase()}: ${message}`);
            
            // Try to create a basic Bootstrap toast if possible
            try {
                this.createBasicToast(message, type);
            } catch (error) {
                // Fallback to alert if all else fails
                alert(`${type.toUpperCase()}: ${message}`);
            }
        }
    }

    /**
     * Create a basic toast notification
     */
    createBasicToast(message, type) {
        // Create toast container if it doesn't exist
        let toastContainer = document.getElementById('toast-container');
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.id = 'toast-container';
            toastContainer.className = 'toast-container position-fixed top-0 end-0 p-3';
            toastContainer.style.zIndex = '9999';
            document.body.appendChild(toastContainer);
        }

        // Create toast element
        const toastId = 'toast-' + Date.now();
        const bgClass = type === 'error' ? 'danger' : type === 'success' ? 'success' : type === 'warning' ? 'warning' : 'primary';
        
        const toastHtml = `
            <div id="${toastId}" class="toast align-items-center text-white bg-${bgClass}" role="alert" aria-live="assertive" aria-atomic="true">
                <div class="d-flex">
                    <div class="toast-body">
                        ${message}
                    </div>
                    <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
                </div>
            </div>
        `;

        toastContainer.insertAdjacentHTML('beforeend', toastHtml);
        
        // Initialize and show toast if Bootstrap is available
        if (typeof bootstrap !== 'undefined' && bootstrap.Toast) {
            const toastElement = document.getElementById(toastId);
            const toast = new bootstrap.Toast(toastElement, { delay: 5000 });
            toast.show();

            // Remove toast element after it's hidden
            toastElement.addEventListener('hidden.bs.toast', () => {
                toastElement.remove();
            });
        } else {
            // Remove manually after delay if Bootstrap is not available
            setTimeout(() => {
                const toastElement = document.getElementById(toastId);
                if (toastElement) {
                    toastElement.remove();
                }
            }, 5000);
        }
    }
}

// Initialize and expose globally only if not already initialized
if (!window.providerBookingsManager) {
    window.providerBookingsManager = new ProviderBookingsManager();
    console.log('✅ Provider Bookings Manager initialized');
} else {
    console.log('Provider Bookings Manager already initialized');
} 