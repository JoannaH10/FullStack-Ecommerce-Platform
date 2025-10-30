// public/js/checkout.js

(function() {
    /*------------------------------------------------------------------------------------------------------------------------------------------------*/
    /*----------------------------------------------------------------CHECKOUT LOGIC------------------------------------------------------------------*/
    /*------------------------------------------------------------------------------------------------------------------------------------------------*/

    // Constants for pricing
    const SHIPPING_INTERNATIONAL = 15.00;
    const SHIPPING_EGYPT = 5.00; // Example for local shipping
    const IMPORT_FEES_PERCENTAGE = 0.10; // 10% import fees for international, 0% for local

    // Get elements
    const orderItemsContainer = document.getElementById('orderItems');
    const subtotalDisplay = document.getElementById('subtotal');
    const shippingLabel = document.getElementById('shippingLabel');
    const shippingDisplay = document.getElementById('shipping');
    const feesLabel = document.getElementById('feesLabel');
    const feesDisplay = document.getElementById('fees');
    const totalDisplay = document.getElementById('total');
    const shippingCountrySelect = document.getElementById('shippingCountry');
    const creditCardOption = document.getElementById('creditCardOption');
    const cashOption = document.getElementById('cashOption');
    const creditCardForm = document.getElementById('creditCardForm');
    const cashForm = document.getElementById('cashForm');
    const placeOrderBtn = document.getElementById('placeOrderBtn');
    const cvvTooltip = document.getElementById('cvvTooltip');
    const addItemBtn = document.getElementById('addItemBtn');

    // Credit Card display elements
    const displayCardNumber = document.getElementById('displayCardNumber');
    const displayCardHolder = document.getElementById('displayCardHolder');
    const displayCardExpiry = document.getElementById('displayCardExpiry');
    const displayCardCVV = document.getElementById('displayCardCVV');
    const creditCardElement = document.getElementById('creditCard');
    const cardBrandIcon = document.getElementById('cardBrandIcon');
    const cardBrandIconBack = document.getElementById('cardBrandIconBack');

    // Input fields for form validation
    const shippingInputs = {
        firstName: document.getElementById('shippingFirstName'),
        lastName: document.getElementById('shippingLastName'),
        addressLine: document.getElementById('shippingAddressLine'),
        city: document.getElementById('shippingCity'),
        postalCode: document.getElementById('shippingPostalCode'),
        country: document.getElementById('shippingCountry'),
        phone: document.getElementById('shippingPhone'),
        specialInstructions: document.getElementById('specialInstructions')
    };

    const creditCardInputs = {
        cardNumber: document.getElementById('cardNumber'),
        cardHolder: document.getElementById('cardHolder'),
        cardExpiry: document.getElementById('cardExpiry'),
        cardCVV: document.getElementById('cardCVV')
    };

    const cashDeliveryInputs = {
        deliveryInstructions: document.getElementById('deliveryInstructions')
    };

    // --- Helper Functions ---

    function getCart() {
        return JSON.parse(localStorage.getItem('cart') || '[]');
    }

    function setCart(cart) {
        localStorage.setItem('cart', JSON.stringify(cart));
    }

    // This function is crucial if your cart stores ONLY product IDs.
    // If your cart already stores full product objects (as implied by your second IIFE),
    // then you can remove this and directly use the product object from the cart.
    // For this example, I will assume the cart stores full product objects for simplicity and robustness.
    // If it stores only IDs, you MUST have a global `products` array or fetch product data.
    // let products = []; // Uncomment and populate if cart stores only IDs

    // function getProductDetails(productId) {
    //     if (typeof products !== 'undefined' && Array.isArray(products)) {
    //         return products.find(p => p.id === productId);
    //     }
    //     console.error('Products array not found or not an array.');
    //     return null;
    // }

    function formatPrice(price) {
        return `${parseFloat(price).toFixed(2)} EGP`;
    }

    // --- BUY NOW LOGIC: Check for buyNowType in URL and override cart if present ---
    function getQueryParam(param) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(param);
    }

    const buyNowType = getQueryParam('buyNowType');
    const buyNowId = getQueryParam('id');
    const buyNowQuantity = parseInt(getQueryParam('quantity'), 10) || 1;
    const isBuyNow = !!(buyNowType && buyNowId);

    async function fetchBuyNowItem(type, id) {
        let url = '';
        if (type === 'product') url = `/api/s1/products/${id}`; // Adjusted to your API path
        else if (type === 'bundle') url = `/api/s1/bundles/${id}`; // Adjusted to your API path
        if (!url) return null;
        try {
            const res = await fetch(url);
            if (!res.ok) return null;
            return await res.json();
        } catch (e) {
            return null;
        }
    }

    // --- Core Render Function ---
    async function renderOrderSummary() {
        let cart = JSON.parse(localStorage.getItem('cart') || '[]');
        let subtotal = 0;
        let itemsToProcess = [];

        if (isBuyNow) {
            // In Buy Now flow, `cart` might initially contain multiple items, but we only care about the buy-now one.
            // For now, let's assume the cart for Buy Now only has the single item previously placed there.
            // A more robust approach for Buy Now would be to fetch the item details here instead of relying on cart.
            // For this example, we proceed with the assumption that `cart[0]` is the Buy Now item.
            const buyNowItem = cart && cart.length > 0 ? cart[0] : null;

            if (!buyNowItem || (buyNowItem._id !== buyNowId && buyNowItem.productId !== buyNowId)) {
                // If the cart doesn't contain the specific buy-now item or it's empty, try to fetch it.
                const fetchedItem = await fetchBuyNowItem(buyNowType, buyNowId);
                if (fetchedItem) {
                    itemsToProcess.push({
                        _id: fetchedItem._id, // Ensure _id is present for backend
                        type: buyNowType === 'product' ? 'Product' : 'Bundle', // Add type for backend
                        name: fetchedItem.name || fetchedItem.title,
                        price: fetchedItem.price,
                        quantity: buyNowQuantity,
                        image: fetchedItem.image,
                        brand: fetchedItem.brand
                    });
                    // Overwrite cart for buy now scenario to ensure correct item is displayed
                    setCart(itemsToProcess);
                } else {
                    orderItemsContainer.innerHTML = '<div class="text-red-500">Could not load item for Buy Now.</div>';
                    // Reset cart to empty if buy now item not found or invalid
                    setCart([]);
                    return;
                }
            } else {
                // If buyNowItem is already correctly in cart[0]
                itemsToProcess.push({
                    _id: buyNowItem._id || buyNowItem.productId, // Ensure _id
                    type: buyNowType === 'product' ? 'Product' : 'Bundle', // Add type
                    name: buyNowItem.name || buyNowItem.title,
                    price: buyNowItem.price,
                    quantity: buyNowQuantity, // Use buyNowQuantity from URL
                    image: buyNowItem.image,
                    brand: buyNowItem.brand
                });
                setCart(itemsToProcess); // Ensure cart is correctly set for Buy Now
            }
        } else {
            // Normal cart flow
            itemsToProcess = cart;
        }

        if (orderItemsContainer) {
            orderItemsContainer.innerHTML = '';
        }

        if (itemsToProcess.length === 0) {
            if (orderItemsContainer) {
                orderItemsContainer.innerHTML = `
                    <div class="empty-state text-center py-10 text-gray-500">
                        <i class="fas fa-shopping-cart text-4xl mb-3"></i>
                        <p class="text-lg font-semibold">Your cart is empty.</p>
                        <p class="text-sm">Please add some delicious snacks from the products page!</p>
                    </div>
                `;
            }
            subtotal = 0; // Ensure subtotal is 0 if cart is empty
        } else {
            itemsToProcess.forEach(item => { // Changed product to item for generic use
                const itemPrice = parseFloat(item.price);
                subtotal += itemPrice * (item.quantity || 1);
                const itemHtml = `
                    <div class="flex items-center justify-between border-b border-gray-200 pb-4">
                        <div class="flex items-center">
                            <img src="${item.image}" alt="${item.title || item.name}" class="w-16 h-16 object-cover rounded-lg mr-4">
                            <div>
                                <h3 class="font-semibold text-gray-800">${item.title || item.name}</h3>
                                <p class="text-sm text-gray-500">${item.brand || ''}</p>
                                <p class="text-xs text-gray-400">Quantity: ${item.quantity || 1}</p>
                            </div>
                        </div>
                        <span class="font-medium text-gray-700">${formatPrice(itemPrice * (item.quantity || 1))}</span>
                    </div>
                `;
                if (orderItemsContainer) {
                    orderItemsContainer.innerHTML += itemHtml;
                }
            });
        }

        // Calculate shipping and fees based on country
        const selectedCountry = shippingCountrySelect ? shippingCountrySelect.value : 'United States';
        let shippingCost = 0;
        let importFees = 0;
        if (selectedCountry === 'Egypt') {
            shippingCost = SHIPPING_EGYPT;
            importFees = 0;
            if (shippingLabel) shippingLabel.textContent = 'Local Shipping:';
            if (feesLabel) feesLabel.textContent = 'Import Fees:';
        } else {
            shippingCost = SHIPPING_INTERNATIONAL;
            importFees = subtotal * IMPORT_FEES_PERCENTAGE;
            if (shippingLabel) shippingLabel.textContent = 'International Shipping:';
            if (feesLabel) feesLabel.textContent = 'Import Fees:';
        }
        const total = subtotal + shippingCost + importFees;
        if (subtotalDisplay) subtotalDisplay.textContent = formatPrice(subtotal);
        if (shippingDisplay) shippingDisplay.textContent = formatPrice(shippingCost);
        if (feesDisplay) feesDisplay.textContent = formatPrice(importFees);
        if (totalDisplay) totalDisplay.textContent = formatPrice(total);

        // Return the full summary object, including the items list (for backend submission)
        return { items: itemsToProcess, subtotal, shippingCost, importFees, total };
    }

    // --- Payment Method Toggling ---
    function setActivePaymentMethod(selectedOption) {
        creditCardOption.classList.remove('active', 'bg-blue-100', 'border-blue-300');
        creditCardOption.classList.add('border-gray-200', 'hover:border-blue-300');
        cashOption.classList.remove('active', 'bg-blue-100', 'border-blue-300');
        cashOption.classList.add('border-gray-200', 'hover:border-blue-300');

        selectedOption.classList.add('active', 'bg-blue-100', 'border-blue-300');
        selectedOption.classList.remove('border-gray-200', 'hover:border-blue-300');

        if (selectedOption.id === 'creditCardOption') {
            creditCardForm.classList.remove('hidden');
            cashForm.classList.add('hidden');
        } else {
            creditCardForm.classList.add('hidden');
            cashForm.classList.remove('hidden');
        }
    }

    // --- Credit Card Input Formatting & Display ---

    // Generic input handling for floating labels and highlighting
    function handleInputField(event) {
        const input = event.target;
        const container = input.closest('.input-container') || input.closest('.input-highlight');
        if (container) {
            if (input.value.trim() !== '') {
                container.classList.add('has-content');
            } else {
                container.classList.remove('has-content');
            }
            container.classList.remove('shake-animation'); // Remove shake on input
        }
    }

    // Card Number Formatting & Display
    function formatCardNumber(input) {
        let value = input.value.replace(/\D/g, ''); // Remove non-digits
        value = value.substring(0, 16); // Max 16 digits
        value = value.replace(/(\d{4})(?=\d)/g, '$1 '); // Add space every 4 digits
        input.value = value;
        if (displayCardNumber) displayCardNumber.textContent = value || '•••• •••• •••• ••••';
        updateCardBrand(value);
    }

    function updateCardBrand(cardNumber) {
        let brandClass = '';
        let brandIcon = '';

        if (cardNumber.startsWith('4')) {
            brandClass = 'fa-cc-visa';
        } else if (cardNumber.startsWith('5')) {
            brandClass = 'fa-cc-mastercard';
        } else if (cardNumber.startsWith('34') || cardNumber.startsWith('37')) {
            brandClass = 'fa-cc-amex';
        } else if (cardNumber.startsWith('6')) {
            brandClass = 'fa-cc-discover';
        } else {
            // Default or unknown card
        }

        // Remove existing brand classes and add new one
        const currentClasses = ['fa-cc-visa', 'fa-cc-mastercard', 'fa-cc-amex', 'fa-cc-discover'];
        currentClasses.forEach(cls => {
            if (cardBrandIcon) cardBrandIcon.classList.remove(cls);
            if (cardBrandIconBack) cardBrandIconBack.classList.remove(cls);
        });

        if (brandClass) {
            if (cardBrandIcon) cardBrandIcon.classList.add(brandClass);
            if (cardBrandIconBack) cardBrandIconBack.classList.add(brandClass);
        } else {
            // If no specific brand is detected, you might show a generic card icon or nothing
            // For now, it will just remove previous icons.
        }
    }

    // Card Holder Display
    function updateCardHolder(input) {
        if (displayCardHolder) displayCardHolder.textContent = input.value.toUpperCase() || 'FULL NAME';
    }

    // Card Expiry Formatting & Display
    function formatCardExpiry(input) {
        let value = input.value.replace(/\D/g, ''); // Remove non-digits
        if (value.length > 2) {
            value = value.substring(0, 2) + '/' + value.substring(2, 4);
        }
        input.value = value;
        if (displayCardExpiry) displayCardExpiry.textContent = value || 'MM/YY';
    }

    // Card CVV Display and Card Flip
    window.flipCard = function(isFocused) {
        if (creditCardElement) {
            if (isFocused) {
                creditCardElement.classList.add('flipped');
            } else {
                creditCardElement.classList.remove('flipped');
            }
        }
    }

    function updateCardCVV(input) {
        if (displayCardCVV) displayCardCVV.textContent = input.value || '•••';
    }

    // CVV Tooltip functions
    window.showCVVTooltip = function() {
        if (cvvTooltip) cvvTooltip.classList.remove('hidden');
    }

    window.hideCVVTooltip = function() {
        if (cvvTooltip) cvvTooltip.classList.add('hidden');
    }

    // --- Validation Functions ---
    function showShakeEffect(element) {
        if (element) {
            const container = element.closest('.input-container') || element.closest('.input-highlight');
            if (container) {
                container.classList.add('shake-animation');
                // Remove the class after the animation finishes
                setTimeout(() => {
                    container.classList.remove('shake-animation');
                }, 500); // Duration of the shake animation
            }
        }
    }

    function validateShippingForm() {
        let isValid = true;
        // Simple check for required fields
        const requiredShippingFields = ['firstName', 'lastName', 'addressLine', 'city', 'postalCode', 'country', 'phone'];

        requiredShippingFields.forEach(field => {
            const input = shippingInputs[field];
            if (input && input.value.trim() === '') {
                showShakeEffect(input);
                isValid = false;
            }
        });

        // Basic phone number format check (optional, can be more robust)
        const phoneInput = shippingInputs.phone;
        if (phoneInput && !/^\+?[0-9\s.-]{7,25}$/.test(phoneInput.value.trim())) {
            showShakeEffect(phoneInput);
            isValid = false;
        }

        return isValid;
    }

    function validateCreditCardForm() {
        let isValid = true;
        const requiredCardFields = ['cardNumber', 'cardHolder', 'cardExpiry', 'cardCVV'];

        requiredCardFields.forEach(field => {
            const input = creditCardInputs[field];
            if (input && input.value.trim() === '') {
                showShakeEffect(input);
                isValid = false;
            }
        });

        // Specific format validations
        const cardNumberInput = creditCardInputs.cardNumber;
        if (cardNumberInput && cardNumberInput.value.replace(/\s/g, '').length < 13) { // Min length for most cards
            showShakeEffect(cardNumberInput);
            isValid = false;
        }

        const cardExpiryInput = creditCardInputs.cardExpiry;
        const expiryRegex = /^(0[1-9]|1[0-2])\/?([0-9]{2})$/; // MM/YY
        if (cardExpiryInput && !expiryRegex.test(cardExpiryInput.value.trim())) {
            showShakeEffect(cardExpiryInput);
            isValid = false;
        } else if (cardExpiryInput) {
            const [month, year] = cardExpiryInput.value.split('/').map(Number);
            const currentYear = new Date().getFullYear() % 100; // Last two digits of current year
            const currentMonth = new Date().getMonth() + 1; // getMonth() is 0-indexed

            if (year < currentYear || (year === currentYear && month < currentMonth)) {
                showShakeEffect(cardExpiryInput);
                isValid = false;
                alert('Card expiration date is in the past.'); // More user-friendly feedback
            }
        }

        const cardCVVInput = creditCardInputs.cardCVV;
        if (cardCVVInput && !/^\d{3,4}$/.test(cardCVVInput.value.trim())) {
            showShakeEffect(cardCVVInput);
            isValid = false;
        }

        return isValid;
    }

    // --- Helper function to get JWT token from cookies ---
    const getJwtToken = () => {
        const name = 'jwt=';
        const decodedCookie = decodeURIComponent(document.cookie);
        const ca = decodedCookie.split(';');
        for(let i = 0; i < ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) === ' ') {
                c = c.substring(1);
            }
            if (c.indexOf(name) === 0) {
                return c.substring(name.length, c.length);
            }
        }
        return '';
    };

    // --- DOMContentLoaded and event listeners ---
    document.addEventListener('DOMContentLoaded', function() {
        renderOrderSummary(); // Initial render of checkout items

        // Event listener for country change to update shipping/fees
        if (shippingCountrySelect) {
            shippingCountrySelect.addEventListener('change', renderOrderSummary);
        }

        // Payment method selection
        if (creditCardOption) {
            creditCardOption.addEventListener('click', () => setActivePaymentMethod(creditCardOption));
        }
        if (cashOption) {
            cashOption.addEventListener('click', () => setActivePaymentMethod(cashOption));
        }

        // Input event listeners for floating labels and card display
        Object.values(shippingInputs).forEach(input => {
            if (input) input.addEventListener('input', handleInputField);
            // Initialize floating label state
            if (input && input.value.trim() !== '') {
                const container = input.closest('.input-container');
                if (container) container.classList.add('has-content');
            }
        });

        if (creditCardInputs.cardNumber) {
            creditCardInputs.cardNumber.addEventListener('input', (e) => {
                formatCardNumber(e.target);
                handleInputField(e);
            });
        }
        if (creditCardInputs.cardHolder) {
            creditCardInputs.cardHolder.addEventListener('input', (e) => {
                updateCardHolder(e.target);
                handleInputField(e);
            });
        }
        if (creditCardInputs.cardExpiry) {
            creditCardInputs.cardExpiry.addEventListener('input', (e) => {
                formatCardExpiry(e.target);
                handleInputField(e);
            });
        }
        if (creditCardInputs.cardCVV) {
            creditCardInputs.cardCVV.addEventListener('input', (e) => {
                updateCardCVV(e.target);
                handleInputField(e);
            });
        }

        if (cashDeliveryInputs.deliveryInstructions) {
            cashDeliveryInputs.deliveryInstructions.addEventListener('input', handleInputField);
            const container = cashDeliveryInputs.deliveryInstructions.closest('.input-container');
            if (container && cashDeliveryInputs.deliveryInstructions.value.trim() !== '') {
                container.classList.add('has-content');
            }
        }


        // Place Order button click handler
        if (placeOrderBtn) {
            placeOrderBtn.addEventListener('click', async function(event) {
                event.preventDefault();

                // Recalculate summary right before submission to ensure latest values
                const summary = await renderOrderSummary();

                if (!summary || !summary.items || summary.items.length === 0) {
                    alert('Your cart is empty. Please add items before placing an order.');
                    return;
                }

                let isFormValid = true;
                if (!validateShippingForm()) {
                    isFormValid = false;
                }

                const paymentMethodIsCreditCard = !creditCardForm.classList.contains('hidden');
                if (paymentMethodIsCreditCard) {
                    if (!validateCreditCardForm()) {
                        isFormValid = false;
                    }
                }

                if (isFormValid) {
                    // Construct order details payload
                    const orderDetails = {
                        items: summary.items, // Directly use items from summary
                        subtotal: summary.subtotal,
                        shippingCost: summary.shippingCost,
                        importFees: summary.importFees,
                        total: summary.total,
                        shippingInfo: {
                            firstName: shippingInputs.firstName.value,
                            lastName: shippingInputs.lastName.value,
                            addressLine: shippingInputs.addressLine.value,
                            city: shippingInputs.city.value,
                            postalCode: shippingInputs.postalCode.value,
                            country: shippingInputs.country.value,
                            phone: shippingInputs.phone.value,
                            specialInstructions: shippingInputs.specialInstructions.value
                        },
                        paymentMethod: paymentMethodIsCreditCard ? 'Credit/Debit Card' : 'Cash on Delivery',
                        paymentDetails: {}
                    };

                    if (orderDetails.paymentMethod === 'Credit/Debit Card') {
                        orderDetails.paymentDetails = {
                            cardNumber: creditCardInputs.cardNumber.value.replace(/\s/g, ''), // Remove spaces
                            cardHolder: creditCardInputs.cardHolder.value,
                            cardExpiry: creditCardInputs.cardExpiry.value,
                            cardCVV: creditCardInputs.cardCVV.value,
                            saveCard: document.getElementById('saveCard') ? document.getElementById('saveCard').checked : false
                        };
                    } else {
                        orderDetails.paymentDetails.deliveryInstructions = cashDeliveryInputs.deliveryInstructions.value;
                    }

                    // Send order to backend
                    try {
                        const token = getJwtToken(); // Get JWT token from cookies
                        if (!token) {
                            alert('You must be logged in to place an order.');
                            window.location.href = '/login'; // Redirect to login
                            return;
                        }

                        const response = await fetch('/api/s1/orders', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${token}` // Include JWT for authentication
                            },
                            body: JSON.stringify(orderDetails)
                        });

                        const data = await response.json();

                        if (response.ok) {
                            alert('Order Placed Successfully! Your order ID: ' + data.order._id);
                            if (!isBuyNow) {
                                setCart([]); // Clear cart only if it's a regular cart purchase
                            }
                            // Optionally redirect to an order confirmation page
                            window.location.href = `/order-confirmation?orderId=${data.order._id}`;
                        } else {
                            // Handle backend errors
                            alert('Failed to place order: ' + (data.message || 'Unknown error.'));
                            console.error('Order submission error:', data.error || data.message);
                        }
                    } catch (error) {
                        console.error('Network or unexpected error during order placement:', error);
                        alert('An unexpected error occurred. Please try again.');
                    }

                } else {
                    alert('Please correct the highlighted fields before placing your order.');
                }
            });
        }

        // Add Another Item button (redirect to products/cart page)
        if (addItemBtn) {
            addItemBtn.addEventListener('click', function() {
                window.location.href = '/products';
            });
        }


        // Listen for storage changes if the checkout page can be open alongside other pages
        window.addEventListener('storage', function(e) {
            if (e.key === 'cart') {
                renderOrderSummary();
            }
        });
    });

})();