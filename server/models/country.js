// models/country.js
const mongoose = require('mongoose');

// Define the Country Schema
const countrySchema = mongoose.Schema({
    // The name of the country (e.g., 'Egypt', 'USA')
    name: {
        type: String,
        required: true,
        unique: true // Country names should be unique to prevent duplicates
    },
    // A short code for the country (e.g., 'EG', 'US') - useful for APIs
    code: {
        type: String,
        required: true,
        unique: true,
        uppercase: true // Store codes as uppercase for consistency
    },
    // The URL for the country's flag image
    flagImage: {
        type: String,
        default: ''
    },
    stock: {
    type: Number,
    default: 0,
    min: 0
},
status: {
    type: String,
    enum: ['Active', 'Inactive'],
    default: 'Active'
},

    // A description for the country
    description: {
        type: String,
        default: ''
    }
}, { timestamps: true }); // Automatically adds 'createdAt' and 'updatedAt' fields

// Export the Country model.
// 'Country' is the model name.
// countrySchema is the schema definition.
// "Countries" is the explicit collection name in MongoDB.
module.exports = mongoose.models.Country || mongoose.model('Country', countrySchema, "Countries");
