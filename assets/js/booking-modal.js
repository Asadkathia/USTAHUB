// Booking Modal JavaScript
// Handles multi-step booking process with validation and Supabase integration

class BookingModal {
    constructor() {
        this.currentStep = 1;
        this.maxSteps = 4;
        this.bookingData = {};
        this.serviceData = {};
        this.providerData = {};
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.setupDateRestrictions();
        this.loadUserProfile();
    }
    
    setupEventListeners() {
        // Step navigation
        document.getElementById('nextStepBtn').addEventListener('click', () => this.nextStep());
        document.getElementById('prevStepBtn').addEventListener('click', () => this.prevStep());
        
        // Price calculation triggers
        document.getElementById('serviceDuration').addEventListener('change', () => this.calculatePrice());
        document.getElementById('urgentService').addEventListener('change', () => this.calculatePrice());
        document.getElementById('weekendService').addEventListener('change', () => this.calculatePrice());
        
        // Form validation triggers
        this.setupFormValidation();
        
        // Modal events
        const modal = document.getElementById('bookingModal');
        modal.addEventListener('hidden.bs.modal', () => this.resetModal());
    }
    
    setupDateRestrictions() {
        const dateInput = document.getElementById('serviceDate');
        const today = new Date();
        today.setDate(today.getDate() + 1); // Minimum 1 day advance booking
        dateInput.min = today.toISOString().split('T')[0];
        
        // Maximum 30 days in advance
        const maxDate = new Date();
        maxDate.setDate(maxDate.getDate() + 30);
        dateInput.max = maxDate.toISOString().split('T')[0];
    }
    
    async loadUserProfile() {
        try {
            // Check if Supabase is loaded
            if (!window.supabase) {
                console.log('Supabase not yet loaded, skipping user profile load');
                return;
            }
            
            const { data: { user } } = await window.supabase.auth.getUser();
            if (user) {
                const { data: profile } = await window.supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single();
                
                if (profile) {
                    document.getElementById('customerName').value = `${profile.first_name} ${profile.last_name}`;
                    document.getElementById('customerPhone').value = profile.phone || '';
                    document.getElementById('customerEmail').value = user.email || '';
                }
            }
        } catch (error) {
            console.log('No user logged in or error loading profile:', error);
        }
    }
    
