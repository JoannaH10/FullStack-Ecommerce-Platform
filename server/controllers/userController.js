// controllers/userController.js

const { User } = require('../models/User');       // Import the User model
const { Country } = require('../models/country'); // Import Country model for population/validation
const bcrypt = require('bcryptjs');               // For password hashing and comparison
const jwt = require('jsonwebtoken');              // For JWT token generation
const mongoose = require('mongoose');             // For ObjectId validation
const AppError = require('../utils/appError');    // Custom error class for operational errors
const catchAsync = require('../utils/catchAsync'); // Utility to wrap async functions
const { registerSchema, loginSchema, updateUserSchema } = require('../utils/validators/userValidator'); // Joi validation schemas
const  { config } = require('../config/db'); // Ensure config is imported to access adminAccessCode and jwtSecret


// --- Helper function to send token as cookie ---
const sendTokenResponse = (user, statusCode, res, message) => {
    const token = jwt.sign(
        { userId: user._id, isAdmin: user.isAdmin, role: user.role },
        config.jwtSecret,
        { expiresIn: '1d' } // Token expires in 1 day
    );

    const cookieOptions = {
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 day
        httpOnly: true, // IMPORTANT: Makes the cookie inaccessible to client-side JavaScript
        secure: config.nodeEnv === 'production', // Only send over HTTPS in production
        // sameSite: 'Lax' or 'Strict' // Consider adding SameSite for CSRF protection
    };

    res.cookie('jwt', token, cookieOptions); // Set the cookie

    res.status(statusCode).json({
        success: true,
        message: message,
        user: {
            _id: user._id,
            name: user.name,
            email: user.email,
            isAdmin: user.isAdmin,
            role: user.role
        },
        // We no longer send the token in the JSON response body for security
        // token: token // REMOVED: Token is now in cookie
    });
};


// --- GET All Users (Admin Only) ---
exports.getAllUsers = catchAsync(async (req, res, next) => {
    const userList = await User.find().select('-passwordHash')
        .populate('country', 'name code flagImage description');

    if (!userList || userList.length === 0) {
        return res.status(200).json([]);
    }
    res.status(200).send(userList);
});

// --- GET Single User by ID ---
exports.getUserById = catchAsync(async (req, res, next) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
        return next(new AppError('Invalid User ID format.', 400));
    }

    const user = await User.findById(req.params.id).select('-passwordHash')
        .populate('country', 'name code flagImage description');

    if (!user) {
        return next(new AppError('User not found.', 404));
    }
    res.status(200).send(user);
});

// --- POST Register a New User ---
exports.registerUser = catchAsync(async (req, res, next) => {
    const { error, value } = registerSchema.validate(req.body, { abortEarly: false });
    if (error) {
        const errors = error.details.map(detail => detail.message);
        return next(new AppError(errors.join(', '), 400));
    }

    const existingUser = await User.findOne({ email: value.email.toLowerCase() });
    if (existingUser) {
        return next(new AppError('Email already registered.', 409));
    }

    let userCountryId = null;
    if (value.country) {
        const country = await Country.findById(value.country);
        if (!country) {
            return next(new AppError('Country not found.', 400));
        }
        userCountryId = country._id;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(value.password, salt);

    const newUser = new User({
        name: value.name.toLowerCase(),
        email: value.email.toLowerCase(),
        passwordHash: passwordHash,
        phone: value.phone,
        isAdmin: value.isAdmin,
        street: value.street,
        apartment: value.apartment,
        zip: value.zip,
        city: value.city,
        country: userCountryId,
        role: value.role,
        gender: value.gender,
        profileImage: value.profileImage
    });

    const savedUser = await newUser.save();
    if (!savedUser) {
        return next(new AppError('The user cannot be created!', 500));
    }

    // After successful registration, automatically log in the user and send token as cookie
    sendTokenResponse(savedUser, 201, res, 'User registered successfully! Logged in.');
});

// --- POST Login User ---
exports.loginUser = catchAsync(async (req, res, next) => {
    const { error, value } = loginSchema.validate(req.body, { abortEarly: false });
    if (error) {
        const errors = error.details.map(detail => detail.message);
        return next(new AppError(errors.join(', '), 400));
    }

    const user = await User.findOne({ email: value.email.toLowerCase() });
    if (!user) {
        return next(new AppError('Invalid credentials.', 400));
    }

    const isMatch = await bcrypt.compare(value.password, user.passwordHash);
    if (!isMatch) {
        return next(new AppError('Invalid credentials.', 400));
    }

    // On successful login, send token as cookie
    sendTokenResponse(user, 200, res, 'Logged in successfully!');
});

// --- NEW FUNCTION: Admin Login via Email, Password, and Secret Code ---
exports.adminLogin = catchAsync(async (req, res, next) => {
    const { email, password, secretKey } = req.body;

    // --- FOR DEBUGGING: Keep these console logs for now to verify ---
    console.log("Admin Login Attempt (New Flow):");
    console.log("Received Email:", email);
    console.log("Received SecretKey:", secretKey);
    console.log("Expected adminAccessCode from config:", config.adminAccessCode);
    // --- END DEBUGGING LOGS ---

    // 1. Basic validation for all required fields
    if (!email || !password || !secretKey) {
        return next(new AppError('Email, password, and secret key are required for admin login.', 400));
    }

    // 2. Validate the provided secretKey against the config
    if (secretKey !== config.adminAccessCode) {
        return next(new AppError('Invalid admin secret key provided.', 401));
    }

    // 3. Find the user by email
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
        return next(new AppError('Invalid credentials or not an administrator.', 401));
    }

    // 4. Compare the provided password with the hashed password from the found user
    const isPasswordMatch = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordMatch) {
        return next(new AppError('Invalid credentials or not an administrator.', 401));
    }

    // 5. Check if the found user actually has isAdmin: true
    if (!user.isAdmin) {
        return next(new AppError('You do not have administrative privileges.', 403));
    }

    // If all checks pass, send token as cookie
    sendTokenResponse(user, 200, res, 'Admin login successful!');
});

