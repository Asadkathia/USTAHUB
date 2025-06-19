// Service Completion Manager
class ServiceCompletionManager {
    constructor() {
        this.initializeEventListeners();
        this.currentUser = null;
        this.initializeUser();
    }

    async initializeUser() {
        try {
            const { data: { user }, error } = await window.supabase.auth.getUser();
            if (error) throw error;
            this.currentUser = user;
        } catch (error) {
            console.error('Error initializing user:', error);
        }
    }

    initializeEventListeners() {
        // Provider-side completion
        document.getElementById('confirmCompletion')?.addEventListener('click', async () => {
            await this.handleProviderCompletion();
        });

        // Consumer-side confirmation
        document.getElementById('confirmServiceCompletion')?.addEventListener('click', async () => {
            await this.handleConsumerConfirmation();
        });

        // Star rating functionality
        document.querySelectorAll('.star-rating .fa-star').forEach(star => {
            star.addEventListener('mouseover', (e) => this.handleStarHover(e));
            star.addEventListener('mouseout', (e) => this.handleStarHoverOut(e));
            star.addEventListener('click', (e) => this.handleStarClick(e));
        });
    }

    /**
     * Show completion modal for provider
     */
    showCompletionModal(booking) {
        const modal = document.getElementById('serviceCompletionModal');
        const form = document.getElementById('serviceCompletionForm');
        
        if (!modal || !form) {
            console.error('Service completion modal not found');
            return;
        }
        
        // Set booking data
        form.dataset.bookingId = booking.id;
        
        // Pre-populate with estimated price
        document.getElementById('actualPrice').value = booking.estimated_price || '';
        
        // Clear previous notes
        document.getElementById('completionNotes').value = '';
        
        // Show modal
        const bootstrapModal = new bootstrap.Modal(modal);
        bootstrapModal.show();
    }

    /**
     * Show confirmation modal for consumer  
     */
    showConfirmationModal(booking) {
        const modal = document.getElementById('serviceConfirmationModal');
        
        if (!modal) {
            console.error('Service confirmation modal not found');
            return;
        }
        
        // Set booking data
        modal.dataset.bookingId = booking.id;
        
        // Populate service info
        this.populateServiceInfo(booking);
        
        // Populate completion info
        this.populateCompletionInfo(booking);
        
        // Reset rating
        modal.dataset.rating = '';
        document.querySelectorAll('#serviceConfirmationModal .fa-star').forEach(star => {
            star.classList.remove('fas');
            star.classList.add('far');
        });
        
        // Clear review text
        document.getElementById('reviewText').value = '';
        
        // Show modal
        const bootstrapModal = new bootstrap.Modal(modal);
        bootstrapModal.show();
    }

