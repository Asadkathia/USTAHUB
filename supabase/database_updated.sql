-- =====================================================
-- USTAHUB UPDATED DATABASE SCHEMA
-- Matches current Supabase database state with wallet system
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- CORE TABLES
-- =====================================================

-- Profiles table (updated to match current schema)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid NOT NULL,
  role text NOT NULL CHECK (role = ANY (ARRAY['consumer'::text, 'provider'::text])),
  first_name text NOT NULL,
  last_name text NOT NULL,
  phone text,
  profile_picture text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  is_verified boolean DEFAULT false,
  is_active boolean DEFAULT true,
  primary_service_category text,
  business_license_url text,
  email text,
  id_document_url text,
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);

-- Services table (updated to match current schema)
CREATE TABLE IF NOT EXISTS public.services (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  provider_id uuid,
  title text,
  description text,
  category text,
  subcategory text,
  price numeric,
  duration integer,
  images ARRAY,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  category_id uuid,
  CONSTRAINT services_pkey PRIMARY KEY (id),
  CONSTRAINT services_provider_id_fkey FOREIGN KEY (provider_id) REFERENCES public.profiles(id)
);

-- =====================================================
-- BOOKING SYSTEM (Updated with wallet support)
-- =====================================================

-- Bookings table (updated to match current schema with wallet payment)
CREATE TABLE IF NOT EXISTS public.bookings (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  service_id uuid NOT NULL,
  consumer_id uuid NOT NULL,
  provider_id uuid NOT NULL,
  status text NOT NULL CHECK (status = ANY (ARRAY['pending'::text, 'confirmed'::text, 'completed'::text, 'cancelled'::text])),
  booking_date timestamp with time zone NOT NULL,
  scheduled_date date NOT NULL,
  scheduled_time time without time zone NOT NULL,
  duration_hours numeric DEFAULT 1.0,
  location_address text NOT NULL,
  customer_phone character varying,
  customer_email character varying,
  special_instructions text,
  estimated_price numeric,
  actual_price numeric,
  payment_status character varying DEFAULT 'pending'::character varying CHECK (payment_status::text = ANY (ARRAY['pending'::character varying, 'paid'::character varying, 'failed'::character varying, 'refunded'::character varying]::text[])),
  payment_method character varying CHECK (payment_method::text = ANY (ARRAY['cash'::character varying, 'online'::character varying, 'card'::character varying, 'wallet'::character varying]::text[])),
  created_by_consumer boolean DEFAULT true,
  booking_reference character varying UNIQUE,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  tokens_awarded boolean DEFAULT false,
  token_award_amount bigint DEFAULT 0,
  CONSTRAINT bookings_pkey PRIMARY KEY (id),
  CONSTRAINT bookings_service_id_fkey FOREIGN KEY (service_id) REFERENCES public.services(id),
  CONSTRAINT bookings_consumer_id_fkey FOREIGN KEY (consumer_id) REFERENCES public.profiles(id),
  CONSTRAINT bookings_provider_id_fkey FOREIGN KEY (provider_id) REFERENCES public.profiles(id)
);

-- Booking statuses table
CREATE TABLE IF NOT EXISTS public.booking_statuses (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  booking_id uuid,
  status text NOT NULL,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT booking_statuses_pkey PRIMARY KEY (id),
  CONSTRAINT booking_statuses_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES public.bookings(id)
);

-- Booking slots table
CREATE TABLE IF NOT EXISTS public.booking_slots (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  provider_id uuid NOT NULL,
  date date NOT NULL,
  start_time time without time zone NOT NULL,
  end_time time without time zone NOT NULL,
  is_booked boolean DEFAULT false,
  booking_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT booking_slots_pkey PRIMARY KEY (id),
  CONSTRAINT booking_slots_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES public.bookings(id),
  CONSTRAINT booking_slots_provider_id_fkey FOREIGN KEY (provider_id) REFERENCES public.profiles(id)
);

-- Provider availability table
CREATE TABLE IF NOT EXISTS public.provider_availability (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  provider_id uuid NOT NULL,
  day_of_week integer NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time time without time zone NOT NULL,
  end_time time without time zone NOT NULL,
  is_available boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT provider_availability_pkey PRIMARY KEY (id),
  CONSTRAINT provider_availability_provider_id_fkey FOREIGN KEY (provider_id) REFERENCES public.profiles(id)
);

