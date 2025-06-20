// Service Completion Manager - Enhanced with comprehensive fixes
class ServiceCompletionManager {
    constructor() {
        this.currentUser = null;
        this.isCheckingConfirmations = false;
        this.modalShown = false;
        this.recentlyCompletedBookings = new Set(); // Track recently completed bookings
        this.lastCheckTime = 0; // Throttle confirmations checking
        this.completionCooldown = 5000; // 5 second cooldown between checks
        
        // Initialize completed bookings from localStorage
        this.initCompletedBookingsFromStorage();
        
        this.handleProviderCompletion = this.handleProviderCompletion.bind(this);
        this.handleConsumerConfirmation = this.handleConsumerConfirmation.bind(this);
        
        setTimeout(() => {
            this.initializeUser();
            this.initializeEventListeners();
        }, 100);
    }

    async initializeUser() {
        try {
            const { data: { user }, error } = await window.supabase.auth.getUser();
            if (error) throw error;
            this.currentUser = user;
            
            // Run cleanup once on initialization
            if (user) {
                console.log('🧹 Running initial cleanup for user:', user.id.substring(0, 8));
                setTimeout(() => {
                    this.cleanupInconsistentBookingStatuses();
                }, 2000); // Delay cleanup to allow other initialization to complete
            }
        } catch (error) {
            console.error('Error initializing user:', error);
        }
    }

    initializeEventListeners() {
        console.log('Initializing service completion event listeners');
        
        // Provider-side completion
        const confirmCompletionBtn = document.getElementById('confirmCompletion');
        if (confirmCompletionBtn) {
            confirmCompletionBtn.addEventListener('click', this.handleProviderCompletion);
            console.log('Provider completion button listener attached');
        } else {
            console.warn('confirmCompletion button not found in DOM');
        }

        // Consumer-side confirmation
        const confirmServiceCompletionBtn = document.getElementById('confirmServiceCompletion');
        if (confirmServiceCompletionBtn) {
            confirmServiceCompletionBtn.addEventListener('click', this.handleConsumerConfirmation);
            console.log('Consumer confirmation button listener attached');
        } else {
            console.warn('confirmServiceCompletion button not found in DOM');
        }

        // Modal close events to reset flags
        const confirmationModal = document.getElementById('serviceConfirmationModal');
        if (confirmationModal) {
            confirmationModal.addEventListener('hidden.bs.modal', () => {
                this.modalShown = false;
                console.log('Confirmation modal closed, reset flags');
            });
            
            // Also handle escape key and backdrop clicks
            confirmationModal.addEventListener('hide.bs.modal', () => {
                this.modalShown = false;
                console.log('Confirmation modal hiding, reset flags');
            });
        }
    }

    /**
     * Add a status record to booking_statuses table
     */
    async addBookingStatus(bookingId, status, notes = null) {
        try {
            const { data, error } = await window.supabase
                .from('booking_statuses')
                .insert({
                    booking_id: bookingId,
                    status: status,
                    notes: notes
                })
                .select()
                .single();
                
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error adding booking status:', error);
            throw error;
        }
    }

    /**
     * Get latest status details from booking_statuses
     */
    async getLatestBookingStatus(bookingId) {
        try {
            const { data, error } = await window.supabase
                .from('booking_statuses')
                .select('*')
                .eq('booking_id', bookingId)
                .order('created_at', { ascending: false })
                .limit(1);
                
            if (error) throw error;
            return data?.[0] || null;
        } catch (error) {
            console.error('Error getting booking status:', error);
            return null;
        }
    }

    /**
     * Show completion modal for provider to mark service as completed
     */
    showCompletionModal(booking) {
        console.log('Showing completion modal for booking:', booking);
        const modal = document.getElementById('serviceCompletionModal');
        const form = document.getElementById('serviceCompletionForm');
        
        if (!modal || !form) {
            console.error('Service completion modal not found');
            return;
        }
        
        // Set booking data
        form.dataset.bookingId = booking.id;
        
        // Pre-populate with estimated price if available
        const priceInput = document.getElementById('actualPrice');
        if (priceInput) {
            priceInput.value = booking.estimated_price || '';
        }
        
        // Clear previous notes
        const notesInput = document.getElementById('completionNotes');
        if (notesInput) {
            notesInput.value = '';
        }
        
        // Show modal
        try {
            const bootstrapModal = new bootstrap.Modal(modal);
            bootstrapModal.show();
            console.log('Modal shown successfully');
        } catch (error) {
            console.error('Error showing modal:', error);
            alert('Error showing completion modal. Please try again.');
        }
    }

    /**
     * Check if the service confirmation modal HTML is loaded
     */
    isModalHTMLLoaded() {
        const modal = document.getElementById('serviceConfirmationModal');
        const starRating = document.querySelector('#serviceConfirmationModal .star-rating');
        const stars = document.querySelectorAll('#serviceConfirmationModal .star-rating .star');
        
        const isLoaded = modal && starRating && stars.length === 5;
        console.log('🔍 Modal HTML loaded check:', {
            modal: !!modal,
            starRating: !!starRating,
            starsCount: stars.length,
            isLoaded
        });
        
        return isLoaded;
    }

