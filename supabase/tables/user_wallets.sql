-- User Wallets Table for Token and Cash Balance Management
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_wallets_user_id ON user_wallets(user_id);

-- Enable RLS
ALTER TABLE user_wallets ENABLE ROW LEVEL SECURITY; 