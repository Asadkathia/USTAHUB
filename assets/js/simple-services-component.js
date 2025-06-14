// Simple Services Component - Clean Implementation
console.log('🔧 Loading Simple Services Component...');

class SimpleServicesManager {
    constructor() {
        this.services = [];
        this.userProfile = null;
        this.initialized = false;
    }

    async init() {
        if (this.initialized) {
            console.log('⚠️ SimpleServicesManager already initialized');
            return;
        }

        console.log('🚀 Initializing SimpleServicesManager...');
        
        // Test Supabase availability
        if (!window.supabase) {
            console.error('❌ Supabase not available!');
            this.showToast('Supabase connection not available', 'error');
            return;
        }
        console.log('✅ Supabase is available');
        
        try {
            // Load user profile first
            await this.loadUserProfile();
            
            // Load services from database
            await this.loadServices();
            
            // Render services
            this.renderServices();
            
            // Initialize modal form
            this.initModalForm();
            
            this.initialized = true;
            console.log('✅ SimpleServicesManager initialized successfully');
            
        } catch (error) {
            console.error('❌ Error initializing SimpleServicesManager:', error);
            this.showFallbackServices();
        }
    }

    async loadUserProfile() {
        try {
            const { data: { session }, error: sessionError } = await window.supabase.auth.getSession();
            if (sessionError || !session) {
                throw new Error('Not authenticated');
            }

            const { data: profile, error: profileError } = await window.supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single();

            if (profileError) {
                throw new Error('Failed to load user profile');
            }

            this.userProfile = profile;
            console.log('👤 User profile loaded:', profile);
            
        } catch (error) {
            console.error('❌ Error loading user profile:', error);
            throw error;
        }
    }

    async loadServices() {
        try {
            const { data: { session }, error: sessionError } = await window.supabase.auth.getSession();
            if (sessionError || !session) {
                throw new Error('Not authenticated');
            }

            const { data: services, error: servicesError } = await window.supabase
                .from('services')
                .select('*')
                .eq('provider_id', session.user.id)
                .order('created_at', { ascending: false });

            if (servicesError) {
                throw new Error('Failed to load services');
            }

            this.services = services || [];
            console.log(`📋 Loaded ${this.services.length} services from database`);
            
        } catch (error) {
            console.error('❌ Error loading services:', error);
            // Don't throw here, let it fall back to sample data
            this.services = [];
        }
    }

    renderServices() {
        const container = document.getElementById('services-container');
        if (!container) {
            console.error('❌ Services container not found');
            return;
        }

        // Create the complete services section structure
        const servicesHTML = `
            <div class="services-section">
                <div class="services-header">
                    <div class="services-title">
                        <i class="fas fa-cogs"></i>
                        <h4>My Services</h4>
                    </div>
                    <button class="btn-add-service" id="btn-add-service" data-bs-toggle="modal" data-bs-target="#add-service-modal">
                        <i class="fas fa-plus"></i>
                        Add Service
                    </button>
                </div>
                <div class="services-content">
                    ${this.services.length > 0 ? this.renderServicesList() : this.renderEmptyStateContent()}
                </div>
            </div>
        `;
        
        container.innerHTML = servicesHTML;
        
        // Attach event listeners to action buttons
        if (this.services.length > 0) {
            this.attachServiceEventListeners();
        }
    }
    
    renderServicesList() {
        return `
            <div class="services-grid">
                ${this.services.map(service => this.createServiceCard(service)).join('')}
            </div>
        `;
    }

