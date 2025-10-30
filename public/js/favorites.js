(function() { // Start of the Immediately Invoked Function Expression (IIFE)

    /*------------------------------------------------------------------------------------------------------------------------------------------------*/
    /*----------------------------------------------------------------FAVORITES LOGIC-----------------------------------------------------------------*/
    /*------------------------------------------------------------------------------------------------------------------------------------------------*/

    // This block runs once the DOM is fully loaded, ensuring elements exist
    document.addEventListener('DOMContentLoaded', () => {

        const PRODUCTS_PER_PAGE = 8;
        let currentPage = 1;

        function getFavorites() {
            return JSON.parse(localStorage.getItem('favorites') || '[]');
        }

        function setFavorites(favs) {
            localStorage.setItem('favorites', JSON.stringify(favs));
        }

        function renderFavorites(page = 1) {
            const favorites = getFavorites();
            const container = document.getElementById('favorites-container');
            const countHeader = document.getElementById('favorites-count-header');
            
            // Exit if the favorites container doesn't exist on this page
            if (!container) {
                // console.warn('Element with ID "favorites-container" not found. Skipping renderFavorites.');
                return;
            }

            const favProducts = products.filter(p => favorites.includes(p.id));
            const total = favProducts.length;

            // Update count if the header element exists
            if (countHeader) countHeader.textContent = total;

            // Pagination logic
            const totalPages = Math.ceil(total / PRODUCTS_PER_PAGE) || 1;
            if (page > totalPages) page = totalPages;
            currentPage = page;
            const start = (page - 1) * PRODUCTS_PER_PAGE;
            const end = start + PRODUCTS_PER_PAGE;
            const pageProducts = favProducts.slice(start, end);

            // Render products or empty state
            container.innerHTML = ''; // Clear existing content
            if (pageProducts.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <div class="icon"><i class="fas fa-heart-broken"></i></div>
                        <div class="text">
                            No favorites yet.<br>
                            <span class="subtext">Go to the products page and add some!</span>
                        </div>
                    </div>
                `;
                // Clear pagination controls if there are no favorites
                const paginationControls = document.getElementById('pagination-controls');
                if (paginationControls) {
                    paginationControls.innerHTML = '';
                }
                return;
            }
            pageProducts.forEach(product => {
                container.innerHTML += `
                <div class="card" data-id="${product.id}">
                    <div class="image-container">
                        <img src="${product.img}" alt="${product.name}">
                        <div class="price">${product.price}</div>
                    </div>
                    <label class="favorite">
                        <input type="checkbox" ${getFavorites().includes(product.id) ? 'checked' : ''} data-product-id="${product.id}">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#000000">
                            <path d="M12 20a1 1 0 0 1-.437-.1C11.214 19.73 3 15.671 3 9a5 5 0 0 1 8.535-3.536l.465.465.465-.465A5 5 0 0 1 21 9c0 6.646-8.212 10.728-8.562 10.9A1 1 0 0 1 12 20z"></path>
                        </svg>
                    </label>
                    <div class="content">
                        <div class="brand">${product.brand}</div>
                        <div class="product-name">${product.name}</div>
                        <div class="button-container">
                            <button class="buy-button button">Buy Now</button>
                            <button class="cart-button button">
                                <svg viewBox="0 0 27.97 25.074" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M0,1.175A1.173,1.173,0,0,1,1.175,0H3.4A2.743,2.743,0,0,1,5.882,1.567H26.01A1.958,1.958,0,0,1,27.9,4.035l-2.008,7.459a3.532,3.532,0,0,1-3.4,2.61H8.36l.264,1.4a1.18,1.18,0,0,0,1.156.955H23.9a1.175,1.175,0,0,1,0,2.351H9.78a3.522,3.522,0,0,1-3.462-2.865L3.791,2.669A.39.39,0,0,0,3.4,2.351H1.175A1.173,1.173,0,0,1,0,1.175ZM6.269,22.724a2.351,2.351,0,1,1,2.351,2.351A2.351,2.351,0,0,1,6.269,22.724Zm16.455-2.351a2.351,2.351,0,1,1-2.351,2.351A2.351,2.351,0,0,1,22.724,20.373Z"></path>
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
                `;
            });

            // Re-render pagination controls
            renderPaginationControls(totalPages, currentPage);
        }

        function renderPaginationControls(totalPages, currentPage) {
            const container = document.getElementById('pagination-controls');
            // Exit if pagination container doesn't exist
            if (!container) {
                // console.warn('Element with ID "pagination-controls" not found. Skipping renderPaginationControls.');
                return;
            }

            if (totalPages <= 1) {
                container.innerHTML = '';
                return;
            }
            let html = `<nav aria-label="Favorites pagination"><ul class="pagination justify-content-center">`;
            if (currentPage > 1) {
                html += `<li class="page-item"><a class="page-link" href="#" data-page="${currentPage - 1}">Previous</a></li>`;
            }
            for (let i = 1; i <= totalPages; i++) {
                html += `<li class="page-item${i === currentPage ? ' active' : ''}"><a class="page-link" href="#" data-page="${i}">${i}</a></li>`;
            }
            if (currentPage < totalPages) {
                html += `<li class="page-item"><a class="page-link" href="#" data-page="${currentPage + 1}">Next</a></li>`;
            }
            html += `</ul></nav>`;
            container.innerHTML = html;
        }

        function toggleFavorite(checkbox, productId) {
            let favorites = getFavorites();
            if (checkbox.checked) {
                if (!favorites.includes(productId)) {
                    favorites.push(productId);
                    setFavorites(favorites);
                }
            } else {
                favorites = favorites.filter(id => id !== productId);
                setFavorites(favorites);
            }
            renderFavorites(currentPage); // Re-render favorites after toggling
        }

        // Initial render of favorites when the DOM is ready
        renderFavorites(1);

        // Event delegation for pagination links (Clicking on a page number)
        const paginationContainer = document.getElementById('pagination-controls');
        if (paginationContainer) { // Check if the element exists
            paginationContainer.addEventListener('click', function(event) {
                // Check if the clicked element is an anchor tag with a data-page attribute
                const pageLink = event.target.closest('a[data-page]');
                if (pageLink) {
                    event.preventDefault(); // Stop the default link behavior
                    const page = parseInt(pageLink.dataset.page, 10);
                    if (!isNaN(page)) {
                        currentPage = page; // Update the global currentPage variable
                        renderFavorites(page);
                    }
                }
            });
        }

        // Event delegation for favorite toggles (Heart icon checkboxes)
        const favoritesContainer = document.getElementById('favorites-container');
        if (favoritesContainer) { // Check if the element exists
            favoritesContainer.addEventListener('click', function(event) {
                // Check if the clicked element (or its closest ancestor) is the checkbox
                const checkbox = event.target.closest('input[type="checkbox"][data-product-id]');
                if (checkbox) {
                    // event.preventDefault(); // Do not prevent default for checkbox as it handles checked state
                    toggleFavorite(checkbox, checkbox.dataset.productId);
                }
            });
        }
    }); // End of DOMContentLoaded for favorites logic

    // window.addEventListener('storage', ...) should remain outside DOMContentLoaded
    // because it listens to changes across browser tabs/windows
    window.addEventListener('storage', function(e) {
        if (e.key === 'favorites') {
            // Re-render favorites if localStorage 'favorites' changes in another tab/window
            // Make sure the renderFavorites function is accessible here (it is, due to closure)
            const favoritesContainer = document.getElementById('favorites-container');
            if (favoritesContainer) { // Only re-render if we are on a page with favorites container
                // We need to call renderFavorites from within the IIFE's scope
                // Since renderFavorites is defined inside the DOMContentLoaded, we need to ensure it's accessible.
                // The easiest way is to hoist it slightly or ensure it's global if localStorage event listener is global.
                // For simplicity here, I'm assuming this script is specific to a favorites page where renderFavorites is always defined.
                // If this is a general script, consider making renderFavorites part of an exposed API or move storage listener into DOMContentLoaded as well.
                // However, given the context, keeping it outside for cross-tab updates is fine.
                // The renderFavorites function is part of the closure of the IIFE, so it's accessible here.
                renderFavorites(currentPage); 
            }
        }
    });

})(); // End of IIFE

(function() { // Start of the Immediately Invoked Function Expression (IIFE)

    /*------------------------------------------------------------------------------------------------------------------------------------------------*/
    /*----------------------------------------------------------------FAVORITES LOGIC-----------------------------------------------------------------*/
    /*------------------------------------------------------------------------------------------------------------------------------------------------*/

    // This block runs once the DOM is fully loaded, ensuring elements exist
    document.addEventListener('DOMContentLoaded', () => {
        // Hardcoded product data (must match products.html) - Consider fetching this data
        const products = [
            {
                id: 'product-1',
                img: 'img/WhatsApp Image 2025-05-03 at 21.39.11_24cd6dbf.jpg',
                price: '$3.99',
                brand: 'Korea Snacks',
                name: 'Spicy Potato Chips'
            },
            {
                id: 'product-2',
                img: 'img/WhatsApp Image 2025-05-03 at 21.39.11_24cd6dbf.jpg',
                price: '$5.49',
                brand: 'Nestle Japan',
                name: 'Matcha KitKat'
            },
            {
                id: 'product-3',
                img: 'img/WhatsApp Image 2025-05-03 at 21.39.11_24cd6dbf.jpg',
                price: '$2.99',
                brand: 'EnergyX',
                name: 'Energy Drink X'
            },
            {
                id: 'product-4',
                img: 'img/WhatsApp Image 2025-05-03 at 21.39.11_24cd6dbf.jpg',
                price: '$4.25',
                brand: 'Belgian Delights',
                name: 'Belgian Chocolate Bar'
            }
            // ...add more products as needed...
        ];

        const PRODUCTS_PER_PAGE = 8;
        let currentPage = 1;

        function getFavorites() {
            return JSON.parse(localStorage.getItem('favorites') || '[]');
        }

        function setFavorites(favs) {
            localStorage.setItem('favorites', JSON.stringify(favs));
        }

        function renderFavorites(page = 1) {
            // Only use valid objects for favorites
            const favorites = getFavorites().filter(item => typeof item === 'object' && item !== null);
            const container = document.getElementById('favorites-container');
            const countHeader = document.getElementById('favorites-count-header');
            if (!container) return;
            const total = favorites.length;
            if (countHeader) countHeader.textContent = total;
            const PRODUCTS_PER_PAGE = 8;
            const totalPages = Math.ceil(total / PRODUCTS_PER_PAGE) || 1;
            if (page > totalPages) page = totalPages;
            currentPage = page;
            const start = (page - 1) * PRODUCTS_PER_PAGE;
            const end = start + PRODUCTS_PER_PAGE;
            const pageProducts = favorites.slice(start, end);
            container.innerHTML = '';
            if (pageProducts.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <div class="icon"><i class="fas fa-heart-broken"></i></div>
                        <div class="text">
                            No favorites yet.<br>
                            <span class="subtext">Go to the products page and add some!</span>
                        </div>
                    </div>
                `;
                const paginationControls = document.getElementById('pagination-controls');
                if (paginationControls) paginationControls.innerHTML = '';
                return;
            }
            pageProducts.forEach(product => {
                // Check if this product is in favorites (should always be true here, but for consistency)
                const favoritesArr = getFavorites().filter(item => typeof item === 'object' && item !== null);
                const isFavorite = favoritesArr.some(item => item.id === product.id);
                container.innerHTML += `
                <div class="cardd" data-id="${product.id}">
                    <div class="image-container">
                        <img src="${product.image}" alt="${product.title}">
                        <div class="price">${product.price} EGP</div>
                    </div>
                    <label class="favorite">
                        <input type="checkbox" class="favorite-checkbox" data-id="${product.id}" ${isFavorite ? 'checked' : ''}>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#000000">
                            <path d="M12 20a1 1 0 0 1-.437-.1C11.214 19.73 3 15.671 3 9a5 5 0 0 1 8.535-3.536l.465.465.465-.465A5 5 0 0 1 21 9c0 6.646-8.212 10.728-8.562 10.9A1 1 0 0 1 12 20z"></path>
                        </svg>
                    </label>
                    <div class="content">
                        <div class="brand">${product.title}</div>
                        <div class="button-container">
                            <button class="buy-button button" data-id="${product.id}">Buy Now</button>
                            <button class="cart-button button" data-id="${product.id}">
                                <svg viewBox="0 0 27.97 25.074" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M0,1.175A1.173,1.173,0,0,1,1.175,0H3.4A2.743,2.743,0,0,1,5.882,1.567H26.01A1.958,1.958,0,0,1,27.9,4.035l-2.008,7.459a3.532,3.532,0,0,1-3.4,2.61H8.36l.264,1.4a1.18,1.18,0,0,0,1.156.955H23.9a1.175,1.175,0,0,1,0,2.351H9.78a3.522,3.522,0,0,1-3.462-2.865L3.791,2.669A.39.39,0,0,0,3.4,2.351H1.175A1.173,1.173,0,0,1,0,1.175ZM6.269,22.724a2.351,2.351,0,1,1,2.351,2.351A2.351,2.351,0,0,1,6.269,22.724Zm16.455-2.351a2.351,2.351,0,1,1-2.351,2.351A2.351,2.351,0,0,1,22.724,20.373Z"></path>
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
                `;
            });
            // Re-render pagination controls
            renderPaginationControls(totalPages, currentPage);
        }

        function renderPaginationControls(totalPages, currentPage) {
            const container = document.getElementById('pagination-controls');
            // Exit if pagination container doesn't exist
            if (!container) {
                // console.warn('Element with ID "pagination-controls" not found. Skipping renderPaginationControls.');
                return;
            }

            if (totalPages <= 1) {
                container.innerHTML = '';
                return;
            }
            let html = `<nav aria-label="Favorites pagination"><ul class="pagination justify-content-center">`;
            if (currentPage > 1) {
                html += `<li class="page-item"><a class="page-link" href="#" data-page="${currentPage - 1}">Previous</a></li>`;
            }
            for (let i = 1; i <= totalPages; i++) {
                html += `<li class="page-item${i === currentPage ? ' active' : ''}"><a class="page-link" href="#" data-page="${i}">${i}</a></li>`;
            }
            if (currentPage < totalPages) {
                html += `<li class="page-item"><a class="page-link" href="#" data-page="${currentPage + 1}">Next</a></li>`;
            }
            html += `</ul></nav>`;
            container.innerHTML = html;
        }

        function toggleFavorite(checkbox, productId) {
            let favorites = getFavorites();
            if (checkbox.checked) {
                if (!favorites.includes(productId)) {
                    favorites.push(productId);
                    setFavorites(favorites);
                }
            } else {
                favorites = favorites.filter(id => id !== productId);
                setFavorites(favorites);
            }
            renderFavorites(currentPage); // Re-render favorites after toggling
        }

        renderFavorites(1);

        const paginationContainer = document.getElementById('pagination-controls');
        if (paginationContainer) { // Check if the element exists
            paginationContainer.addEventListener('click', function(event) {
                const pageLink = event.target.closest('a[data-page]');
                if (pageLink) {
                    event.preventDefault(); 
                    const page = parseInt(pageLink.dataset.page, 10);
                    if (!isNaN(page)) {
                        currentPage = page; 
                        renderFavorites(page);
                    }
                }
            });
        }

        const favoritesContainer = document.getElementById('favorites-container');
        if (favoritesContainer) { // Check if the element exists
            favoritesContainer.addEventListener('click', function(event) {
                const checkbox = event.target.closest('input[type="checkbox"][data-product-id]');
                if (checkbox) {
                    toggleFavorite(checkbox, checkbox.dataset.productId);
                }
            });
        }

        // Event delegation for remove from favorites buttons
        favoritesContainer.addEventListener('click', function(event) {
            const removeButton = event.target.closest('button.remove-from-favorites-btn[data-product-id]');
            if (removeButton) {
                const productId = removeButton.getAttribute('data-product-id');
                let favorites = getFavorites();
                favorites = favorites.filter(item => item.id !== productId);
                setFavorites(favorites);
                renderFavorites(currentPage);
            }
        });

        // Event delegation for favorite checkbox (uncheck to remove from favorites)
        favoritesContainer.addEventListener('change', function(event) {
            const checkbox = event.target.closest('input.favorite-checkbox[type="checkbox"][data-id]');
            if (checkbox) {
                const productId = checkbox.getAttribute('data-id');
                if (!checkbox.checked) {
                    let favorites = getFavorites();
                    favorites = favorites.filter(item => item.id !== productId);
                    setFavorites(favorites);
                    renderFavorites(currentPage);
                }
            }
        });

        // Event delegation for cart button (add to cart)
        favoritesContainer.addEventListener('click', function(event) {
            if (event.target.classList.contains('cart-button') || event.target.closest('.cart-button')) {
                const button = event.target.closest('.cart-button');
                const card = button.closest('.cardd');
                const productId = card.getAttribute('data-id');
                const productTitle = card.querySelector('.brand').textContent.trim();
                const productImage = card.querySelector('img').src;
                const productPrice = card.querySelector('.price').textContent.trim();
                let cart = JSON.parse(localStorage.getItem('cart') || '[]');
                if (!cart.some(item => item.id === productId)) {
                    cart.push({ id: productId, title: productTitle, image: productImage, price: productPrice });
                }
                localStorage.setItem('cart', JSON.stringify(cart));
            }
        });

     
        document.addEventListener('change', function(e) {
            if (e.target.classList.contains('favorite-checkbox')) {
                const bundleId = e.target.getAttribute('data-id');
                const checked = e.target.checked;
               
                document.querySelectorAll('.favorite-checkbox[data-id="' + bundleId + '"]').forEach(cb => {
                    cb.checked = checked;
                });
            }
        });
    }); 

    
    window.addEventListener('storage', function(e) {
        if (e.key === 'favorites') {
         
            const favoritesContainer = document.getElementById('favorites-container');
            if (favoritesContainer) { 
              
                renderFavorites(currentPage); 
            }
        }
    });

})(); // End of IIFE