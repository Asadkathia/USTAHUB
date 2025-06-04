// Booking functionality
document.addEventListener('DOMContentLoaded', function() {
    const bookingModal = new bootstrap.Modal(document.getElementById('bookingModal'));
    const bookingForm = document.getElementById('bookingForm');
    const submitBookingBtn = document.getElementById('submitBooking');

    // Set minimum date to today
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('bookingDate').min = today;

    // Handle booking form submission
    submitBookingBtn.addEventListener('click', async function() {
        if (!bookingForm.checkValidity()) {
            bookingForm.reportValidity();
            return;
        }

        // Check if user is authenticated
        const user = supabase.auth.user();
        if (!user) {
            // Redirect to sign-in page
            window.location.href = 'sign-in.html';
            return;
        }

        // Retrieve the consumer ID
        const consumerId = user.id; // This is the authenticated user's ID

        // Check if user is a consumer
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', consumerId)
            .single();

        if (profileError) {
            console.error("Error fetching user profile:", profileError);
            return;
        }

        if (profile.role !== 'consumer') {
            alert('Only consumers can make bookings.');
            return;
        }

        const bookingData = {
            serviceName: document.getElementById('serviceName').value,
            serviceProvider: document.getElementById('serviceProvider').value,
            bookingDate: document.getElementById('bookingDate').value,
            bookingTime: document.getElementById('bookingTime').value,
            address: document.getElementById('address').value,
            notes: document.getElementById('notes').value,
            status: 'pending'
        };

        try {
            // Here you would typically make an API call to your backend
            // For now, we'll just log the data and show a success message
            console.log('Booking data:', bookingData);
            
            // Show success message
            alert('Booking request submitted successfully!');
            
            // Close modal and reset form
            bookingModal.hide();
            bookingForm.reset();
        } catch (error) {
            console.error('Error submitting booking:', error);
            alert('There was an error submitting your booking. Please try again.');
        }
    });
});

// Function to open booking modal with service details
function openBookingModal(serviceName, serviceProvider) {
    document.getElementById('serviceName').value = serviceName;
    document.getElementById('serviceProvider').value = serviceProvider;
    const bookingModal = new bootstrap.Modal(document.getElementById('bookingModal'));
    bookingModal.show();
} 