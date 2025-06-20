// ========================================
// UstaHub - Navigation JavaScript
// ========================================

// CRITICAL: Disable Bootstrap dropdown auto-initialization for navbar dropdowns
// This prevents conflicts between Bootstrap and our custom dropdown system
document.addEventListener('DOMContentLoaded', function() {
    // Wait for navbar to be mounted first
    setTimeout(() => {
        // Disable Bootstrap dropdown initialization for bottom navbar dropdowns
        const navbarDropdowns = document.querySelectorAll('.bottom-navbar .nav-item.dropdown');
        
        navbarDropdowns.forEach((dropdown, index) => {
            // Remove Bootstrap dropdown attributes to prevent auto-initialization
            dropdown.removeAttribute('data-bs-toggle');
            dropdown.removeAttribute('data-toggle'); // Bootstrap 4 compatibility
            const link = dropdown.querySelector('a');
            if (link) {
                link.removeAttribute('data-bs-toggle');
                link.removeAttribute('data-toggle'); // Bootstrap 4 compatibility
                link.removeAttribute('data-bs-target');
                link.removeAttribute('aria-expanded');
                link.removeAttribute('role');
                // Prevent Bootstrap from handling these dropdowns
                link.classList.remove('dropdown-toggle');
            }
            const menu = dropdown.querySelector('.dropdown-menu');
            if (menu) {
                menu.removeAttribute('data-bs-popper');
                menu.removeAttribute('aria-labelledby');
            }
            
            // Mark as custom-handled to prevent Bootstrap interference
            dropdown.setAttribute('data-custom-dropdown', 'true');
        });
        
        // Initialize our custom dropdown system after disabling Bootstrap
        setTimeout(() => {
            initializeNavbarDropdowns();
        }, 100);
    }, 200); // Increased delay to ensure navbar is mounted
});

// Disable Bootstrap 5 dropdown behavior globally for navbar dropdowns
if (typeof bootstrap !== 'undefined' && bootstrap.Dropdown) {
    // Override Bootstrap 5 dropdown initialization
    const originalGetOrCreateInstance = bootstrap.Dropdown.getOrCreateInstance;
    bootstrap.Dropdown.getOrCreateInstance = function(element, config) {
        // Skip initialization for bottom navbar dropdowns
        if (element && element.closest && element.closest('.bottom-navbar')) {
            return null;
        }
        return originalGetOrCreateInstance.call(this, element, config);
    };
    
    // Also disable auto-initialization via data attributes for navbar dropdowns
    const originalInit = bootstrap.Dropdown.jQueryInterface;
    bootstrap.Dropdown.jQueryInterface = function(config) {
        return this.each(function() {
            if (this.closest && this.closest('.bottom-navbar')) {
                return;
            }
            return originalInit.call(this, config);
        });
    };
}

// Top Navigation Bar
const topNavbar = `
<nav class="custom-navbar top-navbar">
  <div class="container">
    <div class="row align-items-center w-100">
      <div class="col-md-4">
        <div class="nav-left">
          <a href="index-2.html" class="brand"><img src="assets/img/logo.png" alt="UstaHub Logo"></a>
        </div>
      </div>
      <div class="col-md-8">
        <div class="nav-right d-flex justify-content-end align-items-center gap-3">
          <a href="index-2.html" class="nav-link">Home</a>
          <a href="pricing.html" class="nav-link">Pricing</a>
          <a href="about-us.html" class="nav-link">About Us</a>
          <a href="contact.html" class="nav-link">Contact</a>
          <a href="sign-in.html" class="nav-link" id="signInBtn">Sign In</a>
          <a href="register.html" class="nav-link" id="registerBtn">Register</a>
          <a href="#" class="nav-link d-none" id="profileBtn">Profile</a>
          <a href="#" class="nav-link d-none" id="logoutBtn">Logout</a>
        </div>
      </div>
    </div>
  </div>
</nav>`;

