CREATE INDEX IF NOT EXISTS idx_booking_slots_provider_id ON booking_slots(provider_id);
CREATE INDEX IF NOT EXISTS idx_booking_slots_date ON booking_slots(date);
CREATE INDEX IF NOT EXISTS idx_booking_slots_is_booked ON booking_slots(is_booked); 