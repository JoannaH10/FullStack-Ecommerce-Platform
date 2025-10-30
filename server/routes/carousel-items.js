// server/routes/carousel-items.js

const express = require('express');
const router = express.Router();
const carouselItemsController = require('../controllers/carouselItemsController'); 

// --- GET All Carousel Items ---
router.get('/', carouselItemsController.getAllCarouselItems); 

// --- GET Single Carousel Item by ID ---
router.get('/:id', carouselItemsController.getCarouselItemById);

// --- POST Create New Carousel Item ---
router.post(
    '/',
    carouselItemsController.createCarouselItem 
);

// --- PUT Update Carousel Item ---
router.put(
    '/:id',
    carouselItemsController.updateCarouselItem 
);

// --- DELETE Carousel Item ---
router.delete(
    '/:id',
    carouselItemsController.deleteCarouselItem 
);

module.exports = router;