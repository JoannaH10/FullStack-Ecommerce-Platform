/**
 * Bundle Controllers
 * Handles rendering, API, and admin AJAX endpoints for bundle management.
 * 
 * Exports:
 * - renderBundlesPage: Render bundles page for users
 * - getAllBundlesApi: Get all bundles (API, with filters/sorting)
 * - getBundleByIdApi: Get single bundle by ID (API)
 * - createBundle: Create a new bundle (Admin/API)
 * - updateBundle: Update a bundle by ID (Admin/API)
 * - deleteBundle: Delete a bundle by ID (Admin/API)
 * - getBundles: Get all bundles (Admin AJAX)
 * - getProducts: Get all products (Admin AJAX)
 * - getBundleById: Get single bundle by ID (Admin AJAX)
 */

const Bundle = require('../models/Bundle');
const Product = require('../models/Product');
const catchAsync = require('../utils/catchAsync');

// Get all bundles (for admin dashboard AJAX)
exports.getBundles = catchAsync(async (req, res) => {
    const bundles = await Bundle.find().lean();
    res.status(200).json(bundles);
});

// Get all products (for bundle creation/editing)
exports.getProducts = catchAsync(async (req, res) => {
    const products = await Product.find().lean();
    res.status(200).json(products);
});

// Get single bundle by ID
exports.getBundleById = catchAsync(async (req, res) => {
    const bundle = await Bundle.findById(req.params.id).lean();
    if (!bundle) {
        return res.status(404).json({ message: 'Bundle not found' });
    }
    res.status(200).json(bundle);
});

// Create a new bundle
exports.createBundle = catchAsync(async (req, res) => {
    const newBundle = await Bundle.create({
        title: req.body.title,
        category: req.body.category,
        products: req.body.products,
        description: req.body.description,
        price: req.body.price,
        image: req.body.image
    });
    res.status(201).json(newBundle);
});

// Update a bundle
exports.updateBundle = catchAsync(async (req, res) => {
    const updatedBundle = await Bundle.findByIdAndUpdate(
        req.params.id,
        {
            title: req.body.title,
            category: req.body.category,
            products: req.body.products,
            description: req.body.description,
            price: req.body.price,
            image: req.body.image
        },
        { new: true, runValidators: true }
    );
    if (!updatedBundle) {
        return res.status(404).json({ message: 'Bundle not found' });
    }
    res.status(200).json(updatedBundle);
});

// Delete a bundle
exports.deleteBundle = catchAsync(async (req, res) => {
    const bundle = await Bundle.findByIdAndDelete(req.params.id);
    if (!bundle) {
        return res.status(404).json({ message: 'Bundle not found' });
    }
    res.status(204).send();
});

// API: Get all bundles (with optional filters/sorting)
exports.getAllBundlesApi = async (req, res, next) => {
    try {
        const { limit, category, sortBy, sortOrder = 'asc' } = req.query;
        const query = {};
        if (category) {
            query.category = category;
        }
        let sortOptions = {};
        if (sortBy) {
            sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;
        } else {
            sortOptions = { createdAt: -1 };
        }
        let bundlesQuery = Bundle.find(query).sort(sortOptions);
        if (limit) {
            const parsedLimit = parseInt(limit);
            if (!isNaN(parsedLimit) && parsedLimit > 0) {
                bundlesQuery = bundlesQuery.limit(parsedLimit);
            }
        }
        const bundles = await bundlesQuery.exec();
        res.json(bundles);
    } catch (error) {
        next(error);
    }
};

// API: Get single bundle by ID
exports.getBundleByIdApi = async (req, res, next) => {
    try {
        const bundle = await Bundle.findById(req.params.id);
        if (!bundle) {
            return res.status(404).json({ message: 'Bundle not found' });
        }
        res.json(bundle);
    } catch (error) {
        next(error);
    }
};

// Render bundles page for users
exports.renderBundlesPage = async (req, res, next) => {
    try {
        const bundles = await Bundle.find();
        res.render('pages/bundles', {
            title: 'NumNum Snack Store - Bundles',
            bundles,
            showHeader: true,
            showFooter: true,
            currentPage: 'bundles'
        });
    } catch (error) {
        error.statusCode = 500;
        error.message = 'Error fetching bundles from database for display.';
        next(error);
    }
};

// Add this to the exports
exports.getProductsForAdmin = catchAsync(async (req, res) => {
    const products = await Product.find().lean().select('_id name brand price image category');
    res.status(200).json(products);
});