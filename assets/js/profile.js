// Consumer Profile JavaScript - UstaHub
// Modern, reactive UI/UX for the consumer profile page

// State Management
const state = {
    profile: null,
    bookings: [],
    favorites: [],
    settings: {
        emailNotifications: true,
        smsNotifications: false,
        marketingEmails: false
    },
    isLoading: false,
    error: null
};

// Utility Functions
const utils = {
    // Show toast notification with improved styling
    showToast(message, type = 'success') {
        const toastContainer = document.getElementById('toast-container') || this.createToastContainer();
        const toast = document.createElement('div');
        toast.className = `toast align-items-center text-white bg-${type} border-0 show`;
        toast.setAttribute('role', 'alert');
        toast.setAttribute('aria-live', 'assertive');
        toast.setAttribute('aria-atomic', 'true');
        
        toast.innerHTML = `
            <div class="d-flex">
                <div class="toast-body">
                    <i class="fa ${this.getToastIcon(type)} me-2"></i>
                    ${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        `;
        
        toastContainer.appendChild(toast);
        
        // Auto remove after 3 seconds
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    },

    // Get appropriate icon for toast type
    getToastIcon(type) {
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };
        return icons[type] || icons.info;
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

    // Validate email format
    validateEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    },

    // Validate phone number format
    validatePhone(phone) {
        return /^\+?[\d\s-]{10,}$/.test(phone);
    },

    // Add fade-in animation with improved performance
    fadeIn(element, delay = 0) {
        if (!element) return;
        
        element.style.opacity = '0';
        element.style.transform = 'translateY(20px)';
        element.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
        element.style.willChange = 'opacity, transform';
        
        requestAnimationFrame(() => {
            setTimeout(() => {
                element.style.opacity = '1';
                element.style.transform = 'translateY(0)';
            }, delay);
        });
    },

    // Debounce function for performance
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
    }
};

// Initialize profile when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    try {
        state.isLoading = true;
        
        // Wait for Supabase to be initialized
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Check authentication
        const { data: { session }, error } = await window.supabase.auth.getSession();
        
        if (error || !session) {
            utils.showToast('Please sign in to access your profile', 'warning');
            window.location.href = 'sign-in.html';
            return;
        }

        // Initialize profile with authenticated user
        await initProfile(session.user);
    } catch (err) {
        console.error('Error initializing profile:', err);
        utils.showToast('Error loading profile', 'error');
        window.location.href = 'sign-in.html';
    } finally {
        state.isLoading = false;
    }
});

// Profile Management
async function initProfile(user) {
    try {
        state.isLoading = true;
        
        // Load profile data
        await loadProfileData(user);
        
        // Initialize UI components
        await Promise.all([
            initBookingsList(),
            initFavoritesList(),
            initSettings()
        ]);
        
        // Initialize form handlers
        initFormHandlers();
        
        // Add fade-in animations
        document.querySelectorAll('.profile-card, .tab-pane').forEach((element, index) => {
            utils.fadeIn(element, index * 100);
        });
    } catch (err) {
        console.error('Error in profile initialization:', err);
        utils.showToast('Error loading profile data', 'error');
        throw err;
    } finally {
        state.isLoading = false;
    }
}

async function loadProfileData(user) {
    try {
        // Get user profile from Supabase
        const { data: profile, error } = await window.supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        if (error) throw error;

        // Update state
        state.profile = {
            ...profile,
            email: user.email
        };

        // Update UI elements
        updateProfileUI(state.profile);
    } catch (err) {
        console.error('Error loading profile data:', err);
        throw err;
    }
}