    setupFormValidation() {
        // Real-time validation
        const requiredFields = ['customerName', 'customerPhone', 'customerEmail'];
        requiredFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            field.addEventListener('blur', () => this.validateField(field));
            field.addEventListener('input', () => this.clearFieldError(field));
        });
        
        // Phone number formatting
        document.getElementById('customerPhone').addEventListener('input', (e) => {
            this.formatPhoneNumber(e.target);
        });
    }
    
    validateField(field) {
        const value = field.value.trim();
        let isValid = true;
        let errorMessage = '';
        
        if (field.hasAttribute('required') && !value) {
            isValid = false;
            errorMessage = 'This field is required';
        } else if (field.type === 'email' && value) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
                isValid = false;
                errorMessage = 'Please enter a valid email address';
            }
        } else if (field.type === 'tel' && value) {
            const phoneRegex = /^(\+92|0)?[0-9]{10}$/;
            if (!phoneRegex.test(value.replace(/\s/g, ''))) {
                isValid = false;
                errorMessage = 'Please enter a valid Pakistani phone number';
            }
        }
        
        this.setFieldValidation(field, isValid, errorMessage);
        return isValid;
    }
    
    setFieldValidation(field, isValid, errorMessage) {
        field.classList.remove('is-valid', 'is-invalid');
        
        // Remove existing feedback
        const existingFeedback = field.parentNode.querySelector('.invalid-feedback');
        if (existingFeedback) {
            existingFeedback.remove();
        }
        
        if (!isValid) {
            field.classList.add('is-invalid');
            const feedback = document.createElement('div');
            feedback.className = 'invalid-feedback';
            feedback.textContent = errorMessage;
            field.parentNode.appendChild(feedback);
        } else if (field.value.trim()) {
            field.classList.add('is-valid');
        }
    }
    
    clearFieldError(field) {
        field.classList.remove('is-invalid');
        const feedback = field.parentNode.querySelector('.invalid-feedback');
        if (feedback) {
            feedback.remove();
        }
    }
    
    formatPhoneNumber(field) {
        let value = field.value.replace(/\D/g, '');
        
        if (value.startsWith('92')) {
            value = '+' + value;
        } else if (value.startsWith('0')) {
            value = '+92' + value.substring(1);
        } else if (value.length > 0 && !value.startsWith('+')) {
            value = '+92' + value;
        }
        
        field.value = value;
    }
    
    nextStep() {
        if (this.validateCurrentStep()) {
            if (this.currentStep < this.maxSteps) {
                this.currentStep++;
                this.updateStepDisplay();
                
                if (this.currentStep === 4) {
                    this.updateSummary();
                }
            } else {
                this.submitBooking();
            }
        }
    }
    
    prevStep() {
        if (this.currentStep > 1) {
            this.currentStep--;
            this.updateStepDisplay();
        }
    }
    
    validateCurrentStep() {
        switch (this.currentStep) {
            case 1:
                return this.validateStep1();
            case 2:
                return this.validateStep2();
            case 3:
                return this.validateStep3();
            case 4:
                return true; // Summary step, no validation needed
            default:
                return true;
        }
    }
    
    validateStep1() {
        const duration = document.getElementById('serviceDuration').value;
        if (!duration) {
            this.showError('Please select a service duration');
            return false;
        }
        return true;
    }
    
    validateStep2() {
        const date = document.getElementById('serviceDate').value;
        const time = document.getElementById('serviceTime').value;
        const address = document.getElementById('serviceAddress').value.trim();
        
        if (!date) {
            this.showError('Please select a service date');
            return false;
        }
        
        if (!time) {
            this.showError('Please select a service time');
            return false;
        }
        
        if (!address) {
            this.showError('Please enter the service address');
            return false;
        }
        
        // Check if date is not in the past
        const selectedDate = new Date(date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (selectedDate < today) {
            this.showError('Please select a future date');
            return false;
        }
        
        return true;
    }
    
    validateStep3() {
        const requiredFields = ['customerName', 'customerPhone', 'customerEmail'];
        let allValid = true;
        
        requiredFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (!this.validateField(field)) {
                allValid = false;
            }
        });
        
        return allValid;
    }
    
    updateStepDisplay() {
        // Update step indicator
        document.querySelectorAll('.step').forEach(step => {
            const stepNum = parseInt(step.getAttribute('data-step'));
            step.classList.remove('active', 'completed');
            
            if (stepNum === this.currentStep) {
                step.classList.add('active');
            } else if (stepNum < this.currentStep) {
                step.classList.add('completed');
            }
        });
        
        // Update step content
        document.querySelectorAll('.booking-step-content').forEach(content => {
            content.classList.add('d-none');
        });
        document.getElementById(`step-${this.currentStep}`).classList.remove('d-none');
        
        // Update buttons
        const prevBtn = document.getElementById('prevStepBtn');
        const nextBtn = document.getElementById('nextStepBtn');
        
        prevBtn.style.display = this.currentStep > 1 ? 'block' : 'none';
        
        if (this.currentStep === this.maxSteps) {
            nextBtn.innerHTML = '<i class="fas fa-check me-2"></i>Confirm Booking';
            nextBtn.classList.remove('btn-primary');
            nextBtn.classList.add('btn-success');
        } else {
            nextBtn.innerHTML = 'Next <i class="fas fa-arrow-right ms-2"></i>';
            nextBtn.classList.remove('btn-success');
            nextBtn.classList.add('btn-primary');
        }
    }
    
    calculatePrice() {
        const duration = parseInt(document.getElementById('serviceDuration').value) || 1;
        const urgentService = document.getElementById('urgentService').checked;
        const weekendService = document.getElementById('weekendService').checked;
        
        let basePrice = 50; // Base price per hour
        let totalPrice = basePrice * duration;
        
        if (urgentService) totalPrice += 20;
        if (weekendService) totalPrice += 15;
        
        // Update price display in step 1
        const durationSelect = document.getElementById('serviceDuration');
        const selectedOption = durationSelect.options[durationSelect.selectedIndex];
        if (selectedOption) {
            const basePriceText = duration >= 4 ? 'Contact for quote' : `$${totalPrice}`;
            // We could update the option text here if needed
        }
        
        this.bookingData.estimatedPrice = totalPrice;
        return totalPrice;
    }
    
    updateSummary() {
        const serviceTitle = this.serviceData.title || 'Service';
        const providerName = this.providerData.name || 'Provider';
        const date = document.getElementById('serviceDate').value;
        const time = document.getElementById('serviceTime').value;
        const duration = document.getElementById('serviceDuration').value;
        const address = document.getElementById('serviceAddress').value;
        const customerName = document.getElementById('customerName').value;
        const customerPhone = document.getElementById('customerPhone').value;
        
        document.getElementById('summaryService').textContent = serviceTitle;
        document.getElementById('summaryProvider').textContent = providerName;
        document.getElementById('summaryDateTime').textContent = `${date} at ${time}`;
        document.getElementById('summaryDuration').textContent = `${duration} hour(s)`;
        document.getElementById('summaryAddress').textContent = address;
        document.getElementById('summaryCustomer').textContent = `${customerName} (${customerPhone})`;
        
        const totalPrice = this.calculatePrice();
        document.getElementById('summaryTotal').textContent = duration >= 4 ? 'Contact for quote' : `$${totalPrice}`;
    }
    
    async submitBooking() {
        try {
            // Check if Supabase is loaded
            if (!window.supabase) {
                this.showError('System not ready. Please refresh the page and try again.');
                return;
            }
            
            this.showLoading();
            
            // Prepare booking data
            const bookingData = {
                service_id: this.serviceData.id,
                provider_id: this.serviceData.provider_id,
                booking_date: new Date().toISOString(),
                scheduled_date: document.getElementById('serviceDate').value,
                scheduled_time: document.getElementById('serviceTime').value,
                duration_hours: parseFloat(document.getElementById('serviceDuration').value),
                location_address: document.getElementById('serviceAddress').value,
                customer_phone: document.getElementById('customerPhone').value,
                customer_email: document.getElementById('customerEmail').value,
                special_instructions: document.getElementById('specialInstructions').value,
                estimated_price: this.calculatePrice(),
                payment_method: document.querySelector('input[name="paymentMethod"]:checked')?.value || 'cash',
                status: 'pending'
            };
            
            // Get current user
            const { data: { user } } = await window.supabase.auth.getUser();
            if (user) {
                bookingData.consumer_id = user.id;
            } else {
                this.showError('You must be logged in to make a booking.');
                this.hideLoading();
                return;
            }
            
            // Submit to Supabase
            const { data, error } = await window.supabase
                .from('bookings')
                .insert([bookingData])
                .select()
                .single();
            
            if (error) throw error;
            
            this.showSuccess(data);
            
        } catch (error) {
            console.error('Booking submission error:', error);
            this.showError('Failed to submit booking. Please try again.');
            this.hideLoading();
        }
    }
    
    showLoading() {
        const nextBtn = document.getElementById('nextStepBtn');
        nextBtn.disabled = true;
        nextBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Processing...';
    }
    
    hideLoading() {
        const nextBtn = document.getElementById('nextStepBtn');
        nextBtn.disabled = false;
        nextBtn.innerHTML = '<i class="fas fa-check me-2"></i>Confirm Booking';
    }
    
    showSuccess(bookingData) {
        // Replace modal content with success message
        const modalBody = document.querySelector('#bookingModal .modal-body');
        modalBody.innerHTML = `
            <div class="booking-success text-center py-5">
                <div class="success-icon mb-4" style="animation: bounceIn 0.6s ease-out;">
                    <i class="fas fa-check-circle text-success" style="font-size: 4rem;"></i>
                </div>
                <h3 class="text-success mb-3">🎉 Booking Confirmed!</h3>
                <p class="text-muted mb-4">Your booking request has been submitted successfully.</p>
                
                <div class="booking-reference mt-4 mb-4 p-4 bg-light rounded-3 border border-success" style="border-left: 4px solid #28a745 !important;">
                    <div class="mb-2">
                        <strong class="text-dark">Booking Reference</strong>
                    </div>
                    <h4 class="text-success mb-0">#${bookingData.booking_reference || bookingData.id.substring(0, 8).toUpperCase()}</h4>
                </div>
                
                <div class="booking-details p-4 bg-white rounded-3 border">
                    <h5 class="mb-3">Booking Details</h5>
                    <div class="row text-start">
                        <div class="col-6 mb-2">
                            <small class="text-muted">Service:</small><br>
                            <strong>${this.serviceData.title}</strong>
                        </div>
                        <div class="col-6 mb-2">
                            <small class="text-muted">Date & Time:</small><br>
                            <strong>${document.getElementById('serviceDate').value} at ${document.getElementById('serviceTime').value}</strong>
                        </div>
                        <div class="col-6 mb-2">
                            <small class="text-muted">Duration:</small><br>
                            <strong>${document.getElementById('serviceDuration').value} hour(s)</strong>
                        </div>
                        <div class="col-6 mb-2">
                            <small class="text-muted">Status:</small><br>
                            <span class="badge bg-warning">Pending Confirmation</span>
                        </div>
                    </div>
                </div>
                
                <div class="alert alert-info mt-4 text-start">
                    <i class="fas fa-info-circle me-2"></i>
                    <strong>What happens next?</strong><br>
                    <small>The service provider will contact you within 24 hours to confirm the booking details and discuss any specific requirements.</small>
                </div>
                
                <p class="mt-4 mb-0">
                    <i class="fas fa-mobile-alt me-2 text-primary"></i>
                    You will receive SMS and email confirmations shortly.
                </p>
            </div>
            
            <style>
                @keyframes bounceIn {
                    0% { transform: scale(0.3); opacity: 0; }
                    50% { transform: scale(1.05); }
                    70% { transform: scale(0.9); }
                    100% { transform: scale(1); opacity: 1; }
                }
            </style>
        `;
        
        // Update footer with more options
        const modalFooter = document.querySelector('#bookingModal .modal-footer');
        modalFooter.innerHTML = `
            <div class="d-flex gap-2 w-100 justify-content-center">
                <button type="button" class="btn btn-outline-primary" onclick="window.print()">
                    <i class="fas fa-print me-2"></i>Print Details
                </button>
                <button type="button" class="btn btn-primary" data-bs-dismiss="modal">
                    <i class="fas fa-check me-2"></i>Done
                </button>
            </div>
        `;
    }
    
    showError(message) {
        // Create or update error alert
        let errorAlert = document.querySelector('.booking-error-alert');
        if (!errorAlert) {
            errorAlert = document.createElement('div');
            errorAlert.className = 'alert alert-danger booking-error-alert';
            errorAlert.innerHTML = `
                <i class="fas fa-exclamation-circle me-2"></i>
                <span class="error-message"></span>
            `;
            document.querySelector('#bookingModal .modal-body').prepend(errorAlert);
        }
        
        errorAlert.querySelector('.error-message').textContent = message;
        errorAlert.style.display = 'block';
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            errorAlert.style.display = 'none';
        }, 5000);
    }
    
    resetModal() {
        this.currentStep = 1;
        this.bookingData = {};
        // Don't reset serviceData and providerData here as they are set in openModal
        
        // Reset form - add null checks
        document.querySelectorAll('#bookingModal input, #bookingModal select, #bookingModal textarea').forEach(field => {
            if (field) {
                field.value = '';
                field.classList.remove('is-valid', 'is-invalid');
            }
        });
        
        // Reset checkboxes - add null checks
        document.querySelectorAll('#bookingModal input[type="checkbox"]').forEach(checkbox => {
            if (checkbox) {
                checkbox.checked = false;
            }
        });
        
        // Reset radio buttons to default - add null check
        const payOnServiceRadio = document.getElementById('payOnService');
        if (payOnServiceRadio) {
            payOnServiceRadio.checked = true;
        }
        
        // Remove validation feedback
        document.querySelectorAll('.invalid-feedback').forEach(feedback => {
            if (feedback) {
                feedback.remove();
            }
        });
        
        // Remove error alerts
        const errorAlert = document.querySelector('.booking-error-alert');
        if (errorAlert) {
            errorAlert.remove();
        }
        
        this.updateStepDisplay();
        this.loadUserProfile(); // Reload user profile data
    }
    
    openModal(serviceId, providerId, serviceTitle) {
        // Reset and show modal first
        this.resetModal();
        
        // Store service data after reset
        this.serviceData = {
            id: serviceId,
            provider_id: providerId,
            title: serviceTitle
        };
        
        // Create a simple SVG placeholder as base64 data URI
        const placeholderImage = 'data:image/svg+xml;base64,' + btoa(`
            <svg width="150" height="150" xmlns="http://www.w3.org/2000/svg">
                <rect width="150" height="150" fill="#e0e0e0"/>
                <text x="75" y="80" font-family="Arial, sans-serif" font-size="14" fill="#666" text-anchor="middle">Service</text>
            </svg>
        `);
        
        // Update modal content
        const modalServiceTitle = document.getElementById('modalServiceTitle');
        const modalServiceImage = document.getElementById('modalServiceImage');
        
        if (modalServiceTitle) {
            modalServiceTitle.textContent = serviceTitle;
        }
        
        if (modalServiceImage) {
            // Use the SVG placeholder image
            modalServiceImage.src = placeholderImage;
            modalServiceImage.alt = serviceTitle;
            
            // Add error handling for broken images
            modalServiceImage.onerror = function() {
                this.src = placeholderImage;
            };
        }
        
        const modal = new bootstrap.Modal(document.getElementById('bookingModal'));
        modal.show();
    }
}

// Make BookingModal available globally for manual initialization
window.BookingModal = BookingModal; 