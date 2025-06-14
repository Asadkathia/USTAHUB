// Enhanced Dashboard Components for UstaHub Provider Dashboard
// Connects UI components with Phase 2 backend functionality

// ==========================================
// SERVICE MANAGEMENT COMPONENTS
// ==========================================

// Enhanced Services Table Component
class ServicesTableComponent {
    constructor(containerId) {
        console.log('🔧 ServicesTableComponent constructor called with:', containerId);
        this.container = document.getElementById(containerId);
        this.services = [];
        this.currentUser = null;
        this.isRefreshing = false; // Prevent infinite refresh loops
        this.modalListeners = []; // Track modal event listeners for cleanup
        console.log('📋 Container found:', !!this.container);
        this.init();
    }

    async init() {
        try {
            // Get current user
            const { data: { user } } = await window.supabase.auth.getUser();
            this.currentUser = user;
            
            // Load services
            await this.loadServices();
            
            // Render table
            this.render();
            
            // Set up event listeners
            this.attachEventListeners();
            
        } catch (error) {
            console.error('❌ Error initializing ServicesTableComponent:', error);
            this.renderError();
        }
    }

    async loadServices() {
        try {
            const { data, error } = await window.supabase
                .from('services')
                .select('*')
                .eq('provider_id', this.currentUser.id)
                .order('created_at', { ascending: false });

            if (error) {
                console.warn('⚠️ Error loading services from database:', error);
                throw error;
            }
            
            this.services = data || [];
            console.log('✅ Services loaded from database:', this.services.length);
            
            // Debug: Log each service's structure
            this.services.forEach((service, index) => {
                console.log(`🔍 Service ${index + 1}:`, {
                    id: service.id,
                    title: service.title,
                    category: service.category,
                    price: service.price,
                    all_properties: Object.keys(service)
                });
            });
            
        } catch (error) {
            console.log('📋 Using sample services data');
            this.services = this.getSampleServices();
            
            // Debug sample services too
            console.log('🔍 Sample services structure:');
            this.services.forEach((service, index) => {
                console.log(`🔍 Sample Service ${index + 1}:`, {
                    id: service.id,
                    title: service.title,
                    category: service.category,
                    price: service.price
                });
            });
        }
    }

    getSampleServices() {
        return [
            {
                id: 'sample-1',
                title: 'General Plumbing',
                category: 'plumbing',
                price: 75,
                description: 'Complete plumbing services including repairs and installations',
                created_at: new Date().toISOString()
            },
            {
                id: 'sample-2',
                title: 'Electrical Repairs',
                category: 'electrical-services',
                price: 85,
                description: 'Electrical troubleshooting and repair services',
                created_at: new Date().toISOString()
            }
        ];
    }

    render() {
        if (!this.container) return;

        const tableHTML = `
            <div class="services-table-container">
                <div class="table-header">
                    <h5><i class="fas fa-cogs"></i> My Services</h5>
                    <button class="action-btn primary" id="add-service-btn">
                        <i class="fas fa-plus"></i> Add Service
                    </button>
                </div>
                <div class="table-responsive">
                    <table class="services-table">
                        <thead>
                            <tr>
                                <th>Service Name</th>
                                <th>Category</th>
                                <th>Price</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody id="services-table-body">
                            ${this.renderServiceRows()}
                        </tbody>
                    </table>
                </div>
                ${this.services.length === 0 ? this.renderEmptyState() : ''}
            </div>
        `;

        this.container.innerHTML = tableHTML;
    }