    /**
     * Show confirmation modal for consumer to confirm service completion
     */
    showConfirmationModal(booking) {
        console.log('Showing confirmation modal for booking:', booking);
        
        // Check if modal HTML is loaded first
        if (!this.isModalHTMLLoaded()) {
            console.log('⏳ Modal HTML not loaded yet, retrying in 500ms...');
            setTimeout(() => this.showConfirmationModal(booking), 500);
            return;
        }
        
        // Check if modal is already open or visible
        const existingModal = document.getElementById('serviceConfirmationModal');
        if (existingModal && (existingModal.classList.contains('show') || existingModal.style.display === 'block')) {
            console.log('Confirmation modal already open, skipping');
            return;
        }
        
        // Check if this booking was already processed recently
        if (this.recentlyCompletedBookings.has(booking.id)) {
            console.log('Booking was recently completed in this session, skipping modal');
            return;
        }
        
        // Populate booking information
        this.populateServiceInfo(booking);
        this.populateCompletionInfo(booking);
        
        // Store booking ID and initialize rating in modal data
        const modal = document.getElementById('serviceConfirmationModal');
        if (modal) {
            modal.dataset.bookingId = booking.id;
            modal.dataset.rating = '0'; // Default rating
            
            try {
                // Show the modal using Bootstrap
                const modalInstance = new bootstrap.Modal(modal);
                
                // Initialize star rating after modal is fully shown
                modal.addEventListener('shown.bs.modal', () => {
                    console.log('🎭 Modal fully shown, initializing star rating...');
                    setTimeout(() => {
                        this.initializeStarRating();
                    }, 300); // Increased delay for better reliability
                }, { once: true }); // Use once to prevent multiple listeners
                
                modalInstance.show();
                this.modalShown = true; // Set flag after successful show
                console.log('Confirmation modal shown successfully');
            } catch (error) {
                console.error('Error showing confirmation modal:', error);
                // Fallback to manual modal show
                modal.classList.add('show');
                modal.style.display = 'block';
                document.body.classList.add('modal-open');
                this.modalShown = true;
                
                // Initialize star rating in fallback mode with longer delay
                setTimeout(() => {
                    this.initializeStarRating();
                }, 500);
                
                console.log('Confirmation modal shown successfully (fallback)');
            }
        } else {
            console.error('Service confirmation modal not found in DOM');
        }
    }

    /**
     * Populate service information in confirmation modal
     */
    populateServiceInfo(booking) {
        const container = document.getElementById('serviceInfo');
        if (!container) return;
        
        // Get service title from various possible locations
        let serviceTitle = 'N/A';
        if (booking.services && booking.services.title) {
            serviceTitle = booking.services.title;
        } else if (booking.service && booking.service.title) {
            serviceTitle = booking.service.title;
        } else if (booking.service_name) {
            serviceTitle = booking.service_name;
        }
        
        // Get provider name
        let providerName = booking.provider_name || 'N/A';
        if (booking.profiles && booking.profiles.first_name) {
            providerName = `${booking.profiles.first_name} ${booking.profiles.last_name || ''}`;
        }
        
        container.innerHTML = `
            <div class="info-item">
                <span>Service:</span>
                <span>${serviceTitle}</span>
            </div>
            <div class="info-item">
                <span>Provider:</span>
                <span>${providerName}</span>
            </div>
            <div class="info-item">
                <span>Date:</span>
                <span>${this.formatDate(booking.scheduled_date)}</span>
            </div>
            <div class="info-item">
                <span>Time:</span>
                <span>${booking.scheduled_time || 'N/A'}</span>
            </div>
        `;
    }

    /**
     * Populate completion information from booking and booking_statuses
     */
    async populateCompletionInfo(booking) {
        const container = document.getElementById('completionInfo');
        if (!container) return;
        
        try {
            // Get latest status from booking_statuses for completion details
            const latestStatus = await this.getLatestBookingStatus(booking.id);
            
            let completionTime = null;
            let completionNotes = null;
            
            if (latestStatus && latestStatus.status === 'pending_confirmation') {
                completionTime = latestStatus.created_at;
                completionNotes = latestStatus.notes;
            }
            
            container.innerHTML = `
                <div class="info-item">
                    <span>Final Price:</span>
                    <span>${this.formatCurrency(booking.actual_price || booking.estimated_price)}</span>
                </div>
                ${completionTime ? `
                    <div class="info-item">
                        <span>Completed On:</span>
                        <span>${this.formatDate(completionTime)}</span>
                    </div>
                ` : ''}
                ${completionNotes ? `
                    <div class="info-item">
                        <span>Notes:</span>
                        <span>${completionNotes}</span>
                    </div>
                ` : ''}
            `;
        } catch (error) {
            console.error('Error populating completion info:', error);
            container.innerHTML = `
                <div class="info-item">
                    <span>Final Price:</span>
                    <span>${this.formatCurrency(booking.actual_price || booking.estimated_price)}</span>
                </div>
            `;
        }
    }

