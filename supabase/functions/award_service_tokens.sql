-- Award service completion tokens function
-- Awards 5% of service cost in tokens when booking is completed
CREATE OR REPLACE FUNCTION award_service_tokens(
    booking_id UUID,
    consumer_id UUID,
    service_amount DECIMAL
)
RETURNS BIGINT AS $$
DECLARE
    reward_rate DECIMAL := 0.05; -- 5% reward rate
    token_reward BIGINT;
    current_balance BIGINT;
    new_balance BIGINT;
    existing_transaction_id UUID;
BEGIN
    -- Check if tokens already awarded for this booking
    SELECT id INTO existing_transaction_id
    FROM token_transactions 
    WHERE reference_type = 'booking' 
    AND reference_id = award_service_tokens.booking_id;
    
    -- Only award if not already processed
    IF existing_transaction_id IS NULL THEN
        -- Calculate token reward (5% of service cost in tokens)
        token_reward := FLOOR(service_amount * reward_rate * 1000); -- Convert to tokens (1000 tokens = $1)
        
        -- Ensure minimum reward of 50 tokens
        IF token_reward < 50 THEN
            token_reward := 50;
        END IF;
        
        -- Get current balance
        SELECT token_balance INTO current_balance 
        FROM user_wallets 
        WHERE user_id = award_service_tokens.consumer_id;
        
        -- If wallet doesn't exist, create it
        IF current_balance IS NULL THEN
            INSERT INTO user_wallets (user_id, token_balance, total_tokens_earned)
            VALUES (award_service_tokens.consumer_id, token_reward, token_reward);
            current_balance := 0;
            new_balance := token_reward;
        ELSE
            -- Calculate new balance
            new_balance := current_balance + token_reward;
            
            -- Update wallet
            UPDATE user_wallets 
            SET 
                token_balance = new_balance,
                total_tokens_earned = total_tokens_earned + token_reward,
                updated_at = NOW()
            WHERE user_id = award_service_tokens.consumer_id;
        END IF;
        
        -- Record transaction
        INSERT INTO token_transactions (
            user_id, transaction_type, amount, description,
            reference_type, reference_id, balance_before, balance_after
        ) VALUES (
            award_service_tokens.consumer_id, 'earn', token_reward, 
            'Service completion reward - $' || service_amount::TEXT,
            'booking', award_service_tokens.booking_id, current_balance, new_balance
        );
    END IF;
    
    RETURN COALESCE(token_reward, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 