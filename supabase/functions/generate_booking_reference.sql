CREATE OR REPLACE FUNCTION public.generate_booking_reference()
RETURNS TEXT AS $$
DECLARE
    reference TEXT;
    counter INTEGER := 0;
BEGIN
    LOOP
        -- Generate a reference in format UH-YYYYMMDD-XXX
        reference := 'UH-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || 
                    LPAD(FLOOR(RANDOM() * 999 + 1)::TEXT, 3, '0');
        
        -- Check if this reference already exists
        IF NOT EXISTS (SELECT 1 FROM bookings WHERE booking_reference = reference) THEN
            RETURN reference;
        END IF;
        
        counter := counter + 1;
        -- Prevent infinite loop
        IF counter > 100 THEN
            reference := 'UH-' || TO_CHAR(NOW(), 'YYYYMMDDHH24MISS') || '-' || 
                        LPAD(FLOOR(RANDOM() * 999 + 1)::TEXT, 3, '0');
            RETURN reference;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 