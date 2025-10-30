// controllers/categoryController.js
const Category  = require('../models/category');
const mongoose = require('mongoose');
const AppError = require('../utils/appError'); // Import AppError
const catchAsync = require('../utils/catchAsync'); // Import catchAsync

// Get all categories
exports.getAllCategories = catchAsync(async (req, res, next) => {
    const categoryList = await Category.find();
    if (!categoryList || categoryList.length === 0) {
        return next(new AppError('No categories found.', 404)); // Use AppError for 404
    }
    res.status(200).send(categoryList);
});

// Get category by ID
exports.getCategoryById = catchAsync(async (req, res, next) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
        return next(new AppError('Invalid Category ID format.', 400)); // Use AppError for 400
    }
    const category = await Category.findById(req.params.id);
    if (!category) {
        return next(new AppError('Category not found.', 404)); // Use AppError for 404
    }
    res.status(200).send(category);
});

// Create a new category
exports.createCategory = catchAsync(async (req, res, next) => {
    try { // Keep try-catch for unique index error which is database-specific
        let category = new Category({
            name: req.body.name,
            icon: req.body.icon,
            color: req.body.color,
            stock: req.body.stock,         
            status: req.body.status    

        });
        category = await category.save();
        if (!category) {
            return next(new AppError('The category cannot be created!', 500));
        }
        res.status(201).json(category);
    } catch (error) {
        if (error.code === 11000 && error.keyPattern && error.keyPattern.name) {
            return next(new AppError('Category name already exists.', 400));
        }
        return next(new AppError('Error creating category.', 500)); // General error
    }
});

// Update an existing category
exports.updateCategory = catchAsync(async (req, res, next) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
        return next(new AppError('Invalid Category ID format.', 400));
    }
    try { // Keep try-catch for unique index error
        const category = await Category.findByIdAndUpdate(
            req.params.id,
            {
                name: req.body.name,
                icon: req.body.icon,
                color: req.body.color,
                stock: req.body.stock,         
                status: req.body.status    
            },
            { new: true }
        );
        if (!category) {
            return next(new AppError('The category cannot be updated or found!', 404));
        }
        res.status(200).json(category);
    } catch (error) {
        if (error.code === 11000 && error.keyPattern && error.keyPattern.name) {
            return next(new AppError('Category name already exists.', 400));
        }
        return next(new AppError('Error updating category.', 500));
    }
});

// Delete a category
exports.deleteCategory = catchAsync(async (req, res, next) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
        return next(new AppError('Invalid Category ID format.', 400));
    }
    const category = await Category.findByIdAndDelete(req.params.id);
    if (category) {
        res.status(200).json({ success: true, message: 'The category is deleted!' });
    } else {
        return next(new AppError('Category not found!', 404));
    }
});
/*
exports.toggleCategoryStatus = catchAsync(async (req, res, next) => {
    const categoryId = req.params.id;

    if (!mongoose.isValidObjectId(categoryId)) {
        return next(new AppError('Invalid Category ID.', 400));
    }

    const category = await Category.findById(categoryId);
    if (!category) {
        return next(new AppError('Category not found.', 404));
    }

    category.status = category.status === 'Active' ? 'Inactive' : 'Active';
    await category.save();

    res.status(200).json({ status: category.status });
});
*/
exports.toggleStatus = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);
        if (!category) return res.status(404).json({ error: 'Category not found' });

        category.status = category.status === 'Active' ? 'Inactive' : 'Active';
        await category.save();

        res.json({ success: true, status: category.status });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};