    renderServiceRows() {
        return this.services.map(service => {
            // Ensure service has all required properties with defaults
            const safeService = {
                id: service.id || 'unknown',
                title: service.title || 'Unknown Service',
                category: service.category || 'general',
                price: service.price || 0
            };
            
            return `
                <tr data-service-id="${safeService.id}">
                    <td>
                        <div class="service-info">
                            <i class="fas ${this.getServiceIcon(safeService.category)}"></i>
                            <span class="service-name">${safeService.title}</span>
                        </div>
                    </td>
                    <td>
                        <span class="category-badge">${this.formatCategory(safeService.category)}</span>
                    </td>
                    <td>
                        <span class="price-display">$${safeService.price}/hr</span>
                    </td>
                    <td>
                        <div class="action-buttons">
                            <button class="action-icon edit" data-service-id="${safeService.id}" title="Edit Service">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="action-icon view" data-service-id="${safeService.id}" title="View Details">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button class="action-icon delete" data-service-id="${safeService.id}" title="Delete Service">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }

    renderEmptyState() {
        return `
            <div class="empty-state">
                <i class="fas fa-cogs empty-icon"></i>
                <h6>No Services Added Yet</h6>
                <p>Start by adding your first service to attract customers</p>
                <button class="action-btn primary" id="add-first-service-btn">
                    <i class="fas fa-plus"></i> Add Your First Service
                </button>
            </div>
        `;
    }

    renderError() {
        if (!this.container) return;
        
        this.container.innerHTML = `
            <div class="error-state">
                <i class="fas fa-exclamation-triangle error-icon"></i>
                <h6>Unable to Load Services</h6>
                <p>There was an error loading your services. Please try refreshing the page.</p>
                <button class="action-btn secondary" onclick="location.reload()">
                    <i class="fas fa-refresh"></i> Refresh Page
                </button>
            </div>
        `;
    }

    getServiceIcon(category) {
        const iconMap = {
            'plumbing': 'fa-wrench',
            'electrical-services': 'fa-bolt',
            'hvac': 'fa-temperature-high',
            'home-cleaning': 'fa-broom',
            'landscaping': 'fa-leaf',
            'painting-services': 'fa-paint-brush',
            'carpentry': 'fa-hammer',
            'moving-services': 'fa-truck',
            'appliance-repair': 'fa-tools',
            'roofing-services': 'fa-home',
            'locksmith-services': 'fa-key',
            'handyman-services': 'fa-toolbox',
            'hair-salon': 'fa-cut',
            'nail-salon': 'fa-hand-paper',
            'spa-services': 'fa-spa',
            'massage-therapy': 'fa-hands',
            'wellness-services': 'fa-heart',
            'beauty-general': 'fa-female',
            'auto-repair': 'fa-car',
            'car-wash': 'fa-car-wash',
            'it-services': 'fa-laptop',
            'marketing-services': 'fa-bullhorn',
            'tutoring-lessons': 'fa-graduation-cap',
            'event-planning': 'fa-calendar-alt',
            'photography-services': 'fa-camera',
            'legal-services': 'fa-balance-scale',
            'accounting-services': 'fa-calculator',
            'business-consulting': 'fa-briefcase',
            'graphic-design': 'fa-palette',
            'pet-grooming': 'fa-paw',
            'pet-sitting': 'fa-dog',
            'fitness-training': 'fa-dumbbell',
            'catering-services': 'fa-utensils'
        };
        
        return iconMap[category] || 'fa-cog';
    }

    formatCategory(category) {
        // Convert kebab-case to Title Case
        return category
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }

    attachEventListeners() {
        console.log('🔗 Attaching event listeners for ServicesTable...');
        
        // Add service button
        const addServiceBtn = document.getElementById('add-service-btn');
        const addFirstServiceBtn = document.getElementById('add-first-service-btn');
        
        console.log('🔘 Add service button found:', !!addServiceBtn);
        console.log('🔘 Add first service button found:', !!addFirstServiceBtn);
        
        if (addServiceBtn && !addServiceBtn.hasAttribute('data-listener-added')) {
            addServiceBtn.addEventListener('click', () => {
                console.log('🖱️ Add service button clicked (enhanced)');
                this.openAddServiceModal();
            });
            addServiceBtn.setAttribute('data-listener-added', 'true');
        }
        
        if (addFirstServiceBtn && !addFirstServiceBtn.hasAttribute('data-listener-added')) {
            addFirstServiceBtn.addEventListener('click', () => {
                console.log('🖱️ Add first service button clicked (enhanced)');
                this.openAddServiceModal();
            });
            addFirstServiceBtn.setAttribute('data-listener-added', 'true');
        }

        // Service action buttons - use delegation to avoid multiple handlers
        if (!this.container.hasAttribute('data-action-listener-added')) {
            this.container.addEventListener('click', (e) => {
                const actionBtn = e.target.closest('.action-icon');
                if (!actionBtn) return;

                const serviceId = actionBtn.dataset.serviceId;
                const action = actionBtn.classList.contains('edit') ? 'edit' :
                            actionBtn.classList.contains('view') ? 'view' : 'delete';

                this.handleServiceAction(action, serviceId);
            });
            this.container.setAttribute('data-action-listener-added', 'true');
        }
    }

    openAddServiceModal() {
        const modal = document.getElementById('add-service-modal');
        const form = modal.querySelector('#add-service-form');
        
        // Reset form
        form.reset();
        form.removeAttribute('data-service-id');
        
        // Reset modal title and button
        modal.querySelector('.modal-title').textContent = 'Add New Service';
        form.querySelector('button[type="submit"]').innerHTML = '<i class="fas fa-plus-circle"></i>Add Service';
        
        // Remove any validation messages
        form.querySelectorAll('.invalid-feedback').forEach(msg => {
            msg.remove();
        });
        
        // Clean up any existing modal listeners
        this.cleanupModalListeners();
        
        // Show modal first
        const bootstrapModal = new bootstrap.Modal(modal);
        bootstrapModal.show();
        
        // Initialize category display after modal is shown - ONE TIME ONLY
        const initCategory = async () => {
            console.log('🔧 Modal shown, initializing category display...');
            console.log('🔍 ServiceCategoryManager available:', !!window.serviceCategoryManager);
            
            if (window.serviceCategoryManager) {
                try {
                    const success = await window.serviceCategoryManager.initializeCategoryDisplay(form);
                    if (success) {
                        console.log('✅ Category display initialized successfully');
                    } else {
                        console.error('❌ Failed to initialize category display');
                    }
                } catch (error) {
                    console.error('❌ Error initializing category display:', error);
                }
            } else {
                console.error('❌ ServiceCategoryManager not available');
                const categoryDisplay = form.querySelector('#serviceCategoryDisplay');
                const categoryText = categoryDisplay?.querySelector('.category-text');
                if (categoryText) {
                    categoryText.textContent = 'Category manager not available';
                }
            }
        };
        
        // Add event listener with { once: true } to prevent duplicates
        const modalShownHandler = () => {
            initCategory();
        };
        modal.addEventListener('shown.bs.modal', modalShownHandler, { once: true });
        
        // Add event listener to clean up when modal is hidden
        const modalHiddenHandler = () => {
            this.cleanupModalListeners();
        };
        modal.addEventListener('hidden.bs.modal', modalHiddenHandler, { once: true });
        
        // Store references to remove later if needed
        this.modalListeners.push({
            element: modal,
            event: 'shown.bs.modal',
            handler: modalShownHandler
        });
        this.modalListeners.push({
            element: modal,
            event: 'hidden.bs.modal',
            handler: modalHiddenHandler
        });
    }
    
    cleanupModalListeners() {
        // Remove all tracked modal listeners
        this.modalListeners.forEach(listener => {
            listener.element.removeEventListener(listener.event, listener.handler);
        });
        this.modalListeners = [];
    }

    async handleServiceAction(action, serviceId) {
        switch (action) {
            case 'edit':
                await this.editService(serviceId);
                break;
            case 'view':
                await this.viewService(serviceId);
                break;
            case 'delete':
                await this.deleteService(serviceId);
                break;
        }
    }

    async editService(serviceId) {
        try {
            // Find service by ID
            const service = this.services.find(s => s.id === serviceId);
            if (!service) {
                throw new Error('Service not found');
            }
            
            // Get modal and form
            const modal = document.getElementById('add-service-modal');
            const form = modal.querySelector('#add-service-form');
            
            // Set form values
            form.querySelector('#serviceName').value = service.title;
            form.querySelector('#servicePrice').value = service.price;
            form.querySelector('#serviceDescription').value = service.description || '';
            form.querySelector('#serviceCategory').value = service.category;
            
            // Set form in edit mode
            form.dataset.serviceId = serviceId;
            
            // Update modal title and button
            modal.querySelector('.modal-title').textContent = 'Edit Service';
            form.querySelector('button[type="submit"]').innerHTML = '<i class="fas fa-save"></i>Update Service';
            
            // Clean up any existing modal listeners
            this.cleanupModalListeners();
            
            // Show modal
            const bootstrapModal = new bootstrap.Modal(modal);
            bootstrapModal.show();
            
            // Initialize category display
            const initCategory = async () => {
                if (window.serviceCategoryManager) {
                    await window.serviceCategoryManager.initializeCategoryDisplay(form);
                }
            };
            
            // Add event listener with { once: true } to prevent duplicates
            const modalShownHandler = () => {
                initCategory();
            };
            modal.addEventListener('shown.bs.modal', modalShownHandler, { once: true });
            
            // Add event listener to clean up when modal is hidden
            const modalHiddenHandler = () => {
                this.cleanupModalListeners();
            };
            modal.addEventListener('hidden.bs.modal', modalHiddenHandler, { once: true });
            
            // Store references to remove later if needed
            this.modalListeners.push({
                element: modal,
                event: 'shown.bs.modal',
                handler: modalShownHandler
            });
            this.modalListeners.push({
                element: modal,
                event: 'hidden.bs.modal',
                handler: modalHiddenHandler
            });
            
        } catch (error) {
            console.error('❌ Error editing service:', error);
            this.showToast('Error editing service: ' + error.message, 'error');
        }
    }

    async viewService(serviceId) {
        const service = this.services.find(s => s.id === serviceId);
        if (service) {
            this.showServiceDetailsModal(service);
        } else {
            this.showToast('Service not found', 'error');
        }
    }

    showServiceDetailsModal(service) {
        const modalHTML = `
            <div class="modal fade enhanced-modal" id="service-details-modal" tabindex="-1" aria-hidden="true">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Service Details</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <div class="service-details-container">
                                <div class="service-detail-header">
                                    <i class="fas ${this.getServiceIcon(service.category)} service-icon"></i>
                                    <h4>${service.title}</h4>
                                    <span class="category-badge">${this.formatCategory(service.category)}</span>
                                </div>
                                <div class="service-detail-content">
                                    <div class="detail-group">
                                        <h6>Price</h6>
                                        <p class="price-display">$${service.price}/hr</p>
                                    </div>
                                    <div class="detail-group">
                                        <h6>Description</h6>
                                        <p>${service.description || 'No description provided.'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                            <button type="button" class="btn btn-primary" onclick="servicesTable.editService('${service.id}')">
                                <i class="fas fa-edit"></i> Edit Service
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Remove existing modal if any
        const existingModal = document.getElementById('service-details-modal');
        if (existingModal) existingModal.remove();

        // Add new modal
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('service-details-modal'));
        modal.show();

        // Remove modal after it's hidden - use { once: true } to prevent memory leaks
        document.getElementById('service-details-modal').addEventListener('hidden.bs.modal', function() {
            this.remove();
        }, { once: true });
    }

    async deleteService(serviceId) {
        if (!confirm('Are you sure you want to delete this service? This action cannot be undone.')) {
            return;
        }

        try {
            // Check if this is a sample service
            if (serviceId.startsWith('sample-')) {
                this.showToast('Cannot delete sample services. Please add real services to manage them.', 'warning');
                return;
            }

            // Show loading state
            const deleteBtn = document.querySelector(`[data-service-id="${serviceId}"].delete`);
            if (deleteBtn) {
                deleteBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
                deleteBtn.disabled = true;
            }

            const { error } = await window.supabase
                .from('services')
                .delete()
                .eq('id', serviceId)
                .eq('provider_id', this.currentUser.id);

            if (error) throw error;

            // Create activity log (non-blocking)
            if (window.createActivityLog) {
                const service = this.services.find(s => s.id === serviceId);
                window.createActivityLog(
                    this.currentUser.id,
                    'service_deleted',
                    `Service Deleted: ${service?.title || 'Unknown Service'}`,
                    `Removed service from ${service?.category || 'Unknown'} category`,
                    null, serviceId, null, null
                ).catch(error => {
                    console.warn('Failed to create activity log:', error);
                });
            }

            this.showToast('Service deleted successfully', 'success');
            
            // Refresh services without blocking - use setTimeout to avoid UI freeze
            setTimeout(() => {
                this.refresh().catch(error => {
                    console.warn('Failed to refresh after deletion:', error);
                });
            }, 100);

        } catch (error) {
            console.error('❌ Error deleting service:', error);
            this.showToast('Error deleting service: ' + error.message, 'error');
            
            // Reset button state
            const deleteBtn = document.querySelector(`[data-service-id="${serviceId}"].delete`);
            if (deleteBtn) {
                deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
                deleteBtn.disabled = false;
            }
        }
    }

    showToast(message, type) {
        if (window.utils && window.utils.showToast) {
            window.utils.showToast(message, type);
        } else {
            alert(message);
        }
    }

    async refresh() {
        try {
            console.log('🔄 Refreshing services table...');
            
            // Prevent multiple simultaneous refreshes
            if (this.isRefreshing) {
                console.log('⏳ Refresh already in progress, skipping...');
                return;
            }
            
            this.isRefreshing = true;
            
            // Load services without blocking UI
            await this.loadServices();
            
            // Use setTimeout to avoid UI freeze
            setTimeout(() => {
                this.render();
                this.attachEventListeners();
                console.log('✅ Services table refreshed successfully');
                this.isRefreshing = false;
            }, 0);
            
        } catch (error) {
            console.error('❌ Error refreshing services table:', error);
            this.showToast('Error refreshing services', 'error');
            this.isRefreshing = false;
        }
    }
}

// ==========================================
// QUICK ACTIONS COMPONENT
// ==========================================

class QuickActionsComponent {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.init();
    }

    init() {
        this.render();
        this.attachEventListeners();
    }

    render() {
        if (!this.container) return;

        const actionsHTML = `
            <div class="quick-actions-container">
                <h5><i class="fas fa-bolt"></i> Quick Actions</h5>
                <div class="actions-grid">
                    <button class="quick-action-btn primary" id="quick-add-service">
                        <i class="fas fa-plus-circle"></i>
                        <span>Add New Service</span>
                    </button>
                    <button class="quick-action-btn secondary" id="quick-update-availability">
                        <i class="fas fa-calendar-check"></i>
                        <span>Update Availability</span>
                    </button>
                    <button class="quick-action-btn info" id="quick-view-analytics">
                        <i class="fas fa-chart-line"></i>
                        <span>View Analytics</span>
                    </button>
                    <button class="quick-action-btn success" id="quick-boost-visibility">
                        <i class="fas fa-rocket"></i>
                        <span>Boost Visibility</span>
                    </button>
                    <button class="quick-action-btn warning" id="quick-manage-pricing">
                        <i class="fas fa-dollar-sign"></i>
                        <span>Manage Pricing</span>
                    </button>
                </div>
            </div>
        `;

        this.container.innerHTML = actionsHTML;
    }

    attachEventListeners() {
        // Add service action
        const addServiceBtn = document.getElementById('quick-add-service');
        if (addServiceBtn) {
            addServiceBtn.addEventListener('click', () => {
                // Use the services table component's openAddServiceModal method if available
                if (window.servicesTable && window.servicesTable.openAddServiceModal) {
                    window.servicesTable.openAddServiceModal();
                } else {
                    // Fallback to direct modal opening
                    const modal = document.getElementById('add-service-modal');
                    if (modal) {
                        new bootstrap.Modal(modal).show();
                    }
                }
            });
        }

        // Update availability action
        const availabilityBtn = document.getElementById('quick-update-availability');
        if (availabilityBtn) {
            availabilityBtn.addEventListener('click', () => {
                this.showAvailabilityModal();
            });
        }

        // View analytics action
        const analyticsBtn = document.getElementById('quick-view-analytics');
        if (analyticsBtn) {
            analyticsBtn.addEventListener('click', () => {
                this.showAnalyticsModal();
            });
        }

        // Boost visibility action
        const boostBtn = document.getElementById('quick-boost-visibility');
        if (boostBtn) {
            boostBtn.addEventListener('click', () => {
                this.showBoostModal();
            });
        }

        // Manage pricing action
        const pricingBtn = document.getElementById('quick-manage-pricing');
        if (pricingBtn) {
            pricingBtn.addEventListener('click', () => {
                this.showPricingModal();
            });
        }
    }

    showAvailabilityModal() {
        const modalHTML = `
            <div class="modal fade" id="availability-modal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Update Availability</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="availability-settings">
                                <div class="form-group">
                                    <label>Available Days</label>
                                    <div class="days-grid">
                                        ${['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => `
                                            <label class="day-checkbox">
                                                <input type="checkbox" value="${day}" checked>
                                                <span>${day}</span>
                                            </label>
                                        `).join('')}
                                    </div>
                                </div>
                                <div class="form-group">
                                    <label>Working Hours</label>
                                    <div class="time-inputs">
                                        <input type="time" value="09:00" class="form-control">
                                        <span>to</span>
                                        <input type="time" value="17:00" class="form-control">
                                    </div>
                                </div>
                                <div class="form-group">
                                    <label class="checkbox-label">
                                        <input type="checkbox">
                                        <span>Available for emergency calls (24/7)</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                            <button type="button" class="btn btn-primary">Save Availability</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.showModal(modalHTML, 'availability-modal');
    }

    showAnalyticsModal() {
        const modalHTML = `
            <div class="modal fade" id="analytics-modal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Performance Analytics</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="analytics-overview">
                                <div class="analytics-grid">
                                    <div class="analytics-card">
                                        <h6>Profile Views</h6>
                                        <div class="metric-value">1,245</div>
                                        <div class="metric-change positive">+15%</div>
                                    </div>
                                    <div class="analytics-card">
                                        <h6>Booking Rate</h6>
                                        <div class="metric-value">8.5%</div>
                                        <div class="metric-change positive">+2.3%</div>
                                    </div>
                                    <div class="analytics-card">
                                        <h6>Avg. Response</h6>
                                        <div class="metric-value">2.5h</div>
                                        <div class="metric-change negative">+0.5h</div>
                                    </div>
                                    <div class="analytics-card">
                                        <h6>Customer Rating</h6>
                                        <div class="metric-value">4.8/5</div>
                                        <div class="metric-change positive">+0.2</div>
                                    </div>
                                </div>
                                <div class="analytics-chart">
                                    <canvas id="performance-chart" width="400" height="200"></canvas>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                            <button type="button" class="btn btn-primary">Download Report</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.showModal(modalHTML, 'analytics-modal');
    }

    showBoostModal() {
        const modalHTML = `
            <div class="modal fade" id="boost-modal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Boost Your Visibility</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="boost-options">
                                <div class="boost-tips">
                                    <h6>Tips to Improve Your Visibility:</h6>
                                    <ul>
                                        <li><i class="fas fa-check text-success"></i> Complete your profile with photos</li>
                                        <li><i class="fas fa-check text-success"></i> Get verified by uploading credentials</li>
                                        <li><i class="fas fa-times text-danger"></i> Respond to messages within 1 hour</li>
                                        <li><i class="fas fa-times text-danger"></i> Maintain a 4.5+ star rating</li>
                                        <li><i class="fas fa-times text-danger"></i> Update your availability regularly</li>
                                    </ul>
                                </div>
                                <div class="boost-actions">
                                    <button class="btn btn-outline-primary btn-block">Update Profile Photos</button>
                                    <button class="btn btn-outline-primary btn-block">Get Verified</button>
                                    <button class="btn btn-outline-primary btn-block">Set Auto-Responses</button>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.showModal(modalHTML, 'boost-modal');
    }

    showPricingModal() {
        const modalHTML = `
            <div class="modal fade" id="pricing-modal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Manage Pricing</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="pricing-settings">
                                <div class="form-group">
                                    <label>Base Hourly Rate</label>
                                    <div class="input-group">
                                        <span class="input-group-text">$</span>
                                        <input type="number" class="form-control" value="75" min="1">
                                        <span class="input-group-text">/hour</span>
                                    </div>
                                </div>
                                <div class="form-group">
                                    <label>Emergency Service Rate</label>
                                    <div class="input-group">
                                        <span class="input-group-text">$</span>
                                        <input type="number" class="form-control" value="120" min="1">
                                        <span class="input-group-text">/hour</span>
                                    </div>
                                </div>
                                <div class="form-group">
                                    <label>Weekend Rate Multiplier</label>
                                    <select class="form-control">
                                        <option value="1">Same as weekday</option>
                                        <option value="1.25">+25%</option>
                                        <option value="1.5" selected>+50%</option>
                                        <option value="2">+100%</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label class="checkbox-label">
                                        <input type="checkbox" checked>
                                        <span>Auto-adjust prices based on demand</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                            <button type="button" class="btn btn-primary">Save Pricing</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.showModal(modalHTML, 'pricing-modal');
    }

    showModal(modalHTML, modalId) {
        // Remove existing modal if any
        const existingModal = document.getElementById(modalId);
        if (existingModal) existingModal.remove();

        // Add new modal
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Show modal
        const modal = new bootstrap.Modal(document.getElementById(modalId));
        modal.show();

        // Remove modal after it's hidden
        document.getElementById(modalId).addEventListener('hidden.bs.modal', function() {
            this.remove();
        });
    }
}

// ==========================================
// ENHANCED ACTIVITY FILTERS COMPONENT
// ==========================================

class ActivityFiltersComponent {
    constructor(containerId, activityFeedId) {
        this.container = document.getElementById(containerId);
        this.activityFeed = document.getElementById(activityFeedId);
        this.activities = [];
        this.currentFilter = 'all';
        this.init();
    }

