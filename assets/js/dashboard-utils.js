// Dashboard Utilities for Enhanced Components
// Provides common functionality for all dashboard components

// ==========================================
// TOAST NOTIFICATION SYSTEM
// ==========================================

class ToastManager {
    constructor() {
        // Defer container creation until needed
    }

    createToastContainer() {
        if (document.getElementById('toast-container')) return;

        // Wait for DOM to be ready
        if (!document.body) {
            setTimeout(() => this.createToastContainer(), 100);
            return;
        }

        const container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'toast-container';
        container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 9999;
            display: flex;
            flex-direction: column;
            gap: 10px;
        `;
        document.body.appendChild(container);
    }

    show(message, type = 'success', duration = 5000) {
        // Ensure container exists
        this.createToastContainer();
        
        const toast = document.createElement('div');
        const toastId = 'toast-' + Date.now();
        toast.id = toastId;
        toast.className = `enhanced-toast toast-${type}`;
        
        const icon = this.getIcon(type);
        
        toast.innerHTML = `
            <div class="toast-content">
                <i class="fas ${icon}"></i>
                <span>${message}</span>
                <button class="toast-close" onclick="toastManager.remove('${toastId}')">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;

        // Add styles
        toast.style.cssText = `
            background: ${this.getBackgroundColor(type)};
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.15);
            display: flex;
            align-items: center;
            min-width: 300px;
            max-width: 400px;
            transform: translateX(100%);
            transition: all 0.3s ease;
            margin-bottom: 10px;
        `;

        const container = document.getElementById('toast-container');
        if (container) {
            container.appendChild(toast);
        }

        // Animate in
        setTimeout(() => {
            toast.style.transform = 'translateX(0)';
        }, 10);

        // Auto remove
        if (duration > 0) {
            setTimeout(() => {
                this.remove(toastId);
            }, duration);
        }

        return toastId;
    }

    remove(toastId) {
        const toast = document.getElementById(toastId);
        if (toast) {
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => {
                toast.remove();
            }, 300);
        }
    }

    getIcon(type) {
        const icons = {
            success: 'fa-check-circle',
            danger: 'fa-exclamation-triangle',
            warning: 'fa-exclamation-circle',
            info: 'fa-info-circle'
        };
        return icons[type] || icons.info;
    }

    getBackgroundColor(type) {
        const colors = {
            success: '#24B47E',
            danger: '#dc3545',
            warning: '#FFC857',
            info: '#17a2b8'
        };
        return colors[type] || colors.info;
    }
}

// Initialize global toast manager
const toastManager = new ToastManager();

// ==========================================
// LOADING STATES
// ==========================================

class LoadingManager {
    show(element, message = 'Loading...') {
        if (!element) return;

        const originalContent = element.innerHTML;
        element.dataset.originalContent = originalContent;
        
        element.innerHTML = `
            <div class="loading-state">
                <div class="loading-spinner"></div>
                <span>${message}</span>
            </div>
        `;
        element.disabled = true;
    }

    hide(element) {
        if (!element) return;

        const originalContent = element.dataset.originalContent;
        if (originalContent) {
            element.innerHTML = originalContent;
            delete element.dataset.originalContent;
        }
        element.disabled = false;
    }

    showOverlay(container, message = 'Loading...') {
        if (!container) return;

        let overlay = container.querySelector('.loading-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.className = 'loading-overlay';
            overlay.style.cssText = `
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(255,255,255,0.9);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 1000;
                border-radius: inherit;
            `;
            container.style.position = 'relative';
            container.appendChild(overlay);
        }

        overlay.innerHTML = `
            <div class="loading-content">
                <div class="loading-spinner"></div>
                <span style="margin-top: 10px; color: #24B47E; font-weight: 500;">${message}</span>
            </div>
        `;
    }

    hideOverlay(container) {
        if (!container) return;
        
        const overlay = container.querySelector('.loading-overlay');
        if (overlay) {
            overlay.remove();
        }
    }
}

const loadingManager = new LoadingManager();

// ==========================================
// ANIMATION UTILITIES
// ==========================================

class AnimationUtils {
    fadeIn(element, duration = 300) {
        if (!element) return;

        element.style.opacity = '0';
        element.style.transition = `opacity ${duration}ms ease`;
        element.style.display = 'block';

        setTimeout(() => {
            element.style.opacity = '1';
        }, 10);
    }

    fadeOut(element, duration = 300) {
        if (!element) return;

        element.style.transition = `opacity ${duration}ms ease`;
        element.style.opacity = '0';

        setTimeout(() => {
            element.style.display = 'none';
        }, duration);
    }

    slideDown(element, duration = 300) {
        if (!element) return;

        element.style.height = '0';
        element.style.overflow = 'hidden';
        element.style.transition = `height ${duration}ms ease`;
        element.style.display = 'block';

        const targetHeight = element.scrollHeight + 'px';
        setTimeout(() => {
            element.style.height = targetHeight;
        }, 10);

        setTimeout(() => {
            element.style.height = 'auto';
            element.style.overflow = 'visible';
        }, duration);
    }

    slideUp(element, duration = 300) {
        if (!element) return;

        element.style.height = element.scrollHeight + 'px';
        element.style.overflow = 'hidden';
        element.style.transition = `height ${duration}ms ease`;

        setTimeout(() => {
            element.style.height = '0';
        }, 10);

        setTimeout(() => {
            element.style.display = 'none';
        }, duration);
    }

