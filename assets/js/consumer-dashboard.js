/**
 * UstaHub Consumer Dashboard - Enhanced Profile Management
 * Safely integrates with existing codebase using unique namespace and IDs
 * Follows established patterns from provider dashboard and profile.js
 */

// Safe namespace to avoid conflicts
window.ConsumerDashboard = (function() {
    'use strict';

    // State management
    const state = {
        user: null,
        profile: null,
        bookings: [],
        favorites: [],
        reviews: [],
        activities: [],
        metrics: {
            activeBookings: 0,
            completedServices: 0,
            savedFavorites: 0,
            totalSpent: 0
        },
        currentSection: 'overview',
        isLoading: false
    };

    // Configuration
    const config = {
        animationDuration: 300,
        toastTimeout: 3000,
        refreshInterval: 5 * 60 * 1000, // 5 minutes
        maxActivityItems: 10,
        debug: false
    };

    // Utility functions
    const utils = {
        // Safe DOM queries with fallbacks
        safeQuery: (selector) => {
            try {
                return document.querySelector(selector);
            } catch (error) {
                console.warn('Safe query failed:', selector, error);
                return null;
            }
        },

        safeQueryAll: (selector) => {
            try {
                return document.querySelectorAll(selector);
            } catch (error) {
                console.warn('Safe query all failed:', selector, error);
                return [];
            }
        },

        // Show toast notifications using existing system
        showToast: (message, type = 'success') => {
            const toastContainer = utils.safeQuery('#toast-container') || utils.createToastContainer();
            const toast = document.createElement('div');
            toast.className = `toast align-items-center text-white bg-${type} border-0 show`;
            toast.setAttribute('role', 'alert');
            toast.setAttribute('aria-live', 'assertive');
            toast.setAttribute('aria-atomic', 'true');
            
            toast.innerHTML = `
                <div class="d-flex">
                    <div class="toast-body">
                        <i class="fa ${utils.getToastIcon(type)} me-2"></i>
                        ${message}
                    </div>
                    <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
                </div>
            `;
            
            toastContainer.appendChild(toast);
            
            setTimeout(() => {
                toast.classList.remove('show');
                setTimeout(() => toast.remove(), 300);
            }, config.toastTimeout);
        },

        createToastContainer: () => {
            const container = document.createElement('div');
            container.id = 'toast-container';
            container.className = 'toast-container position-fixed top-0 end-0 p-3';
            document.body.appendChild(container);
            return container;
        },

        getToastIcon: (type) => {
            const icons = {
                success: 'fa-check-circle',
                error: 'fa-exclamation-circle',
                warning: 'fa-exclamation-triangle',
                info: 'fa-info-circle'
            };
            return icons[type] || icons.info;
        },

        // Format currency using existing patterns
        formatCurrency: (amount) => {
            return new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD'
            }).format(amount);
        },

        // Format dates consistently
        formatDate: (dateString) => {
            return new Date(dateString).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        },

        // Safe element updates
        updateElement: (selector, content, isHTML = false) => {
            const element = utils.safeQuery(selector);
            if (element) {
                if (isHTML) {
                    element.innerHTML = content;
                } else {
                    element.textContent = content;
                }
            }
        },

        // Animate element visibility
        fadeIn: (element, delay = 0) => {
            if (element) {
                setTimeout(() => {
                    element.style.opacity = '0';
                    element.style.transform = 'translateY(20px)';
                    element.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
                    
                    requestAnimationFrame(() => {
                        element.style.opacity = '1';
                        element.style.transform = 'translateY(0)';
                    });
                }, delay);
            }
        }
    };

    // Core initialization
    async function init(user) {
        if (!user) {
            throw new Error('User is required for initialization');
        }

        try {
            state.user = user;
            state.isLoading = true;

            // Load all data in parallel for better performance
            await Promise.all([
                loadUserProfile(),
                loadUserMetrics(),
                loadRecentActivities()
            ]);

            // Setup UI
            updateProfileDisplay();
            renderMetricCards();
            renderActivityFeed();
            setupSectionNavigation();
            initializeEventListeners();
            setupPeriodicRefresh();
            initializeInternationalization();

            // Check for pending service confirmations after a short delay
            setTimeout(async () => {
                await checkServiceCompletions();
            }, 2000);

            state.isLoading = false;
            console.log('✅ Consumer Dashboard initialized successfully');

        } catch (error) {
            state.error = error.message;
            state.isLoading = false;
            console.error('❌ Consumer Dashboard initialization failed:', error);
            utils.showToast('Failed to load dashboard', 'error');
        }
    }

    // Load user profile data safely
    async function loadUserProfile() {
        try {
            if (!window.supabase) {
                throw new Error('Supabase not available');
            }

            const { data: profile, error } = await window.supabase
                .from('profiles')
                .select('*')
                .eq('id', state.user.id)
                .single();

            if (error) throw error;

            state.profile = profile;
            return profile;

        } catch (error) {
            console.error('Error loading user profile:', error);
            // Use fallback data
            state.profile = {
                id: state.user.id,
                first_name: state.user.user_metadata?.first_name || 'User',
                last_name: state.user.user_metadata?.last_name || '',
                email: state.user.email,
                role: 'consumer'
            };
        }
    }

    // Load user metrics
    async function loadUserMetrics() {
        try {
            if (!window.supabase) return;

            // Load bookings with safe error handling
            const { data: bookings, error: bookingsError } = await window.supabase
                .from('bookings')
                .select('*')
                .eq('consumer_id', state.user.id);

            if (!bookingsError && bookings) {
                state.bookings = bookings;
                
                // Calculate metrics
                state.metrics.activeBookings = bookings.filter(b => 
                    ['pending', 'confirmed'].includes(b.status)
                ).length;

                state.metrics.completedServices = bookings.filter(b => 
                    b.status === 'completed'
                ).length;

                state.metrics.totalSpent = bookings
                    .filter(b => b.status === 'completed' && b.actual_price)
                    .reduce((sum, b) => sum + parseFloat(b.actual_price || 0), 0);
            }

            // Load favorites count (implement when favorites table exists)
            state.metrics.savedFavorites = 0; // Placeholder

        } catch (error) {
            console.error('Error loading user metrics:', error);
        }
    }

    // Load recent activities
    async function loadRecentActivities() {
        try {
            const activities = [];

            // Add booking activities
            if (state.bookings.length > 0) {
                state.bookings
                    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                    .slice(0, 5)
                    .forEach(booking => {
                        activities.push({
                            id: `booking-${booking.id}`,
                            type: 'booking',
                            title: `Booking ${booking.status}`,
                            description: `Service booking for ${booking.service_name || 'service'}`,
                            date: booking.created_at,
                            status: booking.status,
                            icon: 'fa-calendar-check'
                        });
                    });
            }

            // Sort all activities by date
            state.activities = activities
                .sort((a, b) => new Date(b.date) - new Date(a.date))
                .slice(0, config.maxActivityItems);

        } catch (error) {
            console.error('Error loading recent activities:', error);
            state.activities = [];
        }
    }

    // Update profile display
    function updateProfileDisplay() {
        if (!state.profile) return;

        const fullName = `${state.profile.first_name} ${state.profile.last_name}`.trim();
        
        // Update hero section
        utils.updateElement('#heroProfileName', fullName || 'Consumer');
        utils.updateElement('#heroProfileRole', 'Customer');
        
        // Update profile form if in settings section
        if (state.currentSection === 'profile-settings') {
            utils.updateElement('#consumerFirstName', state.profile.first_name || '');
            utils.updateElement('#consumerLastName', state.profile.last_name || '');
            utils.updateElement('#consumerEmail', state.profile.email || '');
            utils.updateElement('#consumerPhone', state.profile.phone || '');
        }
    }

    // Render metric cards
    function renderMetricCards() {
        utils.updateElement('#activeBookingsCount', state.metrics.activeBookings);
        utils.updateElement('#completedServicesCount', state.metrics.completedServices);
        utils.updateElement('#savedFavoritesCount', state.metrics.savedFavorites);
        utils.updateElement('#totalSpentAmount', utils.formatCurrency(state.metrics.totalSpent));

        // Update navigation badges
        utils.updateElement('#bookingsCount', state.bookings.length);
        utils.updateElement('#favoritesCount', state.metrics.savedFavorites);
    }

    // Render activity feed
    function renderActivityFeed() {
        const feedContainer = utils.safeQuery('#consumerActivityFeed');
        if (!feedContainer) return;

        if (state.activities.length === 0) {
            feedContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fa fa-clock"></i>
                    <h5>No Recent Activity</h5>
                    <p>Your recent activities will appear here.</p>
                </div>
            `;
            return;
        }

        feedContainer.innerHTML = state.activities.map(activity => `
            <div class="activity-item" data-activity-id="${activity.id}">
                <div class="d-flex align-items-start">
                    <div class="activity-icon me-3">
                        <i class="fa ${activity.icon} text-primary"></i>
                    </div>
                    <div class="flex-grow-1">
                        <h6 class="mb-1">${activity.title}</h6>
                        <p class="text-muted mb-1">${activity.description}</p>
                        <small class="text-muted">${utils.formatDate(activity.date)}</small>
                    </div>
                    ${activity.status ? `
                        <span class="badge bg-${getStatusColor(activity.status)}">${activity.status}</span>
                    ` : ''}
                </div>
            </div>
        `).join('');
    }

    // Setup section navigation
    function setupSectionNavigation() {
        const navLinks = utils.safeQueryAll('.consumer-dashboard-sidebar .nav-link');
        
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = link.getAttribute('data-section');
                if (section) {
                    switchSection(section);
                }
            });
        });
    }

    // Switch between dashboard sections
    function switchSection(sectionName) {
        // Update navigation
        utils.safeQueryAll('.consumer-dashboard-sidebar .nav-link').forEach(link => {
            link.classList.remove('active');
        });
        
        const activeLink = utils.safeQuery(`[data-section="${sectionName}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }

        // Update content sections
        utils.safeQueryAll('.dashboard-section').forEach(section => {
            section.classList.remove('active');
        });

        const activeSection = utils.safeQuery(`#${sectionName}-section`);
        if (activeSection) {
            activeSection.classList.add('active');
            state.currentSection = sectionName;

            // Load section-specific data
            loadSectionData(sectionName);
        }
    }

    // Load section-specific data
    async function loadSectionData(sectionName) {
        switch (sectionName) {
            case 'bookings':
                await loadBookingsSection();
                break;
            case 'favorites':
                await loadFavoritesSection();
                break;
            case 'reviews':
                await loadReviewsSection();
                break;
            case 'profile-settings':
                updateProfileDisplay();
                break;
        }
    }

    // Load bookings section
    async function loadBookingsSection() {
        const container = utils.safeQuery('#consumerBookingsContainer');
        if (!container) return;

        if (state.bookings.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fa fa-calendar"></i>
                    <h5>No Bookings Yet</h5>
                    <p>Your service bookings will appear here.</p>
                    <a href="service-category.html" class="btn btn-primary">Find Services</a>
                </div>
            `;
            return;
        }

        container.innerHTML = state.bookings.map(booking => `
            <div class="booking-card" data-booking-id="${booking.id}">
                <div class="booking-header">
                    <h5>${booking.service_name || 'Service Booking'}</h5>
                    <span class="booking-status ${booking.status}">${booking.status}</span>
                </div>
                <div class="booking-details">
                    <p><i class="fa fa-calendar"></i> ${utils.formatDate(booking.scheduled_date)}</p>
                    <p><i class="fa fa-clock"></i> ${booking.scheduled_time}</p>
                    <p><i class="fa fa-map-marker"></i> ${booking.location_address}</p>
                    ${booking.estimated_price ? `<p><i class="fa fa-dollar-sign"></i> ${utils.formatCurrency(booking.estimated_price)}</p>` : ''}
                </div>
                <div class="booking-actions">
                    ${getBookingActions(booking)}
                </div>
            </div>
        `).join('');

        // Setup booking filters
        setupBookingFilters();
    }

    // Setup booking filters
    function setupBookingFilters() {
        const filterButtons = utils.safeQueryAll('.booking-filters .filter-btn');
        
        filterButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                // Update active filter
                filterButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                const status = btn.getAttribute('data-status');
                filterBookings(status);
            });
        });
    }

    // Filter bookings by status
    function filterBookings(status) {
        const bookingCards = utils.safeQueryAll('.booking-card');
        
        bookingCards.forEach(card => {
            const bookingId = card.getAttribute('data-booking-id');
            const booking = state.bookings.find(b => b.id === bookingId);
            
            if (status === 'all' || !booking || booking.status === status) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
    }

    // Load favorites section
    async function loadFavoritesSection() {
        const container = utils.safeQuery('#consumerFavoritesContainer');
        if (!container) return;

        // Placeholder for favorites functionality
        container.innerHTML = `
            <div class="empty-state">
                <i class="fa fa-heart"></i>
                <h5>No Favorites Yet</h5>
                <p>Save your favorite services for quick access.</p>
                <a href="service-category.html" class="btn btn-primary">Browse Services</a>
            </div>
        `;
    }

    // Load reviews section
    async function loadReviewsSection() {
        const container = utils.safeQuery('#consumerReviewsContainer');
        if (!container) return;

        // Placeholder for reviews functionality
        container.innerHTML = `
            <div class="empty-state">
                <i class="fa fa-star"></i>
                <h5>No Reviews Yet</h5>
                <p>Reviews for completed services will appear here.</p>
            </div>
        `;
    }

    // Initialize event listeners
    function initializeEventListeners() {
        // Profile form submission
        const profileForm = utils.safeQuery('#consumerProfileForm');
        if (profileForm) {
            profileForm.addEventListener('submit', handleProfileUpdate);
        }

        // Profile picture upload
        const pictureInput = utils.safeQuery('#profilePictureInput');
        if (pictureInput) {
            pictureInput.addEventListener('change', handleProfilePictureUpload);
        }

        // Activity filter buttons
        const activityFilters = utils.safeQueryAll('.activity-filters .filter-btn');
        activityFilters.forEach(btn => {
            btn.addEventListener('click', (e) => {
                activityFilters.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                const filter = btn.getAttribute('data-filter');
                filterActivities(filter);
            });
        });

        // View toggle for favorites
        const viewToggle = utils.safeQueryAll('.view-toggle .toggle-btn');
        viewToggle.forEach(btn => {
            btn.addEventListener('click', (e) => {
                viewToggle.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                const view = btn.getAttribute('data-view');
                toggleFavoritesView(view);
            });
        });
    }

    // Handle profile update
    async function handleProfileUpdate(e) {
        e.preventDefault();
        
        try {
            const formData = new FormData(e.target);
            const updates = {
                first_name: formData.get('first_name') || utils.safeQuery('#consumerFirstName')?.value,
                last_name: formData.get('last_name') || utils.safeQuery('#consumerLastName')?.value,
                phone: formData.get('phone') || utils.safeQuery('#consumerPhone')?.value,
                // Don't update email through this form for security
            };

            if (!window.supabase) {
                throw new Error('Supabase not available');
            }

            const { error } = await window.supabase
                .from('profiles')
                .update(updates)
                .eq('id', state.user.id);

            if (error) throw error;

            // Update local state
            Object.assign(state.profile, updates);
            updateProfileDisplay();
            
            utils.showToast('Profile updated successfully', 'success');

        } catch (error) {
            console.error('Error updating profile:', error);
            utils.showToast('Error updating profile', 'error');
        }
    }

    // Handle profile picture upload
    function handleProfilePictureUpload(e) {
        const file = e.target.files[0];
        if (!file) return;

        // Basic validation
        if (!file.type.startsWith('image/')) {
            utils.showToast('Please select an image file', 'error');
            return;
        }

        if (file.size > 5 * 1024 * 1024) { // 5MB limit
            utils.showToast('Image size must be less than 5MB', 'error');
            return;
        }

        // Preview the image
        const reader = new FileReader();
        reader.onload = (e) => {
            const previewImg = utils.safeQuery('#currentProfilePicture');
            if (previewImg) {
                previewImg.src = e.target.result;
            }
        };
        reader.readAsDataURL(file);

        utils.showToast('Profile picture updated (upload functionality to be implemented)', 'info');
    }

    // Filter activities
    function filterActivities(filter) {
        const activityItems = utils.safeQueryAll('.activity-item');
        
        activityItems.forEach(item => {
            const activityId = item.getAttribute('data-activity-id');
            const activity = state.activities.find(a => a.id === activityId);
            
            if (filter === 'all' || !activity || activity.type === filter) {
                item.style.display = 'block';
            } else {
                item.style.display = 'none';
            }
        });
    }

    // Toggle favorites view
    function toggleFavoritesView(view) {
        const container = utils.safeQuery('#consumerFavoritesContainer');
        if (!container) return;

        container.classList.remove('grid-view', 'list-view');
        container.classList.add(`${view}-view`);
    }

    // Initialize internationalization
    function initializeInternationalization() {
        // Use existing i18n system if available
        if (window.UstaI18n) {
            // Let the existing i18n system handle translations
            console.log('Using existing i18n system');
        }
    }

    // Setup periodic refresh
    function setupPeriodicRefresh() {
        setInterval(async () => {
            try {
                if (!state.isLoading && state.currentSection === 'overview') {
                    await loadUserMetrics();
                    renderMetricCards();
                }
                
                // Check for service completions
                await checkServiceCompletions();
            } catch (error) {
                console.warn('Periodic refresh failed:', error);
            }
        }, config.refreshInterval);
    }

    // Check for pending service confirmations
    async function checkServiceCompletions() {
        if (window.serviceCompletionManager) {
            await window.serviceCompletionManager.checkForPendingConfirmations();
        }
    }

    // Get booking action buttons based on status
    function getBookingActions(booking) {
        switch (booking.status) {
            case 'pending':
                return `
                    <button class="btn btn-sm btn-outline-primary" onclick="viewBookingDetails('${booking.id}')">
                        <i class="fas fa-eye"></i> View Details
                    </button>
                `;
            case 'confirmed': 
                return `
                    <button class="btn btn-sm btn-outline-primary" onclick="viewBookingDetails('${booking.id}')">
                        <i class="fas fa-eye"></i> View Details
                    </button>
                `;
            case 'pending_confirmation':
                return `
                    <button class="btn btn-sm btn-warning" onclick="window.serviceCompletionManager.showConfirmationModal(${JSON.stringify(booking).replace(/"/g, '&quot;')})">
                        <i class="fas fa-star"></i> Confirm & Rate
                    </button>
                `;
            case 'completed':
                return `
                    <span class="badge bg-success">
                        <i class="fas fa-check-circle"></i> Completed
                    </span>
                `;
            case 'cancelled':
                return `
                    <span class="badge bg-danger">
                        <i class="fas fa-times-circle"></i> Cancelled
                    </span>
                `;
            default:
                return '';
        }
    }

    // Enhanced status color function with pending_confirmation
    function getStatusColor(status) {
        const colors = {
            pending: 'warning',
            confirmed: 'primary',
            pending_confirmation: 'info',
            completed: 'success',
            cancelled: 'danger'
        };
        return colors[status] || 'secondary';
    }

    // Global action handlers (called from HTML)
    window.viewBookingDetails = function(bookingId) {
        const booking = state.bookings.find(b => b.id === bookingId);
        if (booking) {
            utils.showToast(`Viewing details for ${booking.service_name || 'booking'}`, 'info');
            // Implement booking details modal or navigation
        }
    };

    window.cancelBooking = function(bookingId) {
        const booking = state.bookings.find(b => b.id === bookingId);
        if (booking && confirm(`Cancel booking for ${booking.service_name || 'this service'}?`)) {
            // Implement booking cancellation
            utils.showToast('Booking cancellation feature to be implemented', 'info');
        }
    };

    window.showBookingHistory = function() {
        switchSection('bookings');
    };

    window.manageNotifications = function() {
        switchSection('profile-settings');
    };

    window.contactSupport = function() {
        window.location.href = 'contact.html';
    };

    window.writeNewReview = function() {
        utils.showToast('Review writing feature to be implemented', 'info');
    };

    // Public API
    return {
        init,
        switchSection,
        getState: () => ({ ...state }),
        updateMetrics: loadUserMetrics,
        refreshDashboard: () => loadRecentActivities()
    };

})();

// Auto-initialize if elements are present
document.addEventListener('DOMContentLoaded', function() {
    // Only initialize if we're on the consumer profile page
    if (document.querySelector('.consumer-dashboard-content')) {
        console.log('Consumer dashboard elements detected, ready for initialization');
    }
});
