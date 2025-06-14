// Dashboard JavaScript - UstaHub
// Modern, reactive UI/UX for both Consumer and Provider dashboards

// CSS Variables and Utility Classes - Updated for Phase 2
const CSS_VARS = {
    '--transition': '0.3s ease',
    '--primary-color': '#24B47E',
    '--secondary-color': '#182B3A', 
    '--accent-color': '#FFC857',
    '--success-color': '#4BDB97',
    '--hover-shadow': '0 8px 32px rgba(36,180,126,0.15)',
    '--card-shadow': '0 4px 24px rgba(0,0,0,0.08)'
};

// Sample Data for Demo
const SAMPLE_DATA = {
    categories: [
        { name: 'Home Services', icon: 'fa-wrench', services: ['Plumbing', 'Electrical', 'HVAC', 'Cleaning'] },
        { name: 'Beauty & Spas', icon: 'fa-cut', services: ['Hair Salons', 'Nail Salons', 'Spas', 'Massage'] },
        { name: 'Health & Medical', icon: 'fa-user-md', services: ['Doctors', 'Dentists', 'Therapists', 'Wellness'] },
        { name: 'Automotive', icon: 'fa-car', services: ['Auto Repair', 'Car Wash', 'Tire Services'] },
        { name: 'Event Planning', icon: 'fa-camera', services: ['Photographers', 'DJs', 'Event Venues'] },
        { name: 'Business Services', icon: 'fa-briefcase', services: ['Accounting', 'Legal', 'Marketing'] }
    ],
    providers: [
        { id: 1, name: 'John Smith', service: 'Plumbing Expert', rating: 4.8, image: 'assets/img/pro-1.jpg', price: '$50/hr' },
        { id: 2, name: 'Sarah Johnson', service: 'Cleaning Specialist', rating: 5.0, image: 'assets/img/pro-2.jpg', price: '$30/hr' },
        { id: 3, name: 'Mike Chen', service: 'Electrical Contractor', rating: 4.9, image: 'assets/img/pro-3.jpg', price: '$60/hr' },
        { id: 4, name: 'Lisa Williams', service: 'Hair Stylist', rating: 4.7, image: 'assets/img/pro-4.jpg', price: '$40/hr' }
    ],
    bookings: [
        { id: 1, provider: 'John Smith', service: 'Plumbing Repair', date: '2024-01-15', status: 'completed' },
        { id: 2, provider: 'Sarah Johnson', service: 'House Cleaning', date: '2024-01-20', status: 'upcoming' },
        { id: 3, provider: 'Mike Chen', service: 'Electrical Installation', date: '2024-01-25', status: 'pending' }
    ],
    requests: [
        { id: 1, customer: 'Emily Chen', service: 'Plumbing', date: '2024-01-15', details: 'Kitchen sink repair needed' },
        { id: 2, customer: 'Ahmed Khan', service: 'Cleaning', date: '2024-01-16', details: 'Deep cleaning for 3BR apartment' },
        { id: 3, customer: 'Maria Garcia', service: 'Electrical', date: '2024-01-17', details: 'Install ceiling fan' }
    ],
    services: [
        { id: 1, name: 'General Plumbing', price: 50 },
        { id: 2, name: 'House Cleaning', price: 30 },
        { id: 3, name: 'Electrical Repair', price: 60 }
    ],
    stats: {
        leads: 3,
        pending: 2,
        completed: 27
    }
};

// Utility Functions
const utils = {
    // Smooth scroll to element
    scrollToElement(selector) {
        const element = document.querySelector(selector);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    },

    // Animate number counter
    animateCounter(element, target, duration = 1000) {
        const start = 0;
        const increment = target / (duration / 16);
        let current = start;
        
        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                element.textContent = target;
                clearInterval(timer);
            } else {
                element.textContent = Math.floor(current);
            }
        }, 16);
    },

    // Show toast notification
    showToast(message, type = 'success') {
        const toastContainer = document.getElementById('toast-container') || this.createToastContainer();
        const toast = document.createElement('div');
        toast.className = `toast align-items-center text-white bg-${type} border-0 show`;
        toast.setAttribute('role', 'alert');
        toast.setAttribute('aria-live', 'assertive');
        toast.setAttribute('aria-atomic', 'true');
        
        toast.innerHTML = `
            <div class="d-flex">
                <div class="toast-body">${message}</div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        `;
        
        toastContainer.appendChild(toast);
        
        // Auto remove after 3 seconds
        setTimeout(() => {
            toast.remove();
        }, 3000);
    },

    // Create toast container if it doesn't exist
    createToastContainer() {
        const container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'toast-container position-fixed top-0 end-0 p-3';
        container.style.zIndex = '9999';
        document.body.appendChild(container);
        return container;
    },

    // Debounce function for search
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    // Add fade-in animation
    fadeIn(element, delay = 0) {
        element.style.opacity = '0';
        element.style.transform = 'translateY(20px)';
        element.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
        
        setTimeout(() => {
            element.style.opacity = '1';
            element.style.transform = 'translateY(0)';
        }, delay);
    }
};

// Consumer Dashboard Functions
function initConsumerDashboard() {
    if (!document.querySelector('.consumer-dashboard')) return;
    
    console.log('Initializing Consumer Dashboard...');
    
    // Initialize search with auto-suggest
    initConsumerSearch();
    
    // Initialize featured categories
    initFeaturedCategories();
    
    // Initialize provider carousel
    initProviderCarousel();
    
    // Initialize recent bookings
    initRecentBookings();
    
    // Initialize responsive sidebar
    initResponsiveSidebar();
    
    // Add fade-in animations
    document.querySelectorAll('.dashboard-section').forEach((section, index) => {
        utils.fadeIn(section, index * 100);
    });
}