    /**
     * Check for bookings awaiting consumer confirmation with improved throttling
     */
    async checkForPendingConfirmations() {
        // Enhanced throttling and duplicate prevention
        const now = Date.now();
        if (!this.currentUser || 
            this.isCheckingConfirmations || 
            this.modalShown || 
            (now - this.lastCheckTime) < this.completionCooldown) {
            return;
        }

        this.isCheckingConfirmations = true;
        this.lastCheckTime = now;
        
        try {
            console.log('Checking for pending confirmations for user:', this.currentUser.id.substring(0, 8));
            
            // CRITICAL FIX: First clean up any inconsistent booking statuses
            // This ensures we don't have bookings stuck in pending_confirmation state
            await this.cleanupInconsistentBookingStatuses();
            
            // Add delay to allow for database propagation
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Query bookings with pending_confirmation status
            const { data: pendingBookings, error } = await window.supabase
                .from('bookings')
                .select('id, status, updated_at')
                .eq('consumer_id', this.currentUser.id)
                .eq('status', 'pending_confirmation')
                .order('updated_at', { ascending: false });
                
            if (error) {
                console.error('Error checking pending confirmations:', error);
                return;
            }
            
            console.log('Found pending bookings:', pendingBookings?.length || 0);
            
            if (pendingBookings && pendingBookings.length > 0) {
                // Filter out recently completed bookings
                const validPendingBookings = pendingBookings.filter(booking => 
                    !this.recentlyCompletedBookings.has(booking.id)
                );
                
                console.log('Valid pending booking details:', validPendingBookings.map(b => ({
                    id: b.id.substring(0, 8),
                    status: b.status,
                    updated_at: b.updated_at
                })));
                
                if (validPendingBookings.length === 0) {
                    console.log('All pending bookings were recently completed, skipping');
                    return;
                }
                
                // Process each pending booking
                for (const pendingBooking of validPendingBookings) {
                    const bookingId = pendingBooking.id;
                    
                    // CRITICAL FIX: Check booking_statuses table for completed status
                    // This ensures we don't show the modal if the booking was completed but
                    // the status in bookings table wasn't updated properly
                    const { data: statusRecords, error: statusError } = await window.supabase
                        .from('booking_statuses')
                        .select('status')
                        .eq('booking_id', bookingId)
                        .eq('status', 'completed')
                        .order('created_at', { ascending: false })
                        .limit(1);
                        
                    if (statusError) {
                        console.error('Error checking booking_statuses:', statusError);
                    } else if (statusRecords && statusRecords.length > 0) {
                        console.log('Booking already has completed status in booking_statuses table:', bookingId.substring(0, 8));
                        
                        // Fix inconsistency: Update bookings table to match booking_statuses
                        const { error: fixError } = await window.supabase
                            .from('bookings')
                            .update({
                                status: 'completed',
                                updated_at: new Date().toISOString()
                            })
                            .eq('id', bookingId);
                            
                        if (fixError) {
                            console.error('Error fixing booking status inconsistency:', fixError);
                        } else {
                            console.log('✅ Fixed booking status inconsistency for:', bookingId.substring(0, 8));
                            
                            // Add to recently completed to prevent showing again
                            this.recentlyCompletedBookings.add(bookingId);
                            
                            // Save to localStorage for persistence across page refreshes
                            this.saveCompletedBookingsToStorage();
                        }
                        
                        // Skip showing modal for this booking
                        continue;
                    }
                    
                    // Double-check the status to prevent race conditions
                    const { data: verifyBooking, error: verifyError } = await window.supabase
                        .from('bookings')
                        .select('id, status')
                        .eq('id', bookingId)
                        .single();
                        
                    console.log('Verification check for booking:', {
                        id: bookingId.substring(0, 8),
                        error: verifyError?.message,
                        booking: verifyBooking ? {
                            status: verifyBooking.status
                        } : null
                    });
                        
                    if (verifyError || !verifyBooking || verifyBooking.status !== 'pending_confirmation') {
                        console.log('Booking status changed or not found, skipping modal');
                        continue;
                    }
                    
                    // Get the most recent pending booking with full details
                    const { data: booking, error: bookingError } = await window.supabase
                        .from('bookings')
                        .select(`
                            *,
                            services (title),
                            profiles!bookings_provider_id_fkey (first_name, last_name)
                        `)
                        .eq('id', bookingId)
                        .single();
                        
                    if (bookingError) {
                        console.error('Error fetching booking details:', bookingError);
                        continue;
                    }
                    
                    if (!booking || booking.status !== 'pending_confirmation') {
                        console.log('Booking no longer needs confirmation, skipping modal');
                        continue;
                    }
                    
                    // Add provider name for easy access
                    if (booking.profiles) {
                        booking.provider_name = `${booking.profiles.first_name} ${booking.profiles.last_name || ''}`;
                    }
                    
                    // Show the confirmation modal for the first valid booking
                    this.showConfirmationModal(booking);
                    break; // Only show one modal at a time
                }
            }
        } catch (error) {
            console.error('Error in checkForPendingConfirmations:', error);
        } finally {
            this.isCheckingConfirmations = false;
        }
    }

    /**
     * Handle provider completion using booking_statuses tracking
     */
    async handleProviderCompletion() {
        console.log('Handling provider completion');
        const form = document.getElementById('serviceCompletionForm');
        if (!form) {
            console.error('Service completion form not found');
            return;
        }
        
        const bookingId = form.dataset.bookingId;
        const actualPrice = document.getElementById('actualPrice').value;
        const completionNotes = document.getElementById('completionNotes').value;

        if (!actualPrice || actualPrice <= 0) {
            this.showToast('Please enter a valid final price', 'error');
            return;
        }

        try {
            console.log('Completing booking via provider using booking_statuses tracking');
            
            // Update booking with final price and status
            const { error: updateError } = await window.supabase
                .from('bookings')
                .update({
                    status: 'pending_confirmation',
                    actual_price: parseFloat(actualPrice),
                    updated_at: new Date().toISOString()
                })
                .eq('id', bookingId);

            if (updateError) throw updateError;
            
            // Add status record to booking_statuses for tracking
            await this.addBookingStatus(
                bookingId, 
                'pending_confirmation', 
                completionNotes || 'Service completed by provider, awaiting customer confirmation'
            );
            
            console.log('Provider completion successful');
            
            // Fetch updated booking with service data for notification
            const { data: bookingData, error: fetchError } = await window.supabase
                .from('bookings')
                .select(`
                    *,
                    services (*)
                `)
                .eq('id', bookingId)
                .single();
                
            if (fetchError) throw fetchError;

            // Create notification for consumer
            await this.createCompletionNotification(bookingData);
            
            // Show success message
            this.showToast('Service marked as completed. Waiting for customer confirmation.', 'success');
            
            // Close modal
            const modal = document.getElementById('serviceCompletionModal');
            if (modal) {
                const modalInstance = bootstrap.Modal.getInstance(modal);
                if (modalInstance) {
                    modalInstance.hide();
                }
            }
            
            // Enhanced dashboard refresh
            this.refreshProviderDashboard();
            
        } catch (error) {
            console.error('Error completing service:', error);
            this.showToast('Error completing service. Please try again.', 'error');
        }
    }

