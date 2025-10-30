// server/controllers/mainController.js

const Review = require('../models/Review');
const User = require('../models/User');
const CarouselItem = require('../models/CarouselItem');
const Bundle = require('../models/Bundle');
const Product = require('../models/Product'); // Ensure this is correctly imported
const mongoose = require('mongoose');

exports.homepage = async (req, res, next) => {
    try {
        // --- Fetch Reviews Data ---
        const reviews = await Review.find({ approved: true })
            .populate('user', 'name profilePicture')
            .limit(5)
            .sort({ createdAt: -1 });

        // --- Fetch Carousel Items ---
        const carouselItems = await CarouselItem.find().sort({ order: 1 });

        // --- FETCH DYNAMIC PRODUCTS FOR 'BEST SELLERS' SECTION (ADDED THIS BLOCK) ---
        const productLimit = 10; // Number of products to display
        const products = await Product.find({})
                                      .sort({ createdAt: -1 }) // Or whatever criteria for 'best sellers'
                                      .limit(productLimit)
                                      .lean(); // Use .lean() for performance

        console.log("Homepage: Fetched Products for 'BEST SELLERS':", products);
        console.log("Homepage: Number of Products Fetched for 'BEST SELLERS':", products.length);
        // Optional: Console logs for debugging
        console.log('Reviews fetched for homepage:', reviews);
        console.log('Carousel Items fetched for homepage:', carouselItems);
        // --- UPDATE THESE BUNDLE IDS ---
        const bundleIds = [
            '684468c66d34372cb50eedeb', // Mystery Snack Adventure
            '684468c66d34372cb50eeddd', // Taste of the Nile
            '684468c66d34372cb50eedea'  // The Bestsellers Collection
        ];
        console.log('Attempting to fetch bundle IDs:', bundleIds);

        // Convert IDs to Mongoose ObjectIds
        const objectIds = bundleIds.map(id => {
            try {
                // Ensure the ID is a valid 24-character hex string for ObjectId
                if (!mongoose.Types.ObjectId.isValid(id)) {
                    console.error(`Invalid ObjectId format for ID: ${id}`);
                    return null;
                }
                return new mongoose.Types.ObjectId(id);
            } catch (err) {
                console.error(`Error converting ID ${id} to ObjectId:`, err);
                return null;
            }
        }).filter(id => id !== null);

        if (objectIds.length === 0 && bundleIds.length > 0) {
            console.error('All bundle IDs failed conversion to ObjectId or were invalid.');
        } else if (objectIds.length < bundleIds.length) {
            console.warn(`Some bundle IDs failed conversion. Only querying for ${objectIds.length} valid IDs.`);
        } else {
            console.log('Successfully converted bundle IDs to ObjectIds:', objectIds);
        }

        const bundles = await Bundle.find({ _id: { $in: objectIds } });
        console.log('Homepage Bundles fetched from DB:', bundles); // Check this log!
        console.log('Bundles array content before rendering:', bundles); // Additional debug log

        if (bundles.length < objectIds.length) { // Use objectIds.length here
            console.warn(`Warning: Only ${bundles.length} out of ${objectIds.length} expected homepage bundles were found.`);
            if (bundles.length === 0) {
                console.error('No homepage bundles were found in the database based on the provided IDs. This might indicate an issue with your database connection or the specific IDs not matching.');
            }
        }
        res.render('pages/homepage', {
            title: 'NumNum Snack Store - Taste the World!',
            reviews,
            bundles,
            carouselItems,
            products, // <--- IMPORTANT: Passing the new 'products' array to the EJS template
            showHeader: true,
            showFooter: true,
            currentPage: 'homepage'
        });

    } catch (error) {
        console.error('Error fetching homepage data:', error);
        next(error); // Pass the error to the next middleware
    }
};