function initConsumerSearch() {
    const searchInput = document.getElementById('consumer-search');
    const suggestionsContainer = document.getElementById('search-suggestions');
    
    if (!searchInput || !suggestionsContainer) return;
    
    const debouncedSearch = utils.debounce((query) => {
        if (query.length < 2) {
            suggestionsContainer.innerHTML = '';
            suggestionsContainer.classList.remove('show');
            return;
        }
        
        // Filter categories and services
        const suggestions = [];
        SAMPLE_DATA.categories.forEach(category => {
            if (category.name.toLowerCase().includes(query.toLowerCase())) {
                suggestions.push({ type: 'category', name: category.name, icon: category.icon });
            }
            category.services.forEach(service => {
                if (service.toLowerCase().includes(query.toLowerCase())) {
                    suggestions.push({ type: 'service', name: service, category: category.name });
                }
            });
        });
        
        // Render suggestions
        suggestionsContainer.innerHTML = suggestions.slice(0, 5).map(item => `
            <li class="list-group-item list-group-item-action suggestion-item" data-type="${item.type}" data-name="${item.name}">
                <i class="fa ${item.icon || 'fa-search'} me-2"></i>
                <span>${item.name}</span>
                ${item.category ? `<small class="text-muted ms-auto">${item.category}</small>` : ''}
            </li>
        `).join('');
        
        suggestionsContainer.classList.add('show');
        
        // Add click handlers to suggestions
        suggestionsContainer.querySelectorAll('.suggestion-item').forEach(item => {
            item.addEventListener('click', () => {
                const name = item.dataset.name;
                searchInput.value = name;
                suggestionsContainer.classList.remove('show');
                
                // Scroll to relevant section
                if (item.dataset.type === 'category') {
                    utils.scrollToElement('.featured-categories');
                } else {
                    utils.scrollToElement('.recommended-providers');
                }
                
                utils.showToast(`Showing results for "${name}"`);
            });
        });
    }, 300);
    
    searchInput.addEventListener('input', (e) => {
        debouncedSearch(e.target.value);
    });
    
    // Hide suggestions when clicking outside
    document.addEventListener('click', (e) => {
        if (!searchInput.contains(e.target) && !suggestionsContainer.contains(e.target)) {
            suggestionsContainer.classList.remove('show');
        }
    });
}

function initFeaturedCategories() {
    const categoriesContainer = document.getElementById('featured-categories');
    if (!categoriesContainer) return;
    
    categoriesContainer.innerHTML = SAMPLE_DATA.categories.map(category => `
        <div class="col-6 col-md-4 col-lg-3">
            <div class="featured-category-card category-hover" data-category="${category.name}">
                <div class="category-icon"><i class="fa ${category.icon}"></i></div>
                <div class="category-name">${category.name}</div>
            </div>
        </div>
    `).join('');
    
    // Add click handlers
    categoriesContainer.querySelectorAll('.featured-category-card').forEach(card => {
        card.addEventListener('click', () => {
            const categoryName = card.dataset.category;
            utils.showToast(`Browsing ${categoryName} services`);
            // Here you would typically navigate to category page
        });
    });
}

function initProviderCarousel() {
    const carousel = document.getElementById('provider-carousel');
    const prevBtn = document.getElementById('provider-prev');
    const nextBtn = document.getElementById('provider-next');
    
    if (!carousel) return;
    
    let currentIndex = 0;
    const itemsPerView = window.innerWidth < 768 ? 1 : 2;
    const maxIndex = Math.max(0, SAMPLE_DATA.providers.length - itemsPerView);
    
    // Render providers
    carousel.innerHTML = SAMPLE_DATA.providers.map(provider => `
        <div class="provider-card" data-provider-id="${provider.id}">
            <img src="${provider.image}" alt="${provider.name}" onerror="this.src='assets/img/default-avatar.jpg'">
            <div class="provider-info">
                <div class="fw-bold">${provider.name}</div>
                <div class="text-muted small">${provider.service}</div>
                <div class="text-warning">
                    <i class="fa fa-star"></i> ${provider.rating}
                    <span class="text-muted ms-2">${provider.price}</span>
                </div>
            </div>
            <button class="btn btn-outline-primary ms-auto book-provider-btn">Book Now</button>
        </div>
    `).join('');
    
    // Add booking handlers
    carousel.querySelectorAll('.book-provider-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const providerId = btn.closest('.provider-card').dataset.providerId;
            const provider = SAMPLE_DATA.providers.find(p => p.id == providerId);
            
            btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Booking...';
            btn.disabled = true;
            
            setTimeout(() => {
                btn.innerHTML = 'Booked!';
                btn.classList.remove('btn-outline-primary');
                btn.classList.add('btn-success');
                utils.showToast(`Successfully booked ${provider.name}!`);
            }, 1500);
        });
    });
    
    // Carousel navigation
    function updateCarousel() {
        const translateX = -(currentIndex * (100 / itemsPerView));
        carousel.style.transform = `translateX(${translateX}%)`;
        
        if (prevBtn) prevBtn.disabled = currentIndex === 0;
        if (nextBtn) nextBtn.disabled = currentIndex >= maxIndex;
    }
    
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            if (currentIndex > 0) {
                currentIndex--;
                updateCarousel();
            }
        });
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            if (currentIndex < maxIndex) {
                currentIndex++;
                updateCarousel();
            }
        });
    }
    
    updateCarousel();
}

function initRecentBookings() {
    const bookingsContainer = document.getElementById('recent-bookings');
    if (!bookingsContainer) return;
    
    if (SAMPLE_DATA.bookings.length === 0) {
        bookingsContainer.innerHTML = '<div class="text-center text-muted py-4">No bookings yet</div>';
        return;
    }
    
    bookingsContainer.innerHTML = SAMPLE_DATA.bookings.map(booking => `
        <div class="list-group-item d-flex justify-content-between align-items-center booking-item" data-booking-id="${booking.id}">
            <div>
                <div class="fw-bold">${booking.service}</div>
                <div class="text-muted small">
                    Provider: ${booking.provider} • ${new Date(booking.date).toLocaleDateString()}
                </div>
            </div>
            <div class="d-flex gap-2">
                <span class="badge bg-${booking.status === 'completed' ? 'success' : booking.status === 'upcoming' ? 'primary' : 'warning'}">${booking.status}</span>
                ${booking.status !== 'completed' ? '<button class="btn btn-sm btn-outline-danger cancel-booking-btn">Cancel</button>' : ''}
            </div>
        </div>
    `).join('');
    
    // Add cancel booking handlers
    bookingsContainer.querySelectorAll('.cancel-booking-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const bookingId = btn.closest('.booking-item').dataset.bookingId;
            showCancelModal(bookingId);
        });
    });
}

