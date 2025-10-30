// routes/countries.js
const express = require('express');
const router = express.Router();
const countryController = require('../controllers/countryController');
const authJwt = require('../middleware/authJwt');

// Import multer and streamifier directly here
const multer = require('multer');
const streamifier = require('streamifier');
const cloudinary = require('cloudinary').v2; // Ensure v2 is used here too

// Initialize multer within this file (or pass it from app.js)
// If you initialize here, you don't need to attach it via req in app.js
const upload = multer({ storage: multer.memoryStorage() });

router.get(`/`, countryController.getAllCountries);
router.get(`/:id`, countryController.getCountryById);

// CORRECT WAY to apply Multer middleware
// Multer parses the multipart/form-data and populates req.body and req.file
router.post(
    `/`,
    upload.single('flagImage'), // Use the directly imported 'upload' instance
    (req, res, next) => {
        // Now attach streamifier and cloudinary to req for the controller to use
        // This makes sure they are available for THIS specific request
        req.streamifier = streamifier;
        req.cloudinary = cloudinary;
        next();
    },
    countryController.createCountry
);

// If update also handles file uploads, you'd add the multer middleware here too
router.put(
    `/:id`,
    upload.single('flagImage'), // Use the directly imported 'upload' instance
    (req, res, next) => {
        req.streamifier = streamifier;
        req.cloudinary = cloudinary;
        next();
    },
    countryController.updateCountry
);

router.delete(`/:id`, /* authJwt.verifyToken, authJwt.isAdmin, */countryController.deleteCountry);

module.exports = router;