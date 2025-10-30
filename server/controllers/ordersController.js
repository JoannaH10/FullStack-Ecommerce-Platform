// server/controllers/orderController.js

const mongoose = require('mongoose');

// Import your Mongoose models
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const Category = require('../models/category');
const Country = require('../models/country');

// Import utilities
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');


// --- Helper function for consistent API responses ---
const sendResponse = (res, statusCode, success, message, data = {}) => {
    res.status(statusCode).json({ success, message, ...data });
};

// --- Helper function to get or create a user's active cart order (status: 'pending') ---
// This function remains crucial for managing the database-backed cart
async function getUserCartOrder(userId) {
    let cartOrder = await Order.findOne({ user: userId, orderStatus: 'pending' });

    if (!cartOrder) {
        cartOrder = new Order({
            user: userId,
            orderItems: [],
            shippingAddress: { // Initialize nested shippingAddress
                country: 'Temporary', // Default country
                city: 'Temporary',
                address: 'Temporary Address',
                postalCode: '00000',
                specialInstructions: ''
            },
            phone: '1234567890',
            paymentMethod: 'cash_on_delivery', // Default for initial cart
            paymentStatus: 'pending',
            orderStatus: 'pending', // 'pending' status for the cart
            subtotal: 0,
            shippingFee: 0,
            tax: 0,
            total: 0,
            currency: 'USD' // Default currency
        });
        await cartOrder.save();
    }
    return cartOrder;
}

// --- Helper function to calculate and update cart totals ---
// Now accepts the shippingCountry to apply conditional logic
async function updateCartTotals(cartOrder, shippingCountry) {
    let currentSubtotal = 0;
    // Iterate through order items to calculate subtotal
    for (const item of cartOrder.orderItems) {
        const product = await Product.findById(item.product);
        if (product) {
            currentSubtotal += product.price * item.quantity;
            if (item.priceAtPurchase === undefined || item.priceAtPurchase === null) {
                item.priceAtPurchase = product.price;
            }
        }
    }

    let currentShippingFee = 0;
    let currentCurrency = 'USD'; // Default currency
    const FEES_PERCENTAGE = 0.15; // Example 15% tax/fees

    if (shippingCountry && shippingCountry.toLowerCase() === 'egypt') {
        // Domestic Shipping for Egypt
        currentShippingFee = 25.00; // Example fixed EGP shipping
        currentCurrency = 'EGP';
    } else {
        // International Shipping
        currentShippingFee = 15.00 + (cartOrder.orderItems.length * 2.50); // Example: Base fee + per item for international
        currentCurrency = 'USD';
    }

    const currentTax = currentSubtotal * FEES_PERCENTAGE;
    const currentTotal = currentSubtotal + currentShippingFee + currentTax;

    cartOrder.subtotal = parseFloat(currentSubtotal.toFixed(2));
    cartOrder.shippingFee = parseFloat(currentShippingFee.toFixed(2));
    cartOrder.tax = parseFloat(currentTax.toFixed(2));
    cartOrder.total = parseFloat(currentTotal.toFixed(2));
    cartOrder.currency = currentCurrency; // Set the currency for the order
}


// @desc    Get all orders
// @access  Admin (or user's own past orders)
exports.getAllOrders = catchAsync(async (req, res, next) => {
    const orderList = await Order.find()
        .populate('user', 'name email')
        .populate({
            path: 'orderItems.product',
            select: 'name price image brand country category',
            populate: [
                { path: 'category', select: 'name' },
                { path: 'country', select: 'name code flagImage' }
            ]
        })
        .sort({ 'dateOrdered': -1 });

    if (!orderList || orderList.length === 0) {
        return sendResponse(res, 200, true, 'No orders found', { orders: [] });
    }
    sendResponse(res, 200, true, 'Orders fetched successfully', { orders: orderList });
});

