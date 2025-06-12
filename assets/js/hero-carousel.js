/* ===== HERO CAROUSEL CONSOLIDATED JAVASCRIPT ===== */
/* Single source file for all hero carousel functionality */
/* Eliminates duplications from dashboard.js and inline scripts */

class HeroCarousel {
  constructor() {
    this.slides = document.querySelectorAll('.hero-slide');
    this.dots = document.querySelectorAll('.dot');
    this.prevBtn = document.querySelector('.carousel-control-prev');
    this.nextBtn = document.querySelector('.carousel-control-next');
    this.currentIndex = 0;
    this.autoSlideInterval = null;
    this.autoSlideDelay = 7000; // 7 seconds
    this.touchStartX = 0;
    this.touchEndX = 0;
    this.isTransitioning = false;
    
    this.init();
  }

  init() {
    if (this.slides.length === 0) {
      console.warn('No hero slides found');
      return;
    }

    this.createLiveRegion();
    this.setupEventListeners();
    this.setupAccessibility();
    this.setupTouchHandlers();
    this.startAutoSlide();
    this.showSlide(0);
    
    console.log('Hero carousel initialized with', this.slides.length, 'slides');
  }

  createLiveRegion() {
    // Create accessibility live region for screen readers
    const liveRegion = document.createElement('div');
    liveRegion.id = 'carousel-live-region';
    liveRegion.className = 'visually-hidden';
    liveRegion.setAttribute('aria-live', 'polite');
    liveRegion.setAttribute('aria-atomic', 'true');
    
    const carousel = document.querySelector('.hero-carousel');
    if (carousel) {
      carousel.appendChild(liveRegion);
    }
  }

  setupEventListeners() {
    // Navigation buttons
    if (this.nextBtn) {
      this.nextBtn.addEventListener('click', () => {
        this.nextSlide();
        this.resetAutoSlide();
      });
    }

    if (this.prevBtn) {
      this.prevBtn.addEventListener('click', () => {
        this.prevSlide();
        this.resetAutoSlide();
      });
    }

    // Dots navigation
    this.dots.forEach((dot, index) => {
      dot.addEventListener('click', () => {
        this.showSlide(index);
        this.resetAutoSlide();
      });
    });

    // Pause auto-slide on hover
    const carousel = document.querySelector('.hero-carousel');
    if (carousel) {
      carousel.addEventListener('mouseenter', () => this.pauseAutoSlide());
      carousel.addEventListener('mouseleave', () => this.startAutoSlide());
    }

    // Pause auto-slide on focus within carousel
    document.addEventListener('focusin', (e) => {
      if (carousel && carousel.contains(e.target)) {
        this.pauseAutoSlide();
      }
    });

    document.addEventListener('focusout', (e) => {
      if (carousel && !carousel.contains(e.relatedTarget)) {
        this.startAutoSlide();
      }
    });
  }