    /**
     * Handle consumer confirmation using booking_statuses tracking - Enhanced version
     */
    async handleConsumerConfirmation() {
        console.log('🔥 STARTING handleConsumerConfirmation');
        
        try {
            const modal = document.getElementById('serviceConfirmationModal');
            if (!modal) {
                console.error('❌ Service confirmation modal not found');
                this.showToast('Modal not found. Please refresh the page.', 'error');
                return;
            }
            
            const bookingId = modal.dataset.bookingId;
            const rating = parseInt(modal.dataset.rating) || 0;
            const reviewText = document.getElementById('reviewText')?.value || '';

            console.log('📊 Modal data:', {
                bookingId: bookingId ? bookingId.substring(0, 8) : 'MISSING',
                rating: rating,
                reviewLength: reviewText.length
            });

            if (!bookingId) {
                console.error('❌ No booking ID found in modal');
                this.showToast('Booking information missing. Please refresh the page.', 'error');
                return;
            }

            if (rating === 0) {
                console.warn('⚠️ No rating provided');
                this.showToast('Please provide a rating before confirming', 'error');
                return;
            }

            console.log('✅ Validation passed, proceeding with confirmation');
            
            // Show loading state
            const confirmBtn = document.getElementById('confirmServiceCompletion');
            if (confirmBtn) {
                confirmBtn.disabled = true;
                confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Confirming...';
            }
            
            // Verify booking exists and current status before updating
            console.log('🔍 Fetching current booking status...');
            const { data: currentBooking, error: fetchError } = await window.supabase
                .from('bookings')
                .select('id, status, consumer_id, provider_id')
                .eq('id', bookingId)
                .single();
                
            if (fetchError) {
                console.error('❌ Error fetching current booking:', fetchError);
                throw fetchError;
            }
            
            console.log('📋 Current booking state before update:', {
                id: bookingId.substring(0, 8),
                status: currentBooking.status,
                consumer_id: currentBooking.consumer_id?.substring(0, 8),
                provider_id: currentBooking.provider_id?.substring(0, 8)
            });
            
            // Check if booking is still in pending_confirmation status
            if (currentBooking.status !== 'pending_confirmation') {
                console.log('⚠️ Booking is no longer in pending_confirmation status:', currentBooking.status);
                this.showToast('This booking has already been processed', 'info');
                this.closeConfirmationModal();
                return;
            }
            
            // CRITICAL FIX: First check if there's already a completed status record
            console.log('🔍 Checking for existing completed status record...');
            const { data: existingStatusRecords, error: checkStatusError } = await window.supabase
                .from('booking_statuses')
                .select('*')
                .eq('booking_id', bookingId)
                .eq('status', 'completed')
                .order('created_at', { ascending: false })
                .limit(1);
                
            if (checkStatusError) {
                console.error('❌ Error checking existing status records:', checkStatusError);
                // Continue with the process even if the check fails
            } else if (existingStatusRecords && existingStatusRecords.length > 0) {
                console.log('⚠️ Completed status record already exists, skipping status record creation');
            } else {
                // Add status record to booking_statuses for tracking
                console.log('📝 Adding status record to booking_statuses FIRST...');
                try {
                    await this.addBookingStatus(
                        bookingId, 
                        'completed', 
                        'Service confirmed as completed by customer'
                    );
                    console.log('✅ Status record added successfully to booking_statuses');
                } catch (statusRecordError) {
                    console.error('❌ Could not add status record:', statusRecordError);
                    throw statusRecordError; // This is now critical - fail if we can't add the status
                }
            }
            
            // Now update the bookings table
            console.log('🔄 Updating booking status to completed in bookings table...');
            let updateAttempts = 0;
            let updateSuccess = false;
            
            while (!updateSuccess && updateAttempts < 3) {
                updateAttempts++;
                try {
                    const { error: statusError } = await window.supabase
                        .from('bookings')
                        .update({
                            status: 'completed',
                            updated_at: new Date().toISOString()
                        })
                        .eq('id', bookingId)
                        .eq('status', 'pending_confirmation'); // Additional safety check

                    if (statusError) {
                        console.error(`❌ Error updating booking status (attempt ${updateAttempts}/3):`, statusError);
                        if (updateAttempts < 3) {
                            console.log(`⏳ Retrying update in ${updateAttempts * 500}ms...`);
                            await new Promise(resolve => setTimeout(resolve, updateAttempts * 500));
                        } else {
                            throw statusError;
                        }
                    } else {
                        updateSuccess = true;
                        console.log('✅ Booking status updated successfully in bookings table');
                    }
                } catch (retryError) {
                    console.error(`❌ Exception during update retry (attempt ${updateAttempts}/3):`, retryError);
                    if (updateAttempts >= 3) throw retryError;
                }
            }
            
            // Even if bookings table update failed, we can continue since we have the booking_statuses record
            // The trigger or our JavaScript fix will correct the inconsistency later
            
            // Add to recently completed bookings to prevent modal from showing again
            this.recentlyCompletedBookings.add(bookingId);
            console.log('📝 Added to recently completed list');
            
            // Save to localStorage for persistence across page refreshes
            this.saveCompletedBookingsToStorage();
            
            // Set timeout to clear from recently completed after 30 seconds
            setTimeout(() => {
                this.recentlyCompletedBookings.delete(bookingId);
                console.log('🗑️ Removed booking from recently completed list:', bookingId.substring(0, 8));
                // Don't remove from localStorage - we want it to persist across refreshes
            }, 30000);
            
            console.log('⭐ Submitting review...');
            // Submit review
            try {
                await this.submitReview(bookingId, rating, reviewText);
                console.log('✅ Review submitted successfully');
            } catch (reviewError) {
                console.warn('⚠️ Review submission failed (non-critical):', reviewError);
                // Don't fail the whole process for review submission
            }
            
            // Show success message
            this.showToast('Service completion confirmed and review submitted!', 'success');
            console.log('🎉 Confirmation process completed successfully');
            
            // Close modal properly
            this.closeConfirmationModal();
            
            // Refresh both consumer and provider dashboards
            this.refreshDashboards();
            
        } catch (error) {
            console.error('💥 CRITICAL ERROR in handleConsumerConfirmation:', error);
            this.showToast('Error confirming completion. Please try again.', 'error');
            
            // Reset button state
            const confirmBtn = document.getElementById('confirmServiceCompletion');
            if (confirmBtn) {
                confirmBtn.disabled = false;
                confirmBtn.innerHTML = '<i class="fas fa-check"></i> Confirm Completion';
            }
        }
    }

