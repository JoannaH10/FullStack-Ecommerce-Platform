// public/js/bundles.js
(function() {
  // Search toggle functionality
  const searchToggle = document.getElementById('searchToggle');
  const searchContainer = document.querySelector('.search-container');

  if (searchToggle && searchContainer) {
    searchToggle.addEventListener('click', () => {
      searchContainer.classList.toggle('active');
    });
  } else {
    console.warn('Search toggle elements not found on bundles page.');
  }

  // Main functionality
  document.addEventListener('DOMContentLoaded', () => {
    // Favorite sync functionality
    function syncFavoriteCheckboxes() {
      const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
      document.querySelectorAll('.favorite-checkbox').forEach(cb => {
        const bundleId = cb.getAttribute('data-id');
        cb.checked = favorites.some(fav => fav.id === bundleId);
      });
    }

    // Cart and favorites event handlers
    function setupEventHandlers() {
      // Favorite checkbox handler
      document.addEventListener('change', function(e) {
        if (e.target.classList.contains('favorite-checkbox')) {
          const card = e.target.closest('.cardd');
          const bundleId = card.getAttribute('data-id');
          const bundleTitle = card.querySelector('.brand').textContent.trim();
          const bundleImage = card.querySelector('img').src;
          const bundlePrice = card.querySelector('.price').textContent.trim();
          let favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
          
          if (e.target.checked) {
            if (!favorites.some(fav => fav.id === bundleId)) {
              favorites.push({ 
                id: bundleId, 
                title: bundleTitle, 
                image: bundleImage, 
                price: bundlePrice 
              });
            }
          } else {
            favorites = favorites.filter(fav => fav.id !== bundleId);
          }
          
          localStorage.setItem('favorites', JSON.stringify(favorites));
          
          // Sync all checkboxes for this bundle
          document.querySelectorAll(`.favorite-checkbox[data-id="${bundleId}"]`).forEach(cb => {
            cb.checked = e.target.checked;
          });
        }
      });

      // Cart button handler
      document.addEventListener('click', function(e) {
        if (e.target.classList.contains('cart-button') || e.target.closest('.cart-button')) {
          const button = e.target.closest('.cart-button');
          const card = button.closest('.cardd');
          const bundleId = card.getAttribute('data-id');
          const bundleTitle = card.querySelector('.brand').textContent.trim();
          const bundleImage = card.querySelector('img').src;
          const bundlePrice = card.querySelector('.price').textContent.trim();
          let cart = JSON.parse(localStorage.getItem('cart') || '[]');
          
          if (!cart.some(item => item.id === bundleId)) {
            cart.push({ 
              id: bundleId, 
              title: bundleTitle, 
              image: bundleImage, 
              price: bundlePrice 
            });
            localStorage.setItem('cart', JSON.stringify(cart));
          }
        }
      });
    }

    // Category filtering functionality
    const submenuLinks = document.querySelectorAll('.submenu-link');
    const bundlesContainer = document.getElementById('bundles-container');

    async function loadBundles(category = 'all') {
      let url = '/api/s1/bundles';
      if (category !== 'all') url += `?category=${encodeURIComponent(category)}`;

      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const bundles = await response.json();
        
        bundlesContainer.innerHTML = bundles.length > 0 ? '' : '<p>No bundles found for this category.</p>';
        
        bundles.forEach(bundle => {
          const bundleCard = `
            <div class="cardd" data-id="${bundle._id}" data-category="${bundle.category}">
              <div class="image-container">
                <img src="${bundle.image}" alt="${bundle.title}">
                <div class="price">${bundle.price.toFixed(2)} EGP</div>
              </div>
              <label class="favorite">
                <input type="checkbox" class="favorite-checkbox" data-id="${bundle._id}">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#000000">
                  <path d="M12 20a1 1 0 0 1-.437-.1C11.214 19.73 3 15.671 3 9a5 5 0 0 1 8.535-3.536l.465.465.465-.465A5 5 0 0 1 21 9c0 6.646-8.212 10.728-8.562 10.9A1 1 0 0 1 12 20z"></path>
                </svg>
              </label>
              <div class="content">
                <div class="brand">${bundle.title}</div>
                <div class="button-container">
                  <button class="buy-button button" data-id="${bundle._id}">Buy Now</button>
                  <button class="cart-button button" data-id="${bundle._id}">
                    <svg viewBox="0 0 27.97 25.074" xmlns="http://www.w3.org/2000/svg">
                      <path d="M0,1.175A1.173,1.173,0,0,1,1.175,0H3.4A2.743,2.743,0,0,1,5.882,1.567H26.01A1.958,1.958,0,0,1,27.9,4.035l-2.008,7.459a3.532,3.532,0,0,1-3.4,2.61H8.36l.264,1.4a1.18,1.18,0,0,0,1.156.955H23.9a1.175,1.175,0,0,1,0,2.351H9.78a3.522,3.522,0,0,1-3.462-2.865L3.791,2.669A.39.39,0,0,0,3.4,2.351H1.175A1.173,1.173,0,0,1,0,1.175ZM6.269,22.724a2.351,2.351,0,1,1,2.351,2.351A2.351,2.351,0,0,1,6.269,22.724Zm16.455-2.351a2.351,2.351,0,1,1-2.351,2.351A2.351,2.351,0,0,1,22.724,20.373Z"></path>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          `;
          bundlesContainer.insertAdjacentHTML('beforeend', bundleCard);
        });
        
        // Sync favorites and setup event handlers
        syncFavoriteCheckboxes();
        setupEventHandlers();
        
      } catch (error) {
        console.error('Error fetching bundles:', error);
        bundlesContainer.innerHTML = '<p>Failed to load bundles.</p>';
      }
    }

    // Setup category filtering
    if (submenuLinks.length && bundlesContainer) {
      submenuLinks.forEach(link => {
        link.addEventListener('click', (e) => {
          e.preventDefault();
          loadBundles(e.target.dataset.value);
        });
      });

      // Load initial bundles
      loadBundles('all');
    }

    // Mutation observer for favorites sync
    if (bundlesContainer) {
      const observer = new MutationObserver(syncFavoriteCheckboxes);
      observer.observe(bundlesContainer, { childList: true, subtree: true });
    }

    // Initial setup
    syncFavoriteCheckboxes();
    setupEventHandlers();
  });
})();