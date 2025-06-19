-- Add new columns to bookings table
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS completed_by_provider boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS completed_by_consumer boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS provider_completion_time timestamp with time zone,
ADD COLUMN IF NOT EXISTS consumer_completion_time timestamp with time zone,
ADD COLUMN IF NOT EXISTS completion_notes text;

-- Update the status enum to include pending_confirmation
DO $$ 
BEGIN
    -- Drop the existing constraint
    ALTER TABLE bookings 
    DROP CONSTRAINT IF EXISTS bookings_status_check;

    -- Add the new constraint with updated status options
    ALTER TABLE bookings
    ADD CONSTRAINT bookings_status_check 
    CHECK (status = ANY (ARRAY[
        'pending'::text, 
        'confirmed'::text, 
        'pending_confirmation'::text, 
        'completed'::text, 
        'cancelled'::text
    ]));
END $$;

-- Create index for faster status queries
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);

-- Create index for completion timestamps
CREATE INDEX IF NOT EXISTS idx_bookings_completion_times 
ON bookings(provider_completion_time, consumer_completion_time);

-- Update existing completed bookings
UPDATE bookings 
SET 
    completed_by_provider = true,
    completed_by_consumer = true,
    provider_completion_time = updated_at,
    consumer_completion_time = updated_at
WHERE status = 'completed'; 