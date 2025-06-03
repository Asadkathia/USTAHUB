async function submitBooking(bookingData) {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            throw new Error('User must be logged in to make a booking');
        }

        // Format the data according to the database schema
        const formattedBooking = {
            service_id: bookingData.serviceId,
            provider_id: bookingData.providerId,
            consumer_id: user.id,
            scheduled_date: bookingData.date,
            scheduled_time: bookingData.time,
            duration_hours: parseFloat(bookingData.duration),
            location_address: bookingData.address,
            customer_phone: bookingData.phone,
            customer_email: bookingData.email,
            special_instructions: bookingData.instructions || null,
            estimated_price: bookingData.price ? parseFloat(bookingData.price) : null,
            payment_method: bookingData.paymentMethod || null,
            status: 'pending'
        };

        const { data, error } = await supabase
            .from('bookings')
            .insert([formattedBooking])
            .select()
            .single();

        if (error) {
            console.error('Booking submission error:', error);
            throw new Error(error.message);
        }

        // Create initial booking status
        const { error: statusError } = await supabase
            .from('booking_statuses')
            .insert([{
                booking_id: data.id,
                status: 'pending',
                notes: 'Booking created'
            }]);

        if (statusError) {
            console.error('Status creation error:', statusError);
            // Don't throw here as the booking was created successfully
        }

        return data;
    } catch (error) {
        console.error('Error in submitBooking:', error);
        throw error;
    }
} 