// Bottom Navigation Bar
const bottomNavbar = `
<nav class="custom-navbar bottom-navbar">
  <div class="container">
    <div class="nav-center">
      <ul class="nav-menu">
        <li class="nav-item dropdown">
          <a href="service-category.html?category=home-garden">Home & Garden</a>
          <div class="dropdown-menu grid-dropdown">
            <div class="dropdown-col">
              <h6>HOME REPAIR</h6>
              <a href="service-category.html?category=contractors"><i class="fa fa-wrench"></i> Contractors & Handymen</a>
              <a href="service-category.html?category=plumbing"><i class="fa fa-tint"></i> Plumbers</a>
              <a href="service-category.html?category=electrical"><i class="fa fa-bolt"></i> Electricians</a>
              <a href="service-category.html?category=hvac"><i class="fa fa-thermometer-half"></i> Heating & Air Conditioning</a>
              <a href="service-category.html?category=appliances"><i class="fa fa-cogs"></i> Appliances and Repair</a>
            </div>
            <div class="dropdown-col">
              <h6>OUTDOOR</h6>
              <a href="service-category.html?category=landscaping"><i class="fa fa-leaf"></i> Landscaping</a>
              <a href="service-category.html?category=gardening"><i class="fa fa-seedling"></i> Nurseries & Gardening</a>
              <a href="service-category.html?category=florists"><i class="fas fa-spa"></i> Florists</a>
              <a href="service-category.html?category=tree-services"><i class="fa fa-tree"></i> Tree Services</a>
              <a href="service-category.html?category=cleaning"><i class="fa fa-broom"></i> Home Cleaning</a>
            </div>
            <div class="dropdown-col">
              <h6>INSTALLATION</h6>
              <a href="service-category.html?category=roofing"><i class="fa fa-home"></i> Roofing</a>
              <a href="service-category.html?category=locksmiths"><i class="fa fa-key"></i> Locksmiths</a>
              <a href="service-category.html?category=painting"><i class="fa fa-paint-brush"></i> Painters</a>
              <a href="service-category.html?category=furniture"><i class="fa fa-couch"></i> Furniture Stores</a>
              <a href="service-category.html?category=moving"><i class="fa fa-truck"></i> Movers</a>
              <a href="service-category.html?category=carpentry"><i class="fa fa-hammer"></i> Carpentry</a>
            </div>
          </div>
        </li>
        <li class="nav-item dropdown">
          <a href="service-category.html?category=health-beauty">Health & Beauty</a>
          <div class="dropdown-menu grid-dropdown">
            <div class="dropdown-col">
              <h6>HEALTHCARE</h6>
              <a href="service-category.html?category=doctors"><i class="fa fa-user-md"></i> Doctors</a>
              <a href="service-category.html?category=dentists"><i class="fa fa-tooth"></i> Dentists</a>
              <a href="service-category.html?category=therapists"><i class="fa fa-heartbeat"></i> Therapists</a>
              <a href="service-category.html?category=wellness"><i class="fa fa-plus-square"></i> Wellness Centers</a>
            </div>
            <div class="dropdown-col">
              <h6>BEAUTY</h6>
              <a href="service-category.html?category=salons"><i class="fa fa-scissors"></i> Hair Salons</a>
              <a href="service-category.html?category=nails"><i class="fa fa-hand-paper-o"></i> Nail Salons</a>
              <a href="service-category.html?category=spas"><i class="fa fa-leaf"></i> Spas</a>
              <a href="service-category.html?category=beauty"><i class="fa fa-female"></i> Beauty Services</a>
            </div>
            <div class="dropdown-col">
              <h6>THERAPY</h6>
              <a href="service-category.html?category=massage"><i class="fa fa-hand-rock-o"></i> Massage Therapists</a>
              <a href="service-category.html?category=medical"><i class="fa fa-medkit"></i> Medical Services</a>
              <a href="service-category.html?category=health"><i class="fa fa-stethoscope"></i> Health Centers</a>
              <a href="service-category.html?category=therapy"><i class="fa fa-wheelchair"></i> Physical Therapy</a>
            </div>
          </div>
        </li>
        <li class="nav-item dropdown">
          <a href="service-category.html?category=auto-transport">Auto & Transport</a>
          <div class="dropdown-menu grid-dropdown">
            <div class="dropdown-col">
              <h6>AUTO SERVICES</h6>
              <a href="service-category.html?category=auto-repair"><i class="fa fa-wrench"></i> Auto Repair</a>
              <a href="service-category.html?category=car-wash"><i class="fa fa-car"></i> Car Washes</a>
              <a href="service-category.html?category=tire-service"><i class="fa fa-life-ring"></i> Tire Services</a>
              <a href="service-category.html?category=motorcycle"><i class="fa fa-motorcycle"></i> Motorcycle Services</a>
            </div>
            <div class="dropdown-col">
              <h6>TRANSPORT</h6>
              <a href="service-category.html?category=taxi"><i class="fa fa-taxi"></i> Taxi Services</a>
              <a href="service-category.html?category=bus"><i class="fa fa-bus"></i> Bus Services</a>
              <a href="service-category.html?category=train"><i class="fa fa-train"></i> Train Services</a>
              <a href="service-category.html?category=travel"><i class="fa fa-plane"></i> Travel Services</a>
            </div>
            <div class="dropdown-col">
              <h6>LOGISTICS</h6>
              <a href="service-category.html?category=moving"><i class="fa fa-truck"></i> Moving Services</a>
              <a href="service-category.html?category=shipping"><i class="fa fa-ship"></i> Shipping Services</a>
              <a href="service-category.html?category=bicycle"><i class="fa fa-bicycle"></i> Bicycle Services</a>
              <a href="service-category.html?category=parking"><i class="fa fa-square"></i> Parking Services</a>
            </div>
          </div>
        </li>
        <li class="nav-item dropdown">
          <a href="service-category.html?category=business">Business</a>
          <div class="dropdown-menu grid-dropdown">
            <div class="dropdown-col">
              <h6>BUSINESS SERVICES</h6>
              <a href="service-category.html?category=business-services"><i class="fa fa-briefcase"></i> Business Services</a>
              <a href="service-category.html?category=it-services"><i class="fa fa-laptop"></i> IT Services</a>
              <a href="service-category.html?category=marketing"><i class="fa fa-bullhorn"></i> Marketing</a>
              <a href="service-category.html?category=consulting"><i class="fa fa-users"></i> Consulting</a>
            </div>
            <div class="dropdown-col">
              <h6>PROFESSIONAL</h6>
              <a href="service-category.html?category=legal"><i class="fa fa-balance-scale"></i> Legal Services</a>
              <a href="service-category.html?category=accounting"><i class="fa fa-calculator"></i> Accounting</a>
              <a href="service-category.html?category=real-estate"><i class="fa fa-building"></i> Real Estate</a>
              <a href="service-category.html?category=financial"><i class="fa fa-money"></i> Financial Services</a>
            </div>
            <div class="dropdown-col">
              <h6>CREATIVE</h6>
              <a href="service-category.html?category=photography"><i class="fa fa-camera"></i> Photography</a>
              <a href="service-category.html?category=printing"><i class="fa fa-print"></i> Printing Services</a>
              <a href="service-category.html?category=education"><i class="fa fa-graduation-cap"></i> Education</a>
              <a href="service-category.html?category=telecom"><i class="fa fa-phone"></i> Telecom Services</a>
            </div>
          </div>
        </li>
        <li class="nav-item dropdown">
          <a href="service-category.html?category=lifestyle">Lifestyle</a>
          <div class="dropdown-menu grid-dropdown">
            <div class="dropdown-col">
              <h6>FOOD & LEISURE</h6>
              <a href="service-category.html?category=food-dining"><i class="fa fa-utensils"></i> Food & Dining</a>
              <a href="service-category.html?category=cafes"><i class="fa fa-coffee"></i> Cafes</a>
              <a href="service-category.html?category=nightlife"><i class="fa fa-glass"></i> Nightlife</a>
              <a href="service-category.html?category=entertainment"><i class="fa fa-gamepad"></i> Entertainment</a>
            </div>
            <div class="dropdown-col">
              <h6>WELLNESS</h6>
              <a href="service-category.html?category=fitness"><i class="fa fa-dumbbell"></i> Fitness</a>
              <a href="service-category.html?category=pet-services"><i class="fa fa-paw"></i> Pet Services</a>
              <a href="service-category.html?category=childcare"><i class="fa fa-child"></i> Child Care</a>
              <a href="service-category.html?category=events"><i class="fa fa-calendar"></i> Events</a>
            </div>
            <div class="dropdown-col">
              <h6>LEARNING</h6>
              <a href="service-category.html?category=lessons"><i class="fa fa-book"></i> Lessons</a>
              <a href="service-category.html?category=tutoring"><i class="fa fa-chalkboard-teacher"></i> Tutoring</a>
              <a href="service-category.html?category=music"><i class="fa fa-music"></i> Music</a>
              <a href="service-category.html?category=crafts"><i class="fa fa-paint-brush"></i> Crafts</a>
              <a href="service-category.html?category=shopping"><i class="fa fa-shopping-bag"></i> Shopping</a>
            </div>
          </div>
        </li>
        <li class="nav-item dropdown">
          <a href="service-category.html?category=more">More</a>
          <div class="dropdown-menu grid-dropdown">
            <div class="dropdown-col">
              <h6>SPECIALTY</h6>
              <a href="service-category.html?category=technology"><i class="fa fa-laptop"></i> Technology</a>
              <a href="service-category.html?category=veterinary"><i class="fa fa-stethoscope"></i> Veterinary</a>
              <a href="service-category.html?category=wellness"><i class="fa fa-heart"></i> Wellness</a>
            </div>
            <div class="dropdown-col">
              <h6>EVENTS</h6>
              <a href="service-category.html?category=venues"><i class="fa fa-building"></i> Event Venues</a>
              <a href="service-category.html?category=photography"><i class="fa fa-camera"></i> Photography</a>
              <a href="service-category.html?category=music"><i class="fa fa-music"></i> Music & Entertainment</a>
            </div>
            <div class="dropdown-col">
              <h6>MISCELLANEOUS</h6>
              <a href="service-category.html?category=decor"><i class="fa fa-home"></i> Home Decor</a>
              <a href="service-category.html?category=travel"><i class="fa fa-plane"></i> Travel Services</a>
              <a href="service-category.html?category=consulting"><i class="fa fa-comments"></i> Consulting</a>
              <a href="service-category.html?category=other"><i class="fa fa-ellipsis-h"></i> Other Services</a>
            </div>
          </div>
        </li>
      </ul>
    </div>
  </div>
</nav>`;

