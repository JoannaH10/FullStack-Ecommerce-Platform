// server/controllers/carouselItemsController.js

const CarouselItem = require('../models/CarouselItem'); // Import your Mongoose model

// --- GET All Carousel Items ---
exports.getAllCarouselItems = async (req, res, next) => {
    try {
        // Filter for active items by default unless 'all=true' query parameter is present
        const filter = req.query.all === 'true' ? {} : { isActive: true };
        // Find carousel items, sort by order and then creation date
        const carouselItems = await CarouselItem.find(filter).sort({ order: 1, createdAt: 1 });

        // If no carousel items are found, return a 200 OK with an empty array
        // This is generally preferred for list endpoints instead of 404 Not Found.
        if (!carouselItems || carouselItems.length === 0) {
            return res.status(200).json([]);
        }

        res.status(200).json(carouselItems); // Send the found carousel items
    } catch (error) {
        next(error); 
    }
};

// --- GET Single Carousel Item by ID ---
exports.getCarouselItemById = async (req, res, next) => {
    try {
        const carouselItem = await CarouselItem.findById(req.params.id); // Find item by ID from request parameters

        if (!carouselItem) {
            return res.status(404).json({ success: false, message: 'Carousel item not found.' });
        }

        res.status(200).json(carouselItem); 
    } catch (error) {
        next(error); 
    }
};

// --- POST Create New Carousel Item ---
exports.createCarouselItem = async (req, res, next) => {
    try {
        const { imageSrc, altText, subtitle, title, buttonLink, buttonText, order, isActive } = req.body;

        if (!imageSrc || !altText || !subtitle || !title || !buttonLink || !buttonText) {
            return res.status(400).json({ success: false, message: 'Missing required fields for carousel item.' });
        }

        // Create a new CarouselItem instance with data from the request body
        const newCarouselItem = new CarouselItem({
            imageSrc,
            altText,
            subtitle,
            title,
            buttonLink,
            buttonText,
            order: order !== undefined ? order : 0, 
            isActive: isActive !== undefined ? isActive : true 
        });

        const savedCarouselItem = await newCarouselItem.save(); 
        res.status(201).json(savedCarouselItem);
    } catch (error) {
        next(error); 
    }
};

// --- PUT Update Carousel Item ---
exports.updateCarouselItem = async (req, res, next) => {
    try {
        const { imageSrc, altText, subtitle, title, buttonLink, buttonText, order, isActive } = req.body;

        if (!imageSrc || !altText || !subtitle || !title || !buttonLink || !buttonText) {
             return res.status(400).json({ success: false, message: 'Missing required fields for update.' });
        }

        // Find and update the carousel item by ID
        const updatedCarouselItem = await CarouselItem.findByIdAndUpdate(
            req.params.id, // ID of the item to update
            { imageSrc, altText, subtitle, title, buttonLink, buttonText, order, isActive },
            { new: true, runValidators: true } 
        );

        // If item not found or update failed, return 404 Not Found
        if (!updatedCarouselItem) {
            return res.status(404).json({ success: false, message: 'Carousel item not found or could not be updated.' });
        }

        res.status(200).json(updatedCarouselItem); 
    } catch (error) {
        next(error); 
    }
};

// --- DELETE Carousel Item ---
exports.deleteCarouselItem = async (req, res, next) => {
    try {
        const deletedCarouselItem = await CarouselItem.findByIdAndDelete(req.params.id); 

        if (!deletedCarouselItem) {
            return res.status(404).json({ success: false, message: 'Carousel item not found or could not be deleted.' });
        }

        res.status(200).json({ success: true, message: 'Carousel item deleted successfully.' }); 
    } catch (error) {
        next(error); 
    }
};