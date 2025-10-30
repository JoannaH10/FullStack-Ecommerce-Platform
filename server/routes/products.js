/* routes/product.js

const express = require('express');
const router = express.Router();

// Import the product controller functions
const productController = require('../controllers/productsController'); // <-- FIXED PATH

// Define the route for fetching all products
// This route will handle GET requests to '/products'
router.get('/', productController.getAllProducts);

// (Optional) Route for a single product by ID
// Example: GET /products/12345
//router.get('/:id', productController.getProductById);

// Add this route if you want a JSON API endpoint for all products
// router.get('/api', async (req, res) => {
//     const { Product } = require('../models/product');
//     const products = await Product.find({});
//     res.json(products);
// });

module.exports = router;