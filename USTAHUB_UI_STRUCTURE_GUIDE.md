# UstaHub UI Structure & Developer Guide

## Table of Contents
1. [Project Overview](#project-overview)
2. [Directory Structure](#directory-structure)
3. [Page Architecture](#page-architecture)
4. [Component System](#component-system)
5. [Navigation System](#navigation-system)
6. [CSS Architecture](#css-architecture)
7. [JavaScript Architecture](#javascript-architecture)
8. [Mobile-First Approach](#mobile-first-approach)
9. [Customization Guidelines](#customization-guidelines)
10. [Best Practices](#best-practices)

---

## Project Overview

UstaHub is a service marketplace platform connecting customers with local service professionals. The UI is built with:
- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Framework**: Bootstrap 5 for responsive design
- **Icons**: Font Awesome 5.15.4
- **Animations**: AOS (Animate On Scroll) & Animate.css
- **Backend**: Supabase (PostgreSQL)
- **Build**: Vanilla JS with modular components

---

## Directory Structure

```
USTAHUB/
├── assets/                          # Static assets
│   ├── css/                         # Stylesheets
│   │   ├── style.css               # Main stylesheet (4200+ lines)
│   │   ├── mobile-sidebar.css      # Mobile navigation styles
│   │   ├── booking-modal.css       # Booking modal styles
│   │   ├── rtl.css                 # Right-to-left language support
│   │   ├── custom.css              # Custom overrides
│   │   └── user.css                # User-specific styles
│   ├── js/                         # JavaScript modules
│   │   ├── navbars.js              # Navigation system
│   │   ├── mobile-sidebar.js       # Mobile sidebar functionality
│   │   ├── booking-modal.js        # Booking system
│   │   ├── auth.js                 # Authentication
│   │   ├── custom.js               # General utilities
│   │   ├── dashboard.js            # Dashboard functionality
│   │   ├── profile.js              # User profile management
│   │   ├── registration.js         # User registration
│   │   ├── supabase.js             # Database integration
│   │   └── i18n.js                 # Internationalization
│   ├── img/                        # Images and graphics
│   ├── fonts/                      # Font files
│   ├── bootstrap/                  # Bootstrap framework
│   └── icons/                      # Icon sets
├── components/                      # Reusable UI components
│   ├── mobile-sidebar.html         # Mobile navigation drawer
│   └── booking-modal.html          # Booking interface
├── supabase/                       # Database schema & policies
│   ├── tables/                     # Database table definitions
│   ├── policies/                   # Row-level security
│   ├── functions/                  # Database functions
│   └── indexes/                    # Performance indexes
├── index-2.html                    # Homepage (main landing)
├── service-category.html           # Service listings
├── service-details.html            # Individual service pages
├── register.html                   # User registration
├── sign-in.html                    # User login
├── provider-dashboard.html         # Service provider interface
├── consumer-profile.html           # Customer profile
├── about-us.html                   # Company information
├── contact.html                    # Contact page
├── pricing.html                    # Pricing plans
└── ustahub_booking_implementation_plan.txt # Development roadmap
```

---

## Page Architecture

### Standard Page Template
Every page follows this structure:

```html
<!doctype html>
<html lang="en">
<head>
    <!-- Meta tags, CSS imports, external libraries -->
</head>
<body>
    <!-- Dropdown mount point for modals -->
    <div id="dropdown-mount"></div>
    
    <div class="page">
        <!-- Hero Section with Navigation -->
        <div class="hero-header">
            <div class="overlay"></div>
            <!-- Dynamic navbar mount points -->
            <div id="navbar-top"></div>
            <div id="navbar-bottom"></div>
            <!-- Page-specific hero content -->
            <div class="hero-content">
                <div class="container">
                    <h1>Page Title</h1>
                    <p class="subtitle">Page description</p>
                </div>
            </div>
        </div>

        <!-- Main Content -->
        <section class="content">
            <div class="container">
                <!-- Page-specific content -->
            </div>
        </section>

        <!-- Footer -->
        <footer class="footer">
            <!-- Footer content -->
        </footer>
    </div>

    <!-- JavaScript imports -->
</body>
</html>
```

### Key Pages Overview

| Page | Purpose | Key Features |
|------|---------|--------------|
| `index-2.html` | Homepage | Hero carousel, service categories, search |
| `service-category.html` | Service listings | Filterable service grid, category navigation |
| `service-details.html` | Service details | Service info, booking modal, provider details |
| `register.html` | User registration | Multi-step form, role selection |
| `sign-in.html` | User login | Authentication, social login |
| `provider-dashboard.html` | Provider interface | Service management, bookings, analytics |
| `consumer-profile.html` | Customer profile | Profile settings, booking history |

---

## Component System

### Reusable Components

#### 1. Mobile Sidebar (`components/mobile-sidebar.html`)
**Purpose**: Unified mobile navigation across all pages

**Structure**:
```html
<aside id="mobile-sidebar" class="mobile-sidebar">
    <div class="sidebar-header">
        <!-- Logo and close button -->
    </div>
    <div class="sidebar-auth">
        <!-- Authentication buttons/user info -->
    </div>
    <div class="sidebar-search">
        <!-- Search input -->
    </div>
    <nav class="sidebar-menu">
        <!-- Hierarchical service categories -->
    </nav>
</aside>
```

**Usage**: Include on every page with `mobile-sidebar.css` and `mobile-sidebar.js`

#### 2. Booking Modal (`components/booking-modal.html`)
**Purpose**: Service booking interface

**Structure**:
- Multi-step form (4 steps)
- Service details display
- Date/time selection
- Customer information
- Payment method selection

**Usage**: Include on service-related pages

### Component Integration

```javascript
// Example: Loading mobile sidebar
fetch('components/mobile-sidebar.html')
    .then(response => response.text())
    .then(html => {
        document.body.insertAdjacentHTML('beforeend', html);
        // Initialize sidebar functionality
        initializeMobileSidebar();
    });
```

---

## Navigation System

### Dual Navigation Structure

#### 1. Top Navbar (`assets/js/navbars.js`)
**Desktop/Tablet**: Traditional horizontal navigation
```javascript
const topNavbar = `
<nav class="custom-navbar top-navbar">
    <div class="container">
        <div class="nav-left">
            <a href="index-2.html" class="brand">
                <img src="assets/img/logo.png" alt="UstaHub Logo">
            </a>
        </div>
        <div class="nav-right">
            <!-- Navigation links -->
        </div>
    </div>
</nav>`;
```

#### 2. Bottom Navbar
**Desktop/Tablet**: Service category navigation with mega dropdowns
```javascript
const bottomNavbar = `
<nav class="custom-navbar bottom-navbar">
    <div class="container">
        <ul class="nav-menu">
            <li class="nav-item dropdown">
                <a href="service-category.html?category=home-garden">Home & Garden</a>
                <div class="dropdown-menu grid-dropdown">
                    <!-- Subcategory grid -->
                </div>
            </li>
            <!-- More categories -->
        </ul>
    </div>
</nav>`;
```

#### 3. Mobile Sidebar
**Mobile**: Hamburger menu with collapsible categories

### Service Categories Hierarchy

```javascript
const categoryHierarchy = {
    "home-garden": [
        "contractors", "plumbing", "electrical", "hvac", 
        "appliances", "roofing", "locksmiths", "painting",
        "landscaping", "gardening", "florists", "tree-services",
        "cleaning", "furniture", "moving", "carpentry"
    ],
    "health-beauty": [
        "doctors", "dentists", "therapists", "wellness",
        "salons", "nails", "spas", "massage",
        "medical", "health", "therapy", "beauty"
    ],
    "auto-transport": [
        "auto-repair", "car-wash", "tire-service", "taxi",
        "moving", "travel", "bus", "train", "shipping",
        "motorcycle", "bicycle", "parking"
    ],
    "business": [
        "business-services", "it-services", "marketing",
        "education", "real-estate", "financial", "legal",
        "photography", "printing", "telecom", "accounting", "consulting"
    ],
    "lifestyle": [
        "food-dining", "shopping", "fitness", "events",
        "pet-services", "childcare", "lessons", "crafts",
        "music", "entertainment", "cafes", "nightlife", "tutoring"
    ],
    "more": [
        "technology", "decor", "veterinary", "venues", "other"
    ]
};
```

---

## CSS Architecture

### Main Stylesheet (`assets/css/style.css`)
**4200+ lines organized by**:

1. **Classes** (Lines 1-400)
   - Alphabetically organized components
   - `.additional-info`, `.alert`, `.answer`, `.author`, etc.

2. **Element Styling** (Lines 400-800)
   - Global element styles
   - Typography, forms, buttons

3. **Forms** (Lines 800-1200)
   - Form components and validation
   - Input styling, selectize integration

4. **Universal Classes** (Lines 1200-3400)
   - Utility classes
   - Layout helpers, spacing, colors

5. **Responsive** (Lines 3400+)
   - Mobile-first breakpoints
   - Tablet and desktop overrides

### CSS Class Naming Convention

```css
/* Component-based naming */
.hero-carousel { }
.hero-slide { }
.hero-content { }

/* BEM-like modifiers */
.btn { }
.btn-primary { }
.btn-framed { }
.btn-rounded { }

/* Utility classes */
.text-center { }
.mb-4 { }
.shadow-sm { }
```

### Responsive Breakpoints

```css
/* Mobile First */
@media (max-width: 767px) { /* Mobile */ }
@media (min-width: 768px) and (max-width: 991px) { /* Tablet */ }
@media (min-width: 992px) and (max-width: 1199px) { /* Desktop */ }
@media (min-width: 1200px) { /* Large Desktop */ }
```

---

## JavaScript Architecture

### Module Organization

#### Core Modules

1. **`navbars.js`** - Navigation system
   ```javascript
   // Renders top/bottom navbars
   // Handles authentication state
   // Manages mobile dropdown behavior
   ```

2. **`mobile-sidebar.js`** - Mobile navigation
   ```javascript
   // Sidebar toggle functionality
   // Submenu interactions
   // Touch/swipe gestures
   ```

3. **`booking-modal.js`** - Booking system
   ```javascript
   // Multi-step form logic
   // Date/time validation
   // Price calculations
   // Payment integration
   ```

4. **`auth.js`** - Authentication
   ```javascript
   // Supabase auth integration
   // Login/logout functionality
   // Session management
   ```

5. **`supabase.js`** - Database
   ```javascript
   // Database connection
   // API endpoints
   // Real-time subscriptions
   ```

#### Utility Modules

- **`custom.js`** - General utilities and helpers
- **`dashboard.js`** - Provider dashboard functionality
- **`profile.js`** - User profile management
- **`registration.js`** - Multi-step registration
- **`i18n.js`** - Internationalization support

### Event Handling Pattern

```javascript
// Standard event delegation pattern
document.addEventListener('DOMContentLoaded', function() {
    // Initialize components
    initializeNavigation();
    initializeMobileSidebar();
    initializeBookingModal();
});

// Component initialization example
function initializeNavigation() {
    // Load navbar HTML
    loadNavbars();
    
    // Attach event listeners
    attachNavigationEvents();
    
    // Update auth state
    updateAuthenticationState();
}
```

---

## Mobile-First Approach

### Responsive Design Strategy

1. **Mobile Sidebar**: Replaces all navigation on screens < 992px
2. **Touch-Friendly**: All interactive elements sized for touch
3. **Progressive Enhancement**: Desktop features add on top of mobile base

### Mobile-Specific Components

```css
/* Mobile sidebar styling */
.mobile-sidebar {
    position: fixed;
    top: 0;
    left: -300px;
    width: 300px;
    height: 100vh;
    background: #fff;
    transform: translateX(-100%);
    transition: transform 0.3s ease;
}

.mobile-sidebar.open {
    transform: translateX(0);
}
```

### Touch Interactions

```javascript
// Touch/swipe gesture handling
let startX, currentX, isDragging = false;

sidebar.addEventListener('touchstart', (e) => {
    startX = e.touches[0].clientX;
    isDragging = true;
});

sidebar.addEventListener('touchmove', (e) => {
    if (!isDragging) return;
    currentX = e.touches[0].clientX;
    const deltaX = currentX - startX;
    
    if (deltaX < -50) {
        closeSidebar();
    }
});
```

---

## Customization Guidelines

### Adding New Pages

1. **Copy Template Structure**
   ```html
   <!-- Start with standard page template -->
   <!-- Add page-specific meta tags -->
   <!-- Include required CSS/JS -->
   ```

2. **Navigation Integration**
   ```javascript
   // Include navbar mount points
   <div id="navbar-top"></div>
   <div id="navbar-bottom"></div>
   
   // Load navigation script
   <script src="assets/js/navbars.js"></script>
   ```

3. **Mobile Sidebar Integration**
   ```html
   <!-- Include mobile sidebar -->
   <!-- Load sidebar CSS -->
   <link rel="stylesheet" href="assets/css/mobile-sidebar.css">
   <!-- Load sidebar JS -->
   <script src="assets/js/mobile-sidebar.js"></script>
   ```

### Adding New Service Categories

1. **Update Category Hierarchy**
   ```javascript
   // In navbars.js and mobile-sidebar.html
   const categoryHierarchy = {
       "new-category": [
           "subcategory-1",
           "subcategory-2"
       ]
   };
   ```

2. **Add Navigation Links**
   ```html
   <!-- In bottom navbar -->
   <li class="nav-item dropdown">
       <a href="service-category.html?category=new-category">New Category</a>
   </li>
   
   <!-- In mobile sidebar -->
   <li><a href="service-category.html?category=new-category">New Category</a></li>
   ```

3. **Create Category Assets**
   - Add category icon to `assets/img/`
   - Add category descriptions
   - Update service data

### Modifying Existing Components

#### Booking Modal Customization
```javascript
// In booking-modal.js
const bookingSteps = [
    { id: 'step1', title: 'Service Details' },
    { id: 'step2', title: 'Date & Time' },
    { id: 'step3', title: 'Your Information' },
    { id: 'step4', title: 'Payment' }
    // Add new steps here
];
```

#### Sidebar Menu Customization
```html
<!-- In components/mobile-sidebar.html -->
<nav class="sidebar-menu">
    <ul>
        <li><a href="new-page.html"><i class="fas fa-icon"></i> New Menu Item</a></li>
        <!-- Add new menu items here -->
    </ul>
</nav>
```

### Styling Customizations

#### Custom CSS Override Pattern
```css
/* In assets/css/custom.css */
:root {
    --primary-color: #ff0000;
    --secondary-color: #f8f9fa;
    --text-color: #363636;
}

/* Override specific components */
.hero-carousel {
    /* Custom hero styles */
}

.booking-modal {
    /* Custom booking modal styles */
}
```

#### Color Scheme Updates
```css
/* Update primary brand color throughout */
.btn-primary,
.navbar-brand,
.hero-content .btn,
.pricing.featured {
    background-color: var(--primary-color);
}
```

---

## Best Practices

### Performance Optimization

1. **Lazy Loading Components**
   ```javascript
   // Load components only when needed
   async function loadBookingModal() {
       if (!document.getElementById('booking-modal')) {
           const response = await fetch('components/booking-modal.html');
           const html = await response.text();
           document.body.insertAdjacentHTML('beforeend', html);
       }
   }
   ```

2. **CSS Critical Path**
   ```html
   <!-- Inline critical CSS -->
   <style>
       /* Above-the-fold styles */
   </style>
   
   <!-- Async load non-critical CSS -->
   <link rel="preload" href="assets/css/style.css" as="style" onload="this.onload=null;this.rel='stylesheet'">
   ```

3. **JavaScript Module Loading**
   ```javascript
   // Use dynamic imports for large modules
   async function initializeDashboard() {
       const { Dashboard } = await import('./assets/js/dashboard.js');
       new Dashboard();
   }
   ```

### Code Organization

1. **Consistent File Naming**
   - Use kebab-case for files: `mobile-sidebar.js`
   - Use camelCase for JavaScript variables: `mobileNavbar`
   - Use BEM for CSS classes: `.mobile-sidebar__menu-item`

2. **Comment Standards**
   ```javascript
   /**
    * Initializes the booking modal component
    * @param {Object} options - Configuration options
    * @param {string} options.serviceId - The service ID to book
    * @param {number} options.price - Base price for the service
    */
   function initializeBookingModal(options) {
       // Implementation
   }
   ```

3. **Error Handling**
   ```javascript
   // Consistent error handling pattern
   try {
       const response = await fetch('/api/bookings');
       if (!response.ok) {
           throw new Error(`HTTP error! status: ${response.status}`);
       }
       const data = await response.json();
       return data;
   } catch (error) {
       console.error('Booking creation failed:', error);
       showErrorMessage('Failed to create booking. Please try again.');
   }
   ```

### Accessibility Guidelines

1. **ARIA Labels**
   ```html
   <button aria-label="Close sidebar" aria-expanded="false">
   <nav aria-label="Main navigation">
   <div role="dialog" aria-modal="true">
   ```

2. **Keyboard Navigation**
   ```javascript
   // Ensure all interactive elements are keyboard accessible
   element.addEventListener('keydown', (e) => {
       if (e.key === 'Enter' || e.key === ' ') {
           e.preventDefault();
           handleClick();
       }
   });
   ```

3. **Focus Management**
   ```javascript
   // Manage focus for modals and navigation
   function openModal() {
       modal.style.display = 'block';
       modal.querySelector('input').focus();
   }
   ```

### Testing Recommendations

1. **Cross-Browser Testing**
   - Chrome/Edge (Chromium)
   - Firefox
   - Safari (WebKit)
   - Mobile browsers (iOS Safari, Chrome Mobile)

2. **Responsive Testing**
   - Mobile: 320px - 767px
   - Tablet: 768px - 991px
   - Desktop: 992px+

3. **Accessibility Testing**
   - Screen reader compatibility
   - Keyboard-only navigation
   - Color contrast validation

---

## Getting Started for Developers

### Quick Setup

1. **Clone and Navigate**
   ```bash
   git clone [repository-url]
   cd USTAHUB
   ```

2. **Local Development**
   ```bash
   # Serve locally (use any static server)
   npx http-server . -p 8080
   # or
   python -m http.server 8080
   ```

3. **Database Setup**
   ```bash
   # Run Supabase SQL files in order:
   # 1. tables/*.sql
   # 2. policies/*.sql
   # 3. functions/*.sql
   # 4. indexes/*.sql
   ```

### Development Workflow

1. **Make Changes**
   - Edit HTML/CSS/JS files
   - Test in browser with developer tools
   - Check mobile responsiveness

2. **Test Components**
   - Load mobile sidebar on different pages
   - Test booking modal functionality
   - Verify navigation behavior

3. **Deploy**
   - Upload files to web server
   - Update database if schema changed
   - Test production environment

This guide provides the foundation for understanding and working with the UstaHub codebase. For specific implementation details, refer to the individual component files and the implementation plan.