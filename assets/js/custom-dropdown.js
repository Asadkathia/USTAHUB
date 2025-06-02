// Custom dropdown logic for category
(function() {
  var input = document.getElementById('category');
  // Use document.body as the mount point
  var mount = document.body;
  if (!input || !mount) return;

  // Dropdown options (5 main only)
  var options = [
    'Home Services',
    'Personal Services',
    'Event Services',
    'Business Services',
    'Food & Drink'
  ];

  // Create dropdown element
  var dropdown = document.createElement('div');
  dropdown.className = 'custom-dropdown-list';
  dropdown.id = 'categoryDropdown';
  dropdown.style.position = 'fixed'; // Use fixed to avoid parent clipping
  dropdown.style.display = 'none';
  dropdown.style.zIndex = 3000;
  options.forEach(function(opt) {
    var item = document.createElement('div');
    item.className = 'custom-dropdown-item';
    item.setAttribute('data-value', opt);
    item.textContent = opt;
    item.addEventListener('click', function(e) {
      input.value = this.getAttribute('data-value');
      dropdown.style.display = 'none';
    });
    dropdown.appendChild(item);
  });
  mount.appendChild(dropdown);

  // Helper to position dropdown
  function positionDropdown() {
    var rect = input.getBoundingClientRect();
    dropdown.style.width = rect.width + 'px';
    dropdown.style.left = rect.left + 'px';
    dropdown.style.top = rect.bottom + 'px';
  }

  input.addEventListener('click', function(e) {
    e.stopPropagation();
    if (dropdown.style.display === 'block') {
      dropdown.style.display = 'none';
    } else {
      positionDropdown();
      dropdown.style.display = 'block';
    }
  });

  window.addEventListener('resize', function() {
    if (dropdown.style.display === 'block') {
      positionDropdown();
    }
  });
  window.addEventListener('scroll', function() {
    if (dropdown.style.display === 'block') {
      positionDropdown();
    }
  });

  document.addEventListener('click', function(e) {
    if (!dropdown.contains(e.target) && e.target !== input) {
      dropdown.style.display = 'none';
    }
  });
})(); 