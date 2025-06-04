// Dashboard JavaScript - UstaHub
// Modern, reactive UI/UX for both Consumer and Provider dashboards

// CSS Variables and Utility Classes
const CSS_VARS = {
    '--transition': '0.3s ease',
    '--primary-color': '#e00707',
    '--hover-shadow': '0 8px 32px rgba(224,7,7,0.15)',
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
        initServicesTable(); 
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

async function fetchAndRenderServices() {
    try {
        const { data: { user }, error: userError } = await window.supabase.auth.getUser();
        if (userError || !user) {
            utils.showToast('Authentication error. Please sign in again.', 'danger');
            return;
        }
        const { data: services, error } = await window.supabase
            .from('services')
            .select('*')
            .eq('provider_id', user.id);
        if (error) throw error;
        renderServices(services || []);
    } catch (error) {
        console.error('Error fetching provider services:', error);
        utils.showToast('Error fetching your services', 'danger');
        renderServices([]); // Render an empty state
    }
}

function renderServices(services) {
    const servicesContainer = document.getElementById('services-table');
    if (!servicesContainer) return;
    if (services.length === 0) {
        servicesContainer.innerHTML = '<div class="alert alert-info">You have not added any services yet. Click the "+" button to add your first service!</div>';
        return;
    }
        servicesContainer.innerHTML = `
            <div class="table-responsive">
            <table class="table table-hover align-middle">
                <thead class="table-light">
                        <tr>
                        <th>Service Title</th>
                        <th>Category</th>
                            <th>Price ($/hr)</th>
                        <th class="text-end">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                    ${services.map(service => `
                            <tr data-service-id="${service.id}">
                            <td class="service-name">${service.title || 'N/A'}</td>
                            <td class="service-category">${service.category || 'N/A'}</td>
                            <td class="service-price">$${service.price != null ? service.price : 'N/A'}</td>
                            <td class="service-actions text-end">
                                <button class="btn btn-sm btn-outline-primary edit-service-btn me-2" title="Edit Service">
                                        <i class="fa fa-edit"></i> Edit
                                    </button>
                                <button class="btn btn-sm btn-outline-danger remove-service-btn" title="Remove Service">
                                        <i class="fa fa-trash"></i> Remove
                                    </button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    attachServiceTableHandlers(services); // Pass services to attach handlers with full data
}

function initServicesTable() {
    fetchAndRenderServices();
}

function attachServiceTableHandlers(servicesData) {
    const servicesContainer = document.getElementById('services-table');
    if (!servicesContainer) return;

        servicesContainer.querySelectorAll('.edit-service-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
                const row = btn.closest('tr');
                const serviceId = row.dataset.serviceId;
            
            const { data: service, error } = await window.supabase
                .from('services')
                .select('*')
                .eq('id', serviceId)
                .single();

            if (error || !service) {
                utils.showToast('Error fetching service details for editing.', 'danger');
                return;
            }
            
            const offcanvasElement = document.getElementById('add-service-offcanvas');
            const offcanvas = bootstrap.Offcanvas.getInstance(offcanvasElement) || new bootstrap.Offcanvas(offcanvasElement);
            const serviceForm = document.getElementById('add-service-form');
            const formTitle = offcanvasElement.querySelector('#addServiceLabel');
            const serviceCategorySelect = serviceForm.serviceCategory;
            const serviceCategoryLabel = serviceCategorySelect ? serviceCategorySelect.closest('.mb-3').querySelector('label[for="serviceCategory"]') : null;
            
            formTitle.textContent = 'Edit Service';
            serviceForm.serviceName.value = service.title;
            serviceForm.servicePrice.value = service.price;
            serviceForm.serviceDescription.value = service.description || '';
            serviceForm.dataset.editingServiceId = serviceId;

            // Set and disable category for editing
            if (serviceCategorySelect) {
                serviceCategorySelect.value = service.category; 
                serviceCategorySelect.disabled = true; 
                if (serviceCategoryLabel) serviceCategoryLabel.textContent = 'Service Category (Locked for this service)';
                
                const selectizeInstance = $(serviceCategorySelect).data('selectize');
                if (selectizeInstance) {
                    selectizeInstance.setValue(service.category, true); // silent true
                    selectizeInstance.disable();
                }
            }

            offcanvas.show();
            });
        });
        
        servicesContainer.querySelectorAll('.remove-service-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
                const serviceId = btn.closest('tr').dataset.serviceId;
                if (confirm('Are you sure you want to remove this service?')) {
                try {
                    const { error } = await window.supabase.from('services').delete().eq('id', serviceId);
                    if (error) throw error;
                    utils.showToast('Service removed successfully', 'warning');
                    fetchAndRenderServices();
                } catch (error) {
                    utils.showToast(`Error removing service: ${error.message}`, 'danger');
                }
                }
            });
        });
    }
    
