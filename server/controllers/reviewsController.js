// server/controllers/reviewsController.js

const Review = require('../models/Review');
const User = require('../models/User'); 


exports.getAllReviews = async (req, res, next) => {
    try {
        
        const filter = req.query.approved === 'false' ? {} : { approved: true };

        const reviewList = await Review.find(filter)
            .populate('user', 'name profilePicture') // Populate user with name and profilePicture for display
            .limit(parseInt(req.query.limit) || 5) // Allow limit to be dynamic, default to 5
            .sort({ createdAt: -1 }); // Latest reviews first

        if (!reviewList || reviewList.length === 0) {
            return res.status(200).json([]); // Return empty array if no reviews found
        }

        res.status(200).json(reviewList);
    } catch (error) {
        next(error); // Pass error to global error handling middleware
    }
};

// --- GET Single Review by ID ---
exports.getReviewById = async (req, res, next) => {
    try {
        const review = await Review.findById(req.params.id)
            .populate('user', 'name profilePicture'); // Populate user details

        if (!review) {
            return res.status(404).json({ success: false, message: 'Review not found.' });
        }

        res.status(200).json(review);
    } catch (error) {
        next(error);
    }
};

// --- GET Reviews by User ID ---
// This function can serve two primary purposes:
// 1. A user viewing their own reviews (via '/api/reviews/my-reviews' route, where req.user._id is used).
// 2. An admin viewing all reviews by a specific user (via '/api/reviews/admin/user/:userId' route, where req.params.userId is used).
exports.getReviewsByUserId = async (req, res, next) => {
    try {
        let userId;

        // Determine the user ID based on the route path or request parameters
        // req.user will be set by the 'protect' middleware.
        // If the route path is '/my-reviews' (user's personal review list), use authenticated user's ID.
        // Otherwise, assume it's for an admin viewing a specific user's reviews, and use req.params.userId.
        if (req.route && req.route.path === '/my-reviews' && req.user) {
            userId = req.user._id;
        } else {
            userId = req.params.userId;
        }

        if (!userId) {
            return res.status(400).json({ success: false, message: 'User ID is required.' });
        }

        const reviews = await Review.find({ user: userId })
            .populate('user', 'name profilePicture') // Populate user details for each review
            .sort({ createdAt: -1 }); 

        if (!reviews || reviews.length === 0) {
            return res.status(200).json([]); 
        }

        res.status(200).json(reviews);
    } catch (error) {
        next(error);
    }
};

// --- POST a New Review ---
// A logged-in user can submit a new review.
exports.createReview = async (req, res, next) => {
    try {
        const user = req.user._id;

        // Extract review details from the request body.
        const { reviewerType, text, rating } = req.body;

        // Basic validation for required fields.
        if (!user || !text || !rating) {
            return res.status(400).json({ success: false, message: 'Missing required review fields (reviewText, rating).' });
        }
        // Validate rating range.
        if (rating < 1 || rating > 5) {
            return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5.' });
        }

       
        const newReview = new Review({
            user,
            reviewerType: reviewerType || 'Customer', 
            reviewText,
            rating,
            approved: false
        });

        const savedReview = await newReview.save();

        const populatedReview = await savedReview.populate('user', 'name profilePicture');

        res.status(201).json(populatedReview); // 201 Created status
    } catch (error) {
        next(error);
    }
};

// --- PUT Update an Existing Review ---
// Can be used by the review owner or an admin. Authorization middleware will differentiate.
exports.updateReview = async (req, res, next) => {
    try {
        const reviewId = req.params.id;
        const updates = req.body; // All updates come from the request body

        // Prevent direct modification of the 'user' field, as ownership should not be changed.
        if (updates.user) {
            return res.status(400).json({ success: false, message: 'Cannot change review owner.' });
        }

        // Optional: Validate rating if it's part of the update.
        if (updates.rating !== undefined && (updates.rating < 1 || updates.rating > 5)) {
            return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5.' });
        }

      
        const updatedReview = await Review.findByIdAndUpdate(
            reviewId,
            updates,
            { new: true, runValidators: true }
        );

        if (!updatedReview) {
            return res.status(404).json({ success: false, message: 'Review not found or could not be updated.' });
        }

        res.status(200).json(updatedReview); 
    } catch (error) {
        next(error);
    }
};

// --- DELETE a Review ---
exports.deleteReview = async (req, res, next) => {
    try {
        const deletedReview = await Review.findByIdAndDelete(req.params.id);

        if (!deletedReview) {
            return res.status(404).json({ success: false, message: 'Review not found or could not be deleted.' });
        }

        res.status(200).json({ success: true, message: 'Review deleted successfully.' }); // 200 OK status
    } catch (error) {
        next(error);
    }
};

// --- Admin Functionality: Approve a Review ---
// Only accessible by administrators (via authorization middleware).
exports.approveReview = async (req, res, next) => {
    try {
        const reviewId = req.params.id;
        const review = await Review.findById(reviewId);

        if (!review) {
            return res.status(404).json({ success: false, message: 'Review not found.' });
        }

        // Set the review's approved status to true.
        review.approved = true;
        await review.save(); 

        res.status(200).json({ success: true, message: 'Review approved successfully.', review });
    } catch (error) {
        next(error);
    }
};

// --- Admin Functionality: Unapprove/Reject a Review ---

exports.unapproveReview = async (req, res, next) => {
    try {
        const reviewId = req.params.id;
        const review = await Review.findById(reviewId);

        if (!review) {
            return res.status(404).json({ success: false, message: 'Review not found.' });
        }

        // Set the review's approved status to false.
        review.approved = false;
        await review.save(); // Save the changes to the database.

        res.status(200).json({ success: true, message: 'Review unapproved successfully.', review });
    } catch (error) {
        next(error);
    }
};