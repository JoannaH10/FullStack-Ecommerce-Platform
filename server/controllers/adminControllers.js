// server/controllers/adminController.js
const mongoose = require('mongoose');
const Category = require('../models/category');
const Country = require('../models/country');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const User = mongoose.model('User', require('../models/User').schema, 'Users');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Bundle = require('../models/Bundle'); 


exports.dashboard = (req, res) => {
    // This is synchronous, so no catchAsync needed unless it starts doing async work
    res.render('admin/dashboard', {
        title: 'Dashboard',
        layout: 'layouts/admin',
        currentRoute: 'dashboard'
    });
};

exports.products = catchAsync(async (req, res, next) => { // Ensure 'next' is passed
    const products = await Product.find({})
        .populate('category')
        .populate('country')
        .lean();
    console.log("DEBUG: adminController - Fetched products before mapping:", JSON.stringify(products, null, 2));

    const categories = await Category.find({}).lean();
    console.log("DEBUG: adminController - Fetched categories for dropdown:", JSON.stringify(categories, null, 2));

    const countries = await Country.find({}).lean();
    console.log("DEBUG: adminController - Fetched countries for dropdown:", JSON.stringify(countries, null, 2));

    const productsWithPopulatedData = products.map(p => ({
        ...p,
        categoryName: p.category ? p.category.name : 'Uncategorized',
        countryName: p.country ? p.country.name : 'Unknown',
        countryCode: p.country ? p.country.code : 'N/A',
        imageUrl: p.image || '',
        stock: p.countInStock
    }));

    console.log("DEBUG: adminController - Products after mapping for EJS:", JSON.stringify(productsWithPopulatedData, null, 2));

    res.render('admin/products', {
        title: 'Products',
        layout: 'layouts/admin',
        currentRoute: 'products',
        products: productsWithPopulatedData,
        categories: categories,
        countries: countries
    });
    // Removed the internal try...catch as catchAsync handles it
});

exports.bundles = catchAsync(async (req, res) => {
    try {
        const Bundle = require('../models/Bundle');
        const bundlesRaw = await Bundle.find({}).lean();
        const bundles = bundlesRaw.map(b => ({
            ...b,
            productCount: b.products ? b.products.length : 0,
            imageUrl: b.image || '',
            priceDisplay: b.price ? b.price.toFixed(2) : '0.00',
            descriptionShort: b.description ? b.description.substring(0, 50) + (b.description.length > 50 ? '...' : '') : 'N/A',
            idDisplay: b.id ? b.id.slice(-6) : b._id.toString().slice(-6)
        }));
        console.log('DEBUG: Rendering admin/bundles with bundles:', bundles.length, Array.isArray(bundles));
        res.render('admin/bundles', {
            title: 'Bundles',
            layout: 'layouts/admin',
            currentRoute: 'bundles',
            bundles
        });
    } catch (err) {
        console.error('ERROR: adminController.bundles', err);
        res.render('admin/bundles', {
            title: 'Bundles',
            layout: 'layouts/admin',
            currentRoute: 'bundles',
            bundles: []
        });
    }
});

exports.orders = catchAsync(async (req, res, next) => { 
    const filter = {};
    const searchTerm = req.query.search;
    const status = req.query.status;

    if (searchTerm) {
        filter.$or = [
            { 'user.name': { $regex: searchTerm, $options: 'i' } },
            { 'user.email': { $regex: searchTerm, $options: 'i' } },
            { 'status': { $regex: searchTerm, $options: 'i' } },
            { '_id': mongoose.isValidObjectId(searchTerm) ? searchTerm : undefined }
        ].filter(Boolean);
    }

    if (status) {
        filter.status = status;
    }

    const orders = await Order.find(filter)
        .populate({
            path: 'user',
            select: 'name email phone'
        })
        .populate({
            path: 'orderItems.product',
            select: 'name price image'
        })
        .sort({ dateOrdered: -1 })
        .lean();

    console.log("DEBUG: Fetched orders for admin panel:", orders.length);

    const formattedOrders = orders.map(order => ({
        ...order,
        dateOrderedFormatted: order.dateOrdered ? new Date(order.dateOrdered).toLocaleDateString('en-US', {
            year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        }) : 'N/A',
        calculatedTotalPrice: order.orderItems.reduce((acc, item) => acc + (item.quantity * (item.product ? item.product.price : 0)), 0)
    }));

    res.render('admin/orders', {
        title: 'Orders',
        layout: 'layouts/admin',
        currentRoute: 'orders',
        messages: {}, 
        query: req.query,
        orders: formattedOrders
    });
}); 

exports.users = catchAsync(async (req, res, next) => {


    const users = await User.find().lean();

    const formattedUsers = users.map(user => ({
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.isAdmin ? 'Admin' : 'User',
        status: user.status || 'active'
    }));

    res.render('admin/users', {
        title: 'Users',
        layout: 'layouts/admin',
        currentRoute: 'users',
        users: formattedUsers
    });
}); 

exports.reviews = (req, res) => {
 
    res.render('admin/reviews', {
        title: 'Reviews',
        layout: 'layouts/admin',
        currentRoute: 'reviews'
    });
};

exports.c_c = catchAsync(async (req, res, next) => { 
    const countries = await Country.find({});
    const categories = await Category.find({});

    res.render('admin/c&c', {
        title: 'Countries & Categories',
        layout: 'layouts/admin',
        currentRoute: 'Countries & Categories',
        countries,
        categories
    });
}); 