    addRippleEffect(element) {
        element.addEventListener('click', function(e) {
            const ripple = document.createElement('span');
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;
            
            ripple.style.cssText = `
                position: absolute;
                border-radius: 50%;
                transform: scale(0);
                animation: ripple 0.6s linear;
                background-color: rgba(255,255,255,0.7);
                width: ${size}px;
                height: ${size}px;
                left: ${x}px;
                top: ${y}px;
                pointer-events: none;
            `;
            
            this.style.position = 'relative';
            this.style.overflow = 'hidden';
            this.appendChild(ripple);
            
            setTimeout(() => ripple.remove(), 600);
        });
    }

    countUp(element, target, duration = 1000) {
        if (!element) return;

        const start = parseInt(element.textContent) || 0;
        const range = target - start;
        const startTime = performance.now();

        const update = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = this.easeOutQuart(progress);
            const current = Math.floor(start + (range * eased));
            
            element.textContent = current.toLocaleString();
            
            if (progress < 1) {
                requestAnimationFrame(update);
            }
        };

        requestAnimationFrame(update);
    }

    easeOutQuart(t) {
        return 1 - (--t) * t * t * t;
    }
}

const animationUtils = new AnimationUtils();

// ==========================================
// FORM UTILITIES
// ==========================================

class FormUtils {
    validate(form) {
        if (!form) return false;

        const requiredFields = form.querySelectorAll('[required]');
        let isValid = true;

        requiredFields.forEach(field => {
            this.clearFieldError(field);
            
            if (!field.value.trim()) {
                this.showFieldError(field, 'This field is required');
                isValid = false;
            } else if (field.type === 'email' && !this.isValidEmail(field.value)) {
                this.showFieldError(field, 'Please enter a valid email address');
                isValid = false;
            } else if (field.type === 'number' && isNaN(field.value)) {
                this.showFieldError(field, 'Please enter a valid number');
                isValid = false;
            }
        });

        return isValid;
    }

    showFieldError(field, message) {
        field.classList.add('error');
        
        let errorElement = field.parentNode.querySelector('.field-error');
        if (!errorElement) {
            errorElement = document.createElement('div');
            errorElement.className = 'field-error';
            errorElement.style.cssText = `
                color: #dc3545;
                font-size: 0.875rem;
                margin-top: 4px;
                display: flex;
                align-items: center;
                gap: 4px;
            `;
            field.parentNode.appendChild(errorElement);
        }
        
        errorElement.innerHTML = `<i class="fas fa-exclamation-triangle"></i>${message}`;
    }

    clearFieldError(field) {
        field.classList.remove('error');
        
        const errorElement = field.parentNode.querySelector('.field-error');
        if (errorElement) {
            errorElement.remove();
        }
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    serialize(form) {
        const formData = new FormData(form);
        const data = {};
        
        for (let [key, value] of formData.entries()) {
            data[key] = value;
        }
        
        return data;
    }
}

const formUtils = new FormUtils();

// ==========================================
// DATE/TIME UTILITIES
// ==========================================

class DateUtils {
    formatTimeAgo(date) {
        const now = new Date();
        const diffMs = now - new Date(date);
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
        if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
        
        return new Date(date).toLocaleDateString();
    }

    formatDate(date, options = {}) {
        const defaultOptions = {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        };
        
        return new Date(date).toLocaleDateString('en-US', { ...defaultOptions, ...options });
    }

    formatTime(date) {
        return new Date(date).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }
}

const dateUtils = new DateUtils();

// ==========================================
// NUMBER UTILITIES
// ==========================================

class NumberUtils {
    formatCurrency(amount, currency = 'USD') {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency
        }).format(amount);
    }

    formatNumber(number) {
        return new Intl.NumberFormat('en-US').format(number);
    }

    formatPercentage(value, decimals = 1) {
        return (value * 100).toFixed(decimals) + '%';
    }
}

const numberUtils = new NumberUtils();

// ==========================================
// GLOBAL UTILS OBJECT
// ==========================================

window.utils = {
    toast: toastManager,
    loading: loadingManager,
    animation: animationUtils,
    form: formUtils,
    date: dateUtils,
    number: numberUtils,
    
    // Backward compatibility
    showToast: (message, type, duration) => toastManager.show(message, type, duration),
    hideLoading: (element) => loadingManager.hide(element),
    showLoading: (element, message) => loadingManager.show(element, message)
};

// ==========================================
// CSS INJECTION FOR UTILITIES
// ==========================================

const utilityStyles = `
.enhanced-toast {
    font-family: 'Poppins', sans-serif;
    font-size: 14px;
    border-left: 4px solid rgba(255,255,255,0.3);
}

.enhanced-toast .toast-content {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
}

.enhanced-toast .toast-close {
    background: none;
    border: none;
    color: rgba(255,255,255,0.8);
    cursor: pointer;
    padding: 0;
    margin-left: auto;
    font-size: 12px;
    transition: color 0.2s ease;
}

.enhanced-toast .toast-close:hover {
    color: white;
}

.loading-spinner {
    display: inline-block;
    width: 20px;
    height: 20px;
    border: 2px solid #f3f3f3;
    border-top: 2px solid #24B47E;
    border-radius: 50%;
    animation: spin 1s linear infinite;
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}

@keyframes ripple {
    to {
        transform: scale(4);
        opacity: 0;
    }
}

.enhanced-form-control.error {
    border-color: #dc3545;
    box-shadow: 0 0 0 3px rgba(220, 53, 69, 0.1);
}

.loading-state {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    color: #24B47E;
    font-weight: 500;
}

.loading-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
}
`;

// Inject utility styles
if (!document.getElementById('dashboard-utils-styles')) {
    const styleSheet = document.createElement('style');
    styleSheet.id = 'dashboard-utils-styles';
    styleSheet.textContent = utilityStyles;
    document.head.appendChild(styleSheet);
}

 