    async init() {
        try {
            // Get current user and load activities
            const { data: { user } } = await window.supabase.auth.getUser();
            if (user) {
                await this.loadActivities(user.id);
            }
            
            this.render();
            this.attachEventListeners();
            
        } catch (error) {
            // Silently handle initialization errors
        }
    }

    async loadActivities(userId) {
        try {
            if (window.fetchProviderActivities) {
                this.activities = await window.fetchProviderActivities(userId);
            }
        } catch (error) {
            this.activities = [];
        }
    }

    render() {
        if (!this.container) return;

        const filtersHTML = `
            <div class="activity-filters">
                <button class="filter-btn ${this.currentFilter === 'all' ? 'active' : ''}" data-filter="all">
                    All <span class="count">${this.activities.length}</span>
                </button>
                <button class="filter-btn ${this.currentFilter === 'booking' ? 'active' : ''}" data-filter="booking">
                    Bookings <span class="count">${this.getFilterCount('booking')}</span>
                </button>
                <button class="filter-btn ${this.currentFilter === 'review' ? 'active' : ''}" data-filter="review">
                    Reviews <span class="count">${this.getFilterCount('review')}</span>
                </button>
                <button class="filter-btn ${this.currentFilter === 'payment' ? 'active' : ''}" data-filter="payment">
                    Earnings <span class="count">${this.getFilterCount('payment')}</span>
                </button>
            </div>
        `;

        this.container.innerHTML = filtersHTML;
    }

