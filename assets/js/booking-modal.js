// Modern Booking Modal JavaScript
// Enhanced multi-step booking process with improved UX

class BookingModal {
    constructor() {
        this.currentStep = 1;
        this.maxSteps = 4;
        this.bookingData = {
            estimatedPrice: 0,
            basePrice: 0,
            addonsPrice: 0
        };
        this.serviceData = {};
        this.providerData = {};
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.setupDateRestrictions();
        this.loadUserProfile();
        this.initializeTimeSlots();
        this.setupLocationFeatures();
    }
    
    setupEventListeners() {
        // Step navigation
        document.getElementById('nextStepBtn').addEventListener('click', () => this.nextStep());
        document.getElementById('prevStepBtn').addEventListener('click', () => this.prevStep());
        
        // Price calculation triggers
        document.getElementById('serviceDuration').addEventListener('change', () => this.calculatePrice());
        document.getElementById('urgentService').addEventListener('change', () => this.calculatePrice());
        document.getElementById('weekendService').addEventListener('change', () => this.calculatePrice());
        document.getElementById('materialIncluded')?.addEventListener('change', () => this.calculatePrice());
        
        // Form validation triggers
        this.setupFormValidation();
        
        // Time slot selection
        this.setupTimeSlotSelection();
        
        // Location features
        this.setupLocationFeatures();
        
        // Edit booking functionality
        document.getElementById('editBooking')?.addEventListener('click', () => this.editBooking());
        
        // Modal events
        const modal = document.getElementById('bookingModal');
        modal.addEventListener('hidden.bs.modal', () => this.resetModal());
        modal.addEventListener('shown.bs.modal', () => this.focusFirstField());
    }
    
    setupTimeSlotSelection() {
        const timeSlots = document.querySelectorAll('.time-slot');
        const selectedTimeInput = document.getElementById('selectedTime');
        
        timeSlots.forEach(slot => {
            slot.addEventListener('click', () => {
                if (slot.classList.contains('unavailable')) return;
                
                // Remove previous selection
                timeSlots.forEach(s => s.classList.remove('selected'));
                
                // Add selection to clicked slot
                slot.classList.add('selected');
                selectedTimeInput.value = slot.dataset.time;
                
                // Add smooth animation
                slot.style.transform = 'scale(0.95)';
                setTimeout(() => {
                    slot.style.transform = 'scale(1)';
                }, 150);
            });
        });
    }
    
    setupLocationFeatures() {
        const locationBtn = document.getElementById('useCurrentLocation');
        const addressTextarea = document.getElementById('serviceAddress');
        
        locationBtn?.addEventListener('click', () => {
            if (navigator.geolocation) {
                locationBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Getting location...';
                locationBtn.disabled = true;
                
                navigator.geolocation.getCurrentPosition(
                    async (position) => {
                        try {
                            // Use a simple reverse geocoding approach
                            const lat = position.coords.latitude;
                            const lng = position.coords.longitude;
                            
                            // For now, just show coordinates - in production you'd use a geocoding service
                            addressTextarea.value = `Latitude: ${lat.toFixed(6)}, Longitude: ${lng.toFixed(6)}\n\nPlease edit this to include your complete address with building number, street name, area, and city.`;
                            
                            locationBtn.innerHTML = '<i class="fas fa-check"></i> Location added';
                            locationBtn.style.background = '#28a745';
                            
                            setTimeout(() => {
                                locationBtn.innerHTML = '<i class="fas fa-location-arrow"></i> Use Current Location';
                                locationBtn.style.background = '#e00707';
                                locationBtn.disabled = false;
                            }, 3000);
                        } catch (error) {
                            console.error('Error getting address:', error);
                            this.showLocationError();
                        }
                    },
                    () => {
                        this.showLocationError();
                    }
                );
            } else {
                alert('Geolocation is not supported by this browser.');
            }
        });
    }
    
