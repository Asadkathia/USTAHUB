/**
 * Service Category Manager
 * Handles automatic service category assignment based on provider's primary service category
 * Replaces the old dropdown-based category selection system
 */

class ServiceCategoryManager {
    constructor() {
        this.categoryMap = this.initializeCategoryMap();
        this.currentUserProfile = null;
    }

    /**
     * Initialize the category mapping with icons and display names
     */
    initializeCategoryMap() {
        return {
            // Home & Garden Services
            'plumbing': { 
                icon: 'fa-wrench', 
                display: 'Plumbing Services',
                description: 'Professional plumbing repairs and installations'
            },
            'electrical-services': { 
                icon: 'fa-bolt', 
                display: 'Electrical Services',
                description: 'Licensed electrical work and repairs'
            },
            'hvac': { 
                icon: 'fa-temperature-high', 
                display: 'HVAC Services',
                description: 'Heating, ventilation, and air conditioning'
            },
            'home-cleaning': { 
                icon: 'fa-broom', 
                display: 'Home Cleaning',
                description: 'Professional residential cleaning services'
            },
            'landscaping': { 
                icon: 'fa-leaf', 
                display: 'Landscaping & Gardening',
                description: 'Outdoor design and maintenance services'
            },
            'painting-services': { 
                icon: 'fa-paint-brush', 
                display: 'Painting Services',
                description: 'Interior and exterior painting'
            },
            'carpentry': { 
                icon: 'fa-hammer', 
                display: 'Carpentry',
                description: 'Custom woodwork and construction'
            },
            'moving-services': { 
                icon: 'fa-truck', 
                display: 'Moving Services',
                description: 'Professional moving and relocation'
            },
            'appliance-repair': { 
                icon: 'fa-tools', 
                display: 'Appliance Repair',
                description: 'Home appliance maintenance and repair'
            },
            'roofing-services': { 
                icon: 'fa-home', 
                display: 'Roofing Services',
                description: 'Roof installation and repair'
            },
            'locksmith-services': { 
                icon: 'fa-key', 
                display: 'Locksmith Services',
                description: 'Lock installation and security services'
            },
            'handyman-services': { 
                icon: 'fa-toolbox', 
                display: 'Handyman Services',
                description: 'General home maintenance and repairs'
            },

            // Health & Beauty Services
            'hair-salon': { 
                icon: 'fa-cut', 
                display: 'Hair Salon Services',
                description: 'Professional hair styling and treatments'
            },
            'nail-salon': { 
                icon: 'fa-hand-paper', 
                display: 'Nail Salon Services',
                description: 'Manicure, pedicure, and nail art'
            },
            'spa-services': { 
                icon: 'fa-spa', 
                display: 'Spa Services',
                description: 'Relaxation and wellness treatments'
            },
            'massage-therapy': { 
                icon: 'fa-hands', 
                display: 'Massage Therapy',
                description: 'Therapeutic and relaxation massage'
            },
            'wellness-services': { 
                icon: 'fa-heart', 
                display: 'Wellness Services',
                description: 'Health and wellness consultations'
            },
            'beauty-general': { 
                icon: 'fa-female', 
                display: 'Beauty Services',
                description: 'General beauty and cosmetic services'
            },

            // Auto & Transport Services
            'auto-repair': { 
                icon: 'fa-car', 
                display: 'Auto Repair Services',
                description: 'Vehicle maintenance and repair'
            },
            'car-wash': { 
                icon: 'fa-car-wash', 
                display: 'Car Wash & Detailing',
                description: 'Vehicle cleaning and detailing services'
            },

            // Business Services
            'it-services': { 
                icon: 'fa-laptop', 
                display: 'IT Services',
                description: 'Technology support and solutions'
            },
            'marketing-services': { 
                icon: 'fa-bullhorn', 
                display: 'Marketing Services',
                description: 'Digital marketing and advertising'
            },
            'tutoring-lessons': { 
                icon: 'fa-graduation-cap', 
                display: 'Tutoring & Lessons',
                description: 'Educational and skill-building services'
            },
            'event-planning': { 
                icon: 'fa-calendar-alt', 
                display: 'Event Planning',
                description: 'Professional event coordination'
            },
            'photography-services': { 
                icon: 'fa-camera', 
                display: 'Photography Services',
                description: 'Professional photography and videography'
            },
            'legal-services': { 
                icon: 'fa-balance-scale', 
                display: 'Legal Services',
                description: 'Legal consultation and representation'
            },
            'accounting-services': { 
                icon: 'fa-calculator', 
                display: 'Accounting Services',
                description: 'Financial and accounting services'
            },
            'business-consulting': { 
                icon: 'fa-briefcase', 
                display: 'Business Consulting',
                description: 'Professional business advisory services'
            },
            'graphic-design': { 
                icon: 'fa-palette', 
                display: 'Graphic Design',
                description: 'Creative design and branding services'
            },

            // Lifestyle Services
            'pet-grooming': { 
                icon: 'fa-paw', 
                display: 'Pet Grooming',
                description: 'Professional pet care and grooming'
            },
            'pet-sitting': { 
                icon: 'fa-dog', 
                display: 'Pet Sitting & Care',
                description: 'Pet care and sitting services'
            },
            'fitness-training': { 
                icon: 'fa-dumbbell', 
                display: 'Fitness Training',
                description: 'Personal training and fitness coaching'
            },
            'catering-services': { 
                icon: 'fa-utensils', 
                display: 'Catering Services',
                description: 'Food service and catering'
            },

            // Default/Other
            'other': { 
                icon: 'fa-cog', 
                display: 'Other Services',
                description: 'Specialized or miscellaneous services'
            }
        };
    }

