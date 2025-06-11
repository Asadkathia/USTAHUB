/*
  UstaHub Mobile Sidebar Drawer Logic
  --------------------------------------
  Handles all sidebar open/close, overlay, submenu, and accessibility logic for mobile navigation.
  Only initialize once per page. Import this file on every page that uses the sidebar.
*/

(function() {
  // Check if sidebar is already initialized to prevent duplicate event listeners
  if (window.__ustaSidebarInitialized) return;
  window.__ustaSidebarInitialized = true;

  // FOR TESTING: Simulate login/logout with URL params
  // Add ?login=true or ?logout=true to URL to test
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has('login')) {
    // Set auth cookie and local storage for testing
    localStorage.setItem('ustahub_auth_token', 'test-token');
    localStorage.setItem('ustahub_user_data', JSON.stringify({
      name: 'Test User',
      email: 'test@example.com'
    }));
    document.cookie = 'ustahub_logged_in=true; path=/;';
    console.log('Test login activated');
  }
  if (urlParams.has('logout')) {
    // Clear auth data for testing
    localStorage.removeItem('ustahub_auth_token');
    localStorage.removeItem('ustahub_user_data');
    sessionStorage.removeItem('ustahub_user_data');
    document.cookie = 'ustahub_logged_in=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    console.log('Test logout activated');
  }

  // Create hamburger trigger immediately - don't wait for sidebar to be loaded
  let trigger = document.querySelector('.sidebar-trigger');
  if (!trigger) {
    trigger = document.createElement('button');
    trigger.className = 'sidebar-trigger';
    trigger.setAttribute('aria-label', 'Open menu');
    trigger.innerHTML = '<i class="fas fa-bars" aria-hidden="true"></i>';
    
    // Initially hide the trigger - checkMobileView will show it if needed
    trigger.style.cssText = `
      display: none !important;
      position: fixed !important;
      top: 1.1rem !important;
      left: 1.1rem !important;
      right: auto !important;
      z-index: 1300 !important;
      width: 44px !important;
      height: 44px !important;
      background: #fff !important;
      border-radius: 50% !important;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1) !important;
      border: none !important;
      align-items: center !important;
      justify-content: center !important;
      cursor: pointer !important;
      opacity: 1 !important;
      visibility: visible !important;
    `;
    
    // Add click event listener immediately
    trigger.addEventListener('click', function() {
      console.log('Mobile sidebar trigger clicked');
      const sidebar = document.getElementById('mobile-sidebar');
      const overlay = document.getElementById('sidebar-overlay');
      
      if (sidebar && overlay) {
        openSidebar();
      } else {
        console.log('Sidebar elements not yet loaded, trigger will be reconnected when sidebar loads');
      }
    });
    
    document.body.appendChild(trigger);
    console.log('Mobile sidebar trigger created immediately - initially hidden');
  }

  // Wait for DOM to fully load before initializing the rest
  document.addEventListener('DOMContentLoaded', function() {
    initSidebar();
  });

  // Also try initializing immediately in case DOMContentLoaded already fired
  if (document.readyState === 'interactive' || document.readyState === 'complete') {
    setTimeout(initSidebar, 100);
  }

  function initSidebar() {
    const sidebar = document.getElementById('mobile-sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    
    // Try to find the trigger again in case it wasn't added above
    trigger = document.querySelector('.sidebar-trigger');
    
    // Early exit if sidebar elements don't exist, but ensure trigger exists
    if (!sidebar || !overlay) {
      if (!trigger) {
        createTrigger();
      }
      return;
    }
    
    // Variables
    const closeBtn = document.getElementById('sidebarCloseBtn');
    const submenuToggles = sidebar.querySelectorAll('.submenu-toggle');
    const focusableSelectors = 'a, button, input, [tabindex]:not([tabindex="-1"])';
    let lastFocusedElement = null;

    // Make sure trigger exists
    if (!trigger) {
      createTrigger();
    }

    // Check user authentication status and update UI
    updateAuthUI();

    // Add logout functionality
    const logoutBtn = document.getElementById('sidebarLogoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', handleLogout);
    }

    function createTrigger() {
      // Check if trigger already exists (created immediately on page load)
      trigger = document.querySelector('.sidebar-trigger');
      if (!trigger) {
      trigger = document.createElement('button');
      trigger.className = 'sidebar-trigger';
      trigger.setAttribute('aria-label', 'Open menu');
      trigger.innerHTML = '<i class="fas fa-bars" aria-hidden="true"></i>';
      document.body.appendChild(trigger);
        console.log('Mobile sidebar trigger created in initSidebar');
      } else {
        console.log('Using existing mobile sidebar trigger');
      }
      
      // Initially hide the trigger - checkMobileView will show it if mobile
      trigger.style.cssText = `
        display: none !important;
        position: fixed !important;
        top: 1.1rem !important;
        left: 1.1rem !important;
        right: auto !important;
        z-index: 1300 !important;
        width: 44px !important;
        height: 44px !important;
        background: #fff !important;
        border-radius: 50% !important;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1) !important;
        border: none !important;
        align-items: center !important;
        justify-content: center !important;
        cursor: pointer !important;
        opacity: 1 !important;
        visibility: visible !important;
      `;
      
      // Remove existing listeners and add new one
      trigger.removeEventListener('click', openSidebar);
      trigger.addEventListener('click', openSidebar);
      console.log('Mobile sidebar trigger updated and connected - initially hidden');
      
      // Check if should be visible based on current screen size
      checkMobileView();
    }

    // Check if user is logged in and update auth UI accordingly
    async function updateAuthUI() {
      const guestAuthSection = document.getElementById('sidebar-guest-auth');
      const userAuthSection = document.getElementById('sidebar-user-auth');
      
      if (!guestAuthSection || !userAuthSection) {
        console.error('Auth sections not found in sidebar');
        return;
      }
      
      try {
        // Use the correct Supabase method to get session
        let session = null;
        let isLoggedIn = false;
        
        if (window.supabase && typeof window.supabase.auth.getSession === 'function') {
          // Using Supabase v2 method
          const { data, error } = await window.supabase.auth.getSession();
          if (!error && data && data.session) {
            session = data.session;
            isLoggedIn = true;
            console.log('User authenticated via Supabase getSession');
          }
        } 

        // Check if URL contains token (auth redirect)
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.has('access_token') || urlParams.has('refresh_token')) {
          console.log('Auth tokens detected in URL - assuming user is logged in');
          isLoggedIn = true;
        }
        
        // Fallback to checking provider dashboard data
        if (!isLoggedIn) {
          // On provider dashboard we can check profile data
          const isProviderDashboard = window.location.href.includes('provider-dashboard');
          const hasProviderProfile = window.providerProfile || 
                                   window.currentProviderProfile ||
                                   document.querySelector('.provider-header .profile-name') ||
                                   window.__providerData;
                                   
          if (isProviderDashboard && hasProviderProfile) {
            isLoggedIn = true;
            console.log('User authenticated via provider dashboard data');
          }
        }

        // Check localStorage for auth token
        if (!isLoggedIn && localStorage.getItem('supabase.auth.token')) {
          try {
            const authData = JSON.parse(localStorage.getItem('supabase.auth.token'));
            if (authData && authData.currentSession) {
              isLoggedIn = true;
              console.log('User authenticated via localStorage token');
            }
          } catch (e) {
            console.error('Error parsing auth token:', e);
          }
        }
        
        console.log('User login status:', isLoggedIn);
        
        if (isLoggedIn) {
          // User is logged in - show profile and logout buttons
          guestAuthSection.style.display = 'none';
          userAuthSection.style.display = 'flex';
          
          // Update profile button with user name if available
          updateProfileButton(session);
        } else {
          // User is not logged in - show sign in and sign up buttons
          guestAuthSection.style.display = 'flex';
          userAuthSection.style.display = 'none';
        }
      } catch (error) {
        console.error('Error checking authentication status:', error);
        // Default to showing sign in/up on error
        guestAuthSection.style.display = 'flex';
        userAuthSection.style.display = 'none';
      }
    }
    
    // Update profile button with user name if available
    function updateProfileButton(session) {
      const profileBtn = sidebar.querySelector('.sidebar-profile');
      if (!profileBtn) return;
      
      try {
        if (session && session.user) {
          // Try to get name from user metadata
          const userData = session.user.user_metadata || {};
          if (userData.full_name) {
            profileBtn.innerHTML = `<i class="fas fa-user-circle"></i> ${userData.full_name}`;
            return;
          } else if (userData.first_name) {
            profileBtn.innerHTML = `<i class="fas fa-user-circle"></i> ${userData.first_name}`;
            return;
          }
        }
        
        // Check for provider profile data
        if (window.providerProfile) {
          const name = `${window.providerProfile.first_name || ''} ${window.providerProfile.last_name || ''}`.trim();
          if (name) {
            profileBtn.innerHTML = `<i class="fas fa-user-circle"></i> ${name}`;
            return;
          }
        }
        
        // Check DOM for profile name
        const profileNameElement = document.querySelector('.provider-header .profile-name');
        if (profileNameElement && profileNameElement.textContent) {
          profileBtn.innerHTML = `<i class="fas fa-user-circle"></i> ${profileNameElement.textContent.trim()}`;
          return;
        }
        
        // Default to generic text
        profileBtn.innerHTML = `<i class="fas fa-user-circle"></i> My Profile`;
      } catch (error) {
        console.error('Error updating profile button:', error);
        profileBtn.innerHTML = `<i class="fas fa-user-circle"></i> My Profile`;
      }
    }
    
    // Handle logout button click
    async function handleLogout() {
      try {
        if (window.supabase && typeof window.supabase.auth.signOut === 'function') {
          // Use Supabase signOut
          const { error } = await window.supabase.auth.signOut();
          if (error) throw error;
          
          // Redirect after successful logout
          window.location.href = 'index-2.html';
        } else {
          // Manual logout if Supabase is not available
          localStorage.removeItem('ustahub_auth_token');
          localStorage.removeItem('ustahub_user_data');
          sessionStorage.removeItem('ustahub_user_data');
          document.cookie = 'ustahub_logged_in=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
          
          // Redirect to home page
          window.location.href = 'index-2.html';
        }
      } catch (error) {
        console.error('Error during logout:', error);
        // Still redirect even if there's an error
        window.location.href = 'index-2.html';
      }
    }

    // Open sidebar
    function openSidebar() {
      if (!sidebar || !overlay) {
        console.error('Sidebar elements not found');
        return;
      }
      
      sidebar.classList.add('open');
      overlay.classList.add('active');
      document.body.classList.add('sidebar-open');
      lastFocusedElement = document.activeElement;
      
      // Set ARIA attributes
      sidebar.setAttribute('aria-hidden', 'false');
      overlay.setAttribute('aria-hidden', 'false');
      
      // Focus first focusable element in sidebar
      const firstFocusable = sidebar.querySelector(focusableSelectors);
      if (firstFocusable) setTimeout(() => firstFocusable.focus(), 100);
      
      // Trap focus
      document.addEventListener('keydown', trapFocus);
    }

    // Close sidebar
    function closeSidebar() {
      if (!sidebar || !overlay) return;
      
      sidebar.classList.remove('open');
      overlay.classList.remove('active');
      document.body.classList.remove('sidebar-open');
      
      // Set ARIA attributes
      sidebar.setAttribute('aria-hidden', 'true');
      overlay.setAttribute('aria-hidden', 'true');
      
      // Return focus to trigger or last focused element
      if (lastFocusedElement) setTimeout(() => lastFocusedElement.focus(), 100);
      
      document.removeEventListener('keydown', trapFocus);
    }

    // Trap focus inside sidebar
    function trapFocus(e) {
      if (!sidebar || !sidebar.classList.contains('open')) return;
      
      if (e.key === 'Escape') {
        closeSidebar();
        return;
      }
      
      if (e.key !== 'Tab') return;
      
      const focusableEls = Array.from(sidebar.querySelectorAll(focusableSelectors));
      if (!focusableEls.length) return;
      
      const first = focusableEls[0];
      const last = focusableEls[focusableEls.length - 1];
      
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    // Toggle submenus
    function toggleSubmenu(e) {
      const btn = e.currentTarget;
      const parent = btn.closest('.has-submenu');
      const expanded = btn.getAttribute('aria-expanded') === 'true';
      
      // Close all other open submenus
      submenuToggles.forEach(otherBtn => {
        if (otherBtn !== btn && otherBtn.getAttribute('aria-expanded') === 'true') {
          otherBtn.setAttribute('aria-expanded', 'false');
          otherBtn.closest('.has-submenu').classList.remove('open');
        }
      });
      
      // Toggle current submenu
      btn.setAttribute('aria-expanded', !expanded);
      parent.classList.toggle('open', !expanded);
    }

    // Dark mode toggle
    function toggleDarkMode() {
      const darkModeBtn = sidebar.querySelector('.sidebar-darkmode-toggle');
      if (!darkModeBtn) return;
      
      const isDarkMode = darkModeBtn.getAttribute('aria-pressed') === 'true';
      darkModeBtn.setAttribute('aria-pressed', !isDarkMode);
      
      if (!isDarkMode) {
        document.body.classList.add('dark-mode');
        darkModeBtn.innerHTML = '<i class="fas fa-sun"></i> Light Mode';
      } else {
        document.body.classList.remove('dark-mode');
        darkModeBtn.innerHTML = '<i class="fas fa-moon"></i> Dark Mode';
      }
    }

    // Event listeners
    if (trigger) {
      trigger.addEventListener('click', openSidebar);
    }
    
    if (closeBtn) {
      closeBtn.addEventListener('click', closeSidebar);
    }
    
    if (overlay) {
      overlay.addEventListener('click', closeSidebar);
    }
    
    submenuToggles.forEach(btn => {
      btn.addEventListener('click', toggleSubmenu);
    });
    
    const darkModeBtn = sidebar.querySelector('.sidebar-darkmode-toggle');
    if (darkModeBtn) {
      darkModeBtn.addEventListener('click', toggleDarkMode);
    }

    // Search functionality
    const searchInput = sidebar.querySelector('.sidebar-search input');
    if (searchInput) {
      searchInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          window.location.href = `service-category.html?search=${encodeURIComponent(this.value)}`;
        }
      });
    }

    // Listen for auth changes to update UI accordingly
    window.addEventListener('storage', function(e) {
      // If auth-related item changed in storage, update UI
      if (e.key === 'ustahub_auth_token' || 
          e.key === 'supabase.auth.token' ||
          e.key === 'ustahub_user_data') {
        updateAuthUI();
      }
    });

    // Handle responsive behavior on window resize
    window.addEventListener('resize', function() {
      checkMobileView();
    });
    
    // Set initial ARIA states
    if (sidebar) sidebar.setAttribute('aria-hidden', 'true');
    if (overlay) overlay.setAttribute('aria-hidden', 'true');
  }
  
  // Ensure the button is shown on mobile - apply once immediately
  function checkMobileView() {
    const isMobile = window.innerWidth <= 991;
    console.log('Checking mobile view:', isMobile, 'Window width:', window.innerWidth);
    
      const trigger = document.querySelector('.sidebar-trigger');
    console.log('Mobile trigger found:', !!trigger);
    
      if (trigger) {
      if (isMobile) {
        // Show trigger on mobile
        trigger.style.cssText = `
          display: flex !important;
          position: fixed !important;
          top: 1.1rem !important;
          left: 1.1rem !important;
          right: auto !important;
          z-index: 1300 !important;
          width: 44px !important;
          height: 44px !important;
          background: #fff !important;
          border-radius: 50% !important;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1) !important;
          border: none !important;
          align-items: center !important;
          justify-content: center !important;
          cursor: pointer !important;
          opacity: 1 !important;
          visibility: visible !important;
        `;
        console.log('Mobile trigger shown and styled');
        
        // Hide navbars on mobile
        const topNavbar = document.querySelector('.top-navbar');
        const bottomNavbar = document.querySelector('.bottom-navbar');
        if (topNavbar) {
          topNavbar.style.display = 'none';
          console.log('Top navbar hidden');
        }
        if (bottomNavbar) {
          bottomNavbar.style.display = 'none';
          console.log('Bottom navbar hidden');
        }
      } else {
        // Hide trigger on desktop
        trigger.style.display = 'none !important';
        console.log('Desktop detected - mobile trigger hidden');
        
        // Show navbars on desktop  
        const topNavbar = document.querySelector('.top-navbar');
        const bottomNavbar = document.querySelector('.bottom-navbar');
        if (topNavbar) {
          topNavbar.style.display = '';
          console.log('Top navbar shown');
        }
        if (bottomNavbar) {
          bottomNavbar.style.display = '';
          console.log('Bottom navbar shown');
        }
        
        // Close sidebar if it's open on desktop
        const sidebar = document.getElementById('mobile-sidebar');
        const overlay = document.getElementById('sidebar-overlay');
        if (sidebar && sidebar.classList.contains('open')) {
          sidebar.classList.remove('open');
          overlay.classList.remove('active');
          document.body.classList.remove('sidebar-open');
          console.log('Sidebar closed on desktop resize');
        }
      }
    }
  }
  
  // Check initially, on window load, and on resize
  checkMobileView();
  window.addEventListener('load', checkMobileView);
  window.addEventListener('resize', checkMobileView);

  // Add a simple openSidebar function in global scope for immediate use
  window.openSidebar = function() {
    const sidebar = document.getElementById('mobile-sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    
    if (sidebar && overlay) {
      sidebar.classList.add('open');
      overlay.classList.add('active');
      document.body.classList.add('sidebar-open');
      console.log('Sidebar opened');
    }
  };

  // Add a simple closeSidebar function in global scope
  window.closeSidebar = function() {
    const sidebar = document.getElementById('mobile-sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    
    if (sidebar && overlay) {
      sidebar.classList.remove('open');
      overlay.classList.remove('active');
      document.body.classList.remove('sidebar-open');
      console.log('Sidebar closed');
    }
  };
})(); 