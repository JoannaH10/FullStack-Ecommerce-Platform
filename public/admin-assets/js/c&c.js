(function() { // Start IIFE for c&c.js
    document.addEventListener("DOMContentLoaded", function () {
        // Combined search + dropdown filter logic
        const setupCombinedFilter = (searchSelector, dropdownSelector, tableSelector, footerSelector) => {
            const searchInput = document.querySelector(searchSelector);
            const dropdown = document.querySelector(dropdownSelector);
            const rows = document.querySelectorAll(`${tableSelector} tbody tr`); // Initial query, re-queried in applyFilters
            const footerText = document.querySelector(footerSelector);

            const applyFilters = () => {
                // Re-query rows inside applyFilters for dynamic content
                const currentRows = document.querySelectorAll(`${tableSelector} tbody tr`);
                const query = searchInput.value.toLowerCase().trim();
                const selected = dropdown.value.toLowerCase();
                let visibleCount = 0;

                currentRows.forEach(row => { // Use currentRows here
                    // Adjusting selectors for potential category structure.
                    // Assuming first td has primary info, second is stock, third is status.
                    const name = row.querySelector("td:nth-child(1) p")?.textContent.toLowerCase() || "";
                    // If categories don't have a SKU, this might always be empty. Adjust if needed.
                    const sku = row.querySelector("td:nth-child(1) p:nth-child(2)")?.textContent.toLowerCase() || "";
                    const stock = row.querySelector("td:nth-child(2)")?.textContent.toLowerCase() || "";
                    // Targeting the span specifically for status for robustness
                    const status = row.querySelector("td:nth-child(3) span")?.textContent.toLowerCase().trim() || "";

                    let matchesSearch = true;
                    let matchesDropdown = true;

                    if (query === "active" || query === "inactive") {
                        matchesSearch = (status === query);
                    } else {
                        const combined = `${name} ${sku} ${stock} ${status}`;
                        matchesSearch = combined.includes(query);
                    }

                    if (
                        selected !== "all countries" &&
                        selected !== "all categories" && // Make sure your dropdown has 'all categories' option
                        selected !== "all" &&
                        selected !== "" &&
                        selected !== "default"
                    ) {
                        // For category filter, you're likely filtering by category name
                        matchesDropdown = (name === selected);
                    }

                    if (matchesSearch && matchesDropdown) {
                        row.style.display = "";
                        visibleCount++;
                    } else {
                        row.style.display = "none";
                    }
                });

                if (footerText) {
                    footerText.textContent = `Showing ${visibleCount} of ${currentRows.length} result${currentRows.length !== 1 ? 's' : ''}`;
                }
            };

            searchInput.addEventListener("input", applyFilters);
            dropdown.addEventListener("change", applyFilters);

            // Initial filter application in case there's a default filter or search query
            applyFilters();
        };

        // Helper function to update footer text
        function updateFooterText(tableSelector, footerSelector) {
            const currentRows = document.querySelectorAll(`${tableSelector} tbody tr`);
            const footerText = document.querySelector(footerSelector);
            if (footerText) {
                footerText.textContent = `Showing ${currentRows.length} of ${currentRows.length} result${currentRows.length !== 1 ? 's' : ''}`;
            }
        }

        // Setup filtering for countries and categories
        setupCombinedFilter('.country-search-bar', '.country-filter', '.country-data-table', '.country-table-footer p');
        setupCombinedFilter('.category-search-bar', '.category-filter', '.category-data-table', '.category-table-footer p');


        // --- Common Modal Elements (declared early to be in scope for both country and category modals) ---
        const modalOverlay = document.getElementById("modalOverlay");

        // --- Country related code ---
        const addCountryBtn = document.querySelector(".add-country-btn");
        const addCountryModal = document.getElementById("addCountryForm");
        const closeAddCountryModal = document.getElementById("closeModal");
        const addCountrySubmitBtn = document.getElementById("addCountrySubmit");
        const countryNameInput = document.getElementById("countryName");
        const countryCodeInput = document.getElementById("countryCode");
        const flagUploadInput = document.getElementById("flagUpload");
        const flagPreview = document.getElementById("flagPreview");
        const countryTableBody = document.querySelector(".country-data-table tbody");
        const countryFilterDropdown = document.querySelector(".country-filter");

        // --- Category related code ---
        const addCategoryBtn = document.querySelector(".add-category-btn");
        const addCategoryModal = document.getElementById("addCategoryForm");
        const closeAddCategoryModal = document.getElementById("closeAddCategoryModal");
        const addCategorySubmitBtn = document.getElementById("addCategorySubmit");
        const categoryNameInput = document.getElementById("categoryName");
        const categoryIconInput = document.getElementById("categoryIcon");
        const categoryColorInput = document.getElementById("categoryColor");
        const categoryStockInput = document.getElementById("categoryStock");
        const categoryStatusInput = document.getElementById("categoryStatus");
        const categoryTableBody = document.querySelector(".category-data-table tbody");
        const categoryFilterDropdown = document.querySelector(".category-filter");


        // Ensure elements exist before adding listeners to avoid errors if they are conditionally rendered
        if (addCountryBtn) {
            addCountryBtn.addEventListener("click", () => {
                addCountryModal.classList.add("show");
                modalOverlay.classList.add("show");
            });
        }

        if (closeAddCountryModal) {
            closeAddCountryModal.addEventListener("click", () => {
                addCountryModal.classList.remove("show");
                modalOverlay.classList.remove("show");
                countryNameInput.value = '';
                countryCodeInput.value = '';
                flagUploadInput.value = '';
                flagPreview.style.backgroundImage = 'none';
            });
        }

        if (modalOverlay) {
            modalOverlay.addEventListener("click", () => {
                // Close all modals
                if (addCountryModal) addCountryModal.classList.remove("show");
                if (addCategoryModal) addCategoryModal.classList.remove("show");
                modalOverlay.classList.remove("show");

                // Clear all form fields
                if (countryNameInput) countryNameInput.value = '';
                if (countryCodeInput) countryCodeInput.value = '';
                if (flagUploadInput) flagUploadInput.value = '';
                if (flagPreview) flagPreview.style.backgroundImage = 'none';

                if (categoryNameInput) categoryNameInput.value = '';
                if (categoryIconInput) categoryIconInput.value = '';
                if (categoryColorInput) categoryColorInput.value = '';
                if (categoryStockInput) categoryStockInput.value = '0';
                if (categoryStatusInput) categoryStatusInput.value = 'Active';
            });
        }

        if (flagUploadInput) {
            flagUploadInput.addEventListener('change', function() {
                const file = this.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = function(e) {
                        flagPreview.style.backgroundImage = `url(${e.target.result})`;
                    };
                    reader.readAsDataURL(file);
                } else {
                    flagPreview.style.backgroundImage = 'none';
                }
            });
        }

        if (addCountrySubmitBtn) {
            addCountrySubmitBtn.addEventListener("click", async (e) => {
                e.preventDefault();

                const countryName = countryNameInput.value.trim();
                const countryCode = countryCodeInput.value.trim();
                const flagFile = flagUploadInput.files[0];

                if (!countryName || !countryCode) {
                    alert("Please enter both country name and code.");
                    return;
                }

                const formData = new FormData();
                formData.append('name', countryName);
                formData.append('code', countryCode);
                if (flagFile) {
                    formData.append('flagImage', flagFile);
                }

                try {
                    const res = await fetch('/api/s1/explore', { // Ensure this is your correct endpoint for adding countries
                        method: 'POST',
                        body: formData,
                    });

                    if (!res.ok) {
                        const errorData = await res.json();
                        throw new Error(errorData.message || 'Failed to add country');
                    }

                    const newCountry = await res.json();
                    alert("Country added successfully!");

                    const newRow = document.createElement('tr');
                    newRow.setAttribute('data-id', newCountry._id);

                    const defaultStock = newCountry.stock || 0;
                    const defaultStatus = newCountry.status || 'Active';

                    newRow.innerHTML = `
                        <td>
                            <div class="country-info">
                                <img src="${newCountry.flagImage || 'https://via.placeholder.com/40?text=?'}" alt="Flag">
                                <div>
                                    <p>${newCountry.name}</p>
                                    <p>SKU: ${newCountry.code}</p>
                                </div>
                            </div>
                        </td>
                        <td>${defaultStock}</td>
                        <td>
                            <span class="country-status ${defaultStatus === 'Active' ? 'active' : 'inactive'}"
                                    data-id="${newCountry._id}" data-current-status="${defaultStatus}">
                                ${defaultStatus}
                            </span>
                        </td>
                        <td>
                            <button class="edit-country-btn"><i class="fas fa-edit"></i></button>
                            <button class="delete-country-btn" data-id="${newCountry._id}" title="Delete Country">
                                <i class="fas fa-trash-alt"></i>
                            </button>
                        </td>
                    `;
                    countryTableBody.appendChild(newRow);

                    const newOption = document.createElement('option');
                    newOption.textContent = newCountry.name;
                    countryFilterDropdown.appendChild(newOption);

                    updateFooterText('.country-data-table', '.country-table-footer p');
                    attachDeleteCountryListeners();
                    attachCountryStatusToggleListeners();

                    addCountryModal.classList.remove("show");
                    modalOverlay.classList.remove("show");
                    countryNameInput.value = '';
                    countryCodeInput.value = '';
                    flagUploadInput.value = '';
                    flagPreview.style.backgroundImage = 'none';

                } catch (err) {
                    console.error('Error adding country:', err);
                    alert(`Error adding country: ${err.message}`);
                }
            });
        }

        function attachDeleteCountryListeners() {
            const deleteCountryButtons = document.querySelectorAll('.delete-country-btn');
            deleteCountryButtons.forEach(button => {
                button.removeEventListener('click', handleDeleteCountry); // Prevent duplicate listeners
                button.addEventListener('click', handleDeleteCountry);
            });
        }

        async function handleDeleteCountry(event) {
            const button = event.currentTarget;
            const id = button.dataset.id;
            const confirmDelete = confirm('Are you sure you want to delete this country?');
            if (!confirmDelete) return;

            try {
                const res = await fetch(`/api/s1/explore/${id}`, {
                    method: 'DELETE'
                });

                if (!res.ok) {
                    const errorData = await res.json();
                    throw new Error(errorData.message || 'Failed to delete country');
                }

                // Get the name from the button's parent row's text content before it's removed
                const deletedCountryName = button.closest('tr').querySelector('.country-info p')?.textContent;
                button.closest('tr').remove();
                alert('Country deleted successfully!');

                const options = countryFilterDropdown.querySelectorAll('option');
                options.forEach(option => {
                    if (option.textContent === deletedCountryName) {
                        option.remove();
                    }
                });

                updateFooterText('.country-data-table', '.country-table-footer p');

            } catch (err) {
                console.error('Error deleting country:', err);
                alert(`Error deleting country: ${err.message}`);
            }
        }

        // Country Status Toggle Logic
        function attachCountryStatusToggleListeners() {
            const statusSpans = document.querySelectorAll('.country-status');
            statusSpans.forEach(span => {
                span.removeEventListener('click', handleCountryStatusToggle); // Prevent duplicate listeners
                span.addEventListener('click', handleCountryStatusToggle);
            });
        }

        async function handleCountryStatusToggle(event) {
            const span = event.currentTarget;
            const countryId = span.dataset.id;
            const currentStatus = span.dataset.currentStatus;
            const newStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';

            try {
                const response = await fetch(`/admin/countries/${countryId}/status`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ status: newStatus })
                });

                if (response.ok) {
                    const updatedCountry = await response.json();
                    span.textContent = updatedCountry.status;
                    span.dataset.currentStatus = updatedCountry.status;
                    if (updatedCountry.status === 'Active') {
                        span.classList.remove('inactive');
                        span.classList.add('active');
                    } else {
                        span.classList.remove('active');
                        span.classList.add('inactive');
                    }
                } else {
                    const errorData = await response.json();
                    alert('Error updating country status: ' + errorData.message);
                }
            } catch (error) {
                console.error('Fetch error:', error);
                alert('An unexpected error occurred.');
            }
        }


        // --- Category related code ---

        // Open Add Category Modal
        if (addCategoryBtn) {
            addCategoryBtn.addEventListener("click", () => {
                if (addCategoryModal && modalOverlay) { // Defensive check
                    addCategoryModal.classList.add("show");
                    modalOverlay.classList.add("show");
                }
            });
        }

        // Close Add Category Modal
        if (closeAddCategoryModal) {
            closeAddCategoryModal.addEventListener("click", () => {
                if (addCategoryModal && modalOverlay) { // Defensive check
                    addCategoryModal.classList.remove("show");
                    modalOverlay.classList.remove("show");
                }
                // Clear form fields (added defensive checks)
                if (categoryNameInput) categoryNameInput.value = '';
                if (categoryIconInput) categoryIconInput.value = '';
                if (categoryColorInput) categoryColorInput.value = '';
                if (categoryStockInput) categoryStockInput.value = '0';
                if (categoryStatusInput) categoryStatusInput.value = 'Active';
            });
        }

        // Handle Adding New Category
        if (addCategorySubmitBtn) {
            addCategorySubmitBtn.addEventListener("click", async (e) => {
                e.preventDefault();

                const name = categoryNameInput.value.trim();
                const icon = categoryIconInput.value.trim();
                const color = categoryColorInput.value.trim();
                const stock = parseInt(categoryStockInput.value, 10);
                const status = categoryStatusInput.value;

                if (!name) {
                    alert("Please enter a category name.");
                    return;
                }

                try {
                    const res = await fetch('/api/s1/category/', { // Ensure this is your correct endpoint for adding categories
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            // Add authorization token if needed
                            // 'Authorization': `Bearer ${yourAuthToken}`
                        },
                        body: JSON.stringify({ name, icon, color, stock, status })
                    });

                    if (!res.ok) {
                        const errorData = await res.json();
                        throw new Error(errorData.message || 'Failed to add category');
                    }

                    const newCategory = await res.json();
                    alert("Category added successfully!");

                    const newRow = document.createElement('tr');
                    newRow.setAttribute('data-id', newCategory._id);

                    const displayStock = newCategory.stock !== undefined ? newCategory.stock : 0;
                    const displayStatus = newCategory.status || 'Active';

                    newRow.innerHTML = `
                        <td>
                            <div class="category-info">
                                <i class="${newCategory.icon || 'fas fa-tag'}" style="color:${newCategory.color || '#333'};"></i>
                                <div>
                                    <p>${newCategory.name}</p>
                                </div>
                            </div>
                        </td>
                        <td>${displayStock}</td>
                        <td>
                            <span class="category-status ${displayStatus === 'Active' ? 'active' : 'inactive'}"
                                    data-id="${newCategory._id}" data-current-status="${displayStatus}">
                                ${displayStatus}
                            </span>
                        </td>
                        <td>
                            <button class="edit-category-btn"><i class="fas fa-edit"></i></button>
                            <button class="delete-category-btn" data-id="${newCategory._id}" title="Delete Category">
                                <i class="fas fa-trash-alt"></i>
                            </button>
                        </td>
                    `;
                    categoryTableBody.appendChild(newRow);

                    const newOption = document.createElement('option');
                    newOption.textContent = newCategory.name;
                    categoryFilterDropdown.appendChild(newOption);

                    updateFooterText('.category-data-table', '.category-table-footer p');
                    attachDeleteCategoryListeners(); // Re-attach for new delete button
                    attachCategoryStatusToggleListeners(); // Re-attach for new status span

                    addCategoryModal.classList.remove("show");
                    modalOverlay.classList.remove("show");
                    categoryNameInput.value = '';
                    categoryIconInput.value = '';
                    categoryColorInput.value = '';
                    categoryStockInput.value = '0';
                    categoryStatusInput.value = 'Active';

                } catch (err) {
                    console.error('Error adding category:', err);
                    alert(`Error adding category: ${err.message}`);
                }
            });
        }

        function attachDeleteCategoryListeners() {
            const deleteCategoryButtons = document.querySelectorAll('.delete-category-btn');
            deleteCategoryButtons.forEach(button => {
                button.removeEventListener('click', handleDeleteCategory); // Prevent duplicate listeners
                button.addEventListener('click', handleDeleteCategory);
            });
        }

        async function handleDeleteCategory(event) {
            const button = event.currentTarget;
            const id = button.dataset.id;
            const confirmDelete = confirm('Are you sure you want to delete this category?');
            if (!confirmDelete) return;

            try {
                const res = await fetch(`/api/s1/category/${id}`, { // Your original DELETE endpoint
                    method: 'DELETE'
                });

                if (!res.ok) {
                    const errorData = await res.json();
                    throw new Error(errorData.message || 'Failed to delete category');
                }
                const deletedCategoryName = button.closest('tr').querySelector('.category-info p')?.textContent;
                button.closest('tr').remove();
                alert('Category deleted successfully!');

                updateFooterText('.category-data-table', '.category-table-footer p');

                const options = categoryFilterDropdown.querySelectorAll('option');
                options.forEach(option => {
                    if (option.textContent === deletedCategoryName) {
                        option.remove();
                    }
                });

            } catch (err) {
                console.error('Error deleting category:', err);
                alert(`Error deleting category: ${err.message}`);
            }
        }

        // Category Status Toggle Logic
        function attachCategoryStatusToggleListeners() {
            const statusSpans = document.querySelectorAll('.category-status');
            statusSpans.forEach(span => {
                span.removeEventListener('click', handleCategoryStatusToggle); // Prevent duplicate listeners
                span.addEventListener('click', handleCategoryStatusToggle);
            });
        }

        async function handleCategoryStatusToggle(event) {
            const span = event.currentTarget;
            const categoryId = span.dataset.id;
            const currentStatus = span.dataset.currentStatus;
            const newStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';

            try {
                const response = await fetch(`/admin/categories/${categoryId}/status`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ status: newStatus })
                });

                if (response.ok) {
                    const updatedCategory = await response.json();
                    span.textContent = updatedCategory.status;
                    span.dataset.currentStatus = updatedCategory.status;
                    if (updatedCategory.status === 'Active') {
                        span.classList.remove('inactive');
                        span.classList.add('active');
                    } else {
                        span.classList.remove('active');
                        span.classList.add('inactive');
                    }
                } else {
                    const errorData = await response.json();
                    alert('Error updating status: ' + errorData.message);
                }
            } catch (error) {
                console.error('Fetch error:', error);
                alert('An unexpected error occurred.');
            }
        }

        // Initial attachment of all dynamic event listeners to elements present on page load
        attachDeleteCountryListeners();
        attachCountryStatusToggleListeners();
        attachDeleteCategoryListeners();
        attachCategoryStatusToggleListeners();

    });
})(); // End IIFE for c&c.js