// @desc    Get order by ID
// @access  Authenticated User (for their own order) / Admin
exports.getOrderById = catchAsync(async (req, res, next) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
        return next(new AppError('Invalid Order ID format.', 400));
    }

    const userId = req.user && req.user._id ? req.user._id : null;

    let query = { _id: req.params.id };
    if (userId) {
        query.user = userId;
    } else {
        return next(new AppError('Authentication required to view this order.', 401));
    }

    const order = await Order.findOne(query)
        .populate('user', 'name email')
        .populate({
            path: 'orderItems.product',
            select: 'name price image brand country category',
            populate: [
                { path: 'category', select: 'name' },
                { path: 'country', select: 'name code flagImage' }
            ]
        });

    if (!order) {
        return next(new AppError('Order not found or unauthorized access.', 404));
    }
    sendResponse(res, 200, true, 'Order fetched successfully', { order });
});

// @desc    Get current user's pending cart order
// @access  Authenticated User
exports.getCart = catchAsync(async (req, res, next) => {
    const userId = req.user && req.user._id ? req.user._id : '60d5ec49f0f9c21b38e0b234';

    const cartOrder = await getUserCartOrder(userId);
    // Before populating, update totals and currency based on current shipping address if available
    await updateCartTotals(cartOrder, cartOrder.shippingAddress.country); // Pass country for calculations

    await cartOrder.populate({
        path: 'orderItems.product',
        select: 'name price image brand country category',
        populate: [
            { path: 'country', select: 'name' },
            { path: 'category', select: 'name' }
        ]
    });

    const frontendItems = cartOrder.orderItems.map(item => ({
        productId: item.product._id.toHexString(),
        quantity: item.quantity,
        name: item.product.name,
        price: item.priceAtPurchase,
        image: item.product.image,
        country: item.product.country ? item.product.country.name : null,
        brand: item.product.brand,
        category: item.product.category ? item.product.category.name : null
    }));

    sendResponse(res, 200, true, 'Cart fetched successfully', {
        _id: cartOrder._id,
        items: frontendItems,
        subtotal: cartOrder.subtotal,
        shippingFee: cartOrder.shippingFee,
        tax: cartOrder.tax,
        total: cartOrder.total,
        currency: cartOrder.currency, // Include currency in the response
        shippingLabel: cartOrder.currency === 'EGP' ? 'Shipping' : 'International Shipping' // Add label for frontend
    });
});

// @desc    Add/Update item in user's pending cart
// @access  Authenticated User
exports.addItemToCart = catchAsync(async (req, res, next) => {
    const userId = req.user && req.user._id ? req.user._id : '60d5ec49f0f9c21b38e0b234';

    const { productId, quantity } = req.body;

    if (!mongoose.isValidObjectId(productId) || typeof quantity !== 'number' || quantity <= 0) {
        return next(new AppError('Invalid productId or quantity.', 400));
    }

    const cartOrder = await getUserCartOrder(userId);
    const product = await Product.findById(productId);

    if (!product) {
        return next(new AppError('Product not found.', 404));
    }

    const existingOrderItem = cartOrder.orderItems.find(
        item => item.product.toString() === productId
    );

    if (existingOrderItem) {
        existingOrderItem.quantity += quantity;
    } else {
        cartOrder.orderItems.push({
            product: productId,
            quantity: quantity,
            priceAtPurchase: product.price
        });
    }

    // Pass the current shipping country from the cart for accurate calculations
    await updateCartTotals(cartOrder, cartOrder.shippingAddress.country);
    await cartOrder.save();

    await cartOrder.populate({
        path: 'orderItems.product',
        select: 'name price image brand country category',
        populate: [
            { path: 'country', select: 'name' },
            { path: 'category', select: 'name' }
        ]
    });
    const frontendItems = cartOrder.orderItems.map(item => ({
        productId: item.product._id.toHexString(),
        quantity: item.quantity,
        name: item.product.name,
        price: item.priceAtPurchase,
        image: item.product.image,
        country: item.product.country ? item.product.country.name : null,
        brand: item.product.brand,
        category: item.product.category ? item.product.category.name : null
    }));

    sendResponse(res, 201, true, 'Item added/updated in cart', {
        _id: cartOrder._id,
        items: frontendItems,
        subtotal: cartOrder.subtotal,
        shippingFee: cartOrder.shippingFee,
        tax: cartOrder.tax,
        total: cartOrder.total,
        currency: cartOrder.currency, // Include currency in the response
        shippingLabel: cartOrder.currency === 'EGP' ? 'Shipping' : 'International Shipping' // Add label for frontend
    });
});

