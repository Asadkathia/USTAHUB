// Authentication functions with improved error handling and caching
const auth = {
    // Cache for user profile data
    _profileCache: new Map(),
    
    // Helper function for error handling
    _handleError(error, context) {
        console.error(`${context} error:`, error);
        return { data: null, error };
    },

    // Helper function to clear cache
    _clearCache() {
        this._profileCache.clear();
    },

    // Sign Up
    async signUp(email, password, userData) {
        try {
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: userData,
                    emailRedirectTo: `${window.location.origin}/consumer-profile.html`
                }
            });

            if (authError) throw authError;

            return authData.session 
                ? { data: authData, error: null }
                : { 
                    data: authData, 
                    error: null,
                    message: 'Please check your email to confirm your account'
                };
        } catch (error) {
            return this._handleError(error, 'Signup');
        }
    },

    // Sign In with profile caching
    async signIn(email, password) {
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password
            });

            if (error) throw error;

            if (data.session) {
                const profile = await this._getUserProfile(data.session.user.id);
                return { 
                    data: {
                        ...data,
                        user: {
                            ...data.user,
                            profile
                        }
                    }, 
                    error: null 
                };
            }

            return { data, error: null };
        } catch (error) {
            return this._handleError(error, 'Sign in');
        }
    },

    // Sign Out with cache clearing
    async signOut() {
        try {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;
            this._clearCache();
            window.location.href = 'index-2.html';
        } catch (error) {
            return this._handleError(error, 'Sign out');
        }
    },

    // Get user profile with caching
    async _getUserProfile(userId) {
        // Check cache first
        if (this._profileCache.has(userId)) {
            return this._profileCache.get(userId);
        }

        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (profileError) throw profileError;

        // Cache the profile
        this._profileCache.set(userId, profile);
        return profile;
    },

    // Create Profile with validation
    async createProfile(userId, userData) {
        try {
            // Validate required fields
            if (!userId || !userData || !userData.role) {
                throw new Error('Missing required profile data');
            }

            const { data: existingProfile, error: checkError } = await supabase
                .from('profiles')
                .select('id')
                .eq('id', userId)
                .single();

            if (checkError && checkError.code !== 'PGRST116') {
                throw checkError;
            }

            if (existingProfile) {
                this._profileCache.set(userId, existingProfile);
                return { data: existingProfile, error: null };
            }

            const profileData = {
                id: userId,
                role: userData.role,
                first_name: userData.firstName,
                last_name: userData.lastName,
                phone: userData.phone,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            const { data, error } = await supabase
                .from('profiles')
                .insert([profileData])
                .select()
                .single();

            if (error) throw error;

            // Cache the new profile
            this._profileCache.set(userId, data);
            return { data, error: null };
        } catch (error) {
            return this._handleError(error, 'Create profile');
        }
    },

    // Get Current User with caching
    async getCurrentUser() {
        try {
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();
            
            if (sessionError) throw sessionError;
            if (!session) return { data: null, error: null };

            const profile = await this._getUserProfile(session.user.id);
            return {
                data: {
                    ...session.user,
                    profile
                },
                error: null
            };
        } catch (error) {
            return this._handleError(error, 'Get current user');
        }
    }
};

// Export for use in other files
window.auth = auth; 