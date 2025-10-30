// models/user.js
const mongoose = require('mongoose');

// Define the User Schema
const userSchema = mongoose.Schema({
    // User's full name (will also serve as display name)
    name: {
        type: String,
        required: true,
        trim: true
    },
    // User's email, MUST be unique and used for authentication
    email: {
        type: String,
        required: true,
        unique: true, // Email addresses must be unique for each user
        trim: true,
        lowercase: true // Store emails in lowercase for consistency
    },
    // Hashed password (NEVER store plain passwords)
    passwordHash: {
        type: String,
        required: true,
    },
    // User's phone number
    phone: {
        type: String,
        required: true,
    },
    // Flag to determine if the user is an administrator
    isAdmin: {
        type: Boolean,
        default: false, // Regular user by default
    },
    // User's street address
    street: {
        type: String,
        default: ''
    },
    apartment: {
        type: String,
        default: ''
    },
    zip: {
        type: String,
        default: ''
    },
    city: {
        type: String,
        default: ''
    },
    // Reference to the Country model
    country: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Country',
        default: null // Can be null if not provided
    },
    // User's role (e.g., 'user', 'admin')
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    // User's gender
    gender: {
        type: String,
        enum: ['Male', 'Female', 'Other'],
        default: 'Other'
    },
    // User's profile image (dynamically assigned based on gender)
    profileImage: {
        type: String,
        default: function() {
            if (this.gender === 'Male') {
                return '/images/homepages/avatar-man.png';
            } else if (this.gender === 'Female') {
                return '/images/homepage/avatar-lady.png';
            } else {
                return '/images/homepage/avatar-others.png';
            }
        }
    }
}, { timestamps: true }); // Add createdAt and updatedAt fields

// Create a virtual 'id' field for frontend compatibility
userSchema.virtual('id').get(function () {
    return this._id.toHexString();
});

// Configure the schema to include virtuals when converting to JSON
userSchema.set('toJSON', {
    virtuals: true,
});

// Export the User model. The third argument specifies the collection name in MongoDB.
exports.User = mongoose.model('User', userSchema, 'Users');