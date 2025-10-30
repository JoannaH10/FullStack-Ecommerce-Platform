// models/category.js
const mongoose = require('mongoose');

// Define the Category Schema
const categorySchema = mongoose.Schema({
    // The name of the category (e.g., 'Snacks', 'Beverages')
    name: {
        type: String,
        required: true,
        unique: true // Category names should be unique to prevent duplicates
    },
    // An optional icon string for the category (e.g., Font Awesome class)
    icon: {
        type: String,
        default: ''
    },
    stock: {
  type: Number,
  default: 0
},

status: {
  type: String,
  enum: ['Active', 'Inactive'],
  default: 'Active'
},

    // An optional color string for the category (e.g., a hex code like '#FFD700')
    color: {
        type: String,
        default: ''
    }
}, { timestamps: true }); // Automatically adds 'createdAt' and 'updatedAt' fields

// Export the Category model.
// 'Category' is the model name.
// categorySchema is the schema definition.
// "Categories" is the explicit collection name in MongoDB.
module.exports = mongoose.models.Category || mongoose.model('Category', categorySchema, "Categories");