function initFloatingActionButton() {
    const addServiceBtn = document.getElementById('add-service-btn');
    const addServiceForm = document.getElementById('add-service-form');
    const addServiceOffcanvasElement = document.getElementById('add-service-offcanvas');
    
    if (!addServiceOffcanvasElement) {
        console.warn("Add service offcanvas element not found. Skipping FAB init.");
            return;
        }
    const addServiceOffcanvas = new bootstrap.Offcanvas(addServiceOffcanvasElement);
    const serviceCategorySelect = addServiceForm ? addServiceForm.serviceCategory : null;
    const serviceCategoryLabel = serviceCategorySelect ? serviceCategorySelect.closest('.mb-3').querySelector('label[for="serviceCategory"]') : null;

    if (addServiceBtn) {
        addServiceBtn.addEventListener('click', () => {
            if (addServiceForm) {
                addServiceForm.reset();
                delete addServiceForm.dataset.editingServiceId;
                const formTitle = addServiceOffcanvasElement.querySelector('#addServiceLabel');
                if (formTitle) formTitle.textContent = 'Add New Service';
                const submitButton = addServiceForm.querySelector('button[type="submit"]');
                if (submitButton) submitButton.textContent = 'Add Service';

                // Enforce primary service category
                if (serviceCategorySelect) {
                    const selectizeInstance = $(serviceCategorySelect).data('selectize');
                    if (currentProviderProfile && currentProviderProfile.primary_service_category) {
                        serviceCategorySelect.value = currentProviderProfile.primary_service_category;
                        serviceCategorySelect.disabled = true;
                        if (serviceCategoryLabel) serviceCategoryLabel.textContent = 'Service Category (Your Registered Specialty)';
                        if (selectizeInstance) {
                            selectizeInstance.setValue(currentProviderProfile.primary_service_category, true); // silent true
                            selectizeInstance.disable();
                        }
                    } else {
                        serviceCategorySelect.disabled = false; 
                        if (serviceCategoryLabel) serviceCategoryLabel.textContent = 'Service Category';
                        serviceCategorySelect.selectedIndex = 0; // Reset to placeholder
                        if (selectizeInstance) {
                            selectizeInstance.clear(true); // silent true
                            selectizeInstance.enable();
                        }
                    }
                }
            }
            addServiceOffcanvas.show();
        });
    }

    if (addServiceForm) {
        addServiceForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const serviceName = addServiceForm.serviceName.value.trim();
            const serviceCategory = serviceCategorySelect ? serviceCategorySelect.value : ''; 
            const servicePrice = parseFloat(addServiceForm.servicePrice.value);
            const serviceDescription = addServiceForm.serviceDescription.value.trim();

            if (!serviceName || !serviceCategory || isNaN(servicePrice) || servicePrice <= 0 || !serviceDescription) {
                let errorMsg = 'Please fill in all fields correctly, including a description.';
                if (!serviceCategory) {
                    errorMsg = 'Service category is missing. This might be an issue with your profile setup.';
                }
                utils.showToast(errorMsg, 'danger');
                return;
            }
            
            const submitButton = addServiceForm.querySelector('button[type="submit"]');
            submitButton.disabled = true;
            submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Adding...';

            try {
                const { data: { user } } = await window.supabase.auth.getUser();
                if (!user) throw new Error('User not authenticated. Please sign in.');

                // Ensure provider_id is available (e.g., from currentProviderProfile or session)
                const providerId = currentProviderProfile?.id || user.id;
                if (!providerId) throw new Error('Provider ID not found.');

                const newService = {
                    provider_id: providerId,
                    title: serviceName,
                    category: serviceCategory,
                    price: servicePrice,
                    description: serviceDescription, // Add description to the object
                    // status: 'active' // Optional: set a default status
                };

                    const { data, error } = await window.supabase
                        .from('services')
                    .insert([newService])
                        .select();

                if (error) throw error;

                utils.showToast('Service added successfully!', 'success');
                addServiceForm.reset();
                addServiceOffcanvas.hide();
                
                // Ensure fetchAndRenderServices is awaited if it's async
                if (typeof fetchAndRenderServices === "function") {
                    await fetchAndRenderServices(); // Refresh the services list
                }

            } catch (error) {
                console.error('Error adding service:', error);
                utils.showToast(`Error adding service: ${error.message || 'Could not save service.'}` , 'danger');
            } finally {
                submitButton.disabled = false;
                submitButton.innerHTML = 'Add Service';
            }
        });
    }
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