function showCancelModal(bookingId) {
    const booking = SAMPLE_DATA.bookings.find(b => b.id == bookingId);
    const modal = document.getElementById('cancel-modal');
    
    if (modal) {
        const modalBody = modal.querySelector('.modal-body');
        modalBody.innerHTML = `Are you sure you want to cancel your booking for <strong>${booking.service}</strong> with ${booking.provider}?`;
        
        const confirmBtn = modal.querySelector('.confirm-cancel-btn');
        confirmBtn.onclick = () => {
            cancelBooking(bookingId);
            bootstrap.Modal.getInstance(modal).hide();
        };
        
        new bootstrap.Modal(modal).show();
    }
}

function cancelBooking(bookingId) {
    const bookingElement = document.querySelector(`[data-booking-id="${bookingId}"]`);
    if (bookingElement) {
        bookingElement.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        bookingElement.style.opacity = '0';
        bookingElement.style.transform = 'translateX(-100%)';
        
        setTimeout(() => {
            bookingElement.remove();
            utils.showToast('Booking cancelled successfully', 'warning');
        }, 300);
    }
}

// Provider Dashboard Functions
let currentProviderProfile = null; // Variable to store the fetched profile

async function initProviderDashboard() {
    if (!document.querySelector('.provider-dashboard')) return;
    
    console.log('Initializing Provider Dashboard...');
    
    try {
        if (!window.supabase) {
            utils.showToast('Supabase client not available. Dashboard cannot load.', 'danger');
            return;
        }
        const { data: { session }, error: sessionError } = await window.supabase.auth.getSession();
        
        if (sessionError) throw sessionError;
        if (!session) {
            console.warn('No active session. Redirecting to sign-in.');
            window.location.href = 'sign-in.html';
            return;
        }

        const { data: profile, error: profileError } = await window.supabase
            .from('profiles')
            .select('*, primary_service_category') 
            .eq('id', session.user.id)
            .single();

        if (profileError) {
            console.error('Error fetching profile:', profileError);
            utils.showToast('Error loading your profile. ', 'danger');
            if (profileError.code === 'PGRST116') { 
                 utils.showToast('Profile not found. Redirecting to sign-in.', 'danger');
                 setTimeout(() => window.location.href = 'sign-in.html', 2000);
            }
            return;
        }
        if (!profile) {
            console.error("Provider profile not found for user:", session.user.id);
            utils.showToast('Could not load your profile. Please try logging out and back in.', 'danger');
            return;
        }
        currentProviderProfile = profile; 
        console.log("Provider profile loaded:", currentProviderProfile);

        initAnimatedStats();
        initIncomingRequests();
        // initServicesTable(); // REMOVED - handled by enhanced-dashboard-components.js 
        initFloatingActionButton(); 
    initResponsiveSidebar();
    
    document.querySelectorAll('.dashboard-section').forEach((section, index) => {
        utils.fadeIn(section, index * 100);
    });

        // updateMetrics(); // Using sample data for now, can be re-enabled with real data

    } catch (error) {
        console.error('Error initializing provider dashboard:', error);
        utils.showToast(`Dashboard Error: ${error.message || 'Unknown error'}`, 'danger');
    }
}

function initAnimatedStats() {
    const statCards = document.querySelectorAll('.stat-value');
    
    // Animate stats on page load
    statCards.forEach((card, index) => {
        const targetValue = parseInt(card.textContent);
        utils.animateCounter(card, targetValue, 1000 + (index * 200));
    });
}

function initIncomingRequests() {
    const requestsContainer = document.getElementById('incoming-requests');
    if (!requestsContainer) return;
    
    requestsContainer.innerHTML = SAMPLE_DATA.requests.map((request, index) => `
        <div class="accordion-item">
            <h2 class="accordion-header">
                <button class="accordion-button ${index === 0 ? '' : 'collapsed'}" type="button" 
                        data-bs-toggle="collapse" data-bs-target="#request-${request.id}">
                    <div class="d-flex justify-content-between w-100 me-3">
                        <div>
                            <strong>${request.customer}</strong>
                            <span class="text-muted ms-2">${request.service}</span>
                        </div>
                        <small class="text-muted">${new Date(request.date).toLocaleDateString()}</small>
                    </div>
                </button>
            </h2>
            <div id="request-${request.id}" class="accordion-collapse collapse ${index === 0 ? 'show' : ''}" data-bs-parent="#incoming-requests">
                <div class="accordion-body">
                    <p class="mb-3">${request.details}</p>
                    <div class="d-flex gap-2">
                        <button class="btn btn-success accept-btn" data-request-id="${request.id}">
                            <i class="fa fa-check me-1"></i> Accept
                        </button>
                        <button class="btn btn-outline-danger decline-btn" data-request-id="${request.id}">
                            <i class="fa fa-times me-1"></i> Decline
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
    
    // Add request handlers
    requestsContainer.querySelectorAll('.accept-btn, .decline-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const requestId = btn.dataset.requestId;
            const isAccept = btn.classList.contains('accept-btn');
            const accordionItem = btn.closest('.accordion-item');
            
            // Disable buttons and show spinner
            const buttons = accordionItem.querySelectorAll('button:not(.accordion-button)');
            buttons.forEach(button => {
                button.disabled = true;
                if (button === btn) {
                    button.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span>${isAccept ? 'Accepting...' : 'Declining...'}`;
                }
            });
            
            // Simulate API call
            setTimeout(() => {
                accordionItem.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
                accordionItem.style.opacity = '0';
                accordionItem.style.transform = 'translateX(100%)';
                
                setTimeout(() => {
                    accordionItem.remove();
                    utils.showToast(
                        `Request ${isAccept ? 'accepted' : 'declined'} successfully`,
                        isAccept ? 'success' : 'warning'
                    );
                }, 300);
            }, 1500);
        });
    });
}