-- =====================================================
-- WALLET SYSTEM TABLES
-- =====================================================

-- User wallets table
CREATE TABLE IF NOT EXISTS public.user_wallets (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL UNIQUE,
  token_balance bigint DEFAULT 0 CHECK (token_balance >= 0),
  cash_balance numeric DEFAULT 0.00 CHECK (cash_balance >= 0::numeric),
  total_tokens_earned bigint DEFAULT 0,
  total_cash_redeemed numeric DEFAULT 0.00,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT user_wallets_pkey PRIMARY KEY (id),
  CONSTRAINT user_wallets_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

-- Token transactions table
CREATE TABLE IF NOT EXISTS public.token_transactions (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  transaction_type character varying NOT NULL CHECK (transaction_type::text = ANY (ARRAY['earn'::character varying, 'redeem'::character varying, 'bonus'::character varying, 'spend'::character varying]::text[])),
  amount bigint NOT NULL,
  description text NOT NULL,
  reference_type character varying CHECK (reference_type::text = ANY (ARRAY['signup'::character varying, 'booking'::character varying, 'redemption'::character varying, 'payment'::character varying]::text[])),
  reference_id uuid,
  balance_before bigint NOT NULL,
  balance_after bigint NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT token_transactions_pkey PRIMARY KEY (id),
  CONSTRAINT token_transactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

-- Cash redemptions table
CREATE TABLE IF NOT EXISTS public.cash_redemptions (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  token_amount bigint NOT NULL CHECK (token_amount > 0),
  cash_amount numeric NOT NULL CHECK (cash_amount > 0::numeric),
  exchange_rate numeric NOT NULL,
  status character varying DEFAULT 'pending'::character varying CHECK (status::text = ANY (ARRAY['pending'::character varying, 'completed'::character varying, 'cancelled'::character varying]::text[])),
  processed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  notes text,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  CONSTRAINT cash_redemptions_pkey PRIMARY KEY (id),
  CONSTRAINT cash_redemptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

-- =====================================================
-- REVIEWS AND METRICS
-- =====================================================

-- Reviews table
CREATE TABLE IF NOT EXISTS public.reviews (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  booking_id uuid NOT NULL UNIQUE,
  reviewer_id uuid NOT NULL,
  provider_id uuid NOT NULL,
  service_id uuid NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title character varying,
  review_text text,
  quality_rating integer CHECK (quality_rating >= 1 AND quality_rating <= 5),
  punctuality_rating integer CHECK (punctuality_rating >= 1 AND punctuality_rating <= 5),
  communication_rating integer CHECK (communication_rating >= 1 AND communication_rating <= 5),
  value_rating integer CHECK (value_rating >= 1 AND value_rating <= 5),
  is_anonymous boolean DEFAULT false,
  is_verified boolean DEFAULT true,
  helpful_count integer DEFAULT 0,
  not_helpful_count integer DEFAULT 0,
  provider_response text,
  provider_response_date timestamp with time zone,
  status character varying DEFAULT 'active'::character varying CHECK (status::text = ANY (ARRAY['active'::character varying, 'hidden'::character varying, 'flagged'::character varying, 'deleted'::character varying]::text[])),
  moderation_notes text,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT reviews_pkey PRIMARY KEY (id),
  CONSTRAINT reviews_reviewer_id_fkey FOREIGN KEY (reviewer_id) REFERENCES public.profiles(id),
  CONSTRAINT reviews_provider_id_fkey FOREIGN KEY (provider_id) REFERENCES public.profiles(id),
  CONSTRAINT reviews_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES public.bookings(id),
  CONSTRAINT reviews_service_id_fkey FOREIGN KEY (service_id) REFERENCES public.services(id)
);

-- Provider metrics table
CREATE TABLE IF NOT EXISTS public.provider_metrics (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  provider_id uuid NOT NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  new_requests integer DEFAULT 0,
  upcoming_bookings integer DEFAULT 0,
  completed_jobs integer DEFAULT 0,
  cancelled_jobs integer DEFAULT 0,
  total_revenue numeric DEFAULT 0,
  pending_revenue numeric DEFAULT 0,
  average_job_value numeric DEFAULT 0,
  profile_views integer DEFAULT 0,
  conversion_rate numeric DEFAULT 0,
  average_rating numeric DEFAULT 0,
  total_reviews integer DEFAULT 0,
  average_response_time integer DEFAULT 0,
  acceptance_rate numeric DEFAULT 0,
  completion_rate numeric DEFAULT 0,
  week_over_week_growth numeric DEFAULT 0,
  month_over_month_growth numeric DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT provider_metrics_pkey PRIMARY KEY (id),
  CONSTRAINT provider_metrics_provider_id_fkey FOREIGN KEY (provider_id) REFERENCES public.profiles(id)
);

-- =====================================================
-- ACTIVITY LOGS (Updated with wallet activities)
-- =====================================================

-- Activity logs table (updated to match current schema)
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

-- =====================================================
-- USER SETTINGS
-- =====================================================

-- User settings table
CREATE TABLE IF NOT EXISTS public.user_settings (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL UNIQUE,
  email_notifications boolean DEFAULT true,
  sms_notifications boolean DEFAULT false,
  marketing_emails boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT user_settings_pkey PRIMARY KEY (id),
  CONSTRAINT user_settings_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Booking indexes
CREATE INDEX IF NOT EXISTS idx_bookings_service_id ON public.bookings(service_id);
CREATE INDEX IF NOT EXISTS idx_bookings_consumer_id ON public.bookings(consumer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_provider_id ON public.bookings(provider_id);
CREATE INDEX IF NOT EXISTS idx_bookings_scheduled_date ON public.bookings(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_payment_status ON public.bookings(payment_status);
CREATE INDEX IF NOT EXISTS idx_bookings_tokens_awarded ON public.bookings(tokens_awarded);

-- Wallet indexes
CREATE INDEX IF NOT EXISTS idx_user_wallets_user_id ON public.user_wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_token_transactions_user_id ON public.token_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_token_transactions_type ON public.token_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_token_transactions_reference ON public.token_transactions(reference_type, reference_id);
CREATE INDEX IF NOT EXISTS idx_cash_redemptions_user_id ON public.cash_redemptions(user_id);
CREATE INDEX IF NOT EXISTS idx_cash_redemptions_status ON public.cash_redemptions(status);

-- Provider indexes
CREATE INDEX IF NOT EXISTS idx_provider_availability_provider_id ON public.provider_availability(provider_id);
CREATE INDEX IF NOT EXISTS idx_provider_availability_day_of_week ON public.provider_availability(day_of_week);
CREATE INDEX IF NOT EXISTS idx_booking_slots_provider_id ON public.booking_slots(provider_id);
CREATE INDEX IF NOT EXISTS idx_booking_slots_date ON public.booking_slots(date);
CREATE INDEX IF NOT EXISTS idx_booking_slots_is_booked ON public.booking_slots(is_booked);

-- Activity and settings indexes
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON public.activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_activity_type ON public.activity_logs(activity_type);
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON public.user_settings(user_id);

-- Reviews indexes
CREATE INDEX IF NOT EXISTS idx_reviews_provider ON public.reviews(provider_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_service ON public.reviews(service_id, status);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON public.reviews(rating, status);

-- Provider metrics indexes
CREATE INDEX IF NOT EXISTS idx_provider_metrics_provider_date ON public.provider_metrics(provider_id, date DESC);

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON DATABASE ustahub IS 'UstaHub service marketplace database with integrated wallet system';

COMMENT ON TABLE public.bookings IS 'Main booking table with wallet payment support and token tracking';
COMMENT ON TABLE public.user_wallets IS 'Unified wallet for token and cash balance management';
COMMENT ON TABLE public.token_transactions IS 'Audit trail for all token transactions';
COMMENT ON TABLE public.cash_redemptions IS 'Token to cash redemption requests';
COMMENT ON TABLE public.activity_logs IS 'Activity feed with booking and wallet events';

COMMENT ON COLUMN public.bookings.payment_method IS 'Payment method including wallet option';
COMMENT ON COLUMN public.bookings.tokens_awarded IS 'Whether tokens have been awarded for this booking';
COMMENT ON COLUMN public.bookings.token_award_amount IS 'Amount of tokens awarded for this booking';
COMMENT ON COLUMN public.user_wallets.user_id IS 'References auth.users(id) for unified wallet access';
COMMENT ON COLUMN public.cash_redemptions.exchange_rate IS 'Exchange rate used for conversion (default: 1000 tokens = $1)'; 