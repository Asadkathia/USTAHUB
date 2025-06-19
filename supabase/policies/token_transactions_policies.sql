-- Token Transactions Policies
-- Enable RLS
ALTER TABLE token_transactions ENABLE ROW LEVEL SECURITY;

-- Users can view their own transactions
CREATE POLICY "Users can view own transactions" ON token_transactions
    FOR SELECT USING (auth.uid() = user_id);

-- Only system functions can insert transactions
CREATE POLICY "System can insert transactions" ON token_transactions
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- No updates or deletes allowed
CREATE POLICY "No transaction updates" ON token_transactions
    FOR UPDATE USING (false);

CREATE POLICY "No transaction deletions" ON token_transactions
    FOR DELETE USING (false); 