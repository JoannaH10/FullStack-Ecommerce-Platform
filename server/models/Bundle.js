// models/bundles.js
const mongoose = require('mongoose');

const bundleSchema = mongoose.Schema({
    id: {
        type: String,
    },
    category: {
        type: String,
    },
    title: { 
        type: String,
    },
    products: { 
        type: Array,
        default: [],
    },
    description: {
        type: String,
    },
    price: {
        type: Number,
    },
    image: {
        type: String,
    },
}, {
    timestamps: true,
    collection: 'Bundles' 
});

const Bundle = mongoose.model('Bundle', bundleSchema);

module.exports = Bundle;

// Add virtual for product count
bundleSchema.virtual('productCount').get(function() {
    return this.products.length;
});

// Enable virtuals in toJSON
bundleSchema.set('toJSON', { virtuals: true });