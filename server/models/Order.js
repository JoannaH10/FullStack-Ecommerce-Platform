// models/order.js
const mongoose = require('mongoose');

// Define the OrderItem Schema (sub-schema for products within an order)
// This schema is embedded directly within the Order schema
const orderItemSchema = mongoose.Schema({
    // Reference to the Product model
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product', // References the 'Product' model
        required: true
    },
    // Quantity of this specific product in the order
    quantity: {
        type: Number,
        required: true,
        min: 1 // Quantity must be at least 1
    },
    // NEW: Store the price of the product at the time of purchase
    priceAtPurchase: {
        type: Number,
        required: true,
        min: 0
    }
});

// Define the Order Schema
const orderSchema = mongoose.Schema({
    // Array of products in the order, using the embedded orderItemSchema
    orderItems: [{
        type: orderItemSchema, // Each item in the array conforms to orderItemSchema
        required: true
    }],
    // NEW: Nested object for shipping address details
    shippingAddress: {
        country: {
            type: String,
            required: true,
            trim: true
        },
        city: {
            type: String,
            required: true,
            trim: true
        },
        address: { // Renamed from shippingAddress1/shippingAddress2 to a single field 'address'
            type: String,
            required: true,
            trim: true
        },
        postalCode: { // Renamed from 'zip' to 'postalCode' for clarity
            type: String,
            required: true,
            trim: true
        },
        specialInstructions: { // NEW: Optional field for delivery instructions
            type: String,
            default: ''
        }
    },
    // Contact phone number for the order
    phone: {
        type: String,
        required: true,
        trim: true
    },
    // NEW: Payment method selected by the user
    paymentMethod: {
        type: String,
        enum: ['credit_card', 'paypal', 'stripe', 'bank_transfer', 'cash_on_delivery'],
        required: true
    },
    // NEW: Status of the payment
    paymentStatus: {
        type: String,
        enum: ['pending', 'completed', 'failed', 'refunded'],
        default: 'pending'
    },
    // Current status of the order (e.g., 'pending', 'processing', 'shipped', 'delivered', 'cancelled')
    // RENAMED from 'status' to 'orderStatus' for clarity with paymentStatus
    orderStatus: {
        type: String,
        enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
        required: true,
        default: 'pending' // 'pending' typically means it's still a cart
    },
    // NEW: Subtotal of products before shipping/tax
    subtotal: {
        type: Number,
        default: 0
    },
    // NEW: Shipping fee for the order
    shippingFee: {
        type: Number,
        default: 0
    },
    // NEW: Tax applied to the order
    tax: {
        type: Number,
        default: 0
    },
    // Total price of the order (calculated on backend)
    // RENAMED from 'totalPrice' to 'total' for simplicity
    total: {
        type: Number,
        default: 0 // Default to 0, will be calculated
    },
    // NEW: Currency of the order total
    currency: {
        type: String,
        enum: ['USD', 'EGP'], // Example currencies, add more as needed
        default: 'USD'
    },
    // Reference to the User model who placed the order
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // References the 'User' model
        required: true
    },
    // Date the order was placed
    dateOrdered: {
        type: Date,
        default: Date.now, // Defaults to the current date/time when created
    }
}, { timestamps: true }); // Automatically adds 'createdAt' and 'updatedAt' fields

// Create a virtual 'id' field for frontend compatibility
orderSchema.virtual('id').get(function () {
    return this._id.toHexString();
});

// Configure the schema to include virtuals when converting to JSON
orderSchema.set('toJSON', {
    virtuals: true,
});

// Export the Order model.
// 'Order' is the model name.
// orderSchema is the schema definition.
// "Orders" is the explicit collection name in MongoDB.
// ADDED FIX: Prevents OverwriteModelError during hot-reloads or multiple imports
module.exports = mongoose.models.Order || mongoose.model('Order', orderSchema, "Orders");

// Export OrderItem for direct use if needed in routes (though it's embedded)
module.exports.OrderItem = mongoose.models.OrderItem || mongoose.model('OrderItem', orderItemSchema);