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
              <a href="service-category.html?category=contractors"><i class="fa fa-wrench"></i> Contractors & Handymen</a>
              <a href="service-category.html?category=plumbing"><i class="fa fa-tint"></i> Plumbers</a>
              <a href="service-category.html?category=electrical"><i class="fa fa-bolt"></i> Electricians</a>
              <a href="service-category.html?category=hvac"><i class="fa fa-snowflake-o"></i> Heating & Air Conditioning</a>
              <a href="service-category.html?category=appliances"><i class="fa fa-cogs"></i> Appliances and Repair</a>
              <a href="service-category.html?category=roofing"><i class="fa fa-home"></i> Roofing</a>
              <a href="service-category.html?category=locksmiths"><i class="fa fa-unlock-alt"></i> Locksmiths</a>
              <a href="service-category.html?category=painting"><i class="fa fa-paint-brush"></i> Painters</a>
            </div>
            <div class="dropdown-col">
              <a href="service-category.html?category=landscaping"><i class="fa fa-leaf"></i> Landscaping</a>
              <a href="service-category.html?category=gardening"><i class="fa fa-tree"></i> Nurseries & Gardening</a>
              <a href="service-category.html?category=florists"><i class="fa fa-pagelines"></i> Florists</a>
              <a href="service-category.html?category=tree-services"><i class="fa fa-tree"></i> Tree Services</a>
              <a href="service-category.html?category=cleaning"><i class="fa fa-broom"></i> Home Cleaning</a>
              <a href="service-category.html?category=furniture"><i class="fa fa-couch"></i> Furniture Stores</a>
              <a href="service-category.html?category=moving"><i class="fa fa-truck"></i> Movers</a>
            </div>
          </div>
        </li>
        <li class="nav-item dropdown">
          <a href="service-category.html?category=health-beauty">Health & Beauty</a>
          <div class="dropdown-menu grid-dropdown">
            <div class="dropdown-col">
              <a href="service-category.html?category=doctors"><i class="fa fa-user-md"></i> Doctors</a>
              <a href="service-category.html?category=dentists"><i class="fa fa-hospital-o"></i> Dentists</a>
              <a href="service-category.html?category=therapists"><i class="fa fa-heartbeat"></i> Therapists</a>
              <a href="service-category.html?category=wellness"><i class="fa fa-plus-square"></i> Wellness Centers</a>
              <a href="service-category.html?category=salons"><i class="fa fa-scissors"></i> Hair Salons</a>
              <a href="service-category.html?category=nails"><i class="fa fa-hand-o-right"></i> Nail Salons</a>
            </div>
            <div class="dropdown-col">
              <a href="service-category.html?category=spas"><i class="fa fa-spa"></i> Spas</a>
              <a href="service-category.html?category=massage"><i class="fa fa-hand-spock-o"></i> Massage Therapists</a>
              <a href="service-category.html?category=wellness"><i class="fa fa-heart"></i> Wellness</a>
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
              <a href="service-category.html?category=auto-repair"><i class="fa fa-wrench"></i> Auto Repair</a>
              <a href="service-category.html?category=car-wash"><i class="fa fa-car"></i> Car Washes</a>
              <a href="service-category.html?category=tire-service"><i class="fa fa-tachometer"></i> Tire Services</a>
              <a href="service-category.html?category=taxi"><i class="fa fa-taxi"></i> Taxi Services</a>
              <a href="service-category.html?category=moving"><i class="fa fa-truck"></i> Moving Services</a>
              <a href="service-category.html?category=travel"><i class="fa fa-plane"></i> Travel Services</a>
            </div>
            <div class="dropdown-col">
              <a href="service-category.html?category=bus"><i class="fa fa-bus"></i> Bus Services</a>
              <a href="service-category.html?category=train"><i class="fa fa-train"></i> Train Services</a>
              <a href="service-category.html?category=shipping"><i class="fa fa-ship"></i> Shipping Services</a>
              <a href="service-category.html?category=motorcycle"><i class="fa fa-motorcycle"></i> Motorcycle Services</a>
              <a href="service-category.html?category=bicycle"><i class="fa fa-bicycle"></i> Bicycle Services</a>
              <a href="service-category.html?category=parking"><i class="fa fa-parking"></i> Parking Services</a>
            </div>
          </div>
        </li>
        <li class="nav-item dropdown">
          <a href="service-category.html?category=business">Business</a>
          <div class="dropdown-menu grid-dropdown">
            <div class="dropdown-col">
              <a href="service-category.html?category=business-services"><i class="fa fa-briefcase"></i> Business Services</a>
              <a href="service-category.html?category=it-services"><i class="fa fa-laptop"></i> IT Services</a>
              <a href="service-category.html?category=marketing"><i class="fa fa-bullhorn"></i> Marketing</a>
              <a href="service-category.html?category=education"><i class="fa fa-graduation-cap"></i> Education</a>
              <a href="service-category.html?category=real-estate"><i class="fa fa-building"></i> Real Estate</a>
              <a href="service-category.html?category=financial"><i class="fa fa-money"></i> Financial Services</a>
            </div>
            <div class="dropdown-col">
              <a href="service-category.html?category=legal"><i class="fa fa-balance-scale"></i> Legal Services</a>
              <a href="service-category.html?category=photography"><i class="fa fa-camera"></i> Photography</a>
              <a href="service-category.html?category=printing"><i class="fa fa-print"></i> Printing Services</a>
              <a href="service-category.html?category=telecom"><i class="fa fa-phone"></i> Telecom Services</a>
              <a href="service-category.html?category=accounting"><i class="fa fa-calculator"></i> Accounting</a>
              <a href="service-category.html?category=consulting"><i class="fa fa-chart-line"></i> Consulting</a>
            </div>
          </div>
        </li>
        <li class="nav-item dropdown">
          <a href="service-category.html?category=lifestyle">Lifestyle</a>
          <div class="dropdown-menu grid-dropdown">
            <div class="dropdown-col">
              <a href="service-category.html?category=food-dining"><i class="fa fa-cutlery"></i> Food & Dining</a>
              <a href="service-category.html?category=shopping"><i class="fa fa-shopping-bag"></i> Shopping</a>
              <a href="service-category.html?category=fitness"><i class="fa fa-dumbbell"></i> Fitness</a>
              <a href="service-category.html?category=events"><i class="fa fa-calendar"></i> Events</a>
              <a href="service-category.html?category=pet-services"><i class="fa fa-paw"></i> Pet Services</a>
              <a href="service-category.html?category=childcare"><i class="fa fa-child"></i> Child Care</a>
            </div>
            <div class="dropdown-col">
              <a href="service-category.html?category=lessons"><i class="fa fa-book"></i> Lessons</a>
              <a href="service-category.html?category=crafts"><i class="fa fa-paint-brush"></i> Crafts</a>
              <a href="service-category.html?category=music"><i class="fa fa-music"></i> Music</a>
              <a href="service-category.html?category=entertainment"><i class="fa fa-gamepad"></i> Entertainment</a>
              <a href="service-category.html?category=cafes"><i class="fa fa-coffee"></i> Cafes</a>
              <a href="service-category.html?category=nightlife"><i class="fa fa-glass"></i> Nightlife</a>
            </div>
          </div>
        </li>
        <li class="nav-item dropdown">
          <a href="service-category.html?category=more">More</a>
          <div class="dropdown-menu grid-dropdown">
            <div class="dropdown-col">
              <a href="service-category.html?category=technology"><i class="fa fa-laptop"></i> Technology</a>
              <a href="service-category.html?category=education"><i class="fa fa-graduation-cap"></i> Education</a>
              <a href="service-category.html?category=photography"><i class="fa fa-camera"></i> Photography</a>
              <a href="service-category.html?category=music"><i class="fa fa-music"></i> Music & Entertainment</a>
              <a href="service-category.html?category=events"><i class="fa fa-calendar"></i> Event Planning</a>
              <a href="service-category.html?category=pet-care"><i class="fa fa-paw"></i> Pet Care</a>
            </div>
            <div class="dropdown-col">
              <a href="service-category.html?category=travel"><i class="fa fa-plane"></i> Travel Services</a>
              <a href="service-category.html?category=consulting"><i class="fa fa-comments"></i> Consulting</a>
              <a href="service-category.html?category=decor"><i class="fa fa-paint-brush"></i> Home Decor</a>
              <a href="service-category.html?category=wellness"><i class="fa fa-heart"></i> Wellness</a>
              <a href="service-category.html?category=veterinary"><i class="fa fa-stethoscope"></i> Veterinary</a>
              <a href="service-category.html?category=venues"><i class="fa fa-glass"></i> Event Venues</a>
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
        
        // Remove existing event listeners
        const newLink = link.cloneNode(true);
        link.parentNode.replaceChild(newLink, link);
        
        if (isMobile) {
            newLink.addEventListener('click', function(e) {
                e.preventDefault();
                // Close other open dropdowns
                dropdowns.forEach(otherDropdown => {
                    if (otherDropdown !== dropdown) {
                        otherDropdown.classList.remove('active');
                        otherDropdown.querySelector('.dropdown-menu').style.display = 'none';
                    }
                });
                // Toggle current dropdown
                dropdown.classList.toggle('active');
                menu.style.display = menu.style.display === 'grid' ? 'none' : 'grid';
            });
        }
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

// Mount the navigation bars when the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
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
        // Initialize mobile dropdowns after mounting
        handleMobileDropdowns();
    }
});

// Handle window resize for mobile dropdowns
window.addEventListener('resize', handleMobileDropdowns); 