// server/controllers/productsController.js
const Product = require('../models/Product'); // Still import if needed for other methods, but not for getAllProducts anymore
const catchAsync = require('../utils/catchAsync');

exports.getAllProducts = catchAsync(async (req, res) => {
    // This controller's primary role is to render the EJS page.
    // The actual product data fetching and display is now handled by public/js/products.js
    // via an API call to /api/s1/products.

    // Get the country query parameter from the URL, if present.
    // This will be passed to the EJS template, which products.js can then read.
    const requestedCountryName = req.query.country || ''; // e.g., 'egypt' or ''

    // Determine the page title
    let pageTitle = 'Our Products';
    if (requestedCountryName) {
        pageTitle = requestedCountryName.charAt(0).toUpperCase() + requestedCountryName.slice(1).toLowerCase() + ' Snacks';
    }

    // You do NOT need to fetch products here anymore, as products.js will do it.
    // Just render the page.
    res.render('pages/products', {
        title: pageTitle,
        // No 'products' array needed here as the frontend JS fetches it dynamically.
        // But passing 'selectedCountry' helps the frontend script.
        selectedCountry: requestedCountryName // Pass this so products.js knows which country to fetch
    });
});

exports.getProductById = catchAsync(async (req, res) => {
    // This controller is for rendering a single product detail page
    const product = await Product.findById(req.params.id)
        // REMOVE .populate() calls here too, as category and country are Strings
        // .populate('category')
        // .populate('country')
        .lean();

    if (!product) {
        return res.status(404).render('pages/404', { title: 'Product Not Found' });
    }

    res.render('pages/productDetail', {
        title: product.name,
        product: product
    });
});