// OLD fetchAndRenderServices FUNCTION - REMOVED TO PREVENT CONFLICTS
// This functionality is now handled by enhanced-dashboard-components.js

// OLD SERVICE MANAGEMENT FUNCTIONS - REMOVED TO PREVENT CONFLICTS
// These functions are now handled by enhanced-dashboard-components.js
    
function initFloatingActionButton() {
    // Legacy offcanvas-based service form - disabled to avoid conflicts with new modal system
    // All service management now uses the enhanced modal system in enhanced-dashboard-components.js
    return;
}

function initResponsiveSidebar() {
    const sidebar = document.querySelector('.dashboard-sidebar');
    const toggleBtn = document.getElementById('sidebar-toggle');
    
    if (!sidebar || !toggleBtn) return;
    
    toggleBtn.addEventListener('click', () => {
        sidebar.classList.toggle('show');
    });
    
    // Close sidebar when clicking outside on mobile
    document.addEventListener('click', (e) => {
        if (window.innerWidth <= 991 && 
            !sidebar.contains(e.target) && 
            !toggleBtn.contains(e.target) && 
            sidebar.classList.contains('show')) {
            sidebar.classList.remove('show');
        }
    });
}

// Initialize metrics with animation
function initializeMetrics() {
    const metrics = { requests: { current: 12, target: 20, progress: 60 }, bookings: { current: 8, target: 15, progress: 53 }, completed: { current: 45, target: 60, progress: 75 } };
    animateMetric('stat-requests', metrics.requests.current, 0);
    animateMetric('stat-bookings', metrics.bookings.current, 0);
    animateMetric('stat-completed', metrics.completed.current, 0);
    animateProgress('requests-progress', metrics.requests.progress);
    animateProgress('bookings-progress', metrics.bookings.progress);
    animateProgress('completed-progress', metrics.completed.progress);
}

function animateMetric(elementId, targetValue, startValue = 0) {
    const element = document.getElementById(elementId);
    const duration = 1500; const steps = 60; const increment = (targetValue - startValue) / steps;
    let currentValue = startValue; let step = 0;
    const interval = setInterval(() => {
        step++; currentValue += increment;
        if (step >= steps) {
            element.textContent = targetValue;
            clearInterval(interval);
        } else {
            element.textContent = Math.round(currentValue);
        }
    }, duration / steps);
}

function animateProgress(elementId, targetPercentage) {
    const element = document.getElementById(elementId);
    const duration = 1000; const steps = 60; const increment = targetPercentage / steps;
    let currentPercentage = 0; let step = 0;
    const interval = setInterval(() => {
        step++; currentPercentage += increment;
        if (step >= steps) {
            element.style.width = `${targetPercentage}%`;
            clearInterval(interval);
        } else {
            element.style.width = `${currentPercentage}%`;
        }
    }, duration / steps);
}

function updateMetrics() {
    const newMetrics = { requests: Math.floor(Math.random() * 20) + 5, bookings: Math.floor(Math.random() * 15) + 3, completed: Math.floor(Math.random() * 60) + 30 };
    const reqEl = document.getElementById('stat-requests'); if(reqEl) reqEl.textContent = newMetrics.requests;
    const bookEl = document.getElementById('stat-bookings'); if(bookEl) bookEl.textContent = newMetrics.bookings;
    const compEl = document.getElementById('stat-completed'); if(compEl) compEl.textContent = newMetrics.completed;
    const reqProg = document.getElementById('requests-progress'); if(reqProg) reqProg.style.width = `${(newMetrics.requests / 20) * 100}%`;
    const bookProg = document.getElementById('bookings-progress'); if(bookProg) bookProg.style.width = `${(newMetrics.bookings / 15) * 100}%`;
    const compProg = document.getElementById('completed-progress'); if(compProg) compProg.style.width = `${(newMetrics.completed / 60) * 100}%`;
}

/* Hero carousel functionality moved to dedicated hero-carousel.js file */

// General DOMContentLoaded listener - PREVENT MULTIPLE INITIALIZATIONS
let dashboardJSInitialized = false;

document.addEventListener('DOMContentLoaded', () => {
    // Prevent multiple initializations
    if (dashboardJSInitialized) {
        console.log('⚠️ Dashboard JS already initialized, skipping duplicate initialization');
        return;
    }
    dashboardJSInitialized = true;
    
    console.log('🚀 Dashboard JS DOMContentLoaded - checking page type...');
    
    if (document.body.classList.contains('provider-dashboard')) {
        // Provider dashboard initialization is handled by script in provider-dashboard.html after auth
        console.log("✅ Provider dashboard JS loaded. Waiting for page script to init.");
    } else if (document.body.classList.contains('consumer-dashboard')) {
        console.log("🚀 Initializing consumer dashboard...");
        initConsumerDashboard();
    }
    
    // Apply CSS variables
    Object.entries(CSS_VARS).forEach(([property, value]) => {
        document.documentElement.style.setProperty(property, value);
    });
    
    console.log('✅ Dashboard JS DOMContentLoaded initialization complete');
});

// ========================================
// PHASE 2 ENHANCED PROVIDER DASHBOARD
// ========================================