// --- PUT Update User Profile ---
exports.updateUser = catchAsync(async (req, res, next) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
        return next(new AppError('Invalid User ID format.', 400));
    }

    const { error, value } = updateUserSchema.validate(req.body, { abortEarly: false });
    if (error) {
        const errors = error.details.map(detail => detail.message);
        return next(new AppError(errors.join(', '), 400));
    }

    const userExist = await User.findById(req.params.id);
    if (!userExist) {
        return next(new AppError('User not found.', 404));
    }

    let updatedCountryId = userExist.country;
    if (value.country !== undefined) {
        if (value.country === null || value.country === '') {
            updatedCountryId = null;
        } else {
            const country = await Country.findById(value.country);
            if (!country) return next(new AppError('Country not found.', 400));
            updatedCountryId = country._id;
        }
    }

    let newPasswordHash = userExist.passwordHash;
    if (value.password) {
        const salt = await bcrypt.genSalt(10);
        newPasswordHash = await bcrypt.hash(value.password, salt);
    }

    const updateFields = {
        name: value.name !== undefined ? value.name.toLowerCase() : userExist.name,
        email: value.email !== undefined ? value.email.toLowerCase() : userExist.email,
        passwordHash: newPasswordHash,
        phone: value.phone !== undefined ? value.phone : userExist.phone,
        isAdmin: value.isAdmin !== undefined ? value.isAdmin : userExist.isAdmin,
        street: value.street !== undefined ? value.street : userExist.street,
        apartment: value.apartment !== undefined ? value.apartment : userExist.apartment,
        zip: value.zip !== undefined ? value.zip : userExist.zip,
        city: value.city !== undefined ? value.city : userExist.city,
        country: updatedCountryId,
        role: value.role !== undefined ? value.role : userExist.role,
        gender: value.gender !== undefined ? value.gender : userExist.gender,
        profileImage: value.profileImage !== undefined ? value.profileImage : userExist.profileImage
    };

    const updatedUser = await User.findByIdAndUpdate(
        req.params.id,
        updateFields,
        { new: true, runValidators: true, context: 'query' }
    ).select('-passwordHash');

    if (!updatedUser) {
        return next(new AppError('The user cannot be updated or found!', 500));
    }
    res.status(200).json(updatedUser);
});

// --- DELETE User (Admin Only) ---
exports.deleteUser = catchAsync(async (req, res, next) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
        return next(new AppError('Invalid User ID format.', 400));
    }

    const deletedUser = await User.findByIdAndDelete(req.params.id);

    if (!deletedUser) {
        return next(new AppError('User not found!', 404));
    }
    res.status(200).json({ success: true, message: 'The user is deleted!' });
});

// --- GET User Count ---
exports.getUserCount = catchAsync(async (req, res, next) => {
    const userCount = await User.countDocuments();
    if (userCount === null || userCount === undefined) {
        return next(new AppError('Cannot retrieve user count.', 500));
    }
    res.status(200).send({ userCount: userCount });
});

exports.updateUser = catchAsync(async (req, res, next) => {
    // ... existing code ...
    
    if (!updatedUser) {
        return next(new AppError('The user cannot be updated or found!', 500));
    }
    
    // Send success response with updated user data
    res.status(200).json({ 
        success: true,
        message: 'User updated successfully',
        user: updatedUser
    });
});

// In deleteUser controller, update the response:
exports.deleteUser = catchAsync(async (req, res, next) => {
    // ... existing code ...
    
    if (!deletedUser) {
        return next(new AppError('User not found!', 404));
    }
    res.status(200).json({ 
        success: true, 
        message: 'User deleted successfully'
    });
});