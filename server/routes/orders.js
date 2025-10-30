// server/routes/orders.js

const express = require('express');
const router = express.Router();
const orderController = require('../controllers/ordersController'); // Import the new orderController

// --- API Endpoints ---

// GET /api/s1/orders/all: Get all orders
router.get('/all', orderController.getAllOrders);

// GET /api/s1/orders/:id: Get order by ID
router.get('/:id', orderController.getOrderById);

// GET /api/s1/orders (root): Get current user's pending cart order
router.get('/', orderController.getCart); // Renamed to 'getCart' in controller

// POST /api/s1/orders/items: Add/Update item in user's pending cart
router.post('/items', orderController.addItemToCart); // Renamed to 'addItemToCart'

// PUT /api/s1/orders/items/:productId: Update quantity of item in user's pending cart
router.put('/items/:productId', orderController.updateCartItemQuantity); // Renamed to 'updateCartItemQuantity'

// DELETE /api/s1/orders/items/:productId: Remove item from user's pending cart
router.delete('/items/:productId', orderController.removeCartItem); // Renamed to 'removeCartItem'

// POST /api/s1/orders/checkout: Finalize the pending cart order and process payment
router.post('/checkout', orderController.checkoutOrder); // Renamed to 'checkoutOrder'

// PUT /api/s1/orders/:id/status: Update order status (and payment status)
router.put('/:id/status', orderController.updateOrderStatus);

// DELETE /api/s1/orders/:id: Delete an order
router.delete('/:id', orderController.deleteOrder);

// GET /api/s1/orders/get/totalsales: Get total sales
router.get('/get/totalsales', orderController.getTotalSales);

// GET /api/s1/orders/get/count: Get total number of orders
router.get('/get/count', orderController.getOrderCount);

// GET /api/s1/orders/get/userorders/:userid: Get orders by a specific user
router.get('/get/userorders/:userid', orderController.getUserOrders);


module.exports = router;
