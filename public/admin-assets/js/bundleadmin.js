document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const viewAllBtn = document.getElementById('view-all-bundles-btn');
    const addBundleBtn = document.getElementById('add-bundle-btn');
    const tableSection = document.getElementById('bundle-table-section');
    const formSection = document.getElementById('bundle-form-section');
    const bundleForm = document.getElementById('bundle-form');
    const cancelBtn = document.getElementById('cancel-form-btn');
    const bundleIdInput = document.getElementById('bundle-id');
    const bundlesTableBody = document.getElementById('bundles-table-body');
    const productsGrid = document.getElementById('products-grid');
    const selectedCount = document.getElementById('selected-count');
    const loadingSpinner = document.getElementById('loading-spinner');

    // Data
    let selectedProducts = [];
    let allProducts = [];
    let allBundles = [];

    // Initialize
    fetchBundles();
    fetchProducts();
    setupEventListeners();

    async function fetchBundles() {
        showLoading();
        try {
            const response = await fetch('/admin/bundles/data');
            const bundles = await response.json();
            allBundles = bundles;
            renderBundlesTable(bundles);
            hideLoading();
        } catch (err) {
            console.error('Error fetching bundles:', err);
            hideLoading();
        }
    }

    async function fetchProducts() {
        showLoading();
        try {
            const response = await fetch('/admin/products/data');
            const products = await response.json();
            allProducts = products;
            renderProductsGrid(products);
            hideLoading();
        } catch (err) {
            console.error('Error fetching products:', err);
            hideLoading();
        }
    }

    function renderBundlesTable(bundles) {
        bundlesTableBody.innerHTML = '';
        
        bundles.forEach(bundle => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${bundle._id.slice(-6)}</td>
                <td><img src="${bundle.image || '/images/placeholder.png'}" 
                         alt="${bundle.title}" class="bundle-image"></td>
                <td>${bundle.title}</td>
                <td>${bundle.category}</td>
                <td><span class="product-count">${bundle.products.length}</span></td>
                <td>${bundle.price.toFixed(2)} EGP</td>
                <td>${bundle.description?.substring(0, 50) || 'No description'}...</td>
                <td class="action-buttons">
                    <button class="btn-edit" data-id="${bundle._id}">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn-delete" data-id="${bundle._id}">
                        <i class="fas fa-trash-alt"></i> Delete
                    </button>
                </td>
            `;
            bundlesTableBody.appendChild(row);
        });
        
        attachTableEventListeners();
    }

    function renderProductsGrid(products) {
        productsGrid.innerHTML = '';
        products.forEach(product => {
            const card = document.createElement('div');
            card.className = 'product-card';
            card.dataset.id = product._id;
            card.dataset.category = product.category?.toLowerCase().replace(' ', '') || 'other';
            
            card.innerHTML = `
                <img src="${product.image || '/images/placeholder.png'}" 
                     alt="${product.name}">
                <h4>${product.name}</h4>
                <p>${product.brand || 'No brand'}</p>
                <div class="price">${product.price.toFixed(2)} EGP</div>
            `;
            
            card.addEventListener('click', toggleProductSelection);
            productsGrid.appendChild(card);
        });
    }

    function toggleProductSelection(e) {
        const card = e.currentTarget;
        const productId = card.dataset.id;
        
        if (selectedProducts.includes(productId)) {
            selectedProducts = selectedProducts.filter(id => id !== productId);
            card.classList.remove('selected');
        } else {
            selectedProducts.push(productId);
            card.classList.add('selected');
        }
        
        selectedCount.textContent = `${selectedProducts.length} products selected`;
    }

    function attachTableEventListeners() {
        document.querySelectorAll('.btn-edit').forEach(btn => {
            btn.addEventListener('click', () => loadBundleForEditing(btn.dataset.id));
        });
        
        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', () => deleteBundle(btn.dataset.id));
        });
    }

    async function loadBundleForEditing(bundleId) {
        showLoading();
        try {
            const response = await fetch(`/admin/bundles/${bundleId}`);
            const bundle = await response.json();
            
            // Populate form
            bundleIdInput.value = bundle._id;
            document.getElementById('bundle-title').value = bundle.title;
            document.getElementById('bundle-category').value = bundle.category;
            document.getElementById('bundle-price').value = bundle.price;
            document.getElementById('bundle-description').value = bundle.description;
            document.getElementById('bundle-image').value = bundle.image || '';
            
            // Select products
            selectedProducts = bundle.products.map(p => p._id);
            document.querySelectorAll('.product-card').forEach(card => {
                card.classList.toggle('selected', selectedProducts.includes(card.dataset.id));
            });
            selectedCount.textContent = `${selectedProducts.length} products selected`;
            
            // Switch to form view
            tableSection.classList.remove('active');
            formSection.classList.add('active');
            hideLoading();
        } catch (err) {
            console.error('Error loading bundle:', err);
            hideLoading();
        }
    }

    async function deleteBundle(bundleId) {
        if (!confirm('Are you sure you want to delete this bundle?')) return;
        
        showLoading();
        try {
            const response = await fetch(`/admin/bundles/${bundleId}`, { method: 'DELETE' });
            
            if (response.ok) {
                fetchBundles(); // Refresh table
            } else {
                alert('Failed to delete bundle');
            }
            hideLoading();
        } catch (err) {
            console.error('Error deleting bundle:', err);
            hideLoading();
        }
    }

    function setupEventListeners() {
        // Navigation
        viewAllBtn.addEventListener('click', () => {
            tableSection.classList.add('active');
            formSection.classList.remove('active');
        });
        
        addBundleBtn.addEventListener('click', () => {
            bundleForm.reset();
            bundleIdInput.value = '';
            selectedProducts = [];
            document.querySelectorAll('.product-card').forEach(card => {
                card.classList.remove('selected');
            });
            selectedCount.textContent = '0 products selected';
            tableSection.classList.remove('active');
            formSection.classList.add('active');
        });
        
        cancelBtn.addEventListener('click', () => {
            tableSection.classList.add('active');
            formSection.classList.remove('active');
        });
        
        // Form submission
        bundleForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const bundleData = {
                title: document.getElementById('bundle-title').value,
                category: document.getElementById('bundle-category').value,
                products: selectedProducts,
                price: parseFloat(document.getElementById('bundle-price').value),
                description: document.getElementById('bundle-description').value,
                image: document.getElementById('bundle-image').value
            };
            
            if (!validateBundle(bundleData)) return;
            
            showLoading();
            try {
                const url = bundleIdInput.value 
                    ? `/admin/bundles/${bundleIdInput.value}`
                    : '/admin/bundles';
                    
                const method = bundleIdInput.value ? 'PUT' : 'POST';
                
                const response = await fetch(url, {
                    method,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(bundleData)
                });
                
                if (response.ok) {
                    fetchBundles(); // Refresh table
                    tableSection.classList.add('active');
                    formSection.classList.remove('active');
                } else {
                    const error = await response.json();
                    alert(`Error: ${error.message}`);
                }
                hideLoading();
            } catch (err) {
                console.error('Error saving bundle:', err);
                hideLoading();
            }
        });
        
        // Category filtering
        document.querySelectorAll('.category-tabs a').forEach(tab => {
            tab.addEventListener('click', (e) => {
                e.preventDefault();
                document.querySelectorAll('.category-tabs a').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                
                const filter = tab.dataset.filter;
                document.querySelectorAll('.product-card').forEach(card => {
                    card.style.display = (filter === 'all' || card.dataset.category === filter) 
                        ? 'block' 
                        : 'none';
                });
            });
        });
    }

    function validateBundle(data) {
        if (!data.title) {
            alert('Please enter a bundle title');
            return false;
        }
        if (!data.category) {
            alert('Please select a category');
            return false;
        }
        if (data.products.length === 0) {
            alert('Please select at least one product');
            return false;
        }
        if (isNaN(data.price) || data.price <= 0) {
            alert('Please enter a valid price');
            return false;
        }
        return true;
    }

    function showLoading() {
        loadingSpinner.style.display = 'block';
    }

    function hideLoading() {
        loadingSpinner.style.display = 'none';
    }
});
// Update the fetchProducts function
async function fetchProducts() {
    showLoading();
    try {
        const response = await fetch('/admin/products/admin-data');
        const products = await response.json();
        allProducts = products;
        renderProductsGrid(products);
        hideLoading();
    } catch (err) {
        console.error('Error fetching products:', err);
        hideLoading();
    }
}

// Update renderProductsGrid
function renderProductsGrid(products) {
    productsGrid.innerHTML = '';
    products.forEach(product => {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.dataset.id = product._id;
        card.dataset.category = product.category?.toLowerCase().replace(/\s+/g, '') || 'other';
        
        card.innerHTML = `
            <img src="${product.image || '/images/placeholder.png'}" 
                 alt="${product.name}" 
                 onerror="this.onerror=null;this.src='/images/placeholder.png'">
            <h4>${product.name}</h4>
            <p>${product.brand || 'No brand'}</p>
            <div class="price">${product.price.toFixed(2)} EGP</div>
        `;
        
        card.addEventListener('click', toggleProductSelection);
        productsGrid.appendChild(card);
    });
}