-- User Wallets Policies
-- Enable RLS
ALTER TABLE user_wallets ENABLE ROW LEVEL SECURITY;

-- Users can view their own wallet
CREATE POLICY "Users can view own wallet" ON user_wallets
    FOR SELECT USING (auth.uid() = user_id);

-- Users can update their own wallet (for cash redemptions)
CREATE POLICY "Users can update own wallet" ON user_wallets
    FOR UPDATE USING (auth.uid() = user_id);

-- Only authenticated users can insert wallets (via functions)
CREATE POLICY "Authenticated users can insert wallets" ON user_wallets
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- No direct delete allowed
CREATE POLICY "No direct wallet deletion" ON user_wallets
    FOR DELETE USING (false); 