    /**
     * Properly close confirmation modal and reset flags
     */
    closeConfirmationModal() {
        const modal = document.getElementById('serviceConfirmationModal');
        if (!modal) return;
        
        try {
            const modalInstance = bootstrap.Modal.getInstance(modal);
            if (modalInstance) {
                modalInstance.hide();
            } else {
                modal.classList.remove('show');
                modal.style.display = 'none';
                document.body.classList.remove('modal-open');
                // Remove backdrop if it exists
                const backdrop = document.querySelector('.modal-backdrop');
                if (backdrop) {
                    backdrop.remove();
                }
            }
        } catch (modalError) {
            console.error('Error closing modal:', modalError);
        }
        
        // Reset modal flags
        this.modalShown = false;
        
        // Clear modal data
        modal.dataset.bookingId = '';
        modal.dataset.rating = '0';
        
        // Clear review text
        const reviewTextEl = document.getElementById('reviewText');
        if (reviewTextEl) {
            reviewTextEl.value = '';
        }
    }

    /**
     * Enhanced dashboard refresh for provider
     */
    refreshProviderDashboard() {
        console.log('Refreshing provider dashboard');
        
        // Refresh provider dashboard if available
        if (window.providerBookingsManager) {
            setTimeout(async () => {
                try {
                    await window.providerBookingsManager.loadBookings();
                    await window.providerBookingsManager.loadBookingHistory();
                    console.log('Provider dashboard refreshed successfully');
                } catch (error) {
                    console.error('Error refreshing provider dashboard:', error);
                }
            }, 1000);
        }
        
        // Legacy refresh function
        if (window.refreshDashboard) {
            setTimeout(() => {
                window.refreshDashboard();
            }, 1500);
        }
    }

    /**
     * Enhanced dashboard refresh for both consumer and provider
     */
    refreshDashboards() {
        console.log('Refreshing all dashboards');
        
        // Refresh consumer dashboard if available
        if (window.loadConsumerBookings) {
            setTimeout(() => {
                window.loadConsumerBookings();
                console.log('Consumer dashboard refreshed');
            }, 1000);
        }
        
        // Refresh provider dashboard
        this.refreshProviderDashboard();
    }

    async createCompletionNotification(booking) {
        try {
            console.log('Creating notification for consumer:', booking.consumer_id);
            
            // Get service title
            const serviceTitle = booking.services?.title || 'booking';
            
            await window.supabase
                .from('notifications')
                .insert({
                    user_id: booking.consumer_id,
                    type: 'service_completion',
                    title: 'Service Completion Confirmation Required',
                    message: `Your service "${serviceTitle}" has been marked as completed. Please confirm the completion and rate the service.`,
                    booking_id: booking.id,
                    status: 'unread'
                });
            console.log('Notification created successfully');
        } catch (error) {
            console.error('Error creating notification:', error);
        }
    }

    async submitReview(bookingId, rating, review) {
        try {
            console.log('Submitting review for booking:', bookingId);
            
            // First get the booking details
            const { data: booking, error: bookingError } = await window.supabase
                .from('bookings')
                .select('consumer_id, provider_id, service_id')
                .eq('id', bookingId)
                .single();
                
            if (bookingError) {
                console.error('Error fetching booking for review:', bookingError);
                throw bookingError;
            }
            
            if (!booking) {
                console.error('Booking not found for review submission');
                throw new Error('Booking not found');
            }
            
            console.log('Got booking details, submitting review with rating:', rating);
            
            // Check if a review already exists for this booking
            const { data: existingReviews, error: checkError } = await window.supabase
                .from('reviews')
                .select('id')
                .eq('booking_id', bookingId);
                
            if (checkError) {
                console.error('Error checking existing reviews:', checkError);
                throw checkError;
            }
            
            if (existingReviews && existingReviews.length > 0) {
                console.log('Review already exists for this booking, skipping review submission');
                return;
            }
            
            // Submit the review
            const { data: reviewData, error: reviewError } = await window.supabase
                .from('reviews')
                .insert({
                    booking_id: bookingId,
                    reviewer_id: booking.consumer_id,
                    provider_id: booking.provider_id,
                    service_id: booking.service_id,
                    rating: rating,
                    review_text: review || '',
                    is_verified: true
                })
                .select()
                .single();
                
            if (reviewError) {
                console.error('Error submitting review:', reviewError);
                throw reviewError;
            }
            
            console.log('Review submitted successfully:', reviewData);
            
        } catch (error) {
            console.error('Error in submitReview:', error);
            throw error;
        }
    }

    handleStarHover(event) {
        const rating = parseInt(event.target.dataset.rating);
        const stars = document.querySelectorAll('#serviceConfirmationModal .star-rating .star');
        
        stars.forEach((star, index) => {
            if (index < rating) {
                star.classList.add('hovered');
                star.style.color = '#ffeb3b'; // Bright yellow on hover
            } else {
                star.classList.remove('hovered');
            }
        });
    }

    handleStarHoverOut(event) {
        const stars = document.querySelectorAll('#serviceConfirmationModal .star-rating .star');
        stars.forEach(star => {
            star.classList.remove('hovered');
        });
        
        // Restore selected state
        const modal = document.getElementById('serviceConfirmationModal');
        const currentRating = parseInt(modal.dataset.rating) || 0;
        stars.forEach((star, index) => {
            if (index < currentRating) {
                star.classList.remove('far');
                star.classList.add('fas');
                star.classList.add('selected');
                star.style.color = '#ffc107'; // Gold color for selected stars
            } else {
                star.classList.remove('fas');
                star.classList.add('far');
                star.classList.remove('selected');
                star.style.color = '#ddd'; // Gray color for unselected stars
            }
        });
    }