// Enhanced initialization for Phase 2 provider dashboard
window.initEnhancedProviderDashboard = async function() {
    if (!document.querySelector('.provider-dashboard')) return;
    
    console.log('🚀 Initializing Enhanced Provider Dashboard (Phase 2)...');
    
    try {
        // Verify authentication and profile
        const profileData = await verifyProviderAuthentication();
        if (!profileData) return;
        
        // Initialize all enhanced components
        await Promise.all([
            initEnhancedMetrics(profileData),
            initEnhancedActivityFeed(profileData),
            initEnhancedNavigation(),
            initEnhancedModals(),
            initRealTimeUpdates(profileData)
        ]);
        
        // Initialize animations and interactions
        initEnhancedAnimations();
        
        console.log('✅ Enhanced Provider Dashboard initialized successfully');
        
    } catch (error) {
        console.error('❌ Error initializing enhanced dashboard:', error);
        utils.showToast('Failed to load dashboard. Please refresh the page.', 'danger');
    }
};

// Enhanced authentication verification
async function verifyProviderAuthentication() {
    try {
        if (!window.supabase) {
            throw new Error('Supabase client not available');
        }
        
        const { data: { session }, error: sessionError } = await window.supabase.auth.getSession();
        if (sessionError) throw sessionError;
        
        if (!session) {
            console.warn('No active session. Redirecting to sign-in.');
            window.location.href = 'sign-in.html';
            return null;
        }

        const { data: profile, error: profileError } = await window.supabase
            .from('profiles')
            .select('*, primary_service_category')
            .eq('id', session.user.id)
            .single();

        if (profileError) {
            console.error('Error fetching profile:', profileError);
            if (profileError.code === 'PGRST116') {
                utils.showToast('Profile not found. Redirecting to sign-in.', 'danger');
                setTimeout(() => window.location.href = 'sign-in.html', 2000);
            }
            return null;
        }
        
        if (profile.role !== 'provider') {
            window.location.href = 'consumer-profile.html';
            return null;
        }

        return profile;
        
    } catch (error) {
        console.error('Authentication verification failed:', error);
        utils.showToast('Authentication error. Please sign in again.', 'danger');
        return null;
    }
}

// Enhanced metrics with real-time data
async function initEnhancedMetrics(profileData) {
    try {
        // Fetch real metrics from Supabase
        const metrics = await fetchProviderMetrics(profileData.id);
        
        // Animate metric values
        animateEnhancedCounter(document.getElementById('stat-requests'), metrics.newRequests);
        animateEnhancedCounter(document.getElementById('stat-bookings'), metrics.upcomingBookings);
        animateEnhancedCounter(document.getElementById('stat-completed'), metrics.completedJobs);
        
        // Animate progress bars with smooth transitions
        setTimeout(() => {
            updateProgressBar('requests-progress', metrics.requestsProgress);
            updateProgressBar('bookings-progress', metrics.bookingsProgress);
            updateProgressBar('completed-progress', metrics.completedProgress);
        }, 500);
        
        // Update metric changes with real data
        updateMetricChanges(metrics);
        
    } catch (error) {
        console.error('Error initializing enhanced metrics:', error);
        // Fallback to sample data
        initSampleMetrics();
    }
}

// Update metric change indicators
function updateMetricChanges(metrics) {
    if (!metrics.changes) return;
    
    const changes = metrics.changes;
    
    // Update requests change
    const requestsChange = document.querySelector('#stat-requests').parentNode.querySelector('.metric-change');
    if (requestsChange && changes.requests) {
        requestsChange.textContent = `${changes.requests.positive ? '+' : ''}${changes.requests.value}%`;
        requestsChange.className = `metric-change ${changes.requests.positive ? 'positive' : 'negative'}`;
    }
    
    // Update bookings change
    const bookingsChange = document.querySelector('#stat-bookings').parentNode.querySelector('.metric-change');
    if (bookingsChange && changes.bookings) {
        bookingsChange.textContent = `${changes.bookings.positive ? '+' : ''}${changes.bookings.value}%`;
        bookingsChange.className = `metric-change ${changes.bookings.positive ? 'positive' : 'negative'}`;
    }
    
    // Update completed change
    const completedChange = document.querySelector('#stat-completed').parentNode.querySelector('.metric-change');
    if (completedChange && changes.completed) {
        completedChange.textContent = `${changes.completed.positive ? '+' : ''}${changes.completed.value}%`;
        completedChange.className = `metric-change ${changes.completed.positive ? 'positive' : 'negative'}`;
    }
}

// Fetch provider metrics from database
async function fetchProviderMetrics(providerId) {
    try {
        // Call the database function to get real metrics
        const { data, error } = await window.supabase.rpc('get_provider_metrics', {
            provider_uuid: providerId,
            metric_date: new Date().toISOString().split('T')[0]
        });

        if (error) {
            console.error('Error fetching provider metrics:', error);
            throw error;
        }

        if (data) {
            console.log('✅ Real provider metrics loaded:', data);
            return data;
        }

        // Fallback to sample data if no real data
        throw new Error('No metrics data returned');

    } catch (error) {
        console.warn('⚠️ Using sample metrics data due to error:', error);
        
        // Enhanced sample data as fallback
        return {
            newRequests: 8,
            upcomingBookings: 5,
            completedJobs: 27,
            requestsProgress: 75,
            bookingsProgress: 60,
            completedProgress: 85,
            totalRevenue: 3450.00,
            pendingRevenue: 1200.00,
            averageRating: 4.8,
            totalReviews: 42,
            profileViews: 1245,
            changes: {
                requests: { value: 12, positive: true },
                bookings: { value: 8, positive: true },
                completed: { value: 15, positive: true }
            },
            lastUpdated: new Date().toISOString()
        };
    }
}

// Enhanced counter animation with easing
function animateEnhancedCounter(element, target, duration = 1500) {
    if (!element) return;
    
    let start = 0;
    const startTime = performance.now();
    
    function animate(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function (ease-out)
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const current = Math.floor(start + (target - start) * easeOut);
        
        element.textContent = current;
        
        if (progress < 1) {
            requestAnimationFrame(animate);
        } else {
            element.textContent = target;
        }
    }
    
    requestAnimationFrame(animate);
}

