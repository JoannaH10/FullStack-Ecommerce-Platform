// public/js/admin.js

document.addEventListener('DOMContentLoaded', function() {
    const viewProductsBtn = document.getElementById('view-products-btn');
    const addProductBtn = document.getElementById('add-product-btn');
    const productListSection = document.getElementById('product-table-section');
    const productFormSection = document.getElementById('product-form-section');
    const productTableBody = document.getElementById('product-table-body');
    const productForm = document.getElementById('product-form');
    const productIdInput = document.getElementById('product-id');

    const formTitle = productFormSection.querySelector('h2');
    const cancelFormBtn = document.getElementById('cancel-form-btn');
    const productFormMessage = document.getElementById('product-form-message');
    const loadingProductsMessage = document.getElementById('loading-products-message');
    const emptyProductsMessage = document.getElementById('empty-products-message');
    const productListMessage = document.getElementById('product-list-message');

    const searchInput = document.getElementById('search-input');
    const searchButton = document.getElementById('search-button');

    const productCategorySelect = document.getElementById('product-category');
    const productCountrySelect = document.getElementById('product-country');

    const productCountInStockInput = document.getElementById('product-countInStock'); // Ensure this element is correctly selected

    // Ensure API_SNACK_PREFIX is defined from the EJS layout
    const API_BASE_URL = API_SNACK_PREFIX + '/admin/products';
    const API_CATEGORY_URL = API_SNACK_PREFIX + '/admin/categories';
    const API_COUNTRY_URL = API_SNACK_PREFIX + '/admin/countries';


    // --- Navigation Logic ---
    function showSection(sectionId) {
        document.querySelectorAll('.admin-section').forEach(section => {
            section.classList.remove('active');
        });
        document.getElementById(sectionId).classList.add('active');

        document.querySelectorAll('.admin-nav button').forEach(button => {
            button.classList.remove('active');
        });
        if (sectionId === 'product-table-section') {
            viewProductsBtn.classList.add('active');
        } else if (sectionId === 'product-form-section') {
            addProductBtn.classList.add('active');
        }
    }

    viewProductsBtn.addEventListener('click', () => {
        showSection('product-table-section');
    });

    addProductBtn.addEventListener('click', async () => {
        resetForm();
        formTitle.textContent = 'Add New Product';
        await populateCategoryDropdown();
        await populateCountryDropdown();
        showSection('product-form-section');
    });

    cancelFormBtn.addEventListener('click', () => showSection('product-table-section'));


    // --- Product Fetching and Rendering (FOR CLIENT-SIDE ACTIONS like Search/Filter, NOT initial page load) ---
    async function fetchProducts(searchTerm = '') {
        loadingProductsMessage.style.display = 'block';
        emptyProductsMessage.style.display = 'none';
        productListMessage.style.display = 'none';
        productTableBody.innerHTML = ''; // Clear table for new results

        let url = API_BASE_URL; // Using the Admin API endpoint
        if (searchTerm) {
            url += `?search=${encodeURIComponent(searchTerm)}`;
        }

        try {
            const response = await fetch(url);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to fetch products');
            }
            const products = await response.json();
            renderProductsTable(products);
        } catch (error) {
            console.error('Error fetching products:', error);
            showProductListMessage('Error fetching products: ' + error.message, 'error');
            emptyProductsMessage.style.display = 'block';
        } finally {
            loadingProductsMessage.style.display = 'none';
        }
    }

    function renderProductsTable(products) {
        productTableBody.innerHTML = '';
        if (products.length === 0) {
            emptyProductsMessage.style.display = 'block';
            return;
        }

        products.forEach(product => {
            const row = productTableBody.insertRow();
            row.dataset.id = product._id;
            row.innerHTML = `
                <td>${product._id.slice(-5)}</td>
                <td><img src="${product.image || 'https://via.placeholder.com/60'}" alt="${product.name}" style="width:60px;height:60px;object-fit:cover;" onerror="this.onerror=null;this.src='https://via.placeholder.com/60';"></td>
                <td>${product.name}</td>
                <td>${product.brand}</td>
                <td>${product.categoryName}</td>
                <td>${product.countryName}</td>
                <td>${product.price ? product.price.toFixed(2) : 'N/A'} EGP</td>
                <td>${product.description ? product.description.substring(0, 50) + '...' : 'N/A'}</td>
                <td>${product.countInStock}</td>
                <td class="action-buttons">
                    <button class="btn btn-edit" data-id="${product._id}">Edit</button>
                    <button class="btn btn-delete" data-id="${product._id}">Delete</button>
                </td>
            `;
        });
        attachTableEventListeners();
    }


    // --- Form Submission (Add/Edit) ---
    productForm.addEventListener('submit', async function(event) {
        event.preventDefault();
        showProductFormMessage('Saving product...', '');

        const formData = {
            name: document.getElementById('product-name').value,
            brand: document.getElementById('product-brand').value,
            category: document.getElementById('product-category').value, // This sends the ID
            country: document.getElementById('product-country').value,   // This sends the ID
            price: parseFloat(document.getElementById('product-price').value),
            countInStock: parseInt(productCountInStockInput.value), // Ensure this value is correctly retrieved
            description: document.getElementById('product-description').value,
            image: document.getElementById('product-image').value,
        };

        // Added for client-side debugging: Check what's being sent
        console.log('Frontend (admin.js): Sending formData:', formData);


        const productId = productIdInput.value;
        let url = API_BASE_URL; // Uses admin API for POST/PUT
        let method = 'POST';

        if (productId) { // If product ID exists, it's an update
            url = `${API_BASE_URL}/${productId}`;
            method = 'PUT';
        }

        try {
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to save product');
            }

            const result = await response.json();
            showProductFormMessage('Product saved successfully!', 'success');
            resetForm();
            setTimeout(() => {
                window.location.reload(); // Reload the page to show updated server-rendered list
            }, 1500);

        } catch (error) {
            console.error('Error saving product:', error);
            showProductFormMessage('Error saving product: ' + error.message, 'error');
        }
    });

    // --- Edit and Delete Handlers ---
    function attachTableEventListeners() {
        document.querySelectorAll('.btn-edit').forEach(button => {
            button.onclick = async function() {
                const productId = this.dataset.id;
                await loadProductForEdit(productId);
            };
        });

        document.querySelectorAll('.btn-delete').forEach(button => {
            button.onclick = async function() {
                const productId = this.dataset.id;
                if (confirm('Are you sure you want to delete this product?')) {
                    await deleteProduct(productId);
                }
            };
        });
    }

    async function loadProductForEdit(productId) {
        try {
            const response = await fetch(`${API_BASE_URL}/${productId}`); // Fetch from admin API for edit
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to fetch product for editing');
            }
            const product = await response.json();

            productIdInput.value = product._id;
            document.getElementById('product-name').value = product.name;
            document.getElementById('product-brand').value = product.brand;

            // Pass the _id of the populated category/country to select in dropdown
            await populateCategoryDropdown(product.category._id || product.category);
            await populateCountryDropdown(product.country._id || product.country);

            document.getElementById('product-price').value = product.price;
            productCountInStockInput.value = product.countInStock;
            document.getElementById('product-description').value = product.description;
            document.getElementById('product-image').value = product.image;

            formTitle.textContent = 'Edit Product';
            showSection('product-form-section');
            showProductFormMessage('', '');
        } catch (error) {
            console.error('Error loading product for edit:', error);
            showProductFormMessage('Error loading product for edit: ' + error.message, 'error');
        }
    }

    async function deleteProduct(productId) {
        try {
            const response = await fetch(`${API_BASE_URL}/${productId}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to delete product');
            }

            showProductListMessage('Product deleted successfully!', 'success');
            window.location.reload(); // Reload to reflect changes from server
            setTimeout(() => showProductListMessage('', ''), 2000);
        } catch (error) {
            console.error('Error deleting product:', error);
            showProductListMessage('Error deleting product: ' + error.message, 'error');
        }
    }

    // --- Utility Functions ---
    function resetForm() {
        productForm.reset();
        productIdInput.value = '';
        showProductFormMessage('', '');
    }

    function showProductFormMessage(message, type) {
        productFormMessage.textContent = message;
        productFormMessage.className = 'message ' + type;
        if (message) {
            productFormMessage.style.display = 'block';
        } else {
            productFormMessage.style.display = 'none';
        }
    }

    function showProductListMessage(message, type) {
        productListMessage.textContent = message;
        productListMessage.className = 'message ' + type;
        if (message) {
            productListMessage.style.display = 'block';
        } else {
            productListMessage.style.display = 'none';
        }
    }

    // --- Functions to Fetch and Populate Dropdowns ---
    const fetchAndPopulateDropdown = async (url, selectElement, selectedValue = '') => {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Failed to fetch data from ${url}`);
            }
            const data = await response.json();

            selectElement.innerHTML = '<option value="">Select ' + selectElement.id.replace('product-', '') + '</option>';

            data.forEach(item => {
                const option = document.createElement('option');
                const itemId = item._id || item;
                const itemName = item.name || item;

                option.value = itemId;
                option.textContent = itemName;

                if (String(itemId) === String(selectedValue)) { // Ensure strict comparison for IDs
                    option.selected = true;
                }
                selectElement.appendChild(option);
            });
        } catch (error) {
            console.error(`Error populating ${selectElement.id} dropdown:`, error);
            // Optionally show a message to the user that dropdowns couldn't load
        }
    };

    const populateCategoryDropdown = async (selectedValue = '') => {
        await fetchAndPopulateDropdown(API_CATEGORY_URL, productCategorySelect, selectedValue);
    };

    const populateCountryDropdown = async (selectedValue = '') => {
        await fetchAndPopulateDropdown(API_COUNTRY_URL, productCountrySelect, selectedValue);
    };

    // --- Search functionality event listeners ---
    const performSearch = () => {
        const searchTerm = searchInput.value.trim();
        fetchProducts(searchTerm);
        showSection('product-table-section');
    };

    searchButton.addEventListener('click', performSearch);

    searchInput.addEventListener('keyup', (event) => {
        if (event.key === 'Enter') {
            performSearch();
        }
    });

    // Initial setup: Attach event listeners to the server-rendered table
    attachTableEventListeners();
    populateCategoryDropdown();
    populateCountryDropdown();
});