  setupAccessibility() {
    // Add ARIA attributes and keyboard support to dots
    this.dots.forEach((dot, index) => {
      dot.setAttribute('role', 'button');
      dot.setAttribute('tabindex', index === 0 ? '0' : '-1');
      dot.setAttribute('aria-label', `Go to slide ${index + 1}`);
      
      dot.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.showSlide(index);
          this.resetAutoSlide();
        } else if (e.key === 'ArrowLeft') {
          e.preventDefault();
          this.focusPrevDot();
        } else if (e.key === 'ArrowRight') {
          e.preventDefault();
          this.focusNextDot();
        }
      });
    });

    // Add ARIA attributes to carousel container
    const carousel = document.querySelector('.hero-carousel');
    if (carousel) {
      carousel.setAttribute('role', 'region');
      carousel.setAttribute('aria-label', 'Image carousel');
    }
  }

  setupTouchHandlers() {
    const carousel = document.querySelector('.hero-carousel');
    if (!carousel) return;

    // Touch events for mobile swiping
    carousel.addEventListener('touchstart', (e) => {
      this.touchStartX = e.touches[0].clientX;
      this.pauseAutoSlide();
    }, { passive: true });

    carousel.addEventListener('touchmove', (e) => {
      this.touchEndX = e.touches[0].clientX;
    }, { passive: true });

    carousel.addEventListener('touchend', (e) => {
      this.handleSwipe();
      this.startAutoSlide();
    }, { passive: true });

    // Mouse events for desktop dragging (optional)
    let isDragging = false;
    
    carousel.addEventListener('mousedown', (e) => {
      isDragging = true;
      this.touchStartX = e.clientX;
      this.pauseAutoSlide();
      e.preventDefault();
    });

    document.addEventListener('mousemove', (e) => {
      if (isDragging) {
        this.touchEndX = e.clientX;
      }
    });

    document.addEventListener('mouseup', (e) => {
      if (isDragging) {
        this.handleSwipe();
        this.startAutoSlide();
        isDragging = false;
      }
    });
  }

  handleSwipe() {
    const swipeThreshold = 50;
    const diffX = this.touchStartX - this.touchEndX;

    if (Math.abs(diffX) > swipeThreshold) {
      if (diffX > 0) {
        this.nextSlide(); // Swipe left - next slide
      } else {
        this.prevSlide(); // Swipe right - previous slide
      }
      this.resetAutoSlide();
    }
  }

  showSlide(index) {
    if (this.isTransitioning || index === this.currentIndex) return;
    
    this.isTransitioning = true;
    
    // Update slides
    this.slides.forEach((slide, i) => {
      slide.classList.toggle('active', i === index);
    });

    // Update dots
    this.dots.forEach((dot, i) => {
      dot.classList.toggle('active', i === index);
      dot.setAttribute('tabindex', i === index ? '0' : '-1');
    });

    // Update live region for screen readers
    const liveRegion = document.getElementById('carousel-live-region');
    if (liveRegion) {
      liveRegion.textContent = `Slide ${index + 1} of ${this.slides.length}`;
    }

    this.currentIndex = index;
    
    // Reset transition flag after animation completes
    setTimeout(() => {
      this.isTransitioning = false;
    }, 700); // Match CSS transition duration
  }

  nextSlide() {
    const nextIndex = (this.currentIndex + 1) % this.slides.length;
    this.showSlide(nextIndex);
  }

  prevSlide() {
    const prevIndex = (this.currentIndex - 1 + this.slides.length) % this.slides.length;
    this.showSlide(prevIndex);
  }

  focusNextDot() {
    const nextIndex = (this.currentIndex + 1) % this.dots.length;
    this.dots[nextIndex].focus();
  }

  focusPrevDot() {
    const prevIndex = (this.currentIndex - 1 + this.dots.length) % this.dots.length;
    this.dots[prevIndex].focus();
  }

  startAutoSlide() {
    this.pauseAutoSlide(); // Clear any existing interval
    this.autoSlideInterval = setInterval(() => {
      this.nextSlide();
    }, this.autoSlideDelay);
  }

  pauseAutoSlide() {
    if (this.autoSlideInterval) {
      clearInterval(this.autoSlideInterval);
      this.autoSlideInterval = null;
    }
  }

  resetAutoSlide() {
    this.pauseAutoSlide();
    this.startAutoSlide();
  }

  // Public methods for external control
  goToSlide(index) {
    if (index >= 0 && index < this.slides.length) {
      this.showSlide(index);
      this.resetAutoSlide();
    }
  }

  getCurrentSlide() {
    return this.currentIndex;
  }

  getTotalSlides() {
    return this.slides.length;
  }

  destroy() {
    this.pauseAutoSlide();
    // Remove event listeners would go here if needed
    console.log('Hero carousel destroyed');
  }
}

// Custom dropdown functionality for hero search
class HeroSearchDropdown {
  constructor() {
    this.dropdowns = document.querySelectorAll('.custom-dropdown-input');
    this.init();
  }

  init() {
    this.dropdowns.forEach(dropdown => {
      this.setupDropdown(dropdown);
    });
  }

  setupDropdown(input) {
    const listId = input.getAttribute('data-list');
    const list = document.getElementById(listId);
    if (!list) return;

    // Position dropdown
    this.positionDropdown(input, list);

    // Toggle dropdown on click
    input.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleDropdown(list);
    });

    // Handle item selection
    list.addEventListener('click', (e) => {
      if (e.target.classList.contains('custom-dropdown-item')) {
        input.value = e.target.textContent;
        this.closeDropdown(list);
      }
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', () => {
      this.closeDropdown(list);
    });
  }

  positionDropdown(input, list) {
    const rect = input.getBoundingClientRect();
    list.style.top = `${rect.bottom + window.scrollY}px`;
    list.style.left = `${rect.left + window.scrollX}px`;
    list.style.width = `${rect.width}px`;
  }

  toggleDropdown(list) {
    const isVisible = list.style.display === 'block';
    this.closeAllDropdowns();
    if (!isVisible) {
      list.style.display = 'block';
    }
  }

  closeDropdown(list) {
    list.style.display = 'none';
  }

  closeAllDropdowns() {
    document.querySelectorAll('.custom-dropdown-list').forEach(list => {
      list.style.display = 'none';
    });
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  // Initialize hero carousel
  const heroCarousel = new HeroCarousel();
  
  // Initialize search dropdowns
  const searchDropdowns = new HeroSearchDropdown();
  
  // Make carousel globally accessible for debugging
  window.heroCarousel = heroCarousel;
  
  console.log('Hero carousel and search functionality initialized');
});

// Handle window resize to reposition dropdowns
window.addEventListener('resize', () => {
  // Reposition any open dropdowns
  document.querySelectorAll('.custom-dropdown-list').forEach(list => {
    if (list.style.display === 'block') {
      const input = document.querySelector(`[data-list="${list.id}"]`);
      if (input) {
        const rect = input.getBoundingClientRect();
        list.style.top = `${rect.bottom + window.scrollY}px`;
        list.style.left = `${rect.left + window.scrollX}px`;
        list.style.width = `${rect.width}px`;
      }
    }
  });
});

// Export for module usage if needed
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { HeroCarousel, HeroSearchDropdown };
} 