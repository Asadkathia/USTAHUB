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
            this.showLoading();
            
            // Prepare booking data
            const bookingData = {
                service_id: this.serviceData.id,
                provider_id: this.serviceData.provider_id,
                scheduled_date: document.getElementById('serviceDate').value,
                scheduled_time: document.getElementById('serviceTime').value,
                duration_hours: parseFloat(document.getElementById('serviceDuration').value),
                location_address: document.getElementById('serviceAddress').value,
                customer_phone: document.getElementById('customerPhone').value,
                customer_email: document.getElementById('customerEmail').value,
                special_instructions: document.getElementById('specialInstructions').value,
                estimated_price: this.calculatePrice(),
                payment_method: document.querySelector('input[name="paymentMethod"]:checked').value,
                status: 'pending'
            };
            
            // Get current user
            const { data: { user } } = await window.supabase.auth.getUser();
            if (user) {
                bookingData.consumer_id = user.id;
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
            <div class="booking-success text-center py-4">
                <div class="success-icon">
                    <i class="fas fa-check-circle"></i>
                </div>
                <h4>Booking Confirmed!</h4>
                <p class="text-muted">Your booking request has been submitted successfully.</p>
                <div class="booking-reference mt-3 p-3 bg-light rounded">
                    <strong>Booking Reference: #${bookingData.id.substring(0, 8).toUpperCase()}</strong>
                </div>
                <p class="mt-3">The service provider will contact you shortly to confirm the details.</p>
            </div>
        `;
        
        // Update footer
        const modalFooter = document.querySelector('#bookingModal .modal-footer');
        modalFooter.innerHTML = `
            <button type="button" class="btn btn-primary" data-bs-dismiss="modal">Close</button>
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
        this.serviceData = {};
        this.providerData = {};
        
        // Reset form
        document.querySelectorAll('#bookingModal input, #bookingModal select, #bookingModal textarea').forEach(field => {
            field.value = '';
            field.classList.remove('is-valid', 'is-invalid');
        });
        
        // Reset checkboxes
        document.querySelectorAll('#bookingModal input[type="checkbox"]').forEach(checkbox => {
            checkbox.checked = false;
        });
        
        // Reset radio buttons to default
        document.getElementById('payOnService').checked = true;
        
        // Remove validation feedback
        document.querySelectorAll('.invalid-feedback').forEach(feedback => {
            feedback.remove();
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
        // Store service data
        this.serviceData = {
            id: serviceId,
            provider_id: providerId,
            title: serviceTitle
        };
        
        // Update modal content
        document.getElementById('modalServiceTitle').textContent = serviceTitle;
        document.getElementById('modalServiceImage').src = 'assets/img/icons/default-service.png';
        
        // Reset and show modal
        this.resetModal();
        const modal = new bootstrap.Modal(document.getElementById('bookingModal'));
        modal.show();
    }
}

// Make BookingModal available globally for manual initialization
window.BookingModal = BookingModal; 