// Hero Carousel Functionality
document.addEventListener('DOMContentLoaded', () => {
    const slides = document.querySelectorAll('.hero-slide'),
          dots = document.querySelectorAll('.dot'),
          prevBtn = document.querySelector('.carousel-control-prev'),
          nextBtn = document.querySelector('.carousel-control-next'),
          liveRegion = document.createElement('div');
    
    let currentIndex = 0,
        autoSlideInterval;
    
    liveRegion.id = 'carousel-live-region';
    liveRegion.className = 'visually-hidden';
    liveRegion.setAttribute('aria-live', 'polite');
    document.querySelector('.hero-carousel').appendChild(liveRegion);
    
    function showSlide(i) {
        slides.forEach((s, idx) => s.classList.toggle('active', idx === i));
        dots.forEach((d, idx) => d.classList.toggle('active', idx === i));
        liveRegion.textContent = `Slide ${i + 1} of ${slides.length}`;
        currentIndex = i;
    }
    
    function nextSlide() {
        showSlide((currentIndex + 1) % slides.length);
    }
    
    function prevSlide() {
        showSlide((currentIndex - 1 + slides.length) % slides.length);
    }
    
    function resetAuto() {
        clearInterval(autoSlideInterval);
        autoSlideInterval = setInterval(nextSlide, 7000);
    }
    
    autoSlideInterval = setInterval(nextSlide, 7000);
    
    nextBtn.addEventListener('click', () => {
        nextSlide();
        resetAuto();
    });
    
    prevBtn.addEventListener('click', () => {
        prevSlide();
        resetAuto();
    });
    
    dots.forEach(dot => {
        dot.addEventListener('click', () => {
            const i = parseInt(dot.getAttribute('data-index'), 10);
            showSlide(i);
            resetAuto();
        });
        
        dot.setAttribute('role', 'button');
        dot.setAttribute('tabindex', '0');
        
        dot.addEventListener('keydown', e => {
            if (e.key === 'Enter' || e.key === ' ') {
                const i = parseInt(dot.getAttribute('data-index'), 10);
                showSlide(i);
                resetAuto();
            }
        });
    });
    
    let startX = 0;
    const hero = document.querySelector('.hero-carousel');
    
    hero.addEventListener('touchstart', e => {
        startX = e.touches[0].clientX;
    });
    
    hero.addEventListener('touchend', e => {
        const endX = e.changedTouches[0].clientX;
        if (startX - endX > 50) {
            nextSlide();
            resetAuto();
        } else if (endX - startX > 50) {
            prevSlide();
            resetAuto();
        }
    });
    
    showSlide(0);
});

// General DOMContentLoaded listener
document.addEventListener('DOMContentLoaded', () => {
    if (document.body.classList.contains('provider-dashboard')) {
        // initProviderDashboard(); // Initialization is handled by script in provider-dashboard.html after auth
        console.log("Provider dashboard JS loaded. Waiting for page script to init.");
    } else if (document.body.classList.contains('consumer-dashboard')) {
        initConsumerDashboard();
    }
    Object.entries(CSS_VARS).forEach(([property, value]) => {
        document.documentElement.style.setProperty(property, value);
    });
    // initializeMetrics(); // Called within initProviderDashboard or initConsumerDashboard if needed
    // setInterval(updateMetrics, 30000); // Called within initProviderDashboard or initConsumerDashboard if needed
}); 