    getFilterCount(type) {
        return this.activities.filter(activity => activity.type === type).length;
    }

    attachEventListeners() {
        this.container.addEventListener('click', (e) => {
            const filterBtn = e.target.closest('.filter-btn');
            if (!filterBtn) return;

            // Update active filter
            this.container.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
            filterBtn.classList.add('active');

            // Update current filter
            this.currentFilter = filterBtn.dataset.filter;

            // Apply filter
            this.applyFilter();
        });
    }

    applyFilter() {
        const filteredActivities = this.currentFilter === 'all' 
            ? this.activities 
            : this.activities.filter(activity => activity.type === this.currentFilter);

        // Re-render activity feed with filtered data
        if (window.renderEnhancedActivityFeed) {
            window.renderEnhancedActivityFeed(filteredActivities);
        }
    }

    async refresh() {
        const { data: { user } } = await window.supabase.auth.getUser();
        if (user) {
            await this.loadActivities(user.id);
            this.render();
            this.attachEventListeners();
            this.applyFilter();
        }
    }
}

// ==========================================
// COMPONENT INITIALIZATION
// ==========================================

// Initialize all enhanced dashboard components
function initializeEnhancedComponents() {
    // Check if already initialized to prevent duplicates
    if (window.enhancedComponentsInitialized) {
        console.log('⚠️ Enhanced components already initialized, skipping duplicate initialization');
        return;
    }
    
    console.log('🚀 Starting enhanced components initialization...');
    
    // Wait for ServiceCategoryManager to be available
    const waitForServiceCategoryManager = () => {
        return new Promise((resolve) => {
            if (window.serviceCategoryManager) {
                console.log('✅ ServiceCategoryManager already available');
                resolve(true);
                return;
            }
            
            let attempts = 0;
            const maxAttempts = 50; // 5 seconds max wait
            
            const checkManager = () => {
                attempts++;
                if (window.serviceCategoryManager) {
                    console.log('✅ ServiceCategoryManager loaded');
                    clearInterval(checkInterval);
                    resolve(true);
                } else if (attempts >= maxAttempts) {
                    console.warn('⚠️ ServiceCategoryManager not available after timeout');
                    clearInterval(checkInterval);
                    resolve(false);
                }
            };
            
            const checkInterval = setInterval(checkManager, 100);
        });
    };
    
    // Initialize all components
    const initComponents = async () => {
        try {
            console.log('⏳ Waiting for ServiceCategoryManager...');
            await waitForServiceCategoryManager();
            
            // Clean up any existing components first
            if (window.servicesTable) {
                console.log('🧹 Cleaning up existing ServicesTable component');
                if (window.servicesTable.cleanupModalListeners) {
                    window.servicesTable.cleanupModalListeners();
                }
            }
            
            // Initialize services table component - use correct container ID
            console.log('🔧 Initializing ServicesTable component...');
            window.servicesTable = new ServicesTableComponent('services-table-container');
            console.log('✅ ServicesTable component initialized');
            
            // Initialize quick actions component
            console.log('🔧 Initializing QuickActions component...');
            window.quickActions = new QuickActionsComponent('quick-actions-container');
            console.log('✅ QuickActions component initialized');
            
            // Initialize activity filters component - use correct container ID
            console.log('🔧 Initializing ActivityFilters component...');
            window.activityFilters = new ActivityFiltersComponent('activity-filters-container', 'activity-feed');
            console.log('✅ ActivityFilters component initialized');
            
            // Mark as initialized
            window.enhancedComponentsInitialized = true;
            console.log('✅ All enhanced components initialized successfully');
            
            // Dispatch custom event to notify other scripts
            document.dispatchEvent(new CustomEvent('enhancedComponentsReady', {
                detail: {
                    servicesTable: window.servicesTable,
                    quickActions: window.quickActions,
                    activityFilters: window.activityFilters
                }
            }));
            
        } catch (error) {
            console.error('❌ Error initializing enhanced components:', error);
            // Don't mark as initialized if there was an error
            window.enhancedComponentsInitialized = false;
        }
    };
    
    // Start initialization
    initComponents();
}

// Cleanup function for when page is unloaded
function cleanupEnhancedComponents() {
    console.log('🧹 Cleaning up enhanced components...');
    
    if (window.servicesTable && window.servicesTable.cleanupModalListeners) {
        window.servicesTable.cleanupModalListeners();
    }
    
    // Reset initialization flag
    window.enhancedComponentsInitialized = false;
    
    console.log('✅ Enhanced components cleanup complete');
}

// Add cleanup on page unload
window.addEventListener('beforeunload', cleanupEnhancedComponents);

// Export the initialization function
window.initializeEnhancedComponents = initializeEnhancedComponents;

// Export classes to global scope for debugging and external access
window.ServicesTableComponent = ServicesTableComponent;
window.QuickActionsComponent = QuickActionsComponent;
window.ActivityFiltersComponent = ActivityFiltersComponent;