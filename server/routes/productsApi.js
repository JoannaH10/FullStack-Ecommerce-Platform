// server/routes/productsApi.js
const express = require('express');
const router = express.Router();
const Product = require('../models/Product'); // Ensure correct path to your Product model

// GET all products (for the public frontend)
// This route now handles filtering by country and category via query parameters.
router.get('/', async (req, res) => {
    try {
        let filter = {}; // Initialize an empty filter object

        // Check for 'country' query parameter (e.g., /api/s1/products?country=egypt)
        if (req.query.country) {
            const requestedCountryName = req.query.country;
            // Since 'country' in your Product model is a String, filter directly using regex for case-insensitivity
            filter.country = { $regex: new RegExp(`^${requestedCountryName}$`, 'i') };
            console.log(`API: Filtering by country: ${requestedCountryName}`); // Debug log
        }

        // Check for 'category' query parameter (e.g., /api/s1/products?category=chips&crisps)
        if (req.query.category) {
            const requestedCategoryName = req.query.category;
            // Since 'category' in your Product model is a String, filter directly using regex for case-insensitivity
            // Note: If your categories might have special regex characters (like '&'), be careful.
            // For now, assuming exact string match is sufficient or you pre-process category names.
            // Using a simple regex directly for robustness.
            filter.category = { $regex: new RegExp(`^${requestedCategoryName}$`, 'i') };
            console.log(`API: Filtering by category: ${requestedCategoryName}`); // Debug log
        }

        // Fetch products from the database applying the constructed filter.
        // IMPORTANT: Remove .populate('category') and .populate('country')
        // because these fields are defined as String types in your Product model, not ObjectId references.
        const products = await Product.find(filter)
            // .populate('category') // REMOVE: Category is a String type
            // .populate('country') // REMOVE: Country is a String type
            .lean(); // Use .lean() for plain JS objects for API responses (good for performance)

        console.log(`API: Returning ${products.length} products after filter.`); // Debug log
        res.status(200).json(products);
    } catch (error) {
        console.error('Error fetching public products:', error);
        res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
});

// GET a single product by ID (for product detail page on public frontend)
router.get('/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id)
            // .populate('category') // REMOVE: Category is a String type
            // .populate('country') // REMOVE: Country is a String type
            .lean(); // Use .lean() for plain JS objects
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        res.status(200).json(product);
    } catch (error) {
        console.error('Error fetching public product by ID:', error);
        res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
});

module.exports = router;