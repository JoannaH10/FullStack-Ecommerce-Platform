// models/product.js
const mongoose = require("mongoose");

// Define the Product Schema to match ProductsBack.json exactly
const productSchema = mongoose.Schema({
    // The name of the product (e.g., 'Chipsy', 'Coca-Cola')
    name: {
        type: String,
        required: true,
        trim: true // Remove whitespace from both ends of a string
    },
    // A short description of the product
    description: {
        type: String,
        required: true,
        maxlength: 500 // Limit description length
    },
    // A detailed description of the product
    richDescription: {
        type: String,
        default: ''
    },
    // The main image URL for the product
    image: {
        type: String,
        default: ''
    },
    // An array of additional image URLs for the product
    images: [{
        type: String
    }],
    // The brand of the product
    brand: {
        type: String,
        default: '' // Added 'brand' field back as it's common for products
    },
    // The price of the product
    price: {
        type: Number,
        required: true,
        min: 0 // Price cannot be negative
    },
    // Reference to the Category model
    // This establishes a relationship: a product belongs to one category
    category: {
        type: String, // Changed to String to match JSON
        required: true,
    },
    // Reference to the Country model
    // This establishes a relationship: a product belongs to one country (origin/availability)
    country: {
        type: String, // Changed to String to match JSON
        required: true,
    },
    // The number of items in stock
    countInStock: {
        type: Number,
        required: false,
        min: 0, // Stock cannot be negative
        max: 255 // Example max stock (adjust as needed)
    }
}, { timestamps: true }); // Add timestamps for creation and update dates

// This is useful for frontends that might prefer 'id' over '_id'
productSchema.virtual('id').get(function () {
    return this._id.toHexString();
});

productSchema.set('toJSON', {
    virtuals: true,
});

// Export the Product model.
module.exports = mongoose.model('Product', productSchema, "Products");