    /**
     * Populate service information in confirmation modal
     */
    populateServiceInfo(booking) {
        const container = document.getElementById('serviceInfo');
        if (!container) return;
        
        container.innerHTML = `
            <div class="info-item">
                <span>Service:</span>
                <span>${booking.services?.title || booking.service_name || 'N/A'}</span>
            </div>
            <div class="info-item">
                <span>Provider:</span>
                <span>${booking.provider_name || (booking.profiles ? `${booking.profiles.first_name} ${booking.profiles.last_name}` : 'N/A')}</span>
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
     * Populate completion information
     */
    populateCompletionInfo(booking) {
        const container = document.getElementById('completionInfo');
        if (!container) return;
        
        container.innerHTML = `
            <div class="info-item">
                <span>Final Price:</span>
                <span>${this.formatCurrency(booking.actual_price || booking.estimated_price)}</span>
            </div>
            <div class="info-item">
                <span>Completed On:</span>
                <span>${this.formatDate(booking.provider_completion_time)}</span>
            </div>
            ${booking.completion_notes ? `
                <div class="info-item">
                    <span>Notes:</span>
                    <span>${booking.completion_notes}</span>
                </div>
            ` : ''}
        `;
    }

    /**
     * Check for pending confirmations (consumer side)
     */
    async checkForPendingConfirmations() {
        if (!this.currentUser) return;
        
        try {
            const { data: pendingBookings } = await window.supabase
                .from('bookings')
                .select(`
                    *,
                    services (title),
                    profiles!bookings_provider_id_fkey (first_name, last_name)
                `)
                .eq('consumer_id', this.currentUser.id)
                .eq('status', 'pending_confirmation')
                .order('provider_completion_time', { ascending: false });
                
            if (pendingBookings && pendingBookings.length > 0) {
                // Show the most recent pending confirmation
                const booking = pendingBookings[0];
                booking.provider_name = `${booking.profiles.first_name} ${booking.profiles.last_name}`;
                this.showConfirmationModal(booking);
                
                // Show notification toast
                if (window.showToast) {
                    window.showToast(
                        `Service "${booking.services?.title}" is ready for confirmation!`,
                        'info'
                    );
                }
            }
        } catch (error) {
            console.error('Error checking pending confirmations:', error);
        }
    }

    async handleProviderCompletion() {
        const form = document.getElementById('serviceCompletionForm');
        const bookingId = form.dataset.bookingId;
        const actualPrice = document.getElementById('actualPrice').value;
        const completionNotes = document.getElementById('completionNotes').value;

        if (!actualPrice || actualPrice <= 0) {
            if (window.showToast) {
                window.showToast('Please enter a valid final price', 'error');
            }
            return;
        }

        try {
            const { data, error } = await window.supabase
                .from('bookings')
                .update({
                    status: 'pending_confirmation',
                    actual_price: actualPrice,
                    completion_notes: completionNotes,
                    completed_by_provider: true,
                    provider_completion_time: new Date().toISOString()
                })
                .eq('id', bookingId)
                .select('*, services(*), profiles(*)')
                .single();

            if (error) throw error;

            // Create notification for consumer
            await this.createCompletionNotification(data);
            
            // Show success message
            if (window.showToast) {
                window.showToast('Service marked as completed. Waiting for customer confirmation.', 'success');
            }
            
            // Close modal
            bootstrap.Modal.getInstance(document.getElementById('serviceCompletionModal')).hide();
            
            // Refresh provider dashboard if available
            if (window.servicesTable?.refresh) {
                window.servicesTable.refresh();
            }
            
            // Refresh provider bookings if available
            if (window.providerBookingsManager?.loadBookings) {
                window.providerBookingsManager.loadBookings();
            }

        } catch (error) {
            if (window.showToast) {
                window.showToast('Error marking service as completed: ' + error.message, 'error');
            }
        }
    }

    async handleConsumerConfirmation() {
        const modal = document.getElementById('serviceConfirmationModal');
        const bookingId = modal.dataset.bookingId;
        const rating = parseInt(modal.dataset.rating);
        const review = document.getElementById('reviewText').value;

        if (!rating) {
            if (window.showToast) {
                window.showToast('Please rate the service before confirming', 'error');
            }
            return;
        }

        try {
            const { data, error } = await window.supabase
                .from('bookings')
                .update({
                    status: 'completed',
                    completed_by_consumer: true,
                    consumer_completion_time: new Date().toISOString()
                })
                .eq('id', bookingId)
                .select()
                .single();

            if (error) throw error;

            // Submit review
            await this.submitReview(bookingId, rating, review);

            // Show success message
            if (window.showToast) {
                window.showToast('Service completion confirmed!', 'success');
            }
            
            // Close modal
            bootstrap.Modal.getInstance(modal).hide();
            
            // Refresh consumer dashboard if available
            if (window.ConsumerDashboard?.refresh) {
                window.ConsumerDashboard.refresh();
            }

        } catch (error) {
            if (window.showToast) {
                window.showToast('Error confirming service completion: ' + error.message, 'error');
            }
        }
    }

    async createCompletionNotification(booking) {
        try {
            await window.supabase
                .from('notifications')
                .insert({
                    user_id: booking.consumer_id,
                    type: 'service_completion',
                    title: 'Service Completion Confirmation Required',
                    message: `Your service "${booking.services.title}" has been marked as completed. Please confirm the completion and rate the service.`,
                    booking_id: booking.id,
                    status: 'unread'
                });
        } catch (error) {
            console.error('Error creating notification:', error);
        }
    }

    async submitReview(bookingId, rating, review) {
        try {
            const { data: booking } = await window.supabase
                .from('bookings')
                .select('consumer_id, provider_id, service_id')
                .eq('id', bookingId)
                .single();

            await window.supabase
                .from('reviews')
                .insert({
                    booking_id: bookingId,
                    reviewer_id: booking.consumer_id,  // Fixed: was customer_id
                    provider_id: booking.provider_id,
                    service_id: booking.service_id,
                    rating: rating,
                    review_text: review || null  // Fixed: was comment
                });
        } catch (error) {
            console.error('Error submitting review:', error);
        }
    }

    handleStarHover(event) {
        const rating = parseInt(event.target.dataset.rating);
        const stars = event.target.parentElement.querySelectorAll('.fa-star');
        stars.forEach(star => {
            const starRating = parseInt(star.dataset.rating);
            star.classList.remove('fas', 'far');
            star.classList.add(starRating <= rating ? 'fas' : 'far');
        });
    }

    handleStarHoverOut(event) {
        const modal = document.getElementById('serviceConfirmationModal');
        const selectedRating = parseInt(modal.dataset.rating) || 0;
        const stars = event.target.parentElement.querySelectorAll('.fa-star');
        stars.forEach(star => {
            const starRating = parseInt(star.dataset.rating);
            star.classList.remove('fas', 'far');
            star.classList.add(starRating <= selectedRating ? 'fas' : 'far');
        });
    }

    handleStarClick(event) {
        const rating = event.target.dataset.rating;
        const modal = document.getElementById('serviceConfirmationModal');
        modal.dataset.rating = rating;
        this.handleStarHover(event);
    }

    // Helper method to format currency
    formatCurrency(amount) {
        return new Intl.NumberFormat('en-AE', {
            style: 'currency',
            currency: 'AED'
        }).format(amount || 0);
    }

    // Helper method to format date
    formatDate(date) {
        if (!date) return 'N/A';
        return new Intl.DateTimeFormat('en-AE', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(new Date(date));
    }
}

// Initialize the manager
window.serviceCompletionManager = new ServiceCompletionManager(); 