// Update progress bars with smooth animations
function updateProgressBar(elementId, targetPercentage) {
    const progressBar = document.getElementById(elementId);
    if (!progressBar) return;
    
    let currentWidth = 0;
    const targetWidth = targetPercentage;
    const duration = 1000;
    const startTime = performance.now();
    
    function animate(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Smooth easing
        const easeOut = 1 - Math.pow(1 - progress, 2);
        currentWidth = targetWidth * easeOut;
        
        progressBar.style.width = `${currentWidth}%`;
        
        if (progress < 1) {
            requestAnimationFrame(animate);
        }
    }
    
    requestAnimationFrame(animate);
}

// Enhanced activity feed with real-time updates
async function initEnhancedActivityFeed(profileData) {
    try {
        const activities = await fetchProviderActivities(profileData.id);
        renderEnhancedActivityFeed(activities);
        
        // Initialize filter functionality
        initActivityFilters(activities);
        
    } catch (error) {
        console.error('Error loading activity feed:', error);
        renderSampleActivityFeed();
    }
}

// Fetch provider activities from database
async function fetchProviderActivities(providerId) {
    try {
        // Call the database function to get real activities
        const { data, error } = await window.supabase.rpc('get_provider_activities', {
            provider_uuid: providerId,
            activity_limit: 10,
            activity_filter: 'all'
        });

        if (error) {
            console.error('Error fetching provider activities:', error);
            throw error;
        }

        if (data && Array.isArray(data)) {
            console.log('✅ Real provider activities loaded:', data);
            // Transform the data to match expected format
            return data.map(activity => ({
                ...activity,
                timestamp: new Date(activity.timestamp)
            }));
        }

        // Fallback to sample data if no real data
        throw new Error('No activities data returned');

    } catch (error) {
        console.warn('⚠️ Using sample activities data due to error:', error);
        
        // Enhanced sample data as fallback
        return [
            {
                id: 1,
                type: 'booking',
                title: 'New Booking: Plumbing Service',
                customer: 'John Smith',
                amount: 150,
                timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
                status: 'success'
            },
            {
                id: 2,
                type: 'review',
                title: 'New Review: 5 Stars',
                customer: 'Sarah Johnson',
                rating: 5,
                timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
                status: 'success'
            },
            {
                id: 3,
                type: 'milestone',
                title: 'Profile View Milestone',
                description: '2,500 profile views',
                timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
                status: 'info'
            },
            {
                id: 4,
                type: 'payment',
                title: 'Payment Received',
                amount: 120,
                description: 'Service completed',
                timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
                status: 'success'
            }
        ];
    }
}

// Render enhanced activity feed
function renderEnhancedActivityFeed(activities) {
    const feedContainer = document.getElementById('activity-feed');
    if (!feedContainer) return;
    
    feedContainer.innerHTML = activities.map(activity => `
        <div class="activity-item" data-type="${activity.type}" data-aos="fade-up">
            <div class="activity-content">
                <div class="activity-info">
                    <h6>${activity.title}</h6>
                    <div class="activity-meta">
                        ${activity.customer ? `<i class="fas fa-user"></i><span>${activity.customer}</span>` : ''}
                        ${activity.description ? `<i class="fas fa-info-circle"></i><span>${activity.description}</span>` : ''}
                        <i class="fas fa-clock"></i>
                        <span>${formatTimeAgo(activity.timestamp)}</span>
                    </div>
                </div>
                <div class="activity-badge ${activity.status}">
                    ${activity.amount ? `$${activity.amount}` : ''}
                    ${activity.rating ? generateStarRating(activity.rating) : ''}
                    ${activity.type === 'milestone' ? '<i class="fas fa-trophy"></i>' : ''}
                </div>
            </div>
        </div>
    `).join('');
}

// Enhanced navigation with smooth transitions
function initEnhancedNavigation() {
    const navLinks = document.querySelectorAll('.dashboard-sidebar .nav-link');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Remove active class from all links
            navLinks.forEach(l => l.classList.remove('active'));
            
            // Add active class with animation
            this.classList.add('active');
            
            // Handle section switching
            const section = this.dataset.section;
            switchDashboardSection(section);
        });
    });
}

// Switch dashboard sections with animations
function switchDashboardSection(sectionName) {
    console.log(`Switching to section: ${sectionName}`);
    
    // Add fade out animation to current content
    const mainContent = document.querySelector('.col-lg-9');
    if (mainContent) {
        mainContent.style.opacity = '0.5';
        mainContent.style.transform = 'translateY(10px)';
        
        // Simulate content loading
        setTimeout(() => {
            mainContent.style.opacity = '1';
            mainContent.style.transform = 'translateY(0)';
            
            // Show toast with section name
            utils.showToast(`Switched to ${sectionName} section`, 'info');
        }, 300);
    }
}

// Enhanced modal management
function initEnhancedModals() {
    // Initialize add service modal
    const addServiceBtns = document.querySelectorAll('[id*="add-service"], .action-btn.primary');
    const modal = document.getElementById('add-service-modal');
    
    if (modal) {
        const bootstrapModal = new bootstrap.Modal(modal);
        
        addServiceBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                if (this.textContent.toLowerCase().includes('add')) {
                    bootstrapModal.show();
                }
            });
        });
        
        // Handle form submission
        const form = document.getElementById('add-service-form');
        if (form) {
            form.addEventListener('submit', function(e) {
                e.preventDefault();
                handleEnhancedServiceSubmission(this, bootstrapModal);
            });
        }
    }
}