    createServiceCard(service) {
        const categoryInfo = this.getCategoryInfo(service.subcategory || service.category);
        
        return `
            <div class="service-card" data-service-id="${service.id}">
                <div class="service-icon">
                    <i class="${categoryInfo.icon}"></i>
                </div>
                <div class="service-info">
                    <h5 class="service-title">${service.title}</h5>
                    <p class="service-category">${categoryInfo.displayName}</p>
                    <div class="service-price">$${service.price}/hr</div>
                    ${service.description ? `<p class="service-description">${service.description}</p>` : ''}
                </div>
                <div class="service-actions">
                    <button class="btn-action btn-edit" data-action="edit" data-service-id="${service.id}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-action btn-delete" data-action="delete" data-service-id="${service.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }

    renderEmptyState(container) {
        const servicesHTML = `
            <div class="services-section">
                <div class="services-header">
                    <div class="services-title">
                        <i class="fas fa-cogs"></i>
                        <h4>My Services</h4>
                    </div>
                    <button class="btn-add-service" id="btn-add-service" data-bs-toggle="modal" data-bs-target="#add-service-modal">
                        <i class="fas fa-plus"></i>
                        Add Service
                    </button>
                </div>
                <div class="services-content">
                    ${this.renderEmptyStateContent()}
                </div>
            </div>
        `;
        
        container.innerHTML = servicesHTML;
    }

    renderEmptyStateContent() {
        const userCategory = this.userProfile?.primary_service_category;
        const categoryInfo = userCategory ? this.getCategoryInfo(userCategory) : null;
        
        return `
            <div class="empty-state">
                <div class="empty-icon">
                    <i class="fas fa-cogs"></i>
                </div>
                <h5>No Services Added Yet</h5>
                <p>${categoryInfo ? 
                    `Start by adding your first ${categoryInfo.displayName.toLowerCase()} service to attract customers` :
                    'Start by adding your first service to attract customers'
                }</p>
                <button class="btn-add-first-service" id="btn-add-first-service" data-bs-toggle="modal" data-bs-target="#add-service-modal">
                    <i class="fas fa-plus"></i>
                    Add Your First Service
                </button>
            </div>
        `;
    }

    getCategoryInfo(category) {
        // Comprehensive category mapping based on navigation structure
        const categoryMapping = {
            // Home & Garden Services
            'plumbing': { 
                icon: 'fas fa-wrench', 
                displayName: 'Plumbing Services',
                mainCategory: 'Home & Garden',
                description: 'Professional plumbing repairs and installations'
            },
            'electrical': { 
                icon: 'fas fa-bolt', 
                displayName: 'Electrical Services',
                mainCategory: 'Home & Garden',
                description: 'Licensed electrical work and repairs'
            },
            'electrical-services': { 
                icon: 'fas fa-bolt', 
                displayName: 'Electrical Services',
                mainCategory: 'Home & Garden',
                description: 'Licensed electrical work and repairs'
            },
            'hvac': { 
                icon: 'fas fa-thermometer-half', 
                displayName: 'HVAC Services',
                mainCategory: 'Home & Garden',
                description: 'Heating, ventilation, and air conditioning'
            },
            'contractors': { 
                icon: 'fas fa-wrench', 
                displayName: 'Contractors & Handymen',
                mainCategory: 'Home & Garden',
                description: 'General contracting and handyman services'
            },
            'appliances': { 
                icon: 'fas fa-cogs', 
                displayName: 'Appliances and Repair',
                mainCategory: 'Home & Garden',
                description: 'Home appliance maintenance and repair'
            },
            'landscaping': { 
                icon: 'fas fa-leaf', 
                displayName: 'Landscaping',
                mainCategory: 'Home & Garden',
                description: 'Outdoor design and maintenance services'
            },
            'gardening': { 
                icon: 'fas fa-seedling', 
                displayName: 'Nurseries & Gardening',
                mainCategory: 'Home & Garden',
                description: 'Garden care and plant services'
            },
            'florists': { 
                icon: 'fas fa-spa', 
                displayName: 'Florists',
                mainCategory: 'Home & Garden',
                description: 'Flower arrangements and floral services'
            },
            'tree-services': { 
                icon: 'fas fa-tree', 
                displayName: 'Tree Services',
                mainCategory: 'Home & Garden',
                description: 'Tree care and removal services'
            },
            'cleaning': { 
                icon: 'fas fa-broom', 
                displayName: 'Home Cleaning',
                mainCategory: 'Home & Garden',
                description: 'Professional residential cleaning services'
            },
            'roofing': { 
                icon: 'fas fa-home', 
                displayName: 'Roofing',
                mainCategory: 'Home & Garden',
                description: 'Roof installation and repair'
            },
            'locksmiths': { 
                icon: 'fas fa-key', 
                displayName: 'Locksmiths',
                mainCategory: 'Home & Garden',
                description: 'Lock installation and security services'
            },
            'painting': { 
                icon: 'fas fa-paint-brush', 
                displayName: 'Painters',
                mainCategory: 'Home & Garden',
                description: 'Interior and exterior painting'
            },
            'furniture': { 
                icon: 'fas fa-couch', 
                displayName: 'Furniture Stores',
                mainCategory: 'Home & Garden',
                description: 'Furniture sales and services'
            },
            'moving': { 
                icon: 'fas fa-truck', 
                displayName: 'Movers',
                mainCategory: 'Home & Garden',
                description: 'Professional moving and relocation'
            },
            'carpentry': { 
                icon: 'fas fa-hammer', 
                displayName: 'Carpentry',
                mainCategory: 'Home & Garden',
                description: 'Custom woodwork and construction'
            },

            // Health & Beauty Services
            'doctors': { 
                icon: 'fas fa-user-md', 
                displayName: 'Doctors',
                mainCategory: 'Health & Beauty',
                description: 'Medical consultation and healthcare'
            },
            'dentists': { 
                icon: 'fas fa-tooth', 
                displayName: 'Dentists',
                mainCategory: 'Health & Beauty',
                description: 'Dental care and oral health'
            },
            'therapists': { 
                icon: 'fas fa-heartbeat', 
                displayName: 'Therapists',
                mainCategory: 'Health & Beauty',
                description: 'Mental health and therapy services'
            },
            'wellness': { 
                icon: 'fas fa-plus-square', 
                displayName: 'Wellness Centers',
                mainCategory: 'Health & Beauty',
                description: 'Health and wellness services'
            },
            'salons': { 
                icon: 'fas fa-cut', 
                displayName: 'Hair Salons',
                mainCategory: 'Health & Beauty',
                description: 'Professional hair styling and treatments'
            },
            'hair-salon': { 
                icon: 'fas fa-cut', 
                displayName: 'Hair Salons',
                mainCategory: 'Health & Beauty',
                description: 'Professional hair styling and treatments'
            },
            'nails': { 
                icon: 'fas fa-hand-paper', 
                displayName: 'Nail Salons',
                mainCategory: 'Health & Beauty',
                description: 'Manicure, pedicure, and nail art'
            },
            'nail-salon': { 
                icon: 'fas fa-hand-paper', 
                displayName: 'Nail Salons',
                mainCategory: 'Health & Beauty',
                description: 'Manicure, pedicure, and nail art'
            },
            'spas': { 
                icon: 'fas fa-leaf', 
                displayName: 'Spas',
                mainCategory: 'Health & Beauty',
                description: 'Relaxation and wellness treatments'
            },
            'spa-services': { 
                icon: 'fas fa-leaf', 
                displayName: 'Spas',
                mainCategory: 'Health & Beauty',
                description: 'Relaxation and wellness treatments'
            },
            'beauty': { 
                icon: 'fas fa-female', 
                displayName: 'Beauty Services',
                mainCategory: 'Health & Beauty',
                description: 'General beauty and cosmetic services'
            },
            'massage': { 
                icon: 'fas fa-hands', 
                displayName: 'Massage Therapists',
                mainCategory: 'Health & Beauty',
                description: 'Therapeutic and relaxation massage'
            },
            'massage-therapy': { 
                icon: 'fas fa-hands', 
                displayName: 'Massage Therapists',
                mainCategory: 'Health & Beauty',
                description: 'Therapeutic and relaxation massage'
            },
            'medical': { 
                icon: 'fas fa-medkit', 
                displayName: 'Medical Services',
                mainCategory: 'Health & Beauty',
                description: 'General medical services'
            },
            'health': { 
                icon: 'fas fa-stethoscope', 
                displayName: 'Health Centers',
                mainCategory: 'Health & Beauty',
                description: 'Health and medical centers'
            },
            'therapy': { 
                icon: 'fas fa-wheelchair', 
                displayName: 'Physical Therapy',
                mainCategory: 'Health & Beauty',
                description: 'Physical rehabilitation services'
            },

            // Auto & Transport Services
            'auto-repair': { 
                icon: 'fas fa-wrench', 
                displayName: 'Auto Repair',
                mainCategory: 'Auto & Transport',
                description: 'Vehicle maintenance and repair'
            },
            'car-wash': { 
                icon: 'fas fa-car', 
                displayName: 'Car Washes',
                mainCategory: 'Auto & Transport',
                description: 'Vehicle cleaning and detailing services'
            },
            'tire-service': { 
                icon: 'fas fa-life-ring', 
                displayName: 'Tire Services',
                mainCategory: 'Auto & Transport',
                description: 'Tire installation and repair'
            },
            'motorcycle': { 
                icon: 'fas fa-motorcycle', 
                displayName: 'Motorcycle Services',
                mainCategory: 'Auto & Transport',
                description: 'Motorcycle maintenance and repair'
            },
            'taxi': { 
                icon: 'fas fa-taxi', 
                displayName: 'Taxi Services',
                mainCategory: 'Auto & Transport',
                description: 'Transportation and taxi services'
            },
            'bus': { 
                icon: 'fas fa-bus', 
                displayName: 'Bus Services',
                mainCategory: 'Auto & Transport',
                description: 'Bus transportation services'
            },
            'train': { 
                icon: 'fas fa-train', 
                displayName: 'Train Services',
                mainCategory: 'Auto & Transport',
                description: 'Train transportation services'
            },
            'travel': { 
                icon: 'fas fa-plane', 
                displayName: 'Travel Services',
                mainCategory: 'Auto & Transport',
                description: 'Travel planning and booking'
            },
            'shipping': { 
                icon: 'fas fa-ship', 
                displayName: 'Shipping Services',
                mainCategory: 'Auto & Transport',
                description: 'Shipping and logistics'
            },
            'bicycle': { 
                icon: 'fas fa-bicycle', 
                displayName: 'Bicycle Services',
                mainCategory: 'Auto & Transport',
                description: 'Bicycle repair and maintenance'
            },
            'parking': { 
                icon: 'fas fa-square', 
                displayName: 'Parking Services',
                mainCategory: 'Auto & Transport',
                description: 'Parking facilities and services'
            },

            // Business Services
            'business-services': { 
                icon: 'fas fa-briefcase', 
                displayName: 'Business Services',
                mainCategory: 'Business',
                description: 'General business support services'
            },
            'it-services': { 
                icon: 'fas fa-laptop', 
                displayName: 'IT Services',
                mainCategory: 'Business',
                description: 'Technology support and solutions'
            },
            'marketing': { 
                icon: 'fas fa-bullhorn', 
                displayName: 'Marketing',
                mainCategory: 'Business',
                description: 'Digital marketing and advertising'
            },
            'marketing-services': { 
                icon: 'fas fa-bullhorn', 
                displayName: 'Marketing',
                mainCategory: 'Business',
                description: 'Digital marketing and advertising'
            },
            'consulting': { 
                icon: 'fas fa-users', 
                displayName: 'Consulting',
                mainCategory: 'Business',
                description: 'Professional business advisory services'
            },
            'business-consulting': { 
                icon: 'fas fa-users', 
                displayName: 'Consulting',
                mainCategory: 'Business',
                description: 'Professional business advisory services'
            },
            'legal': { 
                icon: 'fas fa-balance-scale', 
                displayName: 'Legal Services',
                mainCategory: 'Business',
                description: 'Legal consultation and representation'
            },
            'legal-services': { 
                icon: 'fas fa-balance-scale', 
                displayName: 'Legal Services',
                mainCategory: 'Business',
                description: 'Legal consultation and representation'
            },
            'accounting': { 
                icon: 'fas fa-calculator', 
                displayName: 'Accounting',
                mainCategory: 'Business',
                description: 'Financial and accounting services'
            },
            'accounting-services': { 
                icon: 'fas fa-calculator', 
                displayName: 'Accounting',
                mainCategory: 'Business',
                description: 'Financial and accounting services'
            },
            'real-estate': { 
                icon: 'fas fa-building', 
                displayName: 'Real Estate',
                mainCategory: 'Business',
                description: 'Real estate services and consulting'
            },
            'financial': { 
                icon: 'fas fa-money', 
                displayName: 'Financial Services',
                mainCategory: 'Business',
                description: 'Financial planning and services'
            },
            'photography': { 
                icon: 'fas fa-camera', 
                displayName: 'Photography',
                mainCategory: 'Business',
                description: 'Professional photography and videography'
            },
            'photography-services': { 
                icon: 'fas fa-camera', 
                displayName: 'Photography',
                mainCategory: 'Business',
                description: 'Professional photography and videography'
            },
            'printing': { 
                icon: 'fas fa-print', 
                displayName: 'Printing Services',
                mainCategory: 'Business',
                description: 'Printing and publishing services'
            },
            'education': { 
                icon: 'fas fa-graduation-cap', 
                displayName: 'Education',
                mainCategory: 'Business',
                description: 'Educational services and training'
            },
            'telecom': { 
                icon: 'fas fa-phone', 
                displayName: 'Telecom Services',
                mainCategory: 'Business',
                description: 'Telecommunications and communication services'
            },

            // Lifestyle Services
            'food-dining': { 
                icon: 'fas fa-utensils', 
                displayName: 'Food & Dining',
                mainCategory: 'Lifestyle',
                description: 'Restaurant and food services'
            },
            'catering-services': { 
                icon: 'fas fa-utensils', 
                displayName: 'Food & Dining',
                mainCategory: 'Lifestyle',
                description: 'Catering and food services'
            },
            'cafes': { 
                icon: 'fas fa-coffee', 
                displayName: 'Cafes',
                mainCategory: 'Lifestyle',
                description: 'Coffee shops and cafes'
            },
            'nightlife': { 
                icon: 'fas fa-glass', 
                displayName: 'Nightlife',
                mainCategory: 'Lifestyle',
                description: 'Bars and nightlife venues'
            },
            'entertainment': { 
                icon: 'fas fa-gamepad', 
                displayName: 'Entertainment',
                mainCategory: 'Lifestyle',
                description: 'Entertainment and recreation'
            },
            'fitness': { 
                icon: 'fas fa-dumbbell', 
                displayName: 'Fitness',
                mainCategory: 'Lifestyle',
                description: 'Fitness and exercise services'
            },
            'fitness-training': { 
                icon: 'fas fa-dumbbell', 
                displayName: 'Fitness',
                mainCategory: 'Lifestyle',
                description: 'Personal training and fitness coaching'
            },
            'pet-services': { 
                icon: 'fas fa-paw', 
                displayName: 'Pet Services',
                mainCategory: 'Lifestyle',
                description: 'Pet care and grooming services'
            },
            'pet-grooming': { 
                icon: 'fas fa-paw', 
                displayName: 'Pet Services',
                mainCategory: 'Lifestyle',
                description: 'Professional pet care and grooming'
            },
            'pet-sitting': { 
                icon: 'fas fa-dog', 
                displayName: 'Pet Services',
                mainCategory: 'Lifestyle',
                description: 'Pet care and sitting services'
            },
            'childcare': { 
                icon: 'fas fa-child', 
                displayName: 'Child Care',
                mainCategory: 'Lifestyle',
                description: 'Childcare and babysitting services'
            },
            'events': { 
                icon: 'fas fa-calendar', 
                displayName: 'Events',
                mainCategory: 'Lifestyle',
                description: 'Event planning and coordination'
            },
            'event-planning': { 
                icon: 'fas fa-calendar-alt', 
                displayName: 'Events',
                mainCategory: 'Lifestyle',
                description: 'Professional event coordination'
            },
            'lessons': { 
                icon: 'fas fa-book', 
                displayName: 'Lessons',
                mainCategory: 'Lifestyle',
                description: 'Educational lessons and tutoring'
            },
            'tutoring': { 
                icon: 'fas fa-chalkboard-teacher', 
                displayName: 'Tutoring',
                mainCategory: 'Lifestyle',
                description: 'Academic tutoring services'
            },
            'tutoring-lessons': { 
                icon: 'fas fa-graduation-cap', 
                displayName: 'Tutoring & Lessons',
                mainCategory: 'Lifestyle',
                description: 'Educational and skill-building services'
            },
            'music': { 
                icon: 'fas fa-music', 
                displayName: 'Music',
                mainCategory: 'Lifestyle',
                description: 'Music lessons and services'
            },
            'crafts': { 
                icon: 'fas fa-paint-brush', 
                displayName: 'Crafts',
                mainCategory: 'Lifestyle',
                description: 'Arts and crafts services'
            },
            'shopping': { 
                icon: 'fas fa-shopping-bag', 
                displayName: 'Shopping',
                mainCategory: 'Lifestyle',
                description: 'Shopping and retail services'
            },

            // More/Specialty Services
            'technology': { 
                icon: 'fas fa-laptop', 
                displayName: 'Technology',
                mainCategory: 'More',
                description: 'Technology services and support'
            },
            'veterinary': { 
                icon: 'fas fa-stethoscope', 
                displayName: 'Veterinary',
                mainCategory: 'More',
                description: 'Veterinary and animal care'
            },
            'venues': { 
                icon: 'fas fa-building', 
                displayName: 'Event Venues',
                mainCategory: 'More',
                description: 'Event venues and facilities'
            },

            // Default/Other
            'other': { 
                icon: 'fas fa-cog', 
                displayName: 'Other Services',
                mainCategory: 'General',
                description: 'Specialized or miscellaneous services'
            }
        };

        // Return the category info or fallback to 'other'
        return categoryMapping[category] || categoryMapping['other'];
    }

    attachServiceEventListeners() {
        // Handle service card clicks for edit/delete actions
        const container = document.getElementById('services-container');
        if (!container) return;
        
        container.addEventListener('click', (e) => {
            const actionBtn = e.target.closest('.btn-action');
            if (!actionBtn) return;
            
            const action = actionBtn.dataset.action;
            const serviceId = actionBtn.dataset.serviceId;
            
            if (action === 'edit') {
                this.editService(serviceId);
            } else if (action === 'delete') {
                this.deleteService(serviceId);
            }
        });
    }

    initModalForm() {
        console.log('🔧 Initializing modal form...');
        
        const submitBtn = document.getElementById('simple-submit-service');
        const modal = document.getElementById('add-service-modal');
        
        console.log('🔍 Form elements found:', {
            submitBtn: !!submitBtn,
            modal: !!modal,
            submitBtnId: submitBtn?.id,
            modalId: modal?.id
        });
        
        if (submitBtn && !submitBtn.dataset.handlerAttached) {
            console.log('📎 Attaching click handler to submit button');
            submitBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                console.log('🖱️ Submit button clicked!');
                await this.handleFormSubmission();
            });
            submitBtn.dataset.handlerAttached = 'true';
            console.log('✅ Click handler attached successfully');
        } else {
            console.warn('⚠️ Submit button not found or handler already attached', {
                submitBtn: !!submitBtn,
                handlerAttached: submitBtn?.dataset.handlerAttached
            });
        }
        
        // Handle modal shown event to load category
        if (modal && !modal.dataset.shownHandlerAttached) {
            modal.addEventListener('shown.bs.modal', () => {
                console.log('🔧 Modal shown, loading category...');
                this.loadModalCategory();
            });
            modal.dataset.shownHandlerAttached = 'true';
        }
        
        // Handle modal hidden event to reset form
        if (modal && !modal.dataset.hiddenHandlerAttached) {
            modal.addEventListener('hidden.bs.modal', () => {
                console.log('🔧 Modal hidden, resetting form...');
                this.resetModalForm();
            });
            modal.dataset.hiddenHandlerAttached = 'true';
        }
    }

    async handleFormSubmission() {
        console.log('📝 Handling form submission...');
        
        // Add small delay to ensure DOM is ready
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Test if all form elements exist
        const serviceName = document.getElementById('simple-service-name');
        const serviceCategory = document.getElementById('simple-service-category');
        const serviceSubcategory = document.getElementById('simple-service-subcategory');
        const servicePrice = document.getElementById('simple-service-price');
        const serviceDescription = document.getElementById('simple-service-description');
        
        console.log('🔍 Form elements check:', {
            serviceName: !!serviceName,
            serviceCategory: !!serviceCategory,
            serviceSubcategory: !!serviceSubcategory,
            servicePrice: !!servicePrice,
            serviceDescription: !!serviceDescription
        });
        
        if (!serviceName || !serviceCategory || !serviceSubcategory || !servicePrice || !serviceDescription) {
            console.error('❌ Some form elements are missing!');
            this.showToast('Form elements missing. Please refresh the page.', 'error');
            return;
        }
        
        // Get form data
        const serviceNameValue = serviceName.value.trim();
        const serviceCategoryValue = serviceCategory.value;
        const serviceSubcategoryValue = serviceSubcategory.value;
        const servicePriceValue = parseFloat(servicePrice.value);
        const serviceDescriptionValue = serviceDescription.value.trim();
        
        console.log('📋 Form values:', {
            serviceName: serviceNameValue,
            serviceCategory: serviceCategoryValue,
            serviceSubcategory: serviceSubcategoryValue,
            servicePrice: servicePriceValue,
            serviceDescription: serviceDescriptionValue
        });
        
        // Validate required fields
        if (!serviceNameValue) {
            this.showToast('Please enter a service name', 'error');
            return;
        }
        
        if (!serviceCategoryValue || !serviceSubcategoryValue) {
            this.showToast('Service category not loaded. Please refresh the page.', 'error');
            console.error('❌ Category values missing:', {
                category: serviceCategoryValue,
                subcategory: serviceSubcategoryValue,
                userProfile: this.userProfile
            });
            return;
        }
        
        if (isNaN(servicePriceValue) || servicePriceValue <= 0) {
            this.showToast('Please enter a valid price', 'error');
            return;
        }
        
        if (!serviceDescriptionValue) {
            this.showToast('Please enter a service description', 'error');
            return;
        }
        
        // Create service data object
        const serviceData = {
            title: serviceNameValue,
            category: serviceCategoryValue,
            subcategory: serviceSubcategoryValue,
            price: servicePriceValue,
            description: serviceDescriptionValue
        };
        
        console.log('📋 Service data to submit:', serviceData);
        
        // Show loading state
        const submitBtn = document.getElementById('simple-submit-service');
        const originalText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i>Adding...';
        
        try {
            // Check if we're editing an existing service
            const form = document.getElementById('simple-service-form');
            const editingServiceId = form.dataset.editingServiceId;
            
            if (editingServiceId) {
                console.log('📝 Updating existing service:', editingServiceId);
                await this.updateService(editingServiceId, serviceData);
                this.showToast('Service updated successfully!', 'success');
            } else {
                console.log('➕ Adding new service');
                await this.addService(serviceData);
                this.showToast('Service added successfully!', 'success');
            }
            
            // Close modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('add-service-modal'));
            if (modal) modal.hide();
            
        } catch (error) {
            console.error('❌ Error saving service:', error);
            this.showToast(`Failed to save service: ${error.message}`, 'error');
        } finally {
            // Reset button state
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }
    }

    async loadModalCategory() {
        const categoryDisplay = document.getElementById('simple-category-display');
        const categoryInput = document.getElementById('simple-service-category');
        const subcategoryInput = document.getElementById('simple-service-subcategory');
        
        if (!categoryDisplay || !this.userProfile) return;
        
        try {
            const userCategory = this.userProfile.primary_service_category;
            if (!userCategory) {
                throw new Error('Primary service category not found in profile');
            }
            
            console.log('👤 Loading category for modal:', userCategory);
            
            const categoryInfo = this.getCategoryInfo(userCategory);
            
            // Update display
            categoryDisplay.innerHTML = `
                <i class="${categoryInfo.icon} me-2"></i>
                <span>${categoryInfo.displayName}</span>
            `;
            
            // Set hidden inputs
            categoryInput.value = categoryInfo.mainCategory;
            subcategoryInput.value = userCategory;
            
            console.log('✅ Modal category loaded:', {
                mainCategory: categoryInfo.mainCategory,
                subcategory: userCategory,
                displayName: categoryInfo.displayName
            });
            
        } catch (error) {
            console.error('❌ Error loading modal category:', error);
            categoryDisplay.innerHTML = `
                <i class="fas fa-exclamation-triangle me-2 text-warning"></i>
                <span>Error loading category</span>
            `;
        }
    }

    resetModalForm() {
        const form = document.getElementById('simple-service-form');
        const modalTitle = document.querySelector('#add-service-modal .modal-title');
        const submitBtn = document.getElementById('simple-submit-service');
        
        if (form) {
            form.reset();
            delete form.dataset.editingServiceId;
        }
        
        if (modalTitle) {
            modalTitle.innerHTML = '<i class="fas fa-plus-circle me-2"></i>Add New Service';
        }
        
        if (submitBtn) {
            submitBtn.innerHTML = '<i class="fas fa-plus-circle me-1"></i>Add Service';
        }
    }

    async addService(serviceData) {
        console.log('➕ Starting addService with data:', serviceData);
        
        try {
            console.log('🔐 Checking authentication...');
            const { data: { session }, error: sessionError } = await window.supabase.auth.getSession();
            if (sessionError || !session) {
                console.error('❌ Authentication failed:', sessionError);
                throw new Error('Not authenticated');
            }
            console.log('✅ User authenticated:', session.user.id);

            console.log('💾 Inserting service into database...');
            const insertData = {
                provider_id: session.user.id,
                title: serviceData.title,
                category: serviceData.category,
                subcategory: serviceData.subcategory,
                price: serviceData.price,
                description: serviceData.description
            };
            console.log('📋 Insert data:', insertData);

            const { data, error } = await window.supabase
                .from('services')
                .insert([insertData])
                .select()
                .single();

            if (error) {
                console.error('❌ Database insert error:', error);
                throw new Error(`Database error: ${error.message}`);
            }

            console.log('✅ Service added to database:', data);
            
            // Add to local services array
            this.services.unshift(data);
            console.log('📊 Updated local services array, count:', this.services.length);
            
            // Re-render services
            console.log('🔄 Re-rendering services...');
            this.renderServices();
            
            return data;
            
        } catch (error) {
            console.error('❌ Error adding service:', error);
            throw error;
        }
    }

    async updateService(serviceId, serviceData) {
        try {
            const { data, error } = await window.supabase
                .from('services')
                .update({
                    title: serviceData.title,
                    category: serviceData.category,
                    subcategory: serviceData.subcategory,
                    price: serviceData.price,
                    description: serviceData.description,
                    updated_at: new Date().toISOString()
                })
                .eq('id', serviceId)
                .select()
                .single();

            if (error) {
                throw new Error(`Database error: ${error.message}`);
            }

            console.log('✅ Service updated in database:', data);
            
            // Update local services array
            const index = this.services.findIndex(s => s.id === serviceId);
            if (index !== -1) {
                this.services[index] = data;
            }
            
            // Re-render services
            this.renderServices();
            
            return data;
            
        } catch (error) {
            console.error('❌ Error updating service:', error);
            throw error;
        }
    }

    async deleteService(serviceId) {
        if (!confirm('Are you sure you want to delete this service?')) {
            return;
        }

        try {
            const { error } = await window.supabase
                .from('services')
                .delete()
                .eq('id', serviceId);

            if (error) {
                throw new Error(`Database error: ${error.message}`);
            }

            console.log('✅ Service deleted from database');
            
            // Remove from local services array
            this.services = this.services.filter(s => s.id !== serviceId);
            
            // Re-render services
            this.renderServices();
            
            this.showToast('Service deleted successfully', 'success');
            
        } catch (error) {
            console.error('❌ Error deleting service:', error);
            this.showToast('Failed to delete service', 'error');
        }
    }

    editService(serviceId) {
        const service = this.services.find(s => s.id === serviceId);
        if (!service) {
            console.error('Service not found:', serviceId);
            return;
        }

        console.log('📝 Editing service:', service);

        // Populate form with service data
        document.getElementById('simple-service-name').value = service.title;
        document.getElementById('simple-service-price').value = service.price;
        document.getElementById('simple-service-description').value = service.description;
        
        // Set category fields based on user's primary_service_category (not the service's category)
        // This ensures services are always edited within the user's registered specialty
        const userCategory = this.userProfile?.primary_service_category;
        if (userCategory) {
            const categoryInfo = this.getCategoryInfo(userCategory);
            document.getElementById('simple-service-category').value = categoryInfo.mainCategory;
            document.getElementById('simple-service-subcategory').value = userCategory;
            
            console.log('📋 Category set for editing:', {
                userPrimaryCategory: userCategory,
                mainCategory: categoryInfo.mainCategory,
                subcategory: userCategory,
                displayName: categoryInfo.displayName
            });
        }
        
        // Set editing mode
        const form = document.getElementById('simple-service-form');
        form.dataset.editingServiceId = serviceId;
        
        // Update modal title and button
        const modalTitle = document.querySelector('#add-service-modal .modal-title');
        const submitBtn = document.getElementById('simple-submit-service');
        
        if (modalTitle) {
            modalTitle.innerHTML = '<i class="fas fa-edit me-2"></i>Edit Service';
        }
        
        if (submitBtn) {
            submitBtn.innerHTML = '<i class="fas fa-save me-1"></i>Update Service';
        }
        
        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('add-service-modal'));
        modal.show();
    }

    showFallbackServices() {
        console.log('📋 Showing fallback sample services');
        
        const sampleServices = [
            {
                id: 'sample-1',
                title: 'Sample Service',
                category: 'General',
                subcategory: 'general',
                price: 25.00,
                description: 'This is a sample service. Add your own services to get started!'
            }
        ];
        
        this.services = sampleServices;
        this.renderServices();
    }

    showToast(message, type = 'info') {
        if (window.showToast) {
            window.showToast(message, type);
        } else {
            console.log(`Toast: ${message} (${type})`);
        }
    }
}

// Make it globally available
window.SimpleServicesManager = SimpleServicesManager;

console.log('✅ Simple Services Component loaded'); 