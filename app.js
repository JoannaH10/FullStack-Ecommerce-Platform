require('dotenv').config();

console.log('--- app.js STARTING ---');

const express = require('express');
const expressLayout = require('express-ejs-layouts');
const path = require('path');
const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const morgan = require('morgan');
const streamifier = require('streamifier');
const mongoose = require('mongoose'); // Keep mongoose for MongoStore.create
const { config, connectDB } = require('./server/config/db');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const cors = require('cors');
const app = express();

// --- Authentication and Error Handling Middleware Imports (Move these to the top) ---
const { verifyToken, restrictTo } = require('./server/middleware/authJwt');
const AppError = require('./server/utils/appError');
const errorHandlerMiddleware = require('./server/middleware/errorhandling'); // Already imported below, keeping for clarity
const User = require('./server/models/User'); // Already imported below, keeping for clarity


// --- Product model import ---
const Product = require('./server/models/Product'); // Ensure this path is correct
// --- End Product model import ---

console.log(`Configured PORT: ${config.port}`);

const api = config.apiSNACK; // Your API base prefix, e.g., '/api/v1'

console.log(`API_SNACK prefix: ${api}`);

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
});

const upload = multer({ storage: multer.memoryStorage() });

app.use(cors({
    origin: 'http://localhost:5000', // Or your frontend URL
    credentials: true // Crucial for sending/receiving cookies
}));
app.use(morgan("tiny"));
app.use(cookieParser());

// Middleware setup (general purpose)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public')); // Serve static files from 'public' folder

// Serve uploaded files statically
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
// If your uploads are inside public, use: app.use('/public/uploads', express.static(path.join(__dirname, 'public', 'uploads')));

// --- Router Imports ---
// Ensure these paths are correct for your project structure
const reviewsRouter = require('./server/routes/reviews');
const ordersRouter = require('./server/routes/orders');
const usersRouter = require('./server/routes/users');
const categoriesRouter = require('./server/routes/category');
const carouselItemsRouter = require('./server/routes/carousel-items');
const imageUploadRouter = require('./server/routes/image-upload');
const bundleRouter = require('./server/routes/bundles');
const adminRoutes = require('./server/routes/admin');
const countriesRoutes = require('./server/routes/countries');
const productsApiRouter = require('./server/routes/productsApi');
const contactRoutes = require('./server/routes/contactus');




// GET all products for admin panel listing (with optional search)
app.get(`${api}/admin/products`, async (req, res) => {
    try {
        const searchTerm = req.query.search;
        let query = {};

        if (searchTerm) {
            query = {
                $or: [
                    { name: { $regex: searchTerm, $options: 'i' } },
                    { brand: { $regex: searchTerm, $options: 'i' } },
                    { category: { $regex: searchTerm, $options: 'i' } },
                    { country: { $regex: searchTerm, $options: 'i' } },
                    { description: { $regex: searchTerm, $options: 'i' } }
                ]
            };
        }
        const products = await Product.find(query);
        console.log("Backend: Fetched products for admin list:", products.length); // Debugging
        res.json(products);
    } catch (err) {
        console.error("Error fetching products for admin:", err);
        res.status(500).json({ message: 'Error fetching products', error: err.message });
    }
});

// GET a single product by ID for editing in admin panel
app.get(`${api}/admin/products/:id`, async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        res.json(product);
    } catch (err) {
        console.error("Error fetching single product for admin edit:", err);
        res.status(500).json({ message: 'Error fetching product', error: err.message });
    }
});

// POST a new product (Create operation)
app.post(`${api}/admin/products`, async (req, res) => {
    const { name, brand, category, country, price, description, image } = req.body;
    if (!name || !brand || !category || !country || !price) {
        return res.status(400).json({ message: 'Missing required product fields' });
    }

    const newProduct = new Product({
        name, brand, category, country, price, description, image
    });

    try {
        const savedProduct = await newProduct.save();
        res.status(201).json(savedProduct);
    } catch (err) {
        console.error("Error adding product via admin API:", err);
        res.status(400).json({ message: 'Error adding product', error: err.message });
    }
});

app.put(`${api}/admin/products/:id`, async (req, res) => {
    try {
        const updatedProduct = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!updatedProduct) {
            return res.status(404).json({ message: 'Product not found' });
        }
        res.json(updatedProduct);
    } catch (err) {
        console.error("Error updating product via admin API:", err);
        res.status(400).json({ message: 'Error updating product', error: err.message });
    }
});

app.delete(`${api}/admin/products/:id`, async (req, res) => {
    try {
        const deletedProduct = await Product.findByIdAndDelete(req.params.id);
        if (!deletedProduct) {
            return res.status(404).json({ message: 'Product not found' });
        }
        res.json({ message: 'Product deleted successfully' });
    } catch (err) {
        console.error("Error deleting product via admin API:", err);
        res.status(500).json({ message: 'Error deleting product', error: err.message });
    }
});

app.get(`${api}/admin/categories`, async (req, res) => {
    try {
        const categories = await Product.distinct('category');
        console.log("Backend Categories Fetched (for dropdown):", categories); // Debugging
        res.json(categories.sort());
    } catch (err) {
        console.error("Error fetching distinct categories for admin dropdown:", err);
        res.status(500).json({ message: 'Error fetching categories', error: err.message });
    }
});

// GET all distinct countries from products for dropdown
app.get(`${api}/admin/countries`, async (req, res) => {
    try {
        const countries = await Product.distinct('country');
        console.log("Backend Countries Fetched (for dropdown):", countries); // Debugging
        res.json(countries.sort());
    } catch (err) {
        console.error("Error fetching distinct countries for admin dropdown:", err);
        res.status(500).json({ message: 'Error fetching countries', error: err.message });
    }
});
// --- END: Admin Panel Specific API Routes ---


// --- General API Route Mounting (Existing Routers) ---
// These should generally come after specific admin API routes to avoid conflicts
app.use(`${api}/reviews`, reviewsRouter);
app.use(`${api}/orders`, ordersRouter);
app.use(`${api}/users`, usersRouter);
app.use(`${api}/category`, categoriesRouter);
app.use(`${api}/carousel-items`, carouselItemsRouter);
app.use(`${api}/bundles`, bundleRouter);
app.use(`${api}/products`, productsApiRouter);
app.use(`${api}/contactus`, contactRoutes);

// Your existing /explore route handling
app.use(`${api}/explore`, (req, res, next) => {
    req.upload = upload;
    req.streamifier = streamifier;
    req.cloudinary = cloudinary;
    next();
}, countriesRoutes);

// --- Templating Engine setup (EJS) ---
app.use(expressLayout);
app.set('layout', './layouts/main');
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// --- Frontend Routes (serving EJS pages) ---
console.log('Setting up main routes...');
app.use('/', require('./server/routes/main'));

// Route to serve your admin panel HTML/EJS
app.use('/admin', adminRoutes);

// --- Error Handling ---
app.use((req, res, next) => {
    const error = new Error(`Not Found - The requested URL "${req.originalUrl}" was not found on this server.`);
    error.statusCode = 404;
    next(error);
});
app.use(errorHandlerMiddleware); // Your custom error handling middleware


// --- Async function to connect to DB and then start server ---
const startServer = async () => {
    try {
        console.log('Attempting to connect to DB...');
        await connectDB(); // Await the database connection to complete
        console.log('Database connection is ready');

        // Session middleware MUST be placed here, AFTER DB connection is ready
        app.use(session({
            secret: process.env.SESSION_SECRET || 'a_fallback_secret_for_dev_only',
            resave: false,
            saveUninitialized: false,
            store: MongoStore.create({
                client: mongoose.connection.getClient(),
                ttl: 30, // 30 seconds for testing
            }),
            cookie: {
                maxAge: 1000 * 30, // 30 seconds (in milliseconds) for testing
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production'
            }
        }));

        // --- Server Start (Moved here, after all middleware and routes are set up) ---
        const PORT = config.port || 3000;
        app.listen(PORT, () => {
            console.log(`Server is running on http://localhost:${PORT}`);
            console.log(`Access product page at: http://localhost:${PORT}/products`);
            console.log(`Access Admin Panel at: http://localhost:${PORT}/admin`);
        });

    } catch (err) {
        console.error('Failed to start server:', err);
        process.exit(1);
    }
};

// Call the async function to start the server
startServer();