// Handle enhanced service form submission
window.handleEnhancedServiceSubmission = async function handleEnhancedServiceSubmission(form, modal) {
    const formData = new FormData(form);
    const serviceData = {
        // Map form field names to database column names
        title: formData.get('serviceName'), // 'title' is the correct DB column name, not 'name'
        category: formData.get('serviceCategory'),
        price: parseFloat(formData.get('servicePrice')), // 'price' is the correct DB column name, not 'base_price'
        description: formData.get('serviceDescription')
        // 'status' field removed - doesn't exist in database schema
    };
    
    // Validate required fields
    if (!serviceData.title || !serviceData.category || isNaN(serviceData.price) || serviceData.price <= 0 || !serviceData.description) {
        utils.showToast('Please fill in all fields correctly', 'danger');
        return;
    }
    
    // Validate service category using the new ServiceCategoryManager
    try {
        await window.serviceCategoryManager.validateServiceCategory({
            category: serviceData.category,
            name: serviceData.title
        });
    } catch (error) {
        utils.showToast(error.message, 'danger');
        return;
    }
    
    const isEditMode = form.dataset.serviceId;
    const serviceId = form.dataset.serviceId;
    
    // Show loading state
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>Processing...';
    submitBtn.disabled = true;
    
    try {
        let result;
        
        if (isEditMode) {
            // Update existing service
            result = await updateServiceInDatabase(serviceId, serviceData);
            utils.showToast('Service updated successfully!', 'success');
        } else {
            // Add new service
            result = await addServiceToDatabase(serviceData);
            utils.showToast('Service added successfully!', 'success');
        }
        
        // Close modal
        modal.hide();
        
        // Reset form
        form.reset();
        delete form.dataset.serviceId;
        
        // Reset modal title and button
        const modalElement = document.getElementById('add-service-modal');
        modalElement.querySelector('.modal-title').textContent = 'Add New Service';
        submitBtn.innerHTML = '<i class="fas fa-plus-circle"></i>Add Service';
        
        // Refresh services table if enhanced components are available (non-blocking)
        setTimeout(() => {
            if (window.servicesTable && typeof window.servicesTable.refresh === 'function') {
                window.servicesTable.refresh().catch(error => {
                    console.warn('Failed to refresh services table:', error);
                });
            } else {
                console.log('Enhanced components not available, consider page refresh');
            }
        }, 100);
        
    } catch (error) {
        console.error('Error submitting service:', error);
        utils.showToast('Error saving service: ' + error.message, 'danger');
    } finally {
        // Reset button
        submitBtn.innerHTML = isEditMode ? '<i class="fas fa-save"></i>Update Service' : '<i class="fas fa-plus-circle"></i>Add Service';
        submitBtn.disabled = false;
    }
}

// Update service in database
async function updateServiceInDatabase(serviceId, serviceData) {
    const { data: { user } } = await window.supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');
    
    // Ensure we're using the correct field names for the database schema
    const { data, error } = await window.supabase
        .from('services')
        .update({
            title: serviceData.title, // Correct DB column name
            category: serviceData.category,
            price: serviceData.price, // Correct DB column name
            description: serviceData.description,
            updated_at: new Date().toISOString()
        })
        .eq('id', serviceId)
        .eq('provider_id', user.id); // Ensure user can only update their own services
        
    if (error) throw error;
    
    // Create activity log for service update (non-blocking)
    setTimeout(() => {
        createActivityLog(
            user.id,
            'service_updated',
            `Service Updated: ${serviceData.title}`,
            `Updated service details in ${serviceData.category} category`,
            null,  // no related booking
            serviceId,  // related service ID
            null,  // no related user
            serviceData.price || null
        ).catch(error => {
            console.warn('Failed to create activity log for service update:', error);
        });
    }, 0);
    
    return data;
}

// Add service to database
async function addServiceToDatabase(serviceData) {
    const { data: { user } } = await window.supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');
    
    // Ensure we're using the correct field names for the database schema
    const { data, error } = await window.supabase
        .from('services')
        .insert([{
            title: serviceData.title, // Correct DB column name
            category: serviceData.category,
            price: serviceData.price, // Correct DB column name
            description: serviceData.description,
            provider_id: user.id,
            created_at: new Date().toISOString()
        }]);
        
    if (error) throw error;
    
    // Create activity log for service creation (non-blocking)
    setTimeout(() => {
        createActivityLog(
            user.id,
            'service_created',
            `New Service Added: ${serviceData.title}`,
            `Added new service in ${serviceData.category} category`,
            null,  // no related booking
            data?.[0]?.id || null,  // related service ID
            null,  // no related user
            serviceData.price || null
        ).catch(error => {
            console.warn('Failed to create activity log for service creation:', error);
        });
    }, 0);
    
    return data;
}

// Create activity log entry
async function createActivityLog(userId, activityType, title, description, relatedBookingId = null, relatedServiceId = null, relatedUserId = null, amount = null, rating = null, activityData = null) {
    try {
        const { data, error } = await window.supabase.rpc('create_activity_log', {
            user_uuid: userId,
            activity_type_param: activityType,
            title_param: title,
            description_param: description,
            related_booking_uuid: relatedBookingId,
            related_service_uuid: relatedServiceId,
            related_user_uuid: relatedUserId,
            amount_param: amount,
            rating_param: rating,
            activity_data_param: activityData
        });

        if (error) {
            console.error('Error creating activity log:', error);
            return null;
        }

        console.log('✅ Activity log created:', data);
        return data;
    } catch (error) {
        console.error('Error creating activity log:', error);
        return null;
    }
}

// Real-time updates initialization
function initRealTimeUpdates(profileData) {
    // Set up real-time listeners for bookings, reviews, etc.
    console.log('🔄 Real-time updates initialized for provider:', profileData.id);
    
    // Set up periodic refresh for metrics and activities
    setInterval(async () => {
        try {
            // Refresh metrics every 5 minutes
            await refreshProviderMetrics(profileData.id);
        } catch (error) {
            console.warn('Failed to refresh metrics:', error);
        }
    }, 5 * 60 * 1000); // 5 minutes
    
    // Set up activity feed refresh every 2 minutes
    setInterval(async () => {
        try {
            await refreshActivityFeed(profileData.id);
        } catch (error) {
            console.warn('Failed to refresh activity feed:', error);
        }
    }, 2 * 60 * 1000); // 2 minutes
}

// Refresh provider metrics
async function refreshProviderMetrics(providerId) {
    try {
        const metrics = await fetchProviderMetrics(providerId);
        updateMetricsDisplay(metrics);
        console.log('✅ Metrics refreshed');
    } catch (error) {
        console.error('Error refreshing metrics:', error);
    }
}

