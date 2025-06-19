-- Activity Logs Table for Enhanced Activity Feed (Phase 2)
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  activity_type character varying NOT NULL CHECK (activity_type::text = ANY (ARRAY['booking_created'::character varying, 'booking_confirmed'::character varying, 'booking_completed'::character varying, 'booking_cancelled'::character varying, 'review_received'::character varying, 'review_given'::character varying, 'payment_received'::character varying, 'payment_sent'::character varying, 'service_created'::character varying, 'service_updated'::character varying, 'service_deleted'::character varying, 'profile_updated'::character varying, 'milestone_reached'::character varying, 'message_sent'::character varying, 'message_received'::character varying, 'token_earned'::character varying, 'token_redeemed'::character varying]::text[])),
  title text NOT NULL,
  description text,
  related_booking_id uuid,
  related_service_id uuid,
  related_user_id uuid,
  amount numeric,
  rating integer CHECK (rating >= 1 AND rating <= 5),
  status character varying DEFAULT 'active'::character varying CHECK (status::text = ANY (ARRAY['active'::character varying, 'archived'::character varying, 'deleted'::character varying]::text[])),
  is_read boolean DEFAULT false,
  activity_timestamp timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT activity_logs_pkey PRIMARY KEY (id),
  CONSTRAINT activity_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT activity_logs_related_service_id_fkey FOREIGN KEY (related_service_id) REFERENCES public.services(id),
  CONSTRAINT activity_logs_related_user_id_fkey FOREIGN KEY (related_user_id) REFERENCES public.profiles(id),
  CONSTRAINT activity_logs_related_booking_id_fkey FOREIGN KEY (related_booking_id) REFERENCES public.bookings(id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_timestamp ON activity_logs(user_id, activity_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_type ON activity_logs(activity_type);
CREATE INDEX IF NOT EXISTS idx_activity_logs_unread ON activity_logs(user_id, is_read, activity_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_booking ON activity_logs(related_booking_id);

-- Enable RLS
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY; 