// @desc    Update quantity of item in user's pending cart
// @access  Authenticated User
exports.updateCartItemQuantity = catchAsync(async (req, res, next) => {
    const userId = req.user && req.user._id ? req.user._id : '60d5ec49f0f9c21b38e0b234';

    const productId = req.params.productId;
    const { quantity } = req.body;

    if (!mongoose.isValidObjectId(productId) || typeof quantity !== 'number' || quantity < 0) {
        return next(new AppError('Invalid productId or quantity.', 400));
    }

    const cartOrder = await getUserCartOrder(userId);
    const itemIndex = cartOrder.orderItems.findIndex(
        item => item.product.toString() === productId
    );

    if (itemIndex > -1) {
        if (quantity === 0) {
            cartOrder.orderItems.splice(itemIndex, 1);
        } else {
            cartOrder.orderItems[itemIndex].quantity = quantity;
        }

        // Pass the current shipping country from the cart for accurate calculations
        await updateCartTotals(cartOrder, cartOrder.shippingAddress.country);
        await cartOrder.save();

        await cartOrder.populate({
            path: 'orderItems.product',
            select: 'name price image brand country category',
            populate: [
                { path: 'country', select: 'name' },
                { path: 'category', select: 'name' }
            ]
        });
        const frontendItems = cartOrder.orderItems.map(item => ({
            productId: item.product._id.toHexString(),
            quantity: item.quantity,
            name: item.product.name,
            price: item.priceAtPurchase,
            image: item.product.image,
            country: item.product.country ? item.product.country.name : null,
            brand: item.product.brand,
            category: item.product.category ? item.product.category.name : null
        }));

        sendResponse(res, 200, true, 'Item quantity updated in cart', {
            _id: cartOrder._id,
            items: frontendItems,
            subtotal: cartOrder.subtotal,
            shippingFee: cartOrder.shippingFee,
            tax: cartOrder.tax,
            total: cartOrder.total,
            currency: cartOrder.currency, // Include currency in the response
            shippingLabel: cartOrder.currency === 'EGP' ? 'Shipping' : 'International Shipping' // Add label for frontend
        });
    } else {
        next(new AppError('Product not found in cart.', 404));
    }
});

// @desc    Remove item from user's pending cart
// @access  Authenticated User
exports.removeCartItem = catchAsync(async (req, res, next) => {
    const userId = req.user && req.user._id ? req.user._id : '60d5ec49f0f9c21b38e0b234';

    const productId = req.params.productId;

    if (!mongoose.isValidObjectId(productId)) {
        return next(new AppError('Invalid productId format.', 400));
    }

    const cartOrder = await getUserCartOrder(userId);
    const initialLength = cartOrder.orderItems.length;
    cartOrder.orderItems = cartOrder.orderItems.filter(
        item => item.product.toString() !== productId
    );

    if (cartOrder.orderItems.length < initialLength) {
        // Pass the current shipping country from the cart for accurate calculations
        await updateCartTotals(cartOrder, cartOrder.shippingAddress.country);
        await cartOrder.save();

        await cartOrder.populate({
            path: 'orderItems.product',
            select: 'name price image brand country category',
            populate: [
                { path: 'country', select: 'name' },
                { path: 'category', select: 'name' }
            ]
        });
        const frontendItems = cartOrder.orderItems.map(item => ({
            productId: item.product._id.toHexString(),
            quantity: item.quantity,
            name: item.product.name,
            price: item.priceAtPurchase,
            image: item.product.image,
            country: item.product.country ? item.product.country.name : null,
            brand: item.product.brand,
            category: item.product.category ? item.product.category.name : null
        }));

        sendResponse(res, 200, true, 'Item removed successfully', {
            _id: cartOrder._id,
            items: frontendItems,
            subtotal: cartOrder.subtotal,
            shippingFee: cartOrder.shippingFee,
            tax: cartOrder.tax,
            total: cartOrder.total,
            currency: cartOrder.currency, // Include currency in the response
            shippingLabel: cartOrder.currency === 'EGP' ? 'Shipping' : 'International Shipping' // Add label for frontend
        });
    } else {
        next(new AppError('Product not found in cart.', 404));
    }
});

