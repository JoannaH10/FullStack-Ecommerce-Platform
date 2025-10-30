(function() { // Start of the Immediately Invoked Function Expression (IIFE)

    const PRODUCTS_PER_PAGE = 8;
    let currentPage = 1;

    function getCart() {
        return JSON.parse(localStorage.getItem('cart') || '[]');
    }

    function setCart(cart) {
        localStorage.setItem('cart', JSON.stringify(cart));
    }

    function getFavorites() {
        return JSON.parse(localStorage.getItem('favorites') || '[]');
    }

    function setFavorites(favs) {
        localStorage.setItem('favorites', JSON.stringify(favs));
    }

    function updateFavoriteCheckboxes(containerElement) {
        const favorites = getFavorites();
        // Query only within the specified container for efficiency
        containerElement.querySelectorAll('.favorite-checkbox').forEach(cb => {
            cb.checked = favorites.includes(cb.dataset.id);
        });
    }

    function renderCart(page = 1) {
        const cart = getCart();
        const container = document.getElementById('cart-container');
        const countHeader = document.getElementById('cart-count-header');
        const paginationControls = document.getElementById('pagination-controls'); // Get this here too

        // Exit early if the main cart container doesn't exist on this page
        if (!container) {
            // console.warn('Element with ID "cart-container" not found. Skipping renderCart.');
            return;
        }

        const cartProducts = products.filter(p => cart.includes(p.id));
        const total = cartProducts.length;

        // Update cart count if the header element exists
        if (countHeader) {
            countHeader.textContent = total;
        }

        // Pagination logic
        const totalPages = Math.ceil(total / PRODUCTS_PER_PAGE) || 1;
        if (page > totalPages) page = totalPages;
        currentPage = page;
        const start = (page - 1) * PRODUCTS_PER_PAGE;
        const end = start + PRODUCTS_PER_PAGE;
        const pageProducts = cartProducts.slice(start, end);

        // Render products or empty state
        container.innerHTML = ''; // Clear existing content
        if (pageProducts.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="icon"><i class="fas fa-shopping-cart"></i></div>
                    <div class="text">
                        Your cart is empty.<br>
                        <span class="subtext">Go to the products page and add some!</span>
                    </div>
                </div>
            `;
            // Clear pagination controls if the cart is empty and the element exists
            if (paginationControls) {
                paginationControls.innerHTML = '';
            }
            return;
        }

        // Build HTML for cart products
        let productsHtml = '';
        pageProducts.forEach(product => {
            // Check if product is in favorites for initial checkbox state
            const isFavorite = getFavorites().includes(product.id);
            productsHtml += `
            <div class="card" data-id="${product.id}">
                <div class="image-container">
                    <img src="${product.img}" alt="${product.name}">
                    <div class="price">${product.price}</div>
                </div>
                <label class="favorite">
                    <input type="checkbox" class="favorite-checkbox" data-id="${product.id}" ${isFavorite ? 'checked' : ''}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#000000">
                        <path d="M12 20a1 1 0 0 1-.437-.1C11.214 19.73 3 15.671 3 9a5 5 0 0 1 8.535-3.536l.465.465.465-.465A5 5 0 0 1 21 9c0 6.646-8.212 10.728-8.562 10.9A1 1 0 0 1 12 20z"></path>
                    </svg>
                </label>
                <div class="content">
                    <div class="brand">${product.brand}</div>
                    <div class="product-name">${product.name}</div>
                    <div class="button-container">
                        <button class="buy-button button">Buy Now</button>
                        <button class="cart-button button remove-from-cart-btn" data-product-id="${product.id}">
                            <svg viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
                                <line x1="4" y1="4" x2="20" y2="20" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                                <line x1="20" y1="4" x2="4" y2="20" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
            `;
        });
        container.innerHTML = productsHtml; // Set innerHTML once

        // Render pagination controls
        renderPaginationControls(totalPages, currentPage);
    }

    function renderPaginationControls(totalPages, currentPage) {
        const container = document.getElementById('pagination-controls');
        // Exit early if pagination container doesn't exist
        if (!container) {
            // console.warn('Element with ID "pagination-controls" not found. Skipping renderPaginationControls.');
            return;
        }

        if (totalPages <= 1) {
            container.innerHTML = '';
            return;
        }
        let html = `<nav aria-label="Cart pagination"><ul class="pagination justify-content-center">`;
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
            }
        } else {
            favorites = favorites.filter(id => id !== productId);
        }
        setFavorites(favorites);
        // Re-render cart to ensure other favorite checkboxes are updated if needed
        // renderCart(currentPage); // Potentially causes a loop if not careful with rendering
        // Better: just update all checkboxes directly if a favorite changes
        const cartContainer = document.getElementById('cart-container');
        if (cartContainer) {
            updateFavoriteCheckboxes(cartContainer);
        }
    }

    function removeFromCart(productId) {
        let cart = getCart();
        if (cart.includes(productId)) {
            cart = cart.filter(id => id !== productId);
            setCart(cart);
            renderCart(currentPage); // Re-render cart after removal
        }
    }

    // This block runs once the DOM is fully loaded
    document.addEventListener('DOMContentLoaded', function() {
        // Initial render of the cart
        renderCart(1);

        // Event delegation for pagination links
        const paginationContainer = document.getElementById('pagination-controls');
        if (paginationContainer) {
            paginationContainer.addEventListener('click', function(event) {
                const pageLink = event.target.closest('a[data-page]');
                if (pageLink) {
                    event.preventDefault(); // Prevent default link behavior
                    const page = parseInt(pageLink.dataset.page, 10);
                    if (!isNaN(page)) {
                        currentPage = page;
                        renderCart(page);
                    }
                }
            });
        }

        // Event delegation for favorite toggles (checkboxes) within the cart
        const cartContainer = document.getElementById('cart-container');
        if (cartContainer) {
            cartContainer.addEventListener('change', function(event) { // Use 'change' for checkboxes
                const checkbox = event.target.closest('input.favorite-checkbox[type="checkbox"][data-id]');
                if (checkbox) {
                    toggleFavorite(checkbox, checkbox.dataset.id);
                }
            });

            // Event delegation for remove from cart buttons
            cartContainer.addEventListener('click', function(event) {
                const removeButton = event.target.closest('button.remove-from-cart-btn[data-product-id]');
                if (removeButton) {
                    removeFromCart(removeButton.dataset.productId);
                }
            });
        }

        // Handle proceed to checkout button click
        const proceedCheckoutBtn = document.getElementById('proceed-checkout-btn');
        if (proceedCheckoutBtn) {
            proceedCheckoutBtn.addEventListener('click', function() {
                window.open('checkout.html', '_blank');
            });
        }
    });

    // Listen for changes in localStorage from other tabs/windows
    window.addEventListener('storage', function(e) {
        if (e.key === 'cart') {
            const cartContainer = document.getElementById('cart-container');
            if (cartContainer) { // Only re-render if we are on a page with the cart container
                renderCart(currentPage);
            }
        }
        if (e.key === 'favorites') {
            const cartContainer = document.getElementById('cart-container');
            if (cartContainer) { // Only update checkboxes if we are on a page with the cart container
                updateFavoriteCheckboxes(cartContainer);
            }
        }
    });

})(); // End of IIFE

(function() { // Start of the Immediately Invoked Function Expression (IIFE)

    const PRODUCTS_PER_PAGE = 8;
    let currentPage = 1;

    function getCart() {
        return JSON.parse(localStorage.getItem('cart') || '[]');
    }

    function setCart(cart) {
        localStorage.setItem('cart', JSON.stringify(cart));
    }

    function getFavorites() {
        return JSON.parse(localStorage.getItem('favorites') || '[]');
    }

    function setFavorites(favs) {
        localStorage.setItem('favorites', JSON.stringify(favs));
    }

    function updateFavoriteCheckboxes(containerElement) {
        const favorites = getFavorites();
        containerElement.querySelectorAll('.favorite-checkbox').forEach(cb => {
            cb.checked = favorites.includes(cb.dataset.id);
        });
    }

    function renderCart(page = 1) {
        const cart = getCart();
        const container = document.getElementById('cart-container');
        const countHeader = document.getElementById('cart-count-header');
        const paginationControls = document.getElementById('pagination-controls');
        if (!container) return;
        const total = cart.length;
        if (countHeader) countHeader.textContent = total;
        const totalPages = Math.ceil(total / PRODUCTS_PER_PAGE) || 1;
        if (page > totalPages) page = totalPages;
        currentPage = page;
        const start = (page - 1) * PRODUCTS_PER_PAGE;
        const end = start + PRODUCTS_PER_PAGE;
        const pageProducts = cart.slice(start, end);
        container.innerHTML = '';
        if (pageProducts.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="icon"><i class="fas fa-shopping-cart"></i></div>
                    <div class="text">
                        Your cart is empty.<br>
                        <span class="subtext">Go to the bundles page and add some!</span>
                    </div>
                </div>
            `;
            if (paginationControls) paginationControls.innerHTML = '';
            return;
        }
        pageProducts.forEach(product => {
            const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
            const isFavorite = favorites.some(item => item.id === product.id);
            container.innerHTML += `
                <div class="cardd" data-id="${product.id}">
                    <div class="image-container">
                        <img src="${product.image}" alt="${product.title}">
                        <div class="price">${parseFloat(product.price).toFixed(2)} EGP</div>
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
                           
                            <button class="remove-from-cart-btn button" data-product-id="${product.id}">Remove</button>
                        </div>
                    </div>
                </div>
            `;
        });
    }

    function renderPaginationControls(totalPages, currentPage) {
        const container = document.getElementById('pagination-controls');
        if (!container) {
            return;
        }
        let html = `<nav aria-label="Cart pagination"><ul class="pagination justify-content-center">`;

        if (totalPages <= 1) {
            container.innerHTML = '';
            return;
        }
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
            }
        } else {
            favorites = favorites.filter(id => id !== productId);
        }
        setFavorites(favorites);
        const cartContainer = document.getElementById('cart-container');
        if (cartContainer) {
            updateFavoriteCheckboxes(cartContainer);
        }
    }

    function removeFromCart(productId) {
        let cart = getCart();
        if (cart.includes(productId)) {
            cart = cart.filter(id => id !== productId);
            setCart(cart);
            renderCart(currentPage);
        }
    }

    document.addEventListener('DOMContentLoaded', function() {
        renderCart(1);

        const paginationContainer = document.getElementById('pagination-controls');
        if (paginationContainer) {
            paginationContainer.addEventListener('click', function(event) {
                const pageLink = event.target.closest('a[data-page]');
                if (pageLink) {
                    event.preventDefault();
                    const page = parseInt(pageLink.dataset.page, 10);
                    if (!isNaN(page)) {
                        currentPage = page;
                        renderCart(page);
                    }
                }
            });
        }

        const cartContainer = document.getElementById('cart-container');
        if (cartContainer) {
            cartContainer.addEventListener('change', function(event) {
                const checkbox = event.target.closest('input.favorite-checkbox[type="checkbox"][data-id]');
                if (checkbox) {
                    toggleFavorite(checkbox, checkbox.dataset.id);
                }
            });

            cartContainer.addEventListener('click', function(event) {
                const removeButton = event.target.closest('button.remove-from-cart-btn[data-product-id]');
                if (removeButton) {
                    const productId = removeButton.getAttribute('data-product-id');
                    let cart = getCart();
                    cart = cart.filter(item => item.id !== productId);
                    setCart(cart);
                    renderCart(currentPage);
                }
            });
        }

        const proceedCheckoutBtn = document.getElementById('proceed-checkout-btn');
        if (proceedCheckoutBtn) {
            proceedCheckoutBtn.addEventListener('click', function() {
                window.open('checkout.html', '_blank');
            });
        }
    });

    window.addEventListener('storage', function(e) {
        if (e.key === 'cart') {
            const cartContainer = document.getElementById('cart-container');
            if (cartContainer) {
                renderCart(currentPage);
            }
        }
        if (e.key === 'favorites') {
            const cartContainer = document.getElementById('cart-container');
            if (cartContainer) {
                updateFavoriteCheckboxes(cartContainer);
            }
        }
    });

})(); // End of IIFE