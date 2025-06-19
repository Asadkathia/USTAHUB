/**
 * Provider Bookings Manager
 * Handles loading, displaying, and managing bookings for service providers
 */

class ProviderBookingsManager {
    constructor() {
        this.bookings = [];
        this.currentUser = null;
        this.filters = {
            status: 'all'
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
            
            // Set up event listeners
            this.setupEventListeners();
            
            // Set up periodic refresh (every 2 minutes)
            setInterval(() => this.loadBookings(), 2 * 60 * 1000);
            
            this.initialized = true;
            console.log('✅ Provider Bookings Manager initialized');
        } catch (error) {
            console.error('Error initializing Provider Bookings Manager:', error);
        }
    }

    /**
     * Load bookings from Supabase
     */
    async loadBookings() {
        try {
            if (!this.currentUser) return;

            // Fetch bookings for the provider
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
     * Update dashboard metrics based on bookings
     */
    updateDashboardMetrics() {
        try {
            // Calculate metrics
            const metrics = {
                requests: this.bookings.filter(b => b.status === 'pending').length,
                upcoming: this.bookings.filter(b => b.status === 'confirmed').length,
                completed: this.bookings.filter(b => b.status === 'completed').length
            };

            // Update metric displays
            document.getElementById('stat-requests').textContent = metrics.requests;
            document.getElementById('stat-bookings').textContent = metrics.upcoming;
            document.getElementById('stat-completed').textContent = metrics.completed;

            // Update progress bars
            document.getElementById('requests-progress').style.width = Math.min(metrics.requests * 10, 100) + '%';
            document.getElementById('bookings-progress').style.width = Math.min(metrics.upcoming * 15, 100) + '%';
            document.getElementById('completed-progress').style.width = Math.min(metrics.completed * 3, 100) + '%';
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
        if (filterButtons) {
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

        // Set up section navigation
        const navLinks = document.querySelectorAll('.dashboard-sidebar .nav-link');
        if (navLinks) {
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
            pending_confirmation: 'info',
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
            case 'pending_confirmation':
                return `
                    <span class="badge bg-info">
                        <i class="fas fa-clock"></i> Waiting for Customer
                    </span>
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
                    if (window.serviceCompletionManager) {
                        window.serviceCompletionManager.showCompletionModal(booking);
                    } else {
                        // Direct update if no modal available
                        await window.supabase
                            .from('bookings')
                            .update({ 
                                status: 'completed',
                                completed_by_provider: true,
                                provider_completion_time: new Date().toISOString()
                            })
                            .eq('id', bookingId);
                        
                        showToast('Service marked as completed', 'success');
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
            
            // Reload bookings to refresh the list
            await this.loadBookings();
            
        } catch (error) {
            console.error('Error handling booking action:', error);
            showToast('Error updating booking', 'error');
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
}

// Initialize and expose globally
window.providerBookingsManager = new ProviderBookingsManager(); 