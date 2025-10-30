// server/routes/reviews.js - REFURBISHED

const express = require('express');
const router = express.Router();
const reviewsController = require('../controllers/reviewsController');


// --- Public Routes ---
// Anyone can view all approved reviews.
// Maps to: GET /api/s1/reviews
router.get('/', reviewsController.getAllReviews);

// Anyone can view a single review by its ID.
// Maps to: GET /api/s1/reviews/:id
router.get('/:id', reviewsController.getReviewById);


// --- User-Specific Routes (Require Authentication) ---
// These routes assume a user is logged in and 'req.user' is populated by authMiddleware.protect.

// A logged-in user can submit a new review.
// Maps to: POST /api/s1/reviews
router.post(
    '/',
    // authMiddleware.protect, // <--- COMMENTED OUT: Only authenticated users can create reviews
    reviewsController.createReview
);

// A logged-in user can view their own reviews.
// Maps to: GET /api/s1/reviews/my-reviews
// The controller will automatically use req.user._id for the query.
router.get(
    '/my-reviews',
    // authMiddleware.protect, // <--- COMMENTED OUT: User must be authenticated to view their own reviews
    reviewsController.getReviewsByUserId
);


// A logged-in user can update their OWN review.
// Maps to: PUT /api/s1/reviews/:id
router.put(
    '/:id',
    // authMiddleware.protect,          // <--- COMMENTED OUT: User must be authenticated
    // authMiddleware.authorizeReviewOwner, // <--- COMMENTED OUT: User must be the owner of the review OR an admin
    reviewsController.updateReview
);

// A logged-in user can delete their OWN review.
// Maps to: DELETE /api/s1/reviews/:id
router.delete(
    '/:id',
    // authMiddleware.protect,          // <--- COMMENTED OUT: User must be authenticated
    // authMiddleware.authorizeReviewOwner, // <--- COMMENTED OUT: User must be the owner of the review OR an admin
    reviewsController.deleteReview
);


// --- Admin-Specific Routes (Require Authentication AND Admin Role) ---
// These routes assume an admin is logged in and 'req.user' is populated, AND their role is 'admin'.

// Admin can view ALL reviews (approved or unapproved, using query params like ?approved=false).
// Maps to: GET /api/s1/reviews/admin
router.get(
    '/admin',
    // authMiddleware.protect,      // <--- COMMENTED OUT: Must be authenticated
    // authMiddleware.authorizeAdmin, // <--- COMMENTED OUT: Must have 'admin' role
    reviewsController.getAllReviews
);

// Admin can approve any review.
// Maps to: PUT /api/s1/reviews/admin/approve/:id
router.put(
    '/admin/approve/:id',
    // authMiddleware.protect,
    // authMiddleware.authorizeAdmin,
    reviewsController.approveReview
);

// Admin can unapprove (reject) any review.
// Maps to: PUT /api/s1/reviews/admin/unapprove/:id
router.put(
    '/admin/unapprove/:id',
    // authMiddleware.protect,
    // authMiddleware.authorizeAdmin,
    reviewsController.unapproveReview
);

// Admin can update ANY review.
// Maps to: PUT /api/s1/reviews/admin/:id
router.put(
    '/admin/:id',
    // authMiddleware.protect,
    // authMiddleware.authorizeAdmin,
    reviewsController.updateReview
);

// Admin can delete ANY review.
// Maps to: DELETE /api/s1/reviews/admin/:id
router.delete(
    '/admin/:id',
    // authMiddleware.protect,
    // authMiddleware.authorizeAdmin,
    reviewsController.deleteReview
);

// Admin can view reviews submitted by a specific user (by userId in URL parameter).
// Maps to: GET /api/s1/reviews/admin/user/:userId
router.get(
    '/admin/user/:userId',
    // authMiddleware.protect,
    // authMiddleware.authorizeAdmin,
    reviewsController.getReviewsByUserId
);


module.exports = router;