    /**
     * Get category information by category key
     */
    getCategoryInfo(categoryKey) {
        return this.categoryMap[categoryKey] || this.categoryMap['other'];
    }

    /**
     * Get the icon class for a category
     */
    getCategoryIcon(categoryKey) {
        const categoryInfo = this.getCategoryInfo(categoryKey);
        return categoryInfo.icon;
    }

    /**
     * Get the display name for a category
     */
    getCategoryDisplayName(categoryKey) {
        const categoryInfo = this.getCategoryInfo(categoryKey);
        return categoryInfo.display;
    }

    /**
     * Get the description for a category
     */
    getCategoryDescription(categoryKey) {
        const categoryInfo = this.getCategoryInfo(categoryKey);
        return categoryInfo.description;
    }

    /**
     * Fetch the current user's profile and primary service category
     */
    async fetchUserProfile() {
        try {
            const { data: { user } } = await window.supabase.auth.getUser();
            if (!user) {
                throw new Error('No authenticated user found');
            }

            const { data: profile, error } = await window.supabase
                .from('profiles')
                .select('primary_service_category, first_name, last_name')
                .eq('id', user.id)
                .single();

            if (error) {
                throw error;
            }

            this.currentUserProfile = profile;
            return profile;
        } catch (error) {
            console.error('Error fetching user profile:', error);
            throw error;
        }
    }

    /**
     * Initialize the category display in the service modal
     */
    async initializeCategoryDisplay(formElement) {
        try {
            console.log('🔧 Initializing category display...');
            
            const categoryDisplay = formElement.querySelector('#serviceCategoryDisplay');
            const categoryIcon = categoryDisplay?.querySelector('.category-icon');
            const categoryText = categoryDisplay?.querySelector('.category-text');
            const hiddenInput = formElement.querySelector('#serviceCategory');

            if (!categoryDisplay || !categoryIcon || !categoryText || !hiddenInput) {
                console.error('❌ Category display elements not found');
                console.error('Missing elements:', {
                    categoryDisplay: !!categoryDisplay,
                    categoryIcon: !!categoryIcon,
                    categoryText: !!categoryText,
                    hiddenInput: !!hiddenInput
                });
                return false;
            }

            // Show loading state
            categoryDisplay.classList.add('loading');
            categoryText.textContent = 'Loading...';

            // Fetch user profile
            const profile = await this.fetchUserProfile();
            
            if (!profile?.primary_service_category) {
                console.error('❌ No primary service category found for user');
                categoryText.textContent = 'No category assigned';
                return false;
            }

            const categoryKey = profile.primary_service_category;
            const categoryInfo = this.getCategoryInfo(categoryKey);

            // Update display
            categoryIcon.className = `fas ${categoryInfo.icon} category-icon`;
            categoryText.textContent = categoryInfo.display;
            hiddenInput.value = categoryKey;

            // Remove loading state
            categoryDisplay.classList.remove('loading');

            console.log('✅ Category display initialized:', categoryInfo.display);
            return true;

        } catch (error) {
            console.error('❌ Error initializing category display:', error);
            
            // Show error state
            const categoryDisplay = formElement.querySelector('#serviceCategoryDisplay');
            const categoryText = categoryDisplay?.querySelector('.category-text');
            if (categoryText) {
                categoryText.textContent = 'Error loading category';
            }
            
            return false;
        }
    }

    /**
     * Validate that a service can be created in the user's primary category
     */
    async validateServiceCategory(serviceData) {
        try {
            const profile = this.currentUserProfile || await this.fetchUserProfile();
            
            if (!profile?.primary_service_category) {
                throw new Error('No primary service category found for user');
            }

            if (serviceData.category !== profile.primary_service_category) {
                // Handle both 'name' and 'title' properties for backward compatibility
                const serviceName = serviceData.name || serviceData.title || 'Unknown Service';
                throw new Error(`You can only create services in your registered specialty: ${this.getCategoryDisplayName(profile.primary_service_category)}`);
            }

            return true;
        } catch (error) {
            console.error('❌ Service category validation failed:', error);
            throw error;
        }
    }

    /**
     * Get all services for the current user's primary category
     */
    async getUserCategoryServices() {
        try {
            const profile = this.currentUserProfile || await this.fetchUserProfile();
            
            if (!profile?.primary_service_category) {
                return [];
            }

            const { data: services, error } = await window.supabase
                .from('services')
                .select('*')
                .eq('category', profile.primary_service_category)
                .order('created_at', { ascending: false });

            if (error) {
                throw error;
            }

            return services || [];
        } catch (error) {
            console.error('❌ Error fetching category services:', error);
            return [];
        }
    }
}

// Create global instance
console.log('🚀 Creating ServiceCategoryManager instance...');
window.serviceCategoryManager = new ServiceCategoryManager();
console.log('✅ ServiceCategoryManager instance created and available globally');

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ServiceCategoryManager;
} 