// Function to handle mobile dropdowns
function handleMobileDropdowns() {
    const dropdowns = document.querySelectorAll('.bottom-navbar .nav-item.dropdown');
    const isMobile = window.innerWidth <= 991;

    dropdowns.forEach(dropdown => {
        const link = dropdown.querySelector('a');
        const menu = dropdown.querySelector('.dropdown-menu');
        
        // Remove existing event listeners by cloning
        const newLink = link.cloneNode(true);
        link.parentNode.replaceChild(newLink, link);
        
        if (isMobile) {
            newLink.addEventListener('click', function(e) {
                e.preventDefault();
                // Close other open dropdowns
                dropdowns.forEach(otherDropdown => {
                    if (otherDropdown !== dropdown) {
                        otherDropdown.classList.remove('active');
                        const otherMenu = otherDropdown.querySelector('.dropdown-menu');
                        if (otherMenu) otherMenu.style.display = 'none';
                    }
                });
                // Toggle current dropdown
                dropdown.classList.toggle('active');
                if (menu) {
                    menu.style.display = menu.style.display === 'grid' ? 'none' : 'grid';
                }
            });
        }
    });
}


// Function to cleanup existing dropdown listeners
function cleanupDropdownListeners() {
    const dropdownMount = document.getElementById('dropdown-mount');
    if (dropdownMount) {
        dropdownMount.innerHTML = '';
    }
    
    // Clear all timeouts
    if (window.dropdownTimeouts) {
        window.dropdownTimeouts.forEach(timeout => clearTimeout(timeout));
        window.dropdownTimeouts = [];
    } else {
        window.dropdownTimeouts = [];
    }
    
    const dropdowns = document.querySelectorAll('.bottom-navbar .nav-item.dropdown');
    dropdowns.forEach(dropdown => {
        dropdown.removeAttribute('data-listeners-attached');
        // Remove all event listeners by cloning
        const newDropdown = dropdown.cloneNode(true);
        dropdown.parentNode.replaceChild(newDropdown, dropdown);
    });
}

