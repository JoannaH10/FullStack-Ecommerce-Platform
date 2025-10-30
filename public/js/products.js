// public/js/products.js - Refactored to Fetch Products from API

document.addEventListener('DOMContentLoaded', function() {
    console.log('products.js loaded: DOM content fully loaded and parsed.');

    let allProductsData = []; // This will store all products fetched from the API
    let filteredProducts = []; // This will store products currently being filtered/sorted/searched
    let currentPage = 1; // Current page for pagination

    // --- Helper: Get favorites from localStorage ---
    function getFavorites() {
        try {
            return JSON.parse(localStorage.getItem('favorites') || '[]');
        } catch (e) {
            console.error('Error parsing favorites from localStorage:', e);
            return [];
        }
    }
    
    // --- Helper: Save favorites to localStorage ---
    function setFavorites(favs) {
        try {
            localStorage.setItem('favorites', JSON.stringify(favs));
        } catch (e) {
            console.error('Error saving favorites to localStorage:', e);
        }
    }
    
    // --- On page load, update Font Awesome heart icon state based on favorites ---
    function updateFavoriteIconsFromLocalStorage() {
        console.log('Updating favorite icons based on localStorage...');
        const favorites = getFavorites();
        // Select all favorite-checkbox inputs (even those just added to DOM)
        document.querySelectorAll('.favorite-checkbox').forEach(checkbox => {
            const productId = checkbox.dataset.id;
            checkbox.checked = favorites.includes(productId);
        });
    }
            
    // Add a mapping for filter names to display titles
    const FILTER_TITLES = {
        all: "Our Products",
        "chips&crisps": "Chips & Crisps",
        "soda": "Soda",
        "chocolates": "Chocolates",
        "sweets": "Sweets",
        "biscuits": "Biscuits"
        // Add other categories if needed
    };

    // --- Get DOM Elements (CRITICAL: Selectors matched to your EJS) ---
    const sortByDropdown = document.querySelector(".sort-by-dropdown");
    const cardsContainer = document.getElementById('products-container'); // Where product cards will be rendered
    const productTitle = document.getElementById('product-title'); // Main title for the products section
    const searchInput = document.querySelector('.search-input'); // Search input field
    const paginationControls = document.getElementById('pagination-controls'); // Container for pagination buttons
    const sidebar = document.querySelector('.sidebar'); // Assuming you have a sidebar element for filters

    // PAGINATION LOGIC
    const PRODUCTS_PER_PAGE = 12; // Number of products to display per page

    // Helper to get price from product object (received from API)
    function getPriceFromProductData(product) {
        // Ensure product.price is a number, handle potential null/undefined
        return parseFloat(product.price) || 0; 
    }

    // Displays a subset of products for the current page
    function showProductsForPage(page, products) {
        if (!cardsContainer) {
            console.error('cardsContainer not found in showProductsForPage.');
            return;
        }

        const start = (page - 1) * PRODUCTS_PER_PAGE;
        const end = start + PRODUCTS_PER_PAGE;
        
        // Slice the products array to get only the products for the current page
        const productsOnPage = products.slice(start, end);

        // Clear existing products and render only the ones for the current page
        cardsContainer.innerHTML = ''; 
        renderProductsHTML(productsOnPage); // Call the helper to build and append HTML

        // Show/hide empty state message
        const emptyMsg = document.getElementById('empty-state-message');
        if (emptyMsg) {
            emptyMsg.style.display = (products.length === 0) ? 'flex' : 'none';
        }
    }

    // Renders pagination buttons
    function renderPaginationControls(products) {
        const controls = document.getElementById('pagination-controls');
        if (!controls) return; // Exit if pagination controls container not found
        controls.innerHTML = ''; // Clear existing pagination buttons
        
        const totalPages = Math.ceil(products.length / PRODUCTS_PER_PAGE);
        
        if (totalPages <= 1) return; // Don't show pagination if only one page

        for (let i = 1; i <= totalPages; i++) {
            const btn = document.createElement('button');
            btn.textContent = i;
            btn.className = 'pagination-btn' + (i === currentPage ? ' active' : '');
            btn.onclick = () => {
                currentPage = i;
                showProductsForPage(currentPage, products); // Display products for the new page
                renderPaginationControls(products); // Re-render controls to update active state
            };
            controls.appendChild(btn);
        }
    }

    // Updates pagination display and re-renders current page
    function updatePaginationAndDisplay() {
        showProductsForPage(currentPage, filteredProducts); // Use filteredProducts for display
        renderPaginationControls(filteredProducts); // Update pagination based on filteredProducts
        updateFavoriteIconsFromLocalStorage(); // Ensure favorite icons are correct after rendering
    }

    // --- Main function to fetch products from API and then render them ---
    async function fetchAndRenderProducts(country = null, category = 'all', sortBy = '') {
        let url = '/api/s1/products';
        const params = new URLSearchParams();

        if (country) {
            params.append('country', country);
        }
        if (category !== 'all') {
            params.append('category', category);
        }

        if (params.toString()) {
            url += `?${params.toString()}`;
        }
        
        console.log('Fetching products from API URL:', url); // Debug: Logs the URL being called

        try {
            const response = await fetch(url);
            if (!response.ok) {
                // If response is not OK (e.g., 404, 500), throw an error
                throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
            }
            
            let products = await response.json(); // Parse the JSON response

            // Apply sorting immediately after fetching, before updating global states
            if (sortBy) {
                products = sortProductsData(products, sortBy);
            }
            
            allProductsData = products; // Store all fetched and potentially sorted products
            filteredProducts = [...allProductsData]; // Initialize filteredProducts with all fetched data

            console.log('API fetch complete. Number of products received:', allProductsData.length);
            
            currentPage = 1; // Reset to page 1 on any new fetch/filter/sort operation
            updatePaginationAndDisplay(); // Render products and update pagination controls
            
            // Set the main product title based on country or category
            if (productTitle) {
                if (country) {
                    // Capitalize first letter of country and add " Snacks"
                    productTitle.textContent = country.charAt(0).toUpperCase() + country.slice(1).toLowerCase() + ' Snacks';
                } else if (category && FILTER_TITLES[category]) {
                    // Use predefined title for categories
                    productTitle.textContent = FILTER_TITLES[category];
                } else {
                    // Default title if no specific country or category is selected
                    productTitle.textContent = FILTER_TITLES.all;
                }
                console.log(`Product title updated to: "${productTitle.textContent}".`);
            }

        } catch (err) {
            console.error('Error fetching products:', err);
            // Display an error message if fetching fails
            if (cardsContainer) {
                cardsContainer.innerHTML = '<p id="empty-state-message" style="display:flex;justify-content:center;align-items:center;padding:20px;">Failed to load products. Please try again later.</p>';
            }
        }
    }

    // --- Helper to build and append product cards HTML to the container ---
    function renderProductsHTML(productsToRender) {
        if (!cardsContainer) {
            console.error('cardsContainer not found in renderProductsHTML.');
            return;
        }
        
        // This function only *adds* cards. Clearing is handled by showProductsForPage.
        // It does not handle empty state message directly, that's also in showProductsForPage.
        if (productsToRender.length === 0) {
            return; 
        }

        productsToRender.forEach(product => {
            const card = document.createElement('div');
            card.className = 'cardd';
            card.setAttribute('data-id', product._id);
            card.setAttribute('data-category', product.category); // Ensure this matches your API response structure
            card.innerHTML = `
                <div class="image-container">
                    <img src="${product.image}" alt="${product.name}" class="product-image">
                    <div class="price">${product.price ? product.price.toFixed(2) : 'N/A'} EGP</div>
                </div>
                <label class="favorite">
                    <input type="checkbox" class="favorite-checkbox" data-id="${product._id}">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#000000">
                        <path d="M12 20a1 1 0 0 1-.437-.1C11.214 19.73 3 15.671 3 9a5 5 0 0 1 8.535-3.536l.465.465.465-.465A5 5 0 0 1 21 9c0 6.646-8.212 10.728-8.562 10.9A1 1 0 0 1 12 20z"></path>
                    </svg>
                </label>
                <div class="content">
                    <div class="brand product-name">${product.name}</div>
                    <div class="description product-description">${product.description}</div>
                    <div class="button-container">
                        <button class="buy-button button" data-id="${product._id}" data-name="${product.name}" data-price="${product.price}">Buy Now</button>
                        <button class="cart-button button" data-id="${product._id}" data-name="${product.name}" data-price="${product.price}">
                            <svg viewBox="0 0 27.97 25.074" xmlns="http://www.w3.org/2000/svg">
                                <path d="M0,1.175A1.173,1.173,0,0,1,1.175,0H3.4A2.743,2.743,0,0,1,5.882,1.567H26.01A1.958,1.958,0,0,1,27.9,4.035l-2.008,7.459a3.532,3.532,0,0,1-3.4,2.61H8.36l.264,1.4a1.18,1.18,0,0,0,1.156.955H23.9a1.175,1.175,0,0,1,0,2.351H9.78a3.522,3.522,0,0,1-3.462-2.865L3.791,2.669A.39.39,0,0,0,3.4,2.351H1.175A1.173,1.173,0,0,1,0,1.175ZM6.269,22.724a2.351,2.351,0,1,1,2.351,2.351A2.351,2.351,0,0,1,6.269,22.724Zm16.455-2.351a2.351,2.351,0,1,1-2.351,2.351A2.351,2.351,0,0,1,22.724,20.373Z"></path>
                            </svg>
                        </button>
                    </div>
                </div>
            `;
            cardsContainer.appendChild(card);
        });
    }

    // --- Helper to sort products array (data, not DOM elements) ---
    function sortProductsData(products, sortValue) {
        if (!Array.isArray(products)) return products; // Return as-is if not an array
        const sorted = [...products]; // Create a shallow copy to avoid mutating original array

        switch (sortValue) {
            case 'price-low-high':
                sorted.sort((a, b) => getPriceFromProductData(a) - getPriceFromProductData(b));
                break;
            case 'price-high-low':
                sorted.sort((a, b) => getPriceFromProductData(b) - getPriceFromProductData(a));
                break;
            // Add other sorting cases here if you expand options (e.g., "name-asc", "name-desc")
            default:
                // No specific sort, return as is (or by default ID/creation date if available)
                break; 
        }
        return sorted;
    }


    // --- Cart helpers (adapted from your provided code) ---
    function getCart() {
        try {
            return JSON.parse(localStorage.getItem('cart') || '[]');
        } catch (e) {
            console.error('Error parsing cart from localStorage:', e);
            return [];
        }
    }
    function setCart(cart) {
        try {
            localStorage.setItem('cart', JSON.stringify(cart));
        } catch (e) {
            console.error('Error saving cart to localStorage:', e);
        }
    }
    
    // Event listener for add to cart buttons (Delegated from cardsContainer for efficiency)
    if (cardsContainer) {
        cardsContainer.addEventListener('click', (event) => {
            if (event.target.classList.contains('cart-button')) { 
                const productId = event.target.dataset.id;
                // Find the full product data from our cached `allProductsData`
                const product = allProductsData.find(p => p._id === productId); 
                const productName = product ? product.name : 'Product';

                if (!productId) {
                    console.error('Add to cart: Product ID not found on button.');
                    // Consider adding a user-facing message here (e.g., alert or a toast notification)
                    return;
                }
                addToCart(productId);
                // Assuming displayMessage is defined elsewhere for user feedback
                // displayMessage(`${productName || 'Product'} added to cart!`, 'success'); 
                console.log('Product added to cart (localStorage):', productId);
            }
        });
    } else {
        console.warn('Product cards container (id="products-container") not found. Add to cart functionality disabled.');
    }

    function addToCart(productId) {
        let cart = getCart();
        // Only add if not already in cart to avoid duplicates for simplicity
        if (!cart.includes(productId)) { 
            cart.push(productId);
            setCart(cart);
        }
    }

    // --- Add to Favorites Logic (Local Storage Based, delegated from cardsContainer) ---
    if (cardsContainer) {
        cardsContainer.addEventListener('change', (event) => {
            if (event.target.classList.contains('favorite-checkbox')) {
                const productId = event.target.dataset.id;
                const isFavorite = event.target.checked;
                toggleFavorite(isFavorite, productId);
                // No need to call updateFavoriteIconsFromLocalStorage here again, 
                // toggleFavorite already calls it for consistency.
            }
        });
    } else {
        console.warn('Product cards container (id="products-container") not found. Add to favorites functionality disabled.');
    }

    // Function to toggle favorite in localStorage
    function toggleFavorite(isFavorite, productId) {
        let favorites = getFavorites();
        if (isFavorite) { // If checkbox is checked, add to favorites
            if (!favorites.includes(productId)) {
                favorites.push(productId);
            }
        } else { // If checkbox is unchecked, remove from favorites
            favorites = favorites.filter(id => id !== productId);
        }
        setFavorites(favorites);
        // Important: Re-update all icons to ensure consistency across the page if same product appears multiple times
        updateFavoriteIconsFromLocalStorage(); 
    }

    // --- Search Functionality (filters `allProductsData` based on search text) ---
    if (searchInput) {
        searchInput.addEventListener('keyup', (event) => {
            const searchText = event.target.value.toLowerCase().trim();
            console.log('Search input:', searchText);

            if (!searchText) {
                // If search is empty, reset to all products (filtered by current category/country)
                // We need to re-apply the current category filter from allProductsData
                const activeLink = document.querySelector('.submenu-link.active') || document.querySelector('.submenu-link[data-value="all"]');
                const category = activeLink ? activeLink.dataset.value : 'all';
                
                if (category === 'all') {
                    filteredProducts = [...allProductsData];
                } else {
                    filteredProducts = allProductsData.filter(product => product.category === category);
                }

            } else {
                // Filter from the currently loaded `allProductsData`
                filteredProducts = allProductsData.filter(product => { 
                    const name = (product.name || '').toLowerCase();
                    const desc = (product.description || '').toLowerCase();
                    return name.includes(searchText) || desc.includes(searchText);
                });
            }

            currentPage = 1; // Reset to first page after search
            updatePaginationAndDisplay(); // Re-render with filtered products and update pagination
        });
    }

    // --- Dropdown menu open/close for filter (submenu) ---
    const menuItem = document.querySelector('.bundle-header .menu .item');
    const submenu = document.querySelector('.bundle-header .submenu');
    const submenuLinks = document.querySelectorAll('.submenu-link');

    // Toggle submenu on click of the main menu item
    if (menuItem && submenu) {
        menuItem.addEventListener('click', function(e) {
            // Only toggle if clicking the main link, not a submenu item itself
            if (e.target.classList.contains('link') || e.target.closest('.link')) {
                submenu.classList.toggle('open');
                e.preventDefault();
            }
        });
        // Close submenu if clicking outside of the menu item or the submenu itself
        document.addEventListener('click', function(e) {
            if (!menuItem.contains(e.target) && !submenu.contains(e.target)) {
                submenu.classList.remove('open');
            }
        });
    }

    // Submenu link click: filter products and set active class
    submenuLinks.forEach(link => {
        link.addEventListener('click', async (event) => {
            event.preventDefault(); // Prevent default link navigation
            
            // Remove 'active' class from all links and add to the clicked one
            submenuLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            
            submenu.classList.remove('open'); // Close the submenu after selection
            
            const category = link.dataset.value; // Get the category to filter by
            const currentSortBy = sortByDropdown ? sortByDropdown.value : ''; // Get current sort order

            // Call the main fetch function to get filtered and sorted data
            // If the user selects a category, the country filter should be removed.
            await fetchAndRenderProducts(null, category, currentSortBy); 
        });
    });

    // --- Sorting functionality (listens to dropdown changes) ---
    if (sortByDropdown) {
        sortByDropdown.addEventListener('change', async function () {
            const currentSortBy = this.value; // Get the selected sort value
            
            // Determine the currently active category filter
            const activeLink = document.querySelector('.submenu-link.active') || document.querySelector('.submenu-link[data-value="all"]');
            const category = activeLink ? activeLink.dataset.value : 'all'; // Default to 'all' if no active link

            // Determine the current country filter (if any, from URL on initial load)
            const urlParams = new URLSearchParams(window.location.search);
            const currentCountry = urlParams.get('country');

            // Re-fetch with current filters and new sort order
            await fetchAndRenderProducts(currentCountry, category, currentSortBy);
        });
    }

    // Add event listener for Buy Now buttons on product cards (delegated)
    if (cardsContainer) {
        cardsContainer.addEventListener('click', async (event) => {
            if (event.target.classList.contains('buy-button')) {
                const productId = event.target.dataset.id;
                // Find the product data from our cached `allProductsData`
                const product = allProductsData.find(p => p._id === productId);

                if (!product) {
                    console.error('Buy Now: Product data not found for ID:', productId);
                    return;
                }

                // Create a temporary cart for "Buy Now" flow
                const buyNowCart = [{ 
                    id: productId, 
                    name: product.name, 
                    image: product.image, 
                    price: product.price, 
                    quantity: 1 
                }];
                localStorage.setItem('cart', JSON.stringify(buyNowCart)); // Save to localStorage
                
                // Redirect to checkout page
                window.location.href = `/checkout?buyNowType=product&id=${productId}&quantity=1`;
            }
        });
    }
    
    // --- Initial page load: Fetch products and set up display ---
    // Get initial country filter from the URL if present (e.g., from a link like /products?country=egypt)
    const urlParams = new URLSearchParams(window.location.search);
    const initialCountry = urlParams.get('country');
    
    // Get initial sort order from the dropdown if it exists and has a value
    const initialSortBy = sortByDropdown ? sortByDropdown.value : '';

    // Trigger the initial fetch to load all products, applying any initial country filter or sort
    fetchAndRenderProducts(initialCountry, 'all', initialSortBy); // 'all' is the default category on initial load

    console.log('products.js setup complete.');

}); // End of DOMContentLoaded event listener