// Refresh activity feed
async function refreshActivityFeed(providerId) {
    try {
        const activities = await fetchProviderActivities(providerId);
        const currentFilter = document.querySelector('.filter-btn.active')?.dataset.filter || 'all';
        const filteredActivities = currentFilter === 'all' ? activities : activities.filter(activity => activity.type === currentFilter);
        renderEnhancedActivityFeed(filteredActivities);
        console.log('✅ Activity feed refreshed');
    } catch (error) {
        console.error('Error refreshing activity feed:', error);
    }
}

// Update metrics display with new data
function updateMetricsDisplay(metrics) {
    // Update counter values
    const requestsElement = document.getElementById('stat-requests');
    const bookingsElement = document.getElementById('stat-bookings');
    const completedElement = document.getElementById('stat-completed');
    
    if (requestsElement) animateEnhancedCounter(requestsElement, metrics.newRequests);
    if (bookingsElement) animateEnhancedCounter(bookingsElement, metrics.upcomingBookings);
    if (completedElement) animateEnhancedCounter(completedElement, metrics.completedJobs);
    
    // Update progress bars
    updateProgressBar('requests-progress', metrics.requestsProgress);
    updateProgressBar('bookings-progress', metrics.bookingsProgress);
    updateProgressBar('completed-progress', metrics.completedProgress);
    
    // Update revenue display
    const revenueElement = document.querySelector('.revenue-display');
    if (revenueElement) {
        revenueElement.textContent = `$${metrics.totalRevenue.toLocaleString()}`;
    }
    
    // Update rating display
    const ratingElement = document.querySelector('.rating-display');
    if (ratingElement) {
        ratingElement.textContent = metrics.averageRating.toFixed(1);
    }
}

// Enhanced animations initialization
function initEnhancedAnimations() {
    // Initialize AOS animations if not already done
    if (typeof AOS !== 'undefined') {
        AOS.refresh();
    }
    
    // Add custom animations for interactive elements
    addHoverAnimations();
    addClickAnimations();
}

// Add hover animations to interactive elements
function addHoverAnimations() {
    const interactiveElements = document.querySelectorAll('.metric-card, .action-btn, .activity-item');
    
    interactiveElements.forEach(element => {
        element.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-2px) scale(1.02)';
        });
        
        element.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });
    });
}

// Add click animations
function addClickAnimations() {
    const clickableElements = document.querySelectorAll('.action-btn, .filter-btn, .action-icon');
    
    clickableElements.forEach(element => {
        element.addEventListener('click', function(e) {
            // Create ripple effect
            const ripple = document.createElement('span');
            const rect = this.getBoundingClientRect();
            const size = 60;
            
            ripple.style.width = ripple.style.height = size + 'px';
            ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
            ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';
            ripple.classList.add('ripple');
            
            this.appendChild(ripple);
            
            setTimeout(() => {
                ripple.remove();
            }, 600);
        });
    });
}

// Utility functions for enhanced dashboard
function formatTimeAgo(timestamp) {
    const now = new Date();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 60) return `${minutes} minutes ago`;
    if (hours < 24) return `${hours} hours ago`;
    return `${days} days ago`;
}

function generateStarRating(rating) {
    let stars = '';
    for (let i = 1; i <= 5; i++) {
        stars += `<i class="fas fa-star${i <= rating ? '' : '-empty'}"></i>`;
    }
    return stars;
}

// Initialize activity filters
function initActivityFilters(activities) {
    const filterBtns = document.querySelectorAll('.filter-btn');
    
    filterBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            // Remove active class from all buttons
            filterBtns.forEach(b => b.classList.remove('active'));
            
            // Add active class to clicked button
            this.classList.add('active');
            
            // Filter activities
            const filter = this.dataset.filter;
            filterActivities(activities, filter);
        });
    });
}

function filterActivities(activities, filter) {
    const filteredActivities = filter === 'all' 
        ? activities 
        : activities.filter(activity => activity.type === filter);
        
    renderEnhancedActivityFeed(filteredActivities);
}

// Sample data functions (fallbacks)
function initSampleMetrics() {
    animateEnhancedCounter(document.getElementById('stat-requests'), 8);
    animateEnhancedCounter(document.getElementById('stat-bookings'), 5);
    animateEnhancedCounter(document.getElementById('stat-completed'), 27);
    
    setTimeout(() => {
        updateProgressBar('requests-progress', 75);
        updateProgressBar('bookings-progress', 60);
        updateProgressBar('completed-progress', 85);
    }, 500);
}

function renderSampleActivityFeed() {
    const sampleActivities = [
        {
            id: 1,
            type: 'booking',
            title: 'New Booking: Plumbing Service',
            customer: 'John Smith',
            amount: 150,
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
            status: 'success'
        }
    ];
    
    renderEnhancedActivityFeed(sampleActivities);
}

// OLD SERVICE TABLE FUNCTIONS - REMOVED TO PREVENT CONFLICTS
// These functions are now handled by enhanced-dashboard-components.js

function getServiceIcon(category) {
    const iconMap = {
        'Home Services': 'wrench',
        'plumbing': 'wrench',
        'electrical-services': 'bolt',
        'Beauty & Spas': 'cut',
        'hair-salon': 'cut',
        'Automotive': 'car',
        'auto-repair': 'car',
        'Business Services': 'briefcase',
        'default': 'cog'
    };
    
    return iconMap[category] || iconMap['default'];
}

// CSS for ripple effect
const rippleCSS = `
.ripple {
    position: absolute;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.6);
    transform: scale(0);
    animation: ripple-animation 0.6s linear;
    pointer-events: none;
}

@keyframes ripple-animation {
    to {
        transform: scale(4);
        opacity: 0;
    }
}
`;

// Inject ripple CSS
const style = document.createElement('style');
style.textContent = rippleCSS;
document.head.appendChild(style); 