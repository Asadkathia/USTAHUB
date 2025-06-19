-- Booking completion trigger function
-- Awards tokens when booking status changes to completed
CREATE OR REPLACE FUNCTION handle_booking_completion()
RETURNS TRIGGER AS $$
BEGIN
    -- Award tokens when booking is marked as completed
    IF NEW.status = 'completed' AND OLD.status != 'completed' AND NEW.actual_price > 0 THEN
        PERFORM award_service_tokens(NEW.id, NEW.consumer_id, NEW.actual_price);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger that fires after booking status update
DROP TRIGGER IF EXISTS award_tokens_on_completion ON bookings;
CREATE TRIGGER award_tokens_on_completion
    AFTER UPDATE ON bookings
    FOR EACH ROW
    EXECUTE FUNCTION handle_booking_completion(); 