/**
 * UstaHub Wallet System
 * Integrates with existing consumer dashboard and booking modal
 * Handles tokens, wallet balance, and redemptions
 */

// Safe namespace to avoid conflicts
window.WalletSystem = window.WalletSystem || {};

(function() {
    'use strict';

    // Configuration constants
    const CONFIG = {
        TOKENS_PER_DOLLAR: 1000,
        MIN_REDEMPTION_TOKENS: 10000, // $10 minimum
        REDEMPTION_FEE_PERCENT: 0, // No fee for now
        SIGNUP_BONUS: 5000, // 5000 tokens = $5
        REWARD_RATE: 0.05 // 5% of service cost
    };

    // State management
    const state = {
        walletData: null,
        transactions: [],
        isLoading: false,
        user: null
    };

    // Utility functions
    const utils = {
        formatTokens: (tokens) => {
            return tokens?.toLocaleString() || '0';
        },
        
        formatCurrency: (amount) => {
            return `$${(amount || 0).toFixed(2)}`;
        },
        
        tokensToMoney: (tokens) => {
            return (tokens / CONFIG.TOKENS_PER_DOLLAR).toFixed(2);
        },
        
        moneyToTokens: (money) => {
            return Math.floor(money * CONFIG.TOKENS_PER_DOLLAR);
        },
        
        safeQuerySelector: (selector, context = document) => {
            try {
                return context.querySelector(selector);
            } catch (error) {
                console.warn(`Failed to query selector: ${selector}`, error);
                return null;
            }
        },
        
        showToast: (message, type = 'success') => {
            // Use existing toast system if available
            if (window.showToast) {
                window.showToast(message, type);
            } else {
                console.log(`${type.toUpperCase()}: ${message}`);
            }
        }
    };

    // Database operations
    const db = {
        async getUserWallet(userId) {
            try {
                if (!window.supabase) throw new Error('Supabase not available');
                
                const { data, error } = await window.supabase
                    .from('user_wallets')
                    .select('*')
                    .eq('user_id', userId)
                    .single();
                    
                if (error && error.code !== 'PGRST116') throw error;
                return data;
            } catch (error) {
                console.error('Error fetching wallet:', error);
                return null;
            }
        },
        
        async getTransactions(userId, limit = 20) {
            try {
                if (!window.supabase) throw new Error('Supabase not available');
                
                const { data, error } = await window.supabase
                    .from('token_transactions')
                    .select('*')
                    .eq('user_id', userId)
                    .order('created_at', { ascending: false })
                    .limit(limit);
                    
                if (error) throw error;
                return data || [];
            } catch (error) {
                console.error('Error fetching transactions:', error);
                return [];
            }
        },
        
        async redeemTokens(userId, tokenAmount) {
            try {
                if (!window.supabase) throw new Error('Supabase not available');
                
                const cashAmount = parseFloat(utils.tokensToMoney(tokenAmount));
                
                // Create redemption request
                const { data, error } = await window.supabase
                    .from('cash_redemptions')
                    .insert([{
                        user_id: userId,
                        token_amount: tokenAmount,
                        cash_amount: cashAmount,
                        status: 'pending'
                    }])
                    .select()
                    .single();
                    
                if (error) throw error;
                
                // Update wallet balances
                const { error: walletError } = await window.supabase
                    .from('user_wallets')
                    .update({
                        token_balance: state.walletData.token_balance - tokenAmount,
                        cash_balance: state.walletData.cash_balance + cashAmount,
                        updated_at: new Date().toISOString()
                    })
                    .eq('user_id', userId);
                    
                if (walletError) throw walletError;
                
                // Record transaction
                const { error: transactionError } = await window.supabase
                    .from('token_transactions')
                    .insert([{
                        user_id: userId,
                        transaction_type: 'redeem',
                        amount: -tokenAmount,
                        description: `Redeemed ${utils.formatTokens(tokenAmount)} tokens for ${utils.formatCurrency(cashAmount)}`,
                        reference_type: 'redemption',
                        reference_id: data.id,
                        balance_before: state.walletData.token_balance,
                        balance_after: state.walletData.token_balance - tokenAmount
                    }]);
                    
                if (transactionError) throw transactionError;
                
                return data;
            } catch (error) {
                console.error('Error redeeming tokens:', error);
                throw error;
            }
        },
        
        async checkWalletPayment(userId, amount) {
            try {
                const wallet = await this.getUserWallet(userId);
                if (!wallet) return { canPay: false, reason: 'No wallet found' };
                
                if (wallet.cash_balance < amount) {
                    return { 
                        canPay: false, 
                        reason: `Insufficient balance. You have ${utils.formatCurrency(wallet.cash_balance)}, need ${utils.formatCurrency(amount)}` 
                    };
                }
                
                return { canPay: true, wallet };
            } catch (error) {
                console.error('Error checking wallet payment:', error);
                return { canPay: false, reason: 'Error checking wallet balance' };
            }
        }
    };

    // UI Management
    const ui = {
        updateWalletDisplay() {
            if (!state.walletData) return;
            
            // Update token balance
            const tokenElements = document.querySelectorAll('[data-wallet="tokens"]');
            tokenElements.forEach(el => {
                el.textContent = utils.formatTokens(state.walletData.token_balance);
            });
            
            // Update cash balance
            const cashElements = document.querySelectorAll('[data-wallet="cash"]');
            cashElements.forEach(el => {
                el.textContent = utils.formatCurrency(state.walletData.cash_balance);
            });
            
            // Update total earned
            const earnedElements = document.querySelectorAll('[data-wallet="earned"]');
            earnedElements.forEach(el => {
                el.textContent = utils.formatTokens(state.walletData.total_tokens_earned);
            });
            
            // Update booking modal wallet option
            this.updateBookingModalWallet();
        },
        
        updateBookingModalWallet() {
            const walletOption = utils.safeQuerySelector('#walletPaymentOption');
            const walletBalance = utils.safeQuerySelector('#walletBalance');
            
            if (!walletOption || !walletBalance) return;
            
            if (state.walletData && state.walletData.cash_balance > 0) {
                walletOption.style.display = 'block';
                walletBalance.textContent = `Balance: ${utils.formatCurrency(state.walletData.cash_balance)}`;
                
                // Remove disabled class if it exists
                walletOption.classList.remove('disabled');
                const radio = walletOption.querySelector('input[type="radio"]');
                if (radio) radio.disabled = false;
            } else {
                walletOption.style.display = 'none';
            }
        },
        
        showRedemptionModal() {
            if (!state.walletData) {
                utils.showToast('Wallet data not loaded', 'error');
                return;
            }
            
            const maxRedemption = state.walletData.token_balance;
            const minRedemption = CONFIG.MIN_REDEMPTION_TOKENS;
            
            if (maxRedemption < minRedemption) {
                utils.showToast(`You need at least ${utils.formatTokens(minRedemption)} tokens to redeem cash`, 'warning');
                return;
            }
            
            // Create and show redemption modal
            this.createRedemptionModal(maxRedemption, minRedemption);
        },
        
        createRedemptionModal(maxTokens, minTokens) {
            const modalHTML = `
                <div class="modal fade" id="redemptionModal" tabindex="-1">
                    <div class="modal-dialog modal-md">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title">
                                    <i class="fas fa-coins"></i>
                                    Redeem Tokens
                                </h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                            </div>
                            <div class="modal-body">
                                <div class="redemption-form">
                                    <div class="balance-info">
                                        <div class="balance-card">
                                            <div class="balance-icon"><i class="fas fa-coins"></i></div>
                                            <div class="balance-details">
                                                <span class="balance-label">Available Tokens</span>
                                                <span class="balance-amount">${utils.formatTokens(maxTokens)}</span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div class="form-group">
                                        <label for="tokenAmount">Tokens to Redeem</label>
                                        <input type="number" id="tokenAmount" class="form-control" 
                                               min="${minTokens}" max="${maxTokens}" 
                                               placeholder="Enter token amount">
                                        <small class="form-text text-muted">
                                            Minimum: ${utils.formatTokens(minTokens)} tokens (${utils.formatCurrency(utils.tokensToMoney(minTokens))})
                                        </small>
                                    </div>
                                    
                                    <div class="conversion-display">
                                        <div class="conversion-arrow">
                                            <i class="fas fa-arrow-down"></i>
                                        </div>
                                        <div class="cash-amount">
                                            <span class="cash-label">You will receive:</span>
                                            <span class="cash-value" id="cashValue">$0.00</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                                <button type="button" class="btn btn-primary" id="confirmRedemption" disabled>
                                    <i class="fas fa-check"></i>
                                    Confirm Redemption
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            // Remove existing modal if any
            const existingModal = document.getElementById('redemptionModal');
            if (existingModal) existingModal.remove();
            
            // Add modal to DOM
            document.body.insertAdjacentHTML('beforeend', modalHTML);
            
            // Initialize modal functionality
            this.initRedemptionModal();
            
            // Show modal
            const modal = new bootstrap.Modal(document.getElementById('redemptionModal'));
            modal.show();
        },
        
        initRedemptionModal() {
            const tokenInput = document.getElementById('tokenAmount');
            const cashValue = document.getElementById('cashValue');
            const confirmBtn = document.getElementById('confirmRedemption');
            
            if (!tokenInput || !cashValue || !confirmBtn) return;
            
            tokenInput.addEventListener('input', (e) => {
                const tokens = parseInt(e.target.value) || 0;
                const cash = utils.tokensToMoney(tokens);
                cashValue.textContent = utils.formatCurrency(cash);
                
                const isValid = tokens >= CONFIG.MIN_REDEMPTION_TOKENS && 
                               tokens <= state.walletData.token_balance;
                confirmBtn.disabled = !isValid;
            });
            
            confirmBtn.addEventListener('click', () => {
                this.processRedemption();
            });
        },
        
        async processRedemption() {
            const tokenInput = document.getElementById('tokenAmount');
            const tokens = parseInt(tokenInput.value);
            
            if (!tokens || tokens < CONFIG.MIN_REDEMPTION_TOKENS) {
                utils.showToast('Invalid token amount', 'error');
                return;
            }
            
            try {
                const confirmBtn = document.getElementById('confirmRedemption');
                confirmBtn.disabled = true;
                confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
                
                await db.redeemTokens(state.user.id, tokens);
                
                // Refresh wallet data
                await this.loadWalletData();
                
                // Close modal
                const modal = bootstrap.Modal.getInstance(document.getElementById('redemptionModal'));
                modal.hide();
                
                utils.showToast(`Successfully redeemed ${utils.formatTokens(tokens)} tokens!`, 'success');
                
            } catch (error) {
                console.error('Redemption failed:', error);
                utils.showToast('Redemption failed. Please try again.', 'error');
                
                const confirmBtn = document.getElementById('confirmRedemption');
                confirmBtn.disabled = false;
                confirmBtn.innerHTML = '<i class="fas fa-check"></i> Confirm Redemption';
            }
        },
        
        async loadWalletData() {
            if (!state.user) {
                console.warn('No user found for wallet data loading');
                return;
            }
            
            try {
                state.isLoading = true;
                
                const [walletData, transactions] = await Promise.all([
                    db.getUserWallet(state.user.id),
                    db.getTransactions(state.user.id)
                ]);
                
                state.walletData = walletData;
                state.transactions = transactions;
                
                this.updateWalletDisplay();
                
            } catch (error) {
                console.error('Error loading wallet data:', error);
                utils.showToast('Failed to load wallet data', 'error');
            } finally {
                state.isLoading = false;
            }
        }
    };

    // Public API
    window.WalletSystem = {
        // Initialize the wallet system
        async init(user) {
            try {
                state.user = user;
                await ui.loadWalletData();
                this.attachEventListeners();
                console.log('Wallet system initialized successfully');
            } catch (error) {
                console.error('Failed to initialize wallet system:', error);
            }
        },
        
        // Attach event listeners
        attachEventListeners() {
            // Redemption button
            const redeemBtn = utils.safeQuerySelector('[data-action="redeem-tokens"]');
            if (redeemBtn) {
                redeemBtn.addEventListener('click', () => ui.showRedemptionModal());
            }
            
            // Refresh wallet button
            const refreshBtn = utils.safeQuerySelector('[data-action="refresh-wallet"]');
            if (refreshBtn) {
                refreshBtn.addEventListener('click', () => ui.loadWalletData());
            }
        },
        
        // Get current wallet data
        getWalletData() {
            return state.walletData;
        },
        
        // Check if user can pay with wallet
        async canPayWithWallet(amount) {
            if (!state.user) return { canPay: false, reason: 'User not logged in' };
            return await db.checkWalletPayment(state.user.id, amount);
        },
        
        // Refresh wallet data
        async refresh() {
            await ui.loadWalletData();
        },
        
        // Format utilities for external use
        utils: {
            formatTokens: utils.formatTokens,
            formatCurrency: utils.formatCurrency,
            tokensToMoney: utils.tokensToMoney
        }
    };

    // Auto-initialize if user is available
    document.addEventListener('DOMContentLoaded', () => {
        // Check if user is available from existing auth system
        if (window.currentUser) {
            window.WalletSystem.init(window.currentUser);
        }
    });

})(); 