-- Cash Redemptions Policies
-- Enable RLS
ALTER TABLE cash_redemptions ENABLE ROW LEVEL SECURITY;

-- Users can view their own redemptions
CREATE POLICY "Users can view own redemptions" ON cash_redemptions
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own redemptions
CREATE POLICY "Users can create redemptions" ON cash_redemptions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Only system can update redemption status
CREATE POLICY "System can update redemption status" ON cash_redemptions
    FOR UPDATE USING (auth.role() = 'service_role');

-- No deletions allowed
CREATE POLICY "No redemption deletions" ON cash_redemptions
    FOR DELETE USING (false); 