    showLocationError() {
        const locationBtn = document.getElementById('useCurrentLocation');
        locationBtn.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Location unavailable';
        locationBtn.style.background = '#dc3545';
        locationBtn.disabled = false;
        
        setTimeout(() => {
            locationBtn.innerHTML = '<i class="fas fa-location-arrow"></i> Use Current Location';
            locationBtn.style.background = '#e00707';
        }, 3000);
    }
    
    initializeTimeSlots() {
        // Mark some time slots as unavailable (example logic)
        const timeSlots = document.querySelectorAll('.time-slot');
        const unavailableTimes = ['12:00', '13:00']; // Lunch break example
        
        timeSlots.forEach(slot => {
            if (unavailableTimes.includes(slot.dataset.time)) {
                slot.classList.add('unavailable');
                slot.innerHTML += ' <small>(Unavailable)</small>';
            }
        });
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
        
        // Update weekend pricing when date changes
        dateInput.addEventListener('change', () => {
            this.updateWeekendPricing();
            this.calculatePrice();
        });
    }
    
    updateWeekendPricing() {
        const dateInput = document.getElementById('serviceDate');
        const weekendCheckbox = document.getElementById('weekendService');
        
        if (dateInput.value) {
            const selectedDate = new Date(dateInput.value);
            const dayOfWeek = selectedDate.getDay();
            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // Sunday or Saturday
            
            weekendCheckbox.checked = isWeekend;
            weekendCheckbox.disabled = isWeekend;
            
            if (isWeekend) {
                weekendCheckbox.parentElement.style.opacity = '0.7';
            } else {
                weekendCheckbox.parentElement.style.opacity = '1';
            }
        }
    }
    