    handleStarClick(event) {
        const rating = parseInt(event.target.dataset.rating);
        console.log('⭐ Star clicked! Rating:', rating);
        
        const modal = document.getElementById('serviceConfirmationModal');
        if (!modal) {
            console.error('❌ Modal not found for star rating');
            return;
        }
        
        modal.dataset.rating = rating;
        console.log('📝 Modal rating updated to:', modal.dataset.rating);
        
        const stars = document.querySelectorAll('#serviceConfirmationModal .star-rating .star');
        stars.forEach((star, index) => {
            if (index < rating) {
                star.classList.remove('far');
                star.classList.add('fas');
                star.classList.add('selected');
                star.style.color = '#ffc107'; // Gold color for selected stars
            } else {
                star.classList.remove('fas');
                star.classList.add('far');
                star.classList.remove('selected');
                star.style.color = '#ddd'; // Gray color for unselected stars
            }
        });
        
        console.log('✅ Star rating visual update completed');
    }

    showToast(message, type = 'info') {
        // Check if toast container exists
        let toastContainer = document.getElementById('toast-container');
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.id = 'toast-container';
            toastContainer.className = 'toast-container position-fixed top-0 end-0 p-3';
            toastContainer.style.zIndex = '9999';
            document.body.appendChild(toastContainer);
        }

        // Create toast element
        const toastId = 'toast-' + Date.now();
        const toastHtml = `
            <div id="${toastId}" class="toast align-items-center text-bg-${type === 'error' ? 'danger' : type === 'success' ? 'success' : 'primary'} border-0" role="alert" aria-live="assertive" aria-atomic="true">
                <div class="d-flex">
                    <div class="toast-body">
                        ${message}
                    </div>
                    <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
                </div>
            </div>
        `;

        toastContainer.insertAdjacentHTML('beforeend', toastHtml);

