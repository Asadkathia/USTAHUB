-- Create user wallet trigger function
-- Automatically creates wallet and awards signup bonus when profile is created
CREATE OR REPLACE FUNCTION create_user_wallet()
RETURNS TRIGGER AS $$
BEGIN
    -- Award signup bonus (this function will create the wallet)
    PERFORM award_signup_bonus(NEW.id);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger that fires after profile insertion
DROP TRIGGER IF EXISTS create_wallet_on_profile_insert ON profiles;
CREATE TRIGGER create_wallet_on_profile_insert
    AFTER INSERT ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION create_user_wallet(); 