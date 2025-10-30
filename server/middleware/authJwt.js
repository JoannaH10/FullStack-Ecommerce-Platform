// middleware/authJwt.js
const jwt = require('jsonwebtoken'); // For verifying JWT tokens
const AppError = require('../utils/appError'); // Custom error class
const catchAsync = require('../utils/catchAsync'); // Utility to catch async errors
const User = require('../models/User'); // Corrected import for User model

// Middleware to verify the JWT token
exports.verifyToken = catchAsync(async (req, res, next) => {
    let token; // CHANGED: Declare token variable outside if/else

    // 1) Get token from request headers (for client-side fetch requests, e.g., from JS localStorage)
    // ADDED: Check for Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
        token = req.headers.authorization.split(' ')[1];
    }
    // 2) If not in header, check if the JWT cookie exists (for direct browser navigations to EJS pages)
    // ADDED: Check for req.cookies.jwt
    else if (req.cookies && req.cookies.jwt) {
        token = req.cookies.jwt;
    }

    if (!token) {
        // If no token is found in either place, user is not authenticated
        return next(new AppError('You are not logged in! Please log in to get access.', 401));
    }

    // 3) Verify token
    const decoded = await jwt.verify(token, process.env.JWT_SECRET); // Uses your JWT_SECRET from .env

    // 4) Check if user still exists
    // (Optional but recommended for robustness, ensures token isn't for a deleted user)
    const currentUser = await User.findById(decoded.userId); // Use User directly after correct import
    if (!currentUser) {
        return next(new AppError('The user belonging to this token no longer exists.', 401));
    }

    // (Optional: Check if user changed password after the token was issued - commented out as per previous context)
    // if (currentUser.passwordChangedAt) {
    //    const changedTimestamp = parseInt(currentUser.passwordChangedAt.getTime() / 1000, 10);
    //    if (decoded.iat < changedTimestamp) { // iat = issued at
    //        return next(new AppError('User recently changed password! Please log in again.', 401));
    //    }
    // }

    // 5) Grant access to protected route
    // Attach the decoded user payload to the request object for later use in routes/controllers
    req.user = currentUser; // Attach the actual user document (UPDATED: now attaches the Mongoose user object)
    req.userId = decoded.userId; // Also attach userId directly from token
    req.isAdmin = decoded.isAdmin; // Also attach isAdmin directly from JWT payload
    next(); // Proceed to the next middleware or route handler
});

// Middleware to restrict access based on roles
// Pass an array of allowed roles, e.g., restrictTo('admin', 'editor')
exports.restrictTo = (...roles) => {
    return (req, res, next) => {
        // req.isAdmin is set by the verifyToken middleware
        const userRole = req.isAdmin ? 'admin' : 'user'; // Map isAdmin to a role string (UPDATED: assumes 'user' if not admin)

        // Check if the user's role is included in the allowed roles
        if (!roles.includes(userRole)) {
            // If not allowed, return 403 Forbidden
            return next(new AppError('You do not have permission to perform this action.', 403));
        }
        next(); // If allowed, proceed
    };
};

// Simplified isAdmin check (can be used directly if only admin access is needed)
exports.isAdmin = (req, res, next) => {
    if (!req.isAdmin) { // This relies on req.isAdmin being set by verifyToken
        return next(new AppError('You do not have administrative privileges to perform this action.', 403));
    }
    next();
};
