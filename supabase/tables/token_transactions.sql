-- Token Transactions Table for Audit Trail of All Token Activities
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_token_transactions_user_id ON token_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_token_transactions_type ON token_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_token_transactions_reference ON token_transactions(reference_type, reference_id);

-- Enable RLS
ALTER TABLE token_transactions ENABLE ROW LEVEL SECURITY; 