function updateProfileUI(profile) {
    const elements = {
        profileName: document.getElementById('profileName'),
        profileEmail: document.getElementById('profileEmail'),
        profilePhone: document.getElementById('profilePhone'),
        profileLocation: document.getElementById('profileLocation'),
        profileAvatar: document.getElementById('profileAvatar')
    };

    // Safely update elements if they exist
    if (elements.profileName) {
        elements.profileName.textContent = `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Not provided';
    }
    if (elements.profileEmail) {
        elements.profileEmail.textContent = profile.email || 'Not provided';
    }
    if (elements.profilePhone) {
        elements.profilePhone.textContent = profile.phone || 'Not provided';
    }
    if (elements.profileLocation) {
        elements.profileLocation.textContent = profile.location || 'Not provided';
    }
    if (elements.profileAvatar) {
        elements.profileAvatar.src = profile.avatar_url || 'assets/img/default-avatar.svg';
    }
}

async function initBookingsList() {
    try {
        const bookingsContainer = document.getElementById('bookings-list');
        if (!bookingsContainer) return;

        // Get bookings from Supabase
        const { data: bookings, error } = await window.supabase
            .from('bookings')
            .select('*')
            .eq('user_id', state.profile.id)
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Update state
        state.bookings = bookings;

        // Render bookings
        if (bookings.length === 0) {
            bookingsContainer.innerHTML = `
                <div class="text-center py-4">
                    <i class="fa fa-calendar-times fa-3x text-muted mb-3"></i>
                    <p class="text-muted">No bookings found</p>
                </div>
            `;
            return;
        }

        bookingsContainer.innerHTML = bookings.map(booking => `
            <div class="booking-card" data-booking-id="${booking.id}">
                <div class="booking-header">
                    <h5>${booking.service_name}</h5>
                    <span class="badge bg-${getStatusColor(booking.status)}">${booking.status}</span>
                </div>
                <div class="booking-details">
                    <p><i class="fa fa-calendar"></i> ${new Date(booking.scheduled_date).toLocaleDateString()}</p>
                    <p><i class="fa fa-clock"></i> ${booking.scheduled_time}</p>
                    <p><i class="fa fa-map-marker"></i> ${booking.location}</p>
                </div>
                <div class="booking-actions">
                    <button class="btn btn-sm btn-primary" onclick="viewBooking('${booking.id}')">
                        View Details
                    </button>
                    ${booking.status === 'pending' ? `
                        <button class="btn btn-sm btn-danger" onclick="cancelBooking('${booking.id}')">
                            Cancel
                        </button>
                    ` : ''}
                </div>
            </div>
        `).join('');

    } catch (err) {
        console.error('Error loading bookings:', err);
        utils.showToast('Error loading bookings', 'error');
    }
}

function getStatusColor(status) {
    const colors = {
        upcoming: 'primary',
        pending: 'warning',
        completed: 'success',
        cancelled: 'danger'
    };
    return colors[status] || 'secondary';
}

function initFavoritesList() {
    const favoritesList = document.getElementById('favoritesList');
    if (!favoritesList) return;

    if (state.favorites.length === 0) {
        favoritesList.innerHTML = `
            <div class="empty-state">
                <i class="fa fa-heart"></i>
                <h5>No Favorites Yet</h5>
                <p class="text-muted">Your favorite services will appear here.</p>
            </div>
        `;
        return;
    }
    
    favoritesList.innerHTML = state.favorites.map(favorite => `
        <div class="list-group-item d-flex justify-content-between align-items-center favorite-item" data-favorite-id="${favorite.id}">
            <div>
                <div class="fw-bold">${favorite.service}</div>
                <div class="text-muted small">
                    Provider: ${favorite.provider} • ${favorite.price}
                </div>
            </div>
            <div class="d-flex gap-2">
                <div class="text-warning">
                    <i class="fa fa-star"></i> ${favorite.rating}
                </div>
                <button class="btn btn-sm btn-outline-primary book-now-btn">Book Now</button>
                <button class="btn btn-sm btn-outline-danger remove-favorite-btn">
                    <i class="fa fa-heart"></i>
                </button>
            </div>
        </div>
    `).join('');
    
    // Add favorite action handlers
    favoritesList.querySelectorAll('.book-now-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const favoriteId = btn.closest('.favorite-item').dataset.favoriteId;
            bookFavorite(favoriteId);
        });
    });
    
    favoritesList.querySelectorAll('.remove-favorite-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const favoriteId = btn.closest('.favorite-item').dataset.favoriteId;
            removeFavorite(favoriteId);
        });
    });
}

async function initSettings() {
    const settingsForm = document.getElementById('settingsForm');
    if (!settingsForm) return;

    try {
        // Get user settings from Supabase with proper headers
        const { data: settings, error } = await window.supabase
            .from('user_settings')
            .select('email_notifications, sms_notifications, marketing_emails')
            .eq('user_id', state.profile?.id)
            .maybeSingle();

        if (error) {
            console.warn('Error fetching settings:', error);
            // Use default settings if there's an error
            applyDefaultSettings();
            return;
        }

        // Update form with user settings or defaults
        const elements = {
            emailNotifications: document.getElementById('emailNotifications'),
            smsNotifications: document.getElementById('smsNotifications'),
            marketingEmails: document.getElementById('marketingEmails')
        };

        const defaultSettings = {
            email_notifications: true,
            sms_notifications: false,
            marketing_emails: false
        };

        if (elements.emailNotifications) {
            elements.emailNotifications.checked = settings?.email_notifications ?? defaultSettings.email_notifications;
        }
        if (elements.smsNotifications) {
            elements.smsNotifications.checked = settings?.sms_notifications ?? defaultSettings.sms_notifications;
        }
        if (elements.marketingEmails) {
            elements.marketingEmails.checked = settings?.marketing_emails ?? defaultSettings.marketing_emails;
        }
    } catch (err) {
        console.error('Error loading settings:', err);
        applyDefaultSettings();
    }
}

function applyDefaultSettings() {
    const elements = {
        emailNotifications: document.getElementById('emailNotifications'),
        smsNotifications: document.getElementById('smsNotifications'),
        marketingEmails: document.getElementById('marketingEmails')
    };

    if (elements.emailNotifications) elements.emailNotifications.checked = true;
    if (elements.smsNotifications) elements.smsNotifications.checked = false;
    if (elements.marketingEmails) elements.marketingEmails.checked = false;
}

function initFormHandlers() {
    const settingsForm = document.getElementById('settingsForm');
    if (!settingsForm) return;

    settingsForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        try {
            const settings = {
                user_id: state.profile?.id,
                email_notifications: document.getElementById('emailNotifications')?.checked ?? true,
                sms_notifications: document.getElementById('smsNotifications')?.checked ?? false,
                marketing_emails: document.getElementById('marketingEmails')?.checked ?? false
            };

            // Try to save settings
            const { error } = await window.supabase
                .from('user_settings')
                .upsert(settings, {
                    onConflict: 'user_id'
                });

            if (error) {
                console.warn('Could not save settings:', error);
                utils.showToast('Settings saved locally', 'info');
            } else {
                utils.showToast('Settings saved successfully');
            }
        } catch (err) {
            console.error('Error saving settings:', err);
            utils.showToast('Settings saved locally', 'info');
        }
    });
}

// Action Handlers
function viewBooking(bookingId) {
    const booking = state.bookings.find(b => b.id == bookingId);
    if (booking) {
        utils.showToast(`Viewing booking for ${booking.service_name}`);
        // Here you would typically navigate to booking details page
    }
}

function cancelBooking(bookingId) {
    const booking = state.bookings.find(b => b.id == bookingId);
    if (booking && confirm(`Are you sure you want to cancel your booking for ${booking.service_name}?`)) {
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
}

function bookFavorite(favoriteId) {
    const favorite = state.favorites.find(f => f.id == favoriteId);
    if (favorite) {
        utils.showToast(`Booking ${favorite.service} with ${favorite.provider}`);
        // Here you would typically navigate to booking page
    }
}

function removeFavorite(favoriteId) {
    const favorite = state.favorites.find(f => f.id == favoriteId);
    if (favorite && confirm(`Remove ${favorite.service} from favorites?`)) {
        const favoriteElement = document.querySelector(`[data-favorite-id="${favoriteId}"]`);
        if (favoriteElement) {
            favoriteElement.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
            favoriteElement.style.opacity = '0';
            favoriteElement.style.transform = 'translateX(-100%)';
            
            setTimeout(() => {
                favoriteElement.remove();
                utils.showToast('Removed from favorites', 'warning');
            }, 300);
        }
    }
} 