-- Cash Redemptions Table for Token to Cash Conversion Requests
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_cash_redemptions_user_id ON cash_redemptions(user_id);
CREATE INDEX IF NOT EXISTS idx_cash_redemptions_status ON cash_redemptions(status);

-- Enable RLS
ALTER TABLE cash_redemptions ENABLE ROW LEVEL SECURITY; 