    async loadUserProfile() {
        try {
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
                    document.getElementById('customerName').value = `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
                    document.getElementById('customerPhone').value = profile.phone || '';
                    document.getElementById('customerEmail').value = user.email || '';
                }
            }
        } catch (error) {
            console.log('No user logged in or error loading profile:', error);
        }
    }
    
    setupFormValidation() {
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
                this.animateStepTransition('next');
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
            this.animateStepTransition('prev');
            this.currentStep--;
            this.updateStepDisplay();
        }
    }
    
    animateStepTransition(direction) {
        const currentStepElement = document.getElementById(`step-${this.currentStep}`);
        
        if (direction === 'next') {
            currentStepElement.classList.add('next');
        } else {
            currentStepElement.classList.add('prev');
        }
        
        setTimeout(() => {
            currentStepElement.classList.remove('next', 'prev');
        }, 300);
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
                return true;
            default:
                return true;
        }
    }
    
    validateStep1() {
        const duration = document.getElementById('serviceDuration').value;
        if (!duration) {
            this.showValidationError('Please select a service duration');
            return false;
        }
        return true;
    }
    
    validateStep2() {
        const date = document.getElementById('serviceDate').value;
        const selectedTime = document.getElementById('selectedTime').value;
        const address = document.getElementById('serviceAddress').value.trim();
        
        if (!date) {
            this.showValidationError('Please select a service date');
            return false;
        }
        
        if (!selectedTime) {
            this.showValidationError('Please select a service time');
            return false;
        }
        
        if (!address) {
            this.showValidationError('Please enter the service address');
            return false;
        }
        
        const selectedDate = new Date(date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (selectedDate < today) {
            this.showValidationError('Please select a future date');
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
        
        if (!allValid) {
            this.showValidationError('Please fill in all required fields correctly');
        }
        
        return allValid;
    }
    
    updateStepDisplay() {
        // Update step indicators
        document.querySelectorAll('.step-indicator').forEach(step => {
            const stepNum = parseInt(step.getAttribute('data-step'));
            step.classList.remove('active', 'completed');
            
            if (stepNum === this.currentStep) {
                step.classList.add('active');
            } else if (stepNum < this.currentStep) {
                step.classList.add('completed');
            }
        });
        
        // Update progress bar
        const progressBar = document.getElementById('progressBar');
        progressBar.setAttribute('data-step', this.currentStep);
        
        // Update step content
        document.querySelectorAll('.booking-step').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`step-${this.currentStep}`).classList.add('active');
        
        // Update buttons
        this.updateNavigationButtons();
        
        // Focus management
        this.focusFirstField();
    }
    
    updateNavigationButtons() {
        const prevBtn = document.getElementById('prevStepBtn');
        const nextBtn = document.getElementById('nextStepBtn');
        const nextBtnText = document.getElementById('nextBtnText');
        
        prevBtn.style.display = this.currentStep > 1 ? 'flex' : 'none';
        
        if (this.currentStep === this.maxSteps) {
            nextBtnText.textContent = 'Confirm Booking';
            nextBtn.classList.remove('btn-primary');
            nextBtn.classList.add('btn-success');
        } else {
            nextBtnText.textContent = 'Continue';
            nextBtn.classList.remove('btn-success');
            nextBtn.classList.add('btn-primary');
        }
    }
    
    focusFirstField() {
        setTimeout(() => {
            const currentStep = document.getElementById(`step-${this.currentStep}`);
            const firstInput = currentStep.querySelector('input, select, textarea');
            if (firstInput && !firstInput.hasAttribute('readonly')) {
                firstInput.focus();
            }
        }, 100);
    }
    
    calculatePrice() {
        const durationSelect = document.getElementById('serviceDuration');
        const selectedOption = durationSelect.options[durationSelect.selectedIndex];
        const basePrice = selectedOption ? parseInt(selectedOption.dataset.price) || 0 : 0;
        
        let totalPrice = basePrice;
        let addonsPrice = 0;
        
        // Add-ons
        if (document.getElementById('urgentService').checked) {
            addonsPrice += 20;
        }
        if (document.getElementById('weekendService').checked) {
            addonsPrice += 15;
        }
        if (document.getElementById('materialIncluded')?.checked) {
            addonsPrice += 25;
        }
        
        totalPrice += addonsPrice;
        
        // Update price displays
        document.getElementById('basePriceDisplay').textContent = basePrice > 0 ? `$${basePrice}` : 'Custom quote';
        
        const addonsDisplay = document.getElementById('addonsPrice');
        if (addonsPrice > 0) {
            addonsDisplay.style.display = 'flex';
            document.getElementById('addonsPriceDisplay').textContent = `$${addonsPrice}`;
        } else {
            addonsDisplay.style.display = 'none';
        }
        
        document.getElementById('totalPrice').textContent = basePrice > 0 ? `$${totalPrice}` : 'Contact for quote';
        
        this.bookingData.estimatedPrice = totalPrice;
        this.bookingData.basePrice = basePrice;
        this.bookingData.addonsPrice = addonsPrice;
        
        return totalPrice;
    }
    
    updateSummary() {
        const serviceTitle = this.serviceData.title || 'Service';
        const providerName = this.providerData.name || 'Provider';
        const date = document.getElementById('serviceDate').value;
        const selectedTime = document.getElementById('selectedTime').value;
        const duration = document.getElementById('serviceDuration').selectedOptions[0]?.text || '';
        const address = document.getElementById('serviceAddress').value;
        const customerName = document.getElementById('customerName').value;
        const customerPhone = document.getElementById('customerPhone').value;
        
        // Format date and time nicely
        const formattedDate = new Date(date).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        const formattedTime = new Date(`2000-01-01T${selectedTime}`).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
        
        document.getElementById('summaryService').textContent = serviceTitle;
        document.getElementById('summaryProvider').textContent = providerName;
        document.getElementById('summaryDateTime').textContent = `${formattedDate} at ${formattedTime}`;
        document.getElementById('summaryDuration').textContent = duration;
        document.getElementById('summaryAddress').textContent = address;
        document.getElementById('summaryCustomer').textContent = `${customerName} (${customerPhone})`;
        
        // Update pricing in summary
        document.getElementById('finalBasePrice').textContent = this.bookingData.basePrice > 0 ? `$${this.bookingData.basePrice}` : 'Custom quote';
        
        const finalAddonsRow = document.getElementById('finalAddonsRow');
        if (this.bookingData.addonsPrice > 0) {
            finalAddonsRow.style.display = 'flex';
            document.getElementById('finalAddonsPrice').textContent = `$${this.bookingData.addonsPrice}`;
        } else {
            finalAddonsRow.style.display = 'none';
        }
        
        document.getElementById('finalTotalPrice').textContent = this.bookingData.basePrice > 0 ? `$${this.bookingData.estimatedPrice}` : 'Contact for quote';
    }
    
    editBooking() {
        this.currentStep = 1;
        this.updateStepDisplay();
    }
    
    showValidationError(message) {
        // Create a temporary toast notification
        const toast = document.createElement('div');
        toast.className = 'alert alert-danger';
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 9999;
            max-width: 300px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            animation: slideInRight 0.3s ease;
        `;
        toast.innerHTML = `
            <i class="fas fa-exclamation-triangle me-2"></i>
            ${message}
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        }, 3000);
    }
    
    async submitBooking() {
        try {
            if (!window.supabase) {
                this.showError('System not ready. Please refresh the page and try again.');
                return;
            }
            
            this.showLoading();
            
            // Get current user
            const { data: { user } } = await window.supabase.auth.getUser();
            if (!user) {
                this.showError('You must be logged in to make a booking.');
                return;
            }

            // Validate required fields
            const serviceDate = document.getElementById('serviceDate').value;
            const selectedTime = document.getElementById('selectedTime').value;
            const serviceDuration = document.getElementById('serviceDuration').value;
            const serviceAddress = document.getElementById('serviceAddress').value;
            const customerName = document.getElementById('customerName').value;
            const customerPhone = document.getElementById('customerPhone').value;
            const customerEmail = document.getElementById('customerEmail').value;

            if (!serviceDate || !selectedTime || !serviceDuration || !serviceAddress || !customerName || !customerPhone || !customerEmail) {
                this.showError('Please fill in all required fields before submitting.');
                return;
            }

            // Format data according to the actual database schema
            const bookingData = {
                service_id: this.serviceData.id,
                provider_id: this.serviceData.provider_id,
                consumer_id: user.id,
                status: 'pending',
                booking_date: new Date().toISOString(),
                scheduled_date: serviceDate,
                scheduled_time: selectedTime,
                duration_hours: parseFloat(serviceDuration) || 1,
                location_address: serviceAddress,
                customer_phone: customerPhone,
                customer_email: customerEmail,
                special_instructions: document.getElementById('specialInstructions').value || null,
                estimated_price: this.bookingData.estimatedPrice || 0,
                payment_status: 'pending',
                payment_method: document.querySelector('input[name="paymentMethod"]:checked')?.value || 'cash',
                created_by_consumer: true
                // booking_reference will be auto-generated by the database trigger
            };
            
            const { data, error } = await window.supabase
                .from('bookings')
                .insert([bookingData])
                .select()
                .single();
            
            if (error) {
                throw error;
            }
            
            this.showSuccess(data);
            
        } catch (error) {
            console.error('Booking submission error:', error);
            
            // Show more specific error messages
            let errorMessage = 'Failed to submit booking. Please try again.';
            
            if (error.message) {
                if (error.message.includes('duplicate') || error.message.includes('unique')) {
                    errorMessage = 'A booking already exists for this time slot. Please choose a different time.';
                } else if (error.message.includes('foreign key') || error.message.includes('not found')) {
                    errorMessage = 'Service or provider not found. Please refresh the page and try again.';
                } else if (error.message.includes('required') || error.message.includes('null')) {
                    errorMessage = 'Some required information is missing. Please check all fields.';
                } else {
                    errorMessage = `Booking failed: ${error.message}`;
                }
            }
            
            this.showError(errorMessage);
        }
    }
    
    showLoading() {
        document.querySelectorAll('.booking-step').forEach(step => {
            step.style.display = 'none';
        });
        document.getElementById('loading-step').style.display = 'block';
        
        document.getElementById('nextStepBtn').disabled = true;
        document.getElementById('prevStepBtn').disabled = true;
    }
    
    hideLoading() {
        document.getElementById('loading-step').style.display = 'none';
        document.getElementById(`step-${this.currentStep}`).style.display = 'block';
        
        document.getElementById('nextStepBtn').disabled = false;
        document.getElementById('prevStepBtn').disabled = false;
    }
    
    showSuccess(bookingData) {
        document.querySelectorAll('.booking-step').forEach(step => {
            step.style.display = 'none';
        });
        document.getElementById('success-step').style.display = 'block';
        
        // Generate a booking reference
        const reference = `UH${Date.now().toString().slice(-6)}${Math.random().toString(36).substr(2, 2).toUpperCase()}`;
        document.getElementById('bookingReference').textContent = reference;
        
        // Update navigation
        document.getElementById('nextStepBtn').style.display = 'none';
        document.getElementById('prevStepBtn').style.display = 'none';
        
        // Send confirmation (if possible)
        this.sendConfirmation(bookingData, reference);
    }
    
    async sendConfirmation(bookingData, reference) {
        try {
            // This would integrate with your notification system
            console.log('Booking confirmed:', { ...bookingData, reference });
            
            // You could integrate with email/SMS services here
            
        } catch (error) {
            console.error('Error sending confirmation:', error);
        }
    }
    
    showError(message) {
        this.hideLoading();
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'alert alert-danger';
        errorDiv.innerHTML = `
            <i class="fas fa-exclamation-triangle me-2"></i>
            ${message}
        `;
        
        const modalBody = document.querySelector('#bookingModal .modal-body');
        modalBody.insertBefore(errorDiv, modalBody.firstChild);
        
        setTimeout(() => {
            errorDiv.remove();
        }, 5000);
    }
    
    resetModal() {
        this.currentStep = 1;
        this.bookingData = {};
        
        // Reset form
        document.getElementById('bookingModal').querySelectorAll('input, select, textarea').forEach(field => {
            if (field.type === 'checkbox' || field.type === 'radio') {
                field.checked = field.defaultChecked;
            } else {
                field.value = field.defaultValue || '';
            }
            field.classList.remove('is-valid', 'is-invalid');
        });
        
        // Reset validation feedback
        document.querySelectorAll('.invalid-feedback').forEach(feedback => {
            feedback.remove();
        });
        
        // Reset time slots
        document.querySelectorAll('.time-slot').forEach(slot => {
            slot.classList.remove('selected');
        });
        
        // Reset steps
        document.querySelectorAll('.booking-step').forEach(step => {
            step.classList.remove('active');
            step.style.display = 'none';
        });
        document.getElementById('step-1').classList.add('active');
        document.getElementById('step-1').style.display = 'block';
        
        // Reset navigation
        document.getElementById('nextStepBtn').style.display = 'flex';
        document.getElementById('prevStepBtn').style.display = 'none';
        document.getElementById('nextStepBtn').disabled = false;
        document.getElementById('prevStepBtn').disabled = false;
        
        this.updateStepDisplay();
        this.calculatePrice();
    }
    
    openModal(serviceId, providerId, serviceTitle, serviceImage = '', providerName = '') {
        this.serviceData = {
            id: serviceId,
            provider_id: providerId,
            title: serviceTitle,
            image: serviceImage
        };
        
        this.providerData = {
            name: providerName
        };
        
        // Update modal content
        document.getElementById('modalServiceTitle').textContent = serviceTitle;
        document.getElementById('modalProviderName').textContent = providerName;
        
        if (serviceImage) {
            document.getElementById('modalServiceImage').src = serviceImage;
        }
        
        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('bookingModal'));
        modal.show();
        
        // Initialize price calculation
        this.calculatePrice();
    }
}

// Global instance and helper functions
window.BookingModal = BookingModal; 