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
        
        // Payment method change
        document.querySelectorAll('input[name="paymentMethod"]').forEach(radio => {
            radio.addEventListener('change', () => this.handlePaymentMethodChange());
        });
        
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
        
        // For testing - add keyboard shortcut to trigger success animation (press Ctrl+Alt+S)
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.altKey && e.key === 's') {
                console.log('Test animation shortcut triggered');
                this.testSuccessAnimation();
                e.preventDefault();
            }
        });
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
    
    async handlePaymentMethodChange() {
        const selectedPayment = document.querySelector('input[name="paymentMethod"]:checked');
        if (selectedPayment && selectedPayment.value === 'wallet') {
            await this.validateWalletPayment();
        }
    }
    
    async validateWalletPayment() {
        try {
            if (!window.WalletSystem) {
                console.warn('Wallet system not loaded');
                return;
            }
            
            const totalAmount = this.bookingData.estimatedPrice || 0;
            const walletCheck = await window.WalletSystem.canPayWithWallet(totalAmount);
            
            const walletOption = document.getElementById('walletPaymentOption');
            const walletRadio = walletOption?.querySelector('input[type="radio"]');
            
            if (!walletCheck.canPay) {
                // Disable wallet option and show reason
                if (walletOption) {
                    walletOption.classList.add('disabled');
                    const desc = walletOption.querySelector('.payment-desc');
                    if (desc) {
                        desc.textContent = walletCheck.reason;
                        desc.style.color = '#dc3545';
                    }
                }
                if (walletRadio) {
                    walletRadio.disabled = true;
                    // Switch to cash payment
                    document.querySelector('input[name="paymentMethod"][value="cash"]').checked = true;
                }
                
                this.showValidationError(walletCheck.reason);
            } else {
                // Enable wallet option
                if (walletOption) {
                    walletOption.classList.remove('disabled');
                    const desc = walletOption.querySelector('.payment-desc');
                    if (desc) {
                        const wallet = walletCheck.wallet;
                        desc.textContent = `Balance: $${wallet.cash_balance.toFixed(2)}`;
                        desc.style.color = '';
                    }
                }
                if (walletRadio) {
                    walletRadio.disabled = false;
                }
            }
        } catch (error) {
            console.error('Error validating wallet payment:', error);
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
        
        // Re-validate wallet payment if wallet is selected
        const selectedPayment = document.querySelector('input[name="paymentMethod"]:checked');
        if (selectedPayment && selectedPayment.value === 'wallet') {
            setTimeout(() => this.validateWalletPayment(), 100);
        }
        
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
        
        const loadingStep = document.getElementById('loading-step');
        loadingStep.style.display = 'block';
        loadingStep.classList.add('fade-in');
        
        // Reset any previous animations
        const spinner = loadingStep.querySelector('.spinner');
        if (spinner) {
            spinner.classList.remove('morphing');
            spinner.classList.add('spin-up');
        }
        
        document.getElementById('nextStepBtn').disabled = true;
        document.getElementById('prevStepBtn').disabled = true;
        
        // Remove animation classes after they complete
        setTimeout(() => {
            loadingStep.classList.remove('fade-in');
            if (spinner) spinner.classList.remove('spin-up');
        }, 500);
    }
    
    hideLoading() {
        document.getElementById('loading-step').style.display = 'none';
        document.getElementById(`step-${this.currentStep}`).style.display = 'block';
        
        document.getElementById('nextStepBtn').disabled = false;
        document.getElementById('prevStepBtn').disabled = false;
    }
    
    showSuccess(bookingData) {
        console.log('showSuccess called');
        
        // Generate a booking reference
        const reference = `UH${Date.now().toString().slice(-6)}${Math.random().toString(36).substr(2, 2).toUpperCase()}`;
        
        // First animate the loading spinner to success transition
        this.animateLoadingToSuccess().then(() => {
            console.log('animateLoadingToSuccess completed');
            
            // Set booking reference
            document.getElementById('bookingReference').textContent = reference;
            
            // Update navigation
            document.getElementById('nextStepBtn').style.display = 'none';
            document.getElementById('prevStepBtn').style.display = 'none';
            
            // Setup success step interactions
            this.setupSuccessStepInteractions(bookingData, reference);
            
            // Send confirmation (if possible)
            this.sendConfirmation(bookingData, reference);
            
            // Trigger celebration animations with a slight delay to ensure DOM is ready
            setTimeout(() => {
                this.triggerCelebrationEffects();
            }, 100);
        }).catch(error => {
            console.error('Error in animation transition:', error);
            
            // Fallback to direct display without animation
            document.querySelectorAll('.booking-step').forEach(step => {
                step.style.display = 'none';
            });
            
            const successStep = document.getElementById('success-step');
            successStep.style.display = 'block';
            
            const successContainer = successStep.querySelector('.success-container');
            if (successContainer) {
                successContainer.style.display = 'block';
            }
            
            document.getElementById('bookingReference').textContent = reference;
            document.getElementById('nextStepBtn').style.display = 'none';
            document.getElementById('prevStepBtn').style.display = 'none';
            
            this.setupSuccessStepInteractions(bookingData, reference);
            this.sendConfirmation(bookingData, reference);
            this.triggerCelebrationEffects();
        });
    }
    
    animateLoadingToSuccess() {
        return new Promise((resolve) => {
            const loadingStep = document.getElementById('loading-step');
            const successStep = document.getElementById('success-step');
            
            // Make sure loading step is visible
            document.querySelectorAll('.booking-step').forEach(step => {
                step.style.display = 'none';
            });
            loadingStep.style.display = 'block';
            
            // Create the morphing animation
            const spinner = loadingStep.querySelector('.spinner');
            if (spinner) {
                spinner.classList.add('morphing');
            }
            
            // After a delay, transition to success step with animation
            setTimeout(() => {
                loadingStep.style.display = 'none';
                successStep.style.display = 'block';
                
                // Make sure success container is visible
                const successContainer = successStep.querySelector('.success-container');
                if (successContainer) {
                    successContainer.style.display = 'block';
                }
                
                successStep.classList.add('animate-in');
                
                // Log visibility state for debugging
                console.log('Success step display:', successStep.style.display);
                console.log('Success container display:', successContainer ? successContainer.style.display : 'not found');
                
                // Remove animation classes after completion
                setTimeout(() => {
                    if (spinner) spinner.classList.remove('morphing');
                    successStep.classList.remove('animate-in');
                    resolve();
                }, 800);
            }, 1000);
        });
    }
    
    setupSuccessStepInteractions(bookingData, reference) {
        // Copy reference functionality
        const copyBtn = document.getElementById('copyReferenceBtn');
        if (copyBtn) {
            copyBtn.addEventListener('click', () => {
                this.copyToClipboard(reference, copyBtn);
            });
        }
        
        // View booking details
        const viewBookingBtn = document.getElementById('viewBookingBtn');
        if (viewBookingBtn) {
            viewBookingBtn.addEventListener('click', () => {
                // Redirect to consumer profile or booking details page
                if (window.location.pathname.includes('service-category') || 
                    window.location.pathname.includes('service-details')) {
                    window.location.href = '/consumer-profile.html#bookings';
                } else {
                    this.showBookingDetails(bookingData);
                }
            });
        }
        
        // Close modal and return to services
        const closeModalBtn = document.getElementById('closeModalBtn');
        if (closeModalBtn) {
            closeModalBtn.addEventListener('click', () => {
                // Close modal with animation
                const modal = bootstrap.Modal.getInstance(document.getElementById('bookingModal'));
                if (modal) {
                    modal.hide();
                }
            });
        }
    }
    
    copyToClipboard(text, button) {
        // Use modern clipboard API if available
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(text).then(() => {
                this.showCopySuccess(button);
            }).catch(() => {
                this.fallbackCopyToClipboard(text, button);
            });
        } else {
            this.fallbackCopyToClipboard(text, button);
        }
    }
    
    fallbackCopyToClipboard(text, button) {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
            document.execCommand('copy');
            this.showCopySuccess(button);
        } catch (err) {
            console.error('Failed to copy text: ', err);
            this.showCopyError(button);
        } finally {
            document.body.removeChild(textArea);
        }
    }
    
    showCopySuccess(button) {
        const originalHTML = button.innerHTML;
        const originalClass = button.className;
        
        // Update button state
        button.innerHTML = '<i class="fas fa-check"></i> Copied!';
        button.classList.add('copied');
        button.disabled = true;
        
        // Create floating success indicator
        this.createFloatingIndicator(button, 'success');
        
        // Restore button after delay
        setTimeout(() => {
            button.innerHTML = originalHTML;
            button.className = originalClass;
            button.disabled = false;
        }, 2000);
    }
    
    createFloatingIndicator(element, type = 'success') {
        // Create the floating indicator element
        const indicator = document.createElement('div');
        indicator.className = `floating-indicator ${type}`;
        
        // Set content based on type
        if (type === 'success') {
            indicator.innerHTML = '<i class="fas fa-check-circle"></i> Copied to clipboard!';
        } else if (type === 'error') {
            indicator.innerHTML = '<i class="fas fa-exclamation-circle"></i> Failed to copy';
        }
        
        // Position above the element
        const rect = element.getBoundingClientRect();
        indicator.style.left = `${rect.left + rect.width / 2}px`;
        indicator.style.top = `${rect.top - 10}px`;
        
        // Add to document
        document.body.appendChild(indicator);
        
        // Animate and remove
        setTimeout(() => {
            indicator.classList.add('animate');
            
            // Remove from DOM after animation completes
            setTimeout(() => {
                if (indicator.parentNode) {
                    indicator.parentNode.removeChild(indicator);
                }
            }, 2000);
        }, 10);
    }
    
    showCopyError(button) {
        const originalHTML = button.innerHTML;
        
        // Update button state
        button.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Copy Failed';
        button.style.background = '#dc3545';
        button.style.borderColor = '#dc3545';
        button.style.color = 'white';
        
        // Create floating error indicator
        this.createFloatingIndicator(button, 'error');
        
        // Restore button after delay
        setTimeout(() => {
            button.innerHTML = originalHTML;
            button.style.background = '';
            button.style.borderColor = '';
            button.style.color = '';
        }, 2000);
    }
    
    triggerCelebrationEffects() {
        // Get service category for themed celebration (if available)
        let serviceCategory = 'default';
        if (this.serviceData && this.serviceData.category) {
            serviceCategory = this.serviceData.category;
        }
        
        // Ensure checkmark animations are visible
        const checkmarkElements = document.querySelectorAll('.checkmark-stem, .checkmark-kick, .checkmark-background');
        checkmarkElements.forEach(el => {
            if (el) {
                // Force animation restart by removing and adding animation class
                const animationName = el.className.includes('stem') ? 'stemGrow' : 
                                     el.className.includes('kick') ? 'kickGrow' : 'circleGrow';
                el.style.animation = 'none';
                setTimeout(() => {
                    el.style.animation = `${animationName} 0.6s ease-out forwards`;
                }, 10);
            }
        });
        
        // Add subtle celebration particle effect with theme
        this.createCelebrationParticles(serviceCategory);
        
        // Play success sound if available
        this.playSuccessSound();
        
        // Add success ripple effect
        this.createSuccessRipple();
        
        // Log animation state for debugging
        console.log('Celebration effects triggered');
        const checkmark = document.querySelector('.checkmark-circle');
        if (checkmark) {
            console.log('Checkmark element:', checkmark);
            console.log('Checkmark computed style:', window.getComputedStyle(checkmark));
        }
    }
    
    createSuccessRipple() {
        const successCircle = document.querySelector('.checkmark-circle');
        if (successCircle) {
            const ripple = document.createElement('div');
            ripple.className = 'success-ripple';
            
            // Position ripple centered on the checkmark circle
            const rect = successCircle.getBoundingClientRect();
            ripple.style.width = `${rect.width * 3}px`;
            ripple.style.height = `${rect.height * 3}px`;
            ripple.style.left = '50%';
            ripple.style.top = '50%';
            
            // Add to DOM
            const container = document.querySelector('.checkmark-container');
            if (container) {
                container.appendChild(ripple);
                
                // Remove after animation completes
                setTimeout(() => {
                    if (ripple.parentNode) {
                        ripple.parentNode.removeChild(ripple);
                    }
                }, 2000);
            }
        }
    }
    
    createCelebrationParticles(theme = 'default') {
        // Define theme-based colors and particle count
        let colors = ['#24B47E', '#1e9c6d', '#4BDB97', '#28a745']; // Default green theme
        let particleCount = 50;
        let particleShapes = ['circle'];
        
        // Theme-specific settings
        switch (theme.toLowerCase()) {
            case 'cleaning':
                colors = ['#4ECDC4', '#1A535C', '#4BB5C1', '#7BE0AD'];
                particleShapes = ['circle', 'bubble'];
                break;
            case 'repair':
            case 'plumbing':
                colors = ['#3498DB', '#2980B9', '#5DADE2', '#85C1E9'];
                particleShapes = ['circle', 'square'];
                break;
            case 'electrical':
                colors = ['#F1C40F', '#F39C12', '#F7DC6F', '#F9E79F'];
                particleShapes = ['circle', 'spark'];
                break;
            case 'education':
                colors = ['#9B59B6', '#8E44AD', '#C39BD3', '#D7BDE2'];
                particleShapes = ['circle', 'star'];
                break;
            case 'health':
                colors = ['#E74C3C', '#C0392B', '#F1948A', '#FADBD8'];
                particleShapes = ['circle', 'heart'];
                break;
            default:
                // Use default green theme
                break;
        }
        
        // Create particles with delay
        for (let i = 0; i < particleCount; i++) {
            setTimeout(() => {
                const color = colors[Math.floor(Math.random() * colors.length)];
                const shape = particleShapes[Math.floor(Math.random() * particleShapes.length)];
                this.createParticle(color, shape);
            }, i * 20);
        }
    }
    
    createParticle(color, shape = 'circle') {
        const particle = document.createElement('div');
        
        // Base styles for all particles
        let styles = `
            position: fixed;
            pointer-events: none;
            z-index: 9999;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            animation: particleFloat 3s ease-out forwards;
        `;
        
        // Shape-specific styles
        switch (shape) {
            case 'square':
                styles += `
                    width: 8px;
                    height: 8px;
                    background: ${color};
                    transform: translate(-50%, -50%) rotate(45deg);
                `;
                break;
            case 'star':
                styles += `
                    width: 0;
                    height: 0;
                    border-left: 5px solid transparent;
                    border-right: 5px solid transparent;
                    border-bottom: 10px solid ${color};
                    transform: translate(-50%, -50%) rotate(${Math.random() * 360}deg);
                `;
                break;
            case 'bubble':
                styles += `
                    width: 10px;
                    height: 10px;
                    background: transparent;
                    border: 2px solid ${color};
                    border-radius: 50%;
                    opacity: 0.7;
                `;
                break;
            case 'spark':
                styles += `
                    width: 3px;
                    height: 12px;
                    background: ${color};
                    transform: translate(-50%, -50%) rotate(${Math.random() * 360}deg);
                    box-shadow: 0 0 5px 1px ${color};
                `;
                break;
            case 'heart':
                styles += `
                    width: 10px;
                    height: 10px;
                    background: ${color};
                    transform: translate(-50%, -50%) rotate(45deg);
                    position: relative;
                `;
                // Create heart shape with pseudo-elements
                const before = document.createElement('div');
                const after = document.createElement('div');
                before.style.cssText = `
                    position: absolute;
                    width: 10px;
                    height: 10px;
                    background: ${color};
                    border-radius: 50%;
                    left: -50%;
                    top: 0;
                `;
                after.style.cssText = `
                    position: absolute;
                    width: 10px;
                    height: 10px;
                    background: ${color};
                    border-radius: 50%;
                    left: 0;
                    top: -50%;
                `;
                particle.appendChild(before);
                particle.appendChild(after);
                break;
            case 'circle':
            default:
                styles += `
                    width: 6px;
                    height: 6px;
                    background: ${color};
                    border-radius: 50%;
                `;
                break;
        }
        
        particle.style.cssText = styles;
        
        // Add random direction and speed
        const angle = Math.random() * 2 * Math.PI;
        const speed = Math.random() * 200 + 100;
        const xMove = Math.cos(angle) * speed;
        const yMove = Math.sin(angle) * speed;
        
        particle.style.setProperty('--x-move', `${xMove}px`);
        particle.style.setProperty('--y-move', `${yMove}px`);
        
        document.body.appendChild(particle);
        
        // Remove particle after animation
        setTimeout(() => {
            if (particle.parentNode) {
                particle.parentNode.removeChild(particle);
            }
        }, 3000);
    }
    
    playSuccessSound() {
        try {
            // Create a subtle success sound using Web Audio API
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
            oscillator.frequency.setValueAtTime(1000, audioContext.currentTime + 0.1);
            
            gainNode.gain.setValueAtTime(0, audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.3);
        } catch (error) {
            // Silently fail if audio is not supported
            console.log('Audio feedback not available');
        }
    }
    
    showBookingDetails(bookingData) {
        // Create a detailed booking summary modal or redirect
        const detailsHTML = `
            <div class="booking-details-summary">
                <h6>Booking Details</h6>
                <div class="detail-item">
                    <strong>Service:</strong> ${this.serviceData.title}
                </div>
                <div class="detail-item">
                    <strong>Provider:</strong> ${this.providerData.name}
                </div>
                <div class="detail-item">
                    <strong>Date:</strong> ${document.getElementById('serviceDate').value}
                </div>
                <div class="detail-item">
                    <strong>Time:</strong> ${document.getElementById('selectedTime').value}
                </div>
                <div class="detail-item">
                    <strong>Duration:</strong> ${document.getElementById('serviceDuration').selectedOptions[0]?.text}
                </div>
                <div class="detail-item">
                    <strong>Location:</strong> ${document.getElementById('serviceAddress').value}
                </div>
                <div class="detail-item">
                    <strong>Total Price:</strong> $${this.bookingData.estimatedPrice || 'Contact for quote'}
                </div>
            </div>
        `;
        
        // You could show this in a new modal or redirect to a details page
        console.log('Booking details:', detailsHTML);
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

    // For testing purposes only - trigger success animation directly
    testSuccessAnimation() {
        const mockBookingData = {
            service_id: 1,
            provider_id: 1,
            customer_name: 'Test User',
            customer_phone: '+1234567890',
            customer_email: 'test@example.com',
            booking_date: '2025-06-19',
            booking_time: '10:00',
            duration: 60,
            location: 'Test Location',
            notes: 'Test booking',
            payment_method: 'cash',
            estimatedPrice: 100
        };
        
        this.showSuccess(mockBookingData);
    }
}

// Global instance and helper functions
window.BookingModal = BookingModal; 