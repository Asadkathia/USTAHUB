-- Award signup bonus function
-- Awards 5000 tokens ($5 equivalent) to new users
CREATE OR REPLACE FUNCTION award_signup_bonus(user_id UUID)
RETURNS VOID AS $$
DECLARE
    signup_bonus BIGINT := 5000; -- 5000 tokens = $5
    existing_wallet_id UUID;
BEGIN
    -- Check if wallet already exists
    SELECT id INTO existing_wallet_id 
    FROM user_wallets 
    WHERE user_wallets.user_id = award_signup_bonus.user_id;
    
    -- Create wallet if doesn't exist
    IF existing_wallet_id IS NULL THEN
        INSERT INTO user_wallets (user_id, token_balance, total_tokens_earned)
        VALUES (award_signup_bonus.user_id, signup_bonus, signup_bonus);
        
        -- Record transaction
        INSERT INTO token_transactions (
            user_id, transaction_type, amount, description, 
            reference_type, balance_before, balance_after
        ) VALUES (
            award_signup_bonus.user_id, 'bonus', signup_bonus, 'Welcome bonus for new users',
            'signup', 0, signup_bonus
        );
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 