        // Initialize and show toast
        const toastElement = document.getElementById(toastId);
        if (toastElement && window.bootstrap) {
            const toast = new bootstrap.Toast(toastElement, {
                autohide: true,
                delay: type === 'error' ? 5000 : 3000
            });
            toast.show();

            // Remove toast element after it's hidden
            toastElement.addEventListener('hidden.bs.toast', () => {
                toastElement.remove();
            });
        }
    }

    formatCurrency(amount) {
        if (!amount) return 'N/A';
        return `AED ${parseFloat(amount).toFixed(2)}`;
    }

    formatDate(date) {
        if (!date) return 'N/A';
        try {
            return new Date(date).toLocaleDateString('en-AE', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (error) {
            console.error('Error formatting date:', error);
            return 'N/A';
        }
    }

    initializeStarRating() {
        console.log('🌟 Initializing star rating system...');
        
        const tryInitialize = (attempt = 1, maxAttempts = 5) => {
            const stars = document.querySelectorAll('#serviceConfirmationModal .star-rating .star');
            console.log(`🌟 Attempt ${attempt}: Found stars:`, stars.length);
            
            if (stars.length === 0) {
                if (attempt < maxAttempts) {
                    console.log(`⏳ No star elements found, retrying in ${attempt * 200}ms (attempt ${attempt}/${maxAttempts})`);
                    setTimeout(() => tryInitialize(attempt + 1, maxAttempts), attempt * 200);
                    return;
                } else {
                    console.error('❌ No star elements found after all attempts! Modal HTML may not be loaded.');
                    return;
                }
            }
            
            // Stars found, proceed with initialization
            stars.forEach((star, index) => {
                // Remove existing listeners first to prevent duplicates
                const newStar = star.cloneNode(true);
                star.parentNode.replaceChild(newStar, star);
            });
            
            // Re-query after cloning to get fresh elements
            const freshStars = document.querySelectorAll('#serviceConfirmationModal .star-rating .star');
            
            freshStars.forEach((star, index) => {
                // Add event listeners
                star.addEventListener('mouseenter', this.handleStarHover.bind(this));
                star.addEventListener('mouseleave', this.handleStarHoverOut.bind(this));
                star.addEventListener('click', this.handleStarClick.bind(this));
                
                // Add cursor pointer style
                star.style.cursor = 'pointer';
                star.style.transition = 'color 0.2s ease, transform 0.1s ease';
                star.style.color = '#ddd'; // Initial gray color
                
                console.log(`⭐ Star ${index + 1} listeners attached and styled`);
            });
            
            console.log('✅ Star rating system initialized successfully');
        };
        
        // Start the initialization attempts
        tryInitialize();
    }

    // New method to initialize completed bookings from localStorage
    initCompletedBookingsFromStorage() {
        try {
            const storedBookings = localStorage.getItem('recentlyCompletedBookings');
            if (storedBookings) {
                const bookingsData = JSON.parse(storedBookings);
                
                // Filter out any bookings older than 24 hours
                const now = Date.now();
                const validBookings = {};
                let expiredCount = 0;
                
                // Process bookings and filter out expired ones
                Object.entries(bookingsData).forEach(([bookingId, timestamp]) => {
                    if ((now - timestamp) < 24 * 60 * 60 * 1000) { // 24 hours in milliseconds
                        validBookings[bookingId] = timestamp;
                        this.recentlyCompletedBookings.add(bookingId);
                    } else {
                        expiredCount++;
                    }
                });
                
                // If we filtered out old bookings, update localStorage
                if (expiredCount > 0) {
                    localStorage.setItem('recentlyCompletedBookings', JSON.stringify(validBookings));
                    console.log(`Removed ${expiredCount} expired bookings from localStorage`);
                }
                
                console.log(`Loaded ${this.recentlyCompletedBookings.size} recently completed bookings from storage`);
            }
        } catch (error) {
            console.error('Error loading completed bookings from storage:', error);
            // If there's an error, clear localStorage to prevent future errors
            localStorage.removeItem('recentlyCompletedBookings');
        }
    }
    
    // New method to save completed bookings to localStorage
    saveCompletedBookingsToStorage() {
        try {
            // Convert Set to object with timestamps
            const bookingsData = {};
            const now = Date.now();
            
            this.recentlyCompletedBookings.forEach(bookingId => {
                bookingsData[bookingId] = now;
            });
            
            localStorage.setItem('recentlyCompletedBookings', JSON.stringify(bookingsData));
            console.log(`Saved ${this.recentlyCompletedBookings.size} bookings to localStorage`);
        } catch (error) {
            console.error('Error saving completed bookings to storage:', error);
        }
    }

    /**
     * Force clear all pending confirmations for the current user
     * This is a utility method that can be called from the console to fix stuck confirmations
     */
    async forceClearPendingConfirmations() {
        if (!this.currentUser) {
            console.error('❌ No user logged in');
            return;
        }
        
        try {
            console.log('🔄 Force clearing all pending confirmations for user:', this.currentUser.id.substring(0, 8));
            
            // Get all pending confirmations for this user
            const { data: pendingBookings, error } = await window.supabase
                .from('bookings')
                .select('id, status')
                .eq('consumer_id', this.currentUser.id)
                .eq('status', 'pending_confirmation');
                
            if (error) {
                console.error('Error fetching pending confirmations:', error);
                return;
            }
            
            console.log(`Found ${pendingBookings?.length || 0} pending confirmations to clear`);
            
            if (!pendingBookings || pendingBookings.length === 0) {
                console.log('No pending confirmations to clear');
                return;
            }
            
            // Update all pending confirmations to completed
            for (const booking of pendingBookings) {
                console.log(`Clearing pending confirmation for booking: ${booking.id.substring(0, 8)}`);
                
                // First add a status record to booking_statuses
                await this.addBookingStatus(
                    booking.id,
                    'completed',
                    'Force cleared by system'
                );
                
                // Then update the booking status
                const { error: updateError } = await window.supabase
                    .from('bookings')
                    .update({
                        status: 'completed',
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', booking.id);
                    
                if (updateError) {
                    console.error(`Error updating booking ${booking.id.substring(0, 8)}:`, updateError);
                } else {
                    console.log(`✅ Successfully cleared booking ${booking.id.substring(0, 8)}`);
                    
                    // Add to recently completed list
                    this.recentlyCompletedBookings.add(booking.id);
                }
            }
            
            // Save to localStorage
            this.saveCompletedBookingsToStorage();
            
            console.log('✅ Force clear operation completed');
            
            // Refresh dashboards
            this.refreshDashboards();
            
            return pendingBookings.length;
        } catch (error) {
            console.error('Error in forceClearPendingConfirmations:', error);
            return 0;
        }
    }

    /**
     * Clean up inconsistent booking statuses in the database
     * This method will find and fix bookings that have both pending_confirmation and completed statuses
     */
    async cleanupInconsistentBookingStatuses() {
        if (!this.currentUser) {
            console.error('❌ No user logged in');
            return;
        }
        
        try {
            console.log('🧹 Cleaning up inconsistent booking statuses...');
            
            // Step 1: Find all pending_confirmation bookings for this user
            const { data: pendingBookings, error: pendingError } = await window.supabase
                .from('bookings')
                .select('id, status')
                .eq('consumer_id', this.currentUser.id)
                .eq('status', 'pending_confirmation');
                
            if (pendingError) {
                console.error('Error fetching pending bookings:', pendingError);
                return;
            }
            
            if (!pendingBookings || pendingBookings.length === 0) {
                console.log('No pending bookings found, nothing to clean up');
                return;
            }
            
            console.log(`Found ${pendingBookings.length} pending bookings to check for inconsistencies`);
            
            // Step 2: For each pending booking, check if it has a 'completed' status in booking_statuses
            let fixedCount = 0;
            
            for (const booking of pendingBookings) {
                // Check if there's a completed status in booking_statuses
                const { data: statusRecords, error: statusError } = await window.supabase
                    .from('booking_statuses')
                    .select('*')
                    .eq('booking_id', booking.id)
                    .eq('status', 'completed')
                    .order('created_at', { ascending: false })
                    .limit(1);
                    
                if (statusError) {
                    console.error(`Error checking status records for booking ${booking.id.substring(0, 8)}:`, statusError);
                    continue;
                }
                
                // If there's a completed status, update the booking
                if (statusRecords && statusRecords.length > 0) {
                    console.log(`Found inconsistency: Booking ${booking.id.substring(0, 8)} has completed status in booking_statuses but is still pending_confirmation in bookings table`);
                    
                    // Update the booking status
                    const { error: updateError } = await window.supabase
                        .from('bookings')
                        .update({
                            status: 'completed',
                            updated_at: new Date().toISOString()
                        })
                        .eq('id', booking.id);
                        
                    if (updateError) {
                        console.error(`Error updating booking ${booking.id.substring(0, 8)}:`, updateError);
                    } else {
                        console.log(`✅ Fixed booking ${booking.id.substring(0, 8)}: updated status from pending_confirmation to completed`);
                        fixedCount++;
                        
                        // Add to recently completed list
                        this.recentlyCompletedBookings.add(booking.id);
                    }
                } else {
                    // Check if there are duplicate pending_confirmation records
                    const { data: pendingRecords, error: pendingRecordsError } = await window.supabase
                        .from('booking_statuses')
                        .select('*')
                        .eq('booking_id', booking.id)
                        .eq('status', 'pending_confirmation')
                        .order('created_at', { ascending: false });
                        
                    if (pendingRecordsError) {
                        console.error(`Error checking pending records for booking ${booking.id.substring(0, 8)}:`, pendingRecordsError);
                        continue;
                    }
                    
                    // If there are multiple pending_confirmation records, keep only the most recent one
                    if (pendingRecords && pendingRecords.length > 1) {
                        console.log(`Found ${pendingRecords.length} duplicate pending_confirmation records for booking ${booking.id.substring(0, 8)}`);
                        
                        // Keep the most recent one
                        const mostRecent = pendingRecords[0];
                        
                        // Delete the others
                        for (let i = 1; i < pendingRecords.length; i++) {
                            const { error: deleteError } = await window.supabase
                                .from('booking_statuses')
                                .delete()
                                .eq('id', pendingRecords[i].id);
                                
                            if (deleteError) {
                                console.error(`Error deleting duplicate record ${pendingRecords[i].id}:`, deleteError);
                            } else {
                                console.log(`✅ Deleted duplicate pending_confirmation record ${pendingRecords[i].id}`);
                            }
                        }
                    }
                }
            }
            
            // Save to localStorage
            if (fixedCount > 0) {
                this.saveCompletedBookingsToStorage();
                console.log(`✅ Fixed ${fixedCount} inconsistent bookings`);
            }
            
            return fixedCount;
        } catch (error) {
            console.error('Error cleaning up inconsistent booking statuses:', error);
            return 0;
        }
    }

    /**
     * Check for inconsistencies between bookings and booking_statuses tables
     * This is a utility method that can be called from the console
     */
    async checkInconsistencies() {
        if (!this.currentUser) {
            console.error('❌ No user logged in');
            return { error: 'No user logged in' };
        }
        
        try {
            console.log('🔍 Checking for inconsistencies...');
            
            // Get all bookings for this user
            const { data: bookings, error: bookingsError } = await window.supabase
                .from('bookings')
                .select('id, status, updated_at')
                .eq('consumer_id', this.currentUser.id);
                
            if (bookingsError) {
                console.error('Error fetching bookings:', bookingsError);
                return { error: bookingsError.message };
            }
            
            if (!bookings || bookings.length === 0) {
                console.log('No bookings found for this user');
                return { count: 0, bookings: [] };
            }
            
            console.log(`Found ${bookings.length} bookings for user ${this.currentUser.id.substring(0, 8)}`);
            
            // Check each booking for inconsistencies
            const inconsistencies = [];
            
            for (const booking of bookings) {
                // Get latest status from booking_statuses
                const { data: statusRecords, error: statusError } = await window.supabase
                    .from('booking_statuses')
                    .select('*')
                    .eq('booking_id', booking.id)
                    .order('created_at', { ascending: false });
                    
                if (statusError) {
                    console.error(`Error checking status records for booking ${booking.id.substring(0, 8)}:`, statusError);
                    continue;
                }
                
                // Check for inconsistencies
                if (!statusRecords || statusRecords.length === 0) {
                    inconsistencies.push({
                        booking_id: booking.id,
                        type: 'MISSING_STATUS_RECORDS',
                        booking_status: booking.status,
                        status_records: []
                    });
                    continue;
                }
                
                // Check if latest status matches booking status
                const latestStatus = statusRecords[0];
                if (latestStatus.status !== booking.status) {
                    inconsistencies.push({
                        booking_id: booking.id,
                        type: 'STATUS_MISMATCH',
                        booking_status: booking.status,
                        latest_status: latestStatus.status,
                        status_records: statusRecords
                    });
                }
                
                // Check for duplicate status records
                const statusCounts = {};
                statusRecords.forEach(record => {
                    statusCounts[record.status] = (statusCounts[record.status] || 0) + 1;
                });
                
                const duplicateStatuses = Object.entries(statusCounts)
                    .filter(([status, count]) => count > 1)
                    .map(([status, count]) => ({ status, count }));
                    
                if (duplicateStatuses.length > 0) {
                    inconsistencies.push({
                        booking_id: booking.id,
                        type: 'DUPLICATE_STATUS_RECORDS',
                        booking_status: booking.status,
                        duplicate_statuses: duplicateStatuses,
                        status_records: statusRecords
                    });
                }
            }
            
            // Log results
            if (inconsistencies.length === 0) {
                console.log('✅ No inconsistencies found!');
            } else {
                console.warn(`⚠️ Found ${inconsistencies.length} inconsistencies:`);
                inconsistencies.forEach(inc => {
                    console.warn(`Booking ${inc.booking_id.substring(0, 8)}: ${inc.type}`);
                    console.log(inc);
                });
            }
            
            return {
                count: inconsistencies.length,
                inconsistencies: inconsistencies
            };
        } catch (error) {
            console.error('Error checking inconsistencies:', error);
            return { error: error.message };
        }
    }
}

// Auto-instantiate when the script loads if not already exists
if (typeof window !== 'undefined' && !window.serviceCompletionManager) {
    window.ServiceCompletionManager = ServiceCompletionManager;
    window.serviceCompletionManager = new ServiceCompletionManager();
    
    // Expose utility methods to window for debugging
    window.clearPendingConfirmations = async function() {
        if (window.serviceCompletionManager) {
            return await window.serviceCompletionManager.forceClearPendingConfirmations();
        } else {
            console.error('Service completion manager not initialized');
            return 0;
        }
    };
    
    // Expose cleanup method to window for debugging
    window.cleanupBookingStatuses = async function() {
        if (window.serviceCompletionManager) {
            return await window.serviceCompletionManager.cleanupInconsistentBookingStatuses();
        } else {
            console.error('Service completion manager not initialized');
            return 0;
        }
    };
    
    // Expose check inconsistencies method to window for debugging
    window.checkBookingInconsistencies = async function() {
        if (window.serviceCompletionManager) {
            return await window.serviceCompletionManager.checkInconsistencies();
        } else {
            console.error('Service completion manager not initialized');
            return { error: 'Service completion manager not initialized' };
        }
    };
} 