// @desc    Finalize the pending cart order and process payment
// @access  Authenticated User
exports.checkoutOrder = catchAsync(async (req, res, next) => {
    const userId = req.user && req.user._id ? req.user._id : '60d5ec49f0f9c21b38e0b234';

    const {
        paymentMethod,
        shippingAddress: { country, city, address, postalCode, specialInstructions },
        phone
    } = req.body;

    if (!req.body.cartItems || !Array.isArray(req.body.cartItems) || req.body.cartItems.length === 0) {
        return next(new AppError('Checkout failed: Cart is empty or invalid in request payload.', 400));
    }
    if (!address || !city || !postalCode || !country || !phone) {
        return next(new AppError('Shipping information is incomplete.', 400));
    }
    if (!['credit_card', 'paypal', 'stripe', 'bank_transfer', 'cash_on_delivery'].includes(paymentMethod)) {
        return next(new AppError('Invalid payment method.', 400));
    }

    const cartOrder = await getUserCartOrder(userId);

    if (cartOrder.orderItems.length === 0) {
        return next(new AppError('Your cart is empty. Please add items before checking out.', 400));
    }

    let calculatedSubtotal = 0;
    const finalOrderItems = [];

    for (const item of cartOrder.orderItems) {
        const product = await Product.findById(item.product);
        if (!product) {
            return next(new AppError(`Product with ID ${item.product} not found in catalog. Please review your cart.`, 400));
        }
        if (product.countInStock < item.quantity) {
            return next(new AppError(`Not enough stock for "${product.name}". Available: ${product.countInStock}, Requested: ${item.quantity}`, 400));
        }

        calculatedSubtotal += product.price * item.quantity;
        finalOrderItems.push({
            product: product._id,
            quantity: item.quantity,
            priceAtPurchase: product.price
        });
        product.countInStock -= item.quantity;
        await product.save();
    }

    // Recalculate totals and currency based on the *provided* shipping country during checkout
    let finalShippingFee = 0;
    let finalCurrency = 'USD';
    const FEES_PERCENTAGE = 0.15;

    if (country && country.toLowerCase() === 'egypt') {
        finalShippingFee = 25.00;
        finalCurrency = 'EGP';
    } else {
        finalShippingFee = 15.00 + (finalOrderItems.length * 2.50);
        finalCurrency = 'USD';
    }

    const finalTax = calculatedSubtotal * FEES_PERCENTAGE;
    const finalCalculatedTotal = calculatedSubtotal + finalShippingFee + finalTax;

    cartOrder.orderItems = finalOrderItems;
    cartOrder.subtotal = parseFloat(calculatedSubtotal.toFixed(2));
    cartOrder.shippingFee = parseFloat(finalShippingFee.toFixed(2));
    cartOrder.tax = parseFloat(finalTax.toFixed(2));
    cartOrder.total = parseFloat(finalCalculatedTotal.toFixed(2));
    cartOrder.currency = finalCurrency; // Set the final currency for the order

    cartOrder.shippingAddress = {
        country,
        city,
        address,
        postalCode,
        specialInstructions
    };
    cartOrder.phone = phone;
    cartOrder.paymentMethod = paymentMethod;

    cartOrder.orderStatus = 'processing';
    cartOrder.paymentStatus = (paymentMethod === 'cash_on_delivery') ? 'pending' : 'completed';

    cartOrder.dateOrdered = Date.now();

    await cartOrder.save();

    await User.findByIdAndUpdate(
        userId,
        { $push: { orders: cartOrder._id } },
        { new: true, useFindAndModify: false }
    );

    if (paymentMethod === 'credit_card') {
        console.log('Simulating credit card payment for order:', cartOrder._id);
    } else if (paymentMethod === 'cash_on_delivery') {
        console.log('Cash on delivery order for order:', cartOrder._id);
    }

    sendResponse(res, 200, true, 'Order placed successfully!', { order: cartOrder.toObject({ virtuals: true }) });
});


// @desc    Update order status
// @access  Admin
exports.updateOrderStatus = catchAsync(async (req, res, next) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
        return next(new AppError('Invalid Order ID format.', 400));
    }
    const { orderStatus, paymentStatus } = req.body;

    const updateFields = {};
    if (orderStatus && ['pending', 'processing', 'shipped', 'delivered', 'cancelled'].includes(orderStatus)) {
        updateFields.orderStatus = orderStatus;
    }
    if (paymentStatus && ['pending', 'completed', 'failed', 'refunded'].includes(paymentStatus)) {
        updateFields.paymentStatus = paymentStatus;
    }

    if (Object.keys(updateFields).length === 0) {
        return next(new AppError('No valid status fields provided for update.', 400));
    }

    const order = await Order.findByIdAndUpdate(
        req.params.id,
        updateFields,
        { new: true, runValidators: true }
    );

    if (!order) {
        return next(new AppError('Order not found or could not be updated!', 404));
    }
    sendResponse(res, 200, true, 'Order status updated successfully', { order });
});

// @desc    Delete an order
// @access  Admin
exports.deleteOrder = catchAsync(async (req, res, next) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
        return next(new AppError('Invalid Order ID format.', 400));
    }

    const order = await Order.findByIdAndDelete(req.params.id);

    if (!order) {
        return next(new AppError('Order not found!', 404));
    }

    sendResponse(res, 200, true, 'The order is deleted successfully!');
});

// @desc    Get total sales (sum of all order total prices)
// @access  Admin
exports.getTotalSales = catchAsync(async (req, res, next) => {
    try { // Added try-catch for aggregate
        const totalSalesResult = await Order.aggregate([
            { $group: { _id: null, totalsales: { $sum: '$total' } } }
        ]);

        if (!totalSalesResult || totalSalesResult.length === 0) {
            return sendResponse(res, 200, true, 'No sales data available', { totalsales: 0 });
        }
        sendResponse(res, 200, true, 'Total sales fetched successfully', { totalsales: totalSalesResult[0].totalsales });
    } catch (error) {
        next(new AppError('Cannot retrieve total sales.', 500));
    }
});

// @desc    Get total number of orders
// @access  Admin
exports.getOrderCount = catchAsync(async (req, res, next) => {
    const orderCount = await Order.countDocuments();
    sendResponse(res, 200, true, 'Order count fetched successfully', { orderCount });
});

// @desc    Get orders by a specific user
// @access  Authenticated User (for their own orders) or Admin
exports.getUserOrders = catchAsync(async (req, res, next) => {
    if (!mongoose.isValidObjectId(req.params.userid)) {
        return next(new AppError('Invalid User ID format.', 400));
    }

    if (req.user && req.user._id && req.user._id.toString() !== req.params.userid && !req.user.isAdmin) {
        return next(new AppError('Unauthorized: You can only view your own orders.', 403));
    }

    const userOrderList = await Order.find({ user: req.params.userid, orderStatus: { $ne: 'pending' } })
        .populate('user', 'name email')
        .populate({
            path: 'orderItems.product',
            select: 'name price image brand country category',
            populate: [
                { path: 'category', select: 'name' },
                { path: 'country', select: 'name code flagImage' }
            ]
        })
        .sort({ 'dateOrdered': -1 });

    if (!userOrderList || userOrderList.length === 0) {
        return sendResponse(res, 200, true, 'No placed orders found for this user', { orders: [] });
    }
    sendResponse(res, 200, true, 'User orders fetched successfully', { orders: userOrderList });
});
