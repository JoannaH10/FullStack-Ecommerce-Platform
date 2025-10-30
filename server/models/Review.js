const mongoose = require('mongoose');
const reviewSchema = mongoose.Schema({

    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },

    reviewerType: {
        type: String,
        required: true,
        default: 'Customer'
    },

    reviewText: {
        type: String,
        required: true,
        minlength: 10
    },

    rating: {
        type: Number,
        required: true,
        min: 1, 
        max: 5  
    },


    product: {
        type: mongoose.Schema.ObjectId,
        ref: 'Product',
        required: true
    },

    approved: { // To allow admin moderation of reviews
        type: Boolean,
        default: false
    },
}, {
    timestamps: true
});


module.exports = mongoose.model('Review', reviewSchema);