// Simplified dropdown positioning function
function handleDropdownPositioning() {
    console.log('🎯 handleDropdownPositioning called');
    const dropdowns = document.querySelectorAll('.bottom-navbar .nav-item.dropdown');
    const dropdownMount = document.getElementById('dropdown-mount');
    
    console.log(`🎯 Found ${dropdowns.length} dropdowns to handle`);

    if (!dropdownMount) {
        console.warn('❌ Dropdown mount point not found');
        return;
    }
    
    console.log('✅ Dropdown mount point found');

    // Clear any existing mounted dropdowns
    dropdownMount.innerHTML = '';
    
    // Initialize timeouts array
    if (!window.dropdownTimeouts) {
        window.dropdownTimeouts = [];
    }

    dropdowns.forEach((dropdown, index) => {
        const link = dropdown.querySelector('a');
        const menu = dropdown.querySelector('.dropdown-menu');
        
        if (!menu || !link) return;

        // Skip if listeners already attached
        if (dropdown.getAttribute('data-listeners-attached') === 'true') return;
        
        let isHovering = false;
        let currentTimeout = null;
        let mountedMenu = null;

        // Desktop hover behavior
        const handleMouseEnter = function() {
            if (window.innerWidth <= 991) return;
            
            // Clear any existing timeout
            if (currentTimeout) {
                clearTimeout(currentTimeout);
                currentTimeout = null;
            }
            
            isHovering = true;
            
            // IMPORTANT: Add a small delay before showing the mounted dropdown
            // This prevents the original dropdown from briefly appearing
            currentTimeout = setTimeout(() => {
                // Clear any existing mounted dropdowns
                dropdownMount.innerHTML = '';
                
                // Calculate position
                const linkRect = link.getBoundingClientRect();
                const viewportWidth = window.innerWidth;
                const viewportHeight = window.innerHeight;
                
                // Clone and position the dropdown
                mountedMenu = menu.cloneNode(true);
                mountedMenu.style.position = 'fixed';
                mountedMenu.style.zIndex = '10000';
                mountedMenu.style.display = 'grid';
                mountedMenu.style.visibility = 'visible';
                mountedMenu.style.opacity = '1';
                mountedMenu.classList.add('dropdown-mounted');
                mountedMenu.setAttribute('data-dropdown-id', index);
                
                // Add to mount point
                dropdownMount.appendChild(mountedMenu);
                
                // Calculate position after adding to DOM
                const dropdownRect = mountedMenu.getBoundingClientRect();
                
                // Center the dropdown under the link
                let left = linkRect.left + (linkRect.width / 2) - (dropdownRect.width / 2);
                let top = linkRect.bottom + 5;
                
                // Adjust for viewport boundaries
                if (left < 10) {
                    left = 10;
                } else if (left + dropdownRect.width > viewportWidth - 10) {
                    left = viewportWidth - dropdownRect.width - 10;
                }
                
                if (top + dropdownRect.height > viewportHeight - 10) {
                    top = linkRect.top - dropdownRect.height - 5;
                }
                
                mountedMenu.style.left = left + 'px';
                mountedMenu.style.top = top + 'px';
                mountedMenu.style.transform = 'none'; // Remove transform since we're calculating exact position
                
                // Add hover listeners to the cloned menu
                mountedMenu.addEventListener('mouseenter', function() {
                    if (currentTimeout) {
                        clearTimeout(currentTimeout);
                        currentTimeout = null;
                    }
                    isHovering = true;
                });
                
                mountedMenu.addEventListener('mouseleave', function() {
                    isHovering = false;
                    currentTimeout = setTimeout(() => {
                        if (!isHovering && mountedMenu) {
                            mountedMenu.remove();
                            mountedMenu = null;
                        }
                    }, 150);
                    window.dropdownTimeouts.push(currentTimeout);
                });
            }, 50); // Small delay to prevent double animation effect
            
            window.dropdownTimeouts.push(currentTimeout);
        };

        const handleMouseLeave = function() {
            if (window.innerWidth <= 991) return;
            
            isHovering = false;
            currentTimeout = setTimeout(() => {
                if (!isHovering && mountedMenu) {
                    mountedMenu.remove();
                    mountedMenu = null;
                }
            }, 150);
            window.dropdownTimeouts.push(currentTimeout);
        };

        // Attach event listeners
        dropdown.addEventListener('mouseenter', handleMouseEnter);
        dropdown.addEventListener('mouseleave', handleMouseLeave);
        
        // Mark as having listeners attached
        dropdown.setAttribute('data-listeners-attached', 'true');
    });
}

// Function to update navbar based on authentication status
async function updateNavbar() {
  try {
    const { data: { session }, error } = await window.supabase.auth.getSession();
    const signInBtn = document.getElementById('signInBtn');
    const registerBtn = document.getElementById('registerBtn');
    const profileBtn = document.getElementById('profileBtn');
    const logoutBtn = document.getElementById('logoutBtn');

    // Ensure all buttons are actually found in the DOM before trying to manipulate them
    if (!signInBtn || !registerBtn || !profileBtn || !logoutBtn) {
        console.warn("Navbar buttons not found, cannot update visibility.");
        return;
    }

    if (error || !session) {
      // User is not logged in
      signInBtn.classList.remove('d-none');
      registerBtn.classList.remove('d-none');
      profileBtn.classList.add('d-none');
      logoutBtn.classList.add('d-none');
      // Clear any potentially attached logout listener if user is now logged out
      if (logoutBtn.dataset.listenerAttached) {
        const newLogoutBtn = logoutBtn.cloneNode(true); // Clone to remove listeners
        logoutBtn.parentNode.replaceChild(newLogoutBtn, logoutBtn);
        // delete newLogoutBtn.dataset.listenerAttached; // Not strictly necessary on new node
      }

    } else {
      // User is logged in
      signInBtn.classList.add('d-none');
      registerBtn.classList.add('d-none');
      profileBtn.classList.remove('d-none');
      logoutBtn.classList.remove('d-none');

      const { data: userProfile, error: profileError } = await window.supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();

      if (profileError) {
        console.error("Error fetching profile for navbar:", profileError);
        profileBtn.href = '#'; // Default or error link
        // Potentially disable or indicate an issue with the profile button
      } else if (userProfile) {
        if (userProfile.role === 'provider') {
          profileBtn.href = 'provider-dashboard.html';
        } else {
          profileBtn.href = 'consumer-profile.html';
        }
      } else {
        // Profile not found, but no explicit error (should not happen with .single() if user exists)
        console.warn("User profile not found for navbar link.");
        profileBtn.href = '#'; // Default or error link
      }

      // Logout functionality - ensure listener is attached only once
      if (!logoutBtn.dataset.listenerAttached) {
        logoutBtn.addEventListener('click', async () => {
          const { error: signOutError } = await window.supabase.auth.signOut();
          if (!signOutError) {
            window.location.href = 'sign-in.html';
          } else {
            console.error("Logout error:", signOutError);
          }
        });
        logoutBtn.dataset.listenerAttached = 'true';
      }
    }
  } catch (err) {
    console.error('Error updating navbar:', err);
  }
}

// Global variables to track initialization
let navbarsInitialized = false;
let resizeTimeout;

// Debug function to check for duplicate event listeners
function checkForDuplicateListeners() {
    console.log('🔍 Checking for duplicate event listeners...');
    const dropdowns = document.querySelectorAll('.bottom-navbar .nav-item.dropdown');
    dropdowns.forEach((dropdown, index) => {
        const hasListeners = dropdown.getAttribute('data-listeners-attached') === 'true';
        console.log(`Dropdown ${index + 1}: ${dropdown.querySelector('a')?.textContent.trim()} - Has listeners: ${hasListeners}`);
    });
    
    // Check for duplicate mounted dropdowns
    const mountedDropdowns = document.querySelectorAll('#dropdown-mount .dropdown-mounted');
    console.log(`Found ${mountedDropdowns.length} mounted dropdowns`);
    
    // Check for any inline styles on original dropdowns
    dropdowns.forEach((dropdown, index) => {
        const menu = dropdown.querySelector('.dropdown-menu');
        if (menu && (menu.style.display !== 'none' && menu.style.display !== '')) {
            console.warn(`⚠️ Original dropdown ${index + 1} has display: ${menu.style.display}`);
        }
    });
}

// Function to initialize all navbar functionality
function initializeNavbars() {
    // Prevent multiple initializations
    if (navbarsInitialized) {
        console.log('⚠️ Navbars already initialized, skipping duplicate initialization');
        return;
    }
    
    console.log('🚀 Initializing navbars...');
    
    // Mount top navbar
    const topNavbarMount = document.getElementById('navbar-top');
    if (topNavbarMount) {
        topNavbarMount.innerHTML = topNavbar;
        updateNavbar();
    }

    // Mount bottom navbar
    const bottomNavbarMount = document.getElementById('navbar-bottom');
    if (bottomNavbarMount) {
        bottomNavbarMount.innerHTML = bottomNavbar;
        
        // Small delay to ensure DOM is ready, then initialize dropdowns
        setTimeout(() => {
            handleMobileDropdowns();
            // Don't call handleDropdownPositioning here - it will be called by initializeNavbarDropdowns
        }, 100);
    }
    
    navbarsInitialized = true;
    console.log('✅ Navbars initialized successfully');
    
    // Run debug check after initialization
    setTimeout(checkForDuplicateListeners, 1000);
}

// Main initialization function for navbar dropdowns (called from DOMContentLoaded)
function initializeNavbarDropdowns() {
    // Prevent multiple initializations
    if (window.navbarDropdownsInitialized) {
        console.log('⚠️ Navbar dropdowns already initialized, skipping');
        return;
    }
    window.navbarDropdownsInitialized = true;
    
    console.log('🎯 initializeNavbarDropdowns called');
    
    // Clean up any existing listeners first
    cleanupDropdownListeners();
    
    // Initialize our custom dropdown system
    console.log('🎯 Calling handleDropdownPositioning...');
    handleDropdownPositioning();
    
    console.log('✅ Navbar dropdowns initialized successfully');
}

// Function to cleanup and reinitialize on resize
function handleResize() {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        // Only reinitialize if navbars were already initialized
        if (navbarsInitialized) {
            console.log('🔄 Reinitializing navbars on resize...');
            // Cleanup existing listeners and dropdowns
            cleanupDropdownListeners();
            
            // Reinitialize with fresh event listeners
            handleMobileDropdowns();
            handleDropdownPositioning();
        }
    }, 250);
}

// Global click handler to close dropdowns when clicking outside - PREVENT DUPLICATES
let globalClickHandlerAttached = false;

function attachGlobalClickHandler() {
    if (globalClickHandlerAttached) return;
    globalClickHandlerAttached = true;
    
    document.addEventListener('click', function(event) {
        const dropdownMount = document.getElementById('dropdown-mount');
        const bottomNavbar = document.querySelector('.bottom-navbar');
        
        if (dropdownMount && bottomNavbar) {
            const clickedInsideNavbar = bottomNavbar.contains(event.target);
            const clickedInsideDropdown = dropdownMount.contains(event.target);
            
            if (!clickedInsideNavbar && !clickedInsideDropdown) {
                // Close all mounted dropdowns
                dropdownMount.innerHTML = '';
                
                // Close mobile dropdowns
                const mobileDropdowns = document.querySelectorAll('.bottom-navbar .nav-item.dropdown.active');
                mobileDropdowns.forEach(dropdown => {
                    dropdown.classList.remove('active');
                    const menu = dropdown.querySelector('.dropdown-menu');
                    if (menu) menu.style.display = 'none';
                });
            }
        }
    });
}

// CONSOLIDATED DOMCONTENTLOADED LISTENER - PREVENT DUPLICATES
let navbarsDOMInitialized = false;

document.addEventListener('DOMContentLoaded', function() {
    if (navbarsDOMInitialized) {
        console.log('⚠️ Navbars DOM already initialized, skipping');
        return;
    }
    navbarsDOMInitialized = true;
    
    console.log('🚀 Navbars DOMContentLoaded initialization...');
    
    // Initialize navbars
    initializeNavbars();
    
    // Attach global click handler
    attachGlobalClickHandler();
    
    console.log('✅ Navbars DOMContentLoaded complete');
});

// Handle window resize - PREVENT DUPLICATES
let resizeHandlerAttached = false;

function attachResizeHandler() {
    if (resizeHandlerAttached) return;
    resizeHandlerAttached = true;
    
    window.addEventListener('resize', handleResize);
}

// Attach resize handler
attachResizeHandler(); 