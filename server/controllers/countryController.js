// controllers/countryController.js
const Country = require('../models/country');
const mongoose = require('mongoose');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

// Get all countries
exports.getAllCountries = catchAsync(async (req, res, next) => {
    const countryList = await Country.find();
    if (!countryList || countryList.length === 0) {
        return next(new AppError('No countries found.', 404));
    }
    res.status(200).send(countryList);
});

// Get country by ID
exports.getCountryById = catchAsync(async (req, res, next) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
        return next(new AppError('Invalid Country ID format.', 400));
    }
    const country = await Country.findById(req.params.id);
    if (!country) {
        return next(new AppError('Country not found.', 404));
    }
    res.status(200).send(country);
});

// Create a new country
exports.createCountry = catchAsync(async (req, res, next) => {
    try {
        let flagImageUrl = null;

        // Check if a file was uploaded
        if (req.file) {
            const streamUpload = (file) => {
                return new Promise((resolve, reject) => {
                    const uploadStream = req.cloudinary.uploader.upload_stream(
                        { folder: 'country_flags' }, // Specify a folder in Cloudinary
                        (error, result) => {
                            if (result) {
                                resolve(result);
                            } else {
                                reject(error);
                            }
                        }
                    );
                    req.streamifier.createReadStream(file.buffer).pipe(uploadStream);
                });
            };

            const result = await streamUpload(req.file);
            flagImageUrl = result.secure_url; // Get the secure URL from Cloudinary
        }

        let country = new Country({
            name: req.body.name,
            code: req.body.code,
            flagImage: flagImageUrl, // Use the URL from Cloudinary
            description: req.body.description,
            stock: req.body.stock || 0, // Default to 0 if not provided
            status: req.body.status || 'Active' // Default to 'Active' if not provided
        });

        country = await country.save();
        if (!country) {
            return next(new AppError('The country cannot be created!', 500));
        }
        res.status(201).json(country);
    } catch (error) {
        if (error.code === 11000 && error.keyPattern) {
            if (error.keyPattern.name) {
                return next(new AppError('Country name already exists.', 400));
            }
            if (error.keyPattern.code) {
                return next(new AppError('Country code already exists.', 400));
            }
        }
        console.error("Error in createCountry:", error); // Log the actual error for debugging
        return next(new AppError('Error creating country. ' + error.message, 500));
    }
});

// Update an existing country
exports.updateCountry = catchAsync(async (req, res, next) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
        return next(new AppError('Invalid Country ID format.', 400));
    }

    try {
        let flagImageUrl = req.body.flagImage; // Keep existing if not updated

        // Handle new flag image upload if provided during update
        if (req.file) {
            const streamUpload = (file) => {
                return new Promise((resolve, reject) => {
                    const uploadStream = req.cloudinary.uploader.upload_stream(
                        { folder: 'country_flags' },
                        (error, result) => {
                            if (result) {
                                resolve(result);
                            } else {
                                reject(error);
                            }
                        }
                    );
                    req.streamifier.createReadStream(file.buffer).pipe(uploadStream);
                });
            };
            const result = await streamUpload(req.file);
            flagImageUrl = result.secure_url; // Update with new Cloudinary URL
        }

        const country = await Country.findByIdAndUpdate(
            req.params.id,
            {
                name: req.body.name,
                code: req.body.code,
                flagImage: flagImageUrl, // Use the new or existing URL
                description: req.body.description,
                stock: req.body.stock,
                status: req.body.status
            },
            { new: true }
        );
        if (!country) {
            return next(new AppError('The country cannot be updated or found!', 404));
        }
        res.status(200).json(country);
    } catch (error) {
        if (error.code === 11000 && error.keyPattern) {
            if (error.keyPattern.name) {
                return next(new AppError('Country name already exists.', 400));
            }
            if (error.keyPattern.code) {
                return next(new AppError('Country code already exists.', 400));
            }
        }
        console.error("Error in updateCountry:", error);
        return next(new AppError('Error updating country. ' + error.message, 500));
    }
});

// Delete a country
exports.deleteCountry = catchAsync(async (req, res, next) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
        return next(new AppError('Invalid Country ID format.', 400));
    }
    const country = await Country.findByIdAndDelete(req.params.id);
    if (country) {
        // Optional: Delete image from Cloudinary
        if (country.flagImage) {
            const publicId = country.flagImage.split('/').pop().split('.')[0]; // Extract public ID from URL
            await req.cloudinary.uploader.destroy(`country_flags/${publicId}`, (error, result) => {
                if (error) console.error('Cloudinary deletion error:', error);
                // console.log('Cloudinary deletion result:', result);
            });
        }
        res.status(200).json({ success: true, message: 'The country is deleted!' });
    } else {
        return next(new AppError('Country not found!', 404));
    }
});