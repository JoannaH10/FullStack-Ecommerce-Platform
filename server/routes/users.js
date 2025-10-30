// routes/users.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController'); // Import the user controller
const authJwt = require('../middleware/authJwt'); 
// --- GET All Users ---
// This route is typically for administrators only, so it's protected.
router.get(`/`, authJwt.verifyToken, authJwt.isAdmin, userController.getAllUsers);

// --- GET Single User by ID ---
// This route can be accessed by an admin (any user) or the user themselves (if authenticated and accessing their own ID).
// For simplicity, it's currently set as admin-only. For user self-access, additional logic in controller is needed.
router.get(`/:id`, authJwt.verifyToken, authJwt.isAdmin, userController.getUserById);

// --- POST Register User ---
// This route is publicly accessible as it's for new user sign-ups.
router.post(`/register`, userController.registerUser);

// --- POST Admin Login (via Secret Key) ---
// This new route handles admin login using a secret key.
router.post(`/admin-login`, userController.adminLogin); // <--- ADD THIS LINE!

// --- POST Login User ---
// This route is publicly accessible for users to authenticate and get a token.
router.post(`/login`, userController.loginUser);

// --- PUT Update User Profile ---
// This route is typically for administrators (any user) or the user themselves (to update their own profile).
// For simplicity, it's currently set as admin-only. For user self-update, additional logic in controller/middleware is needed.
router.put(`/:id`, authJwt.verifyToken, authJwt.isAdmin, userController.updateUser); // Corrected to userController.updateUser

// --- DELETE User ---
// This route is typically for administrators only.
router.delete(`/:id`, authJwt.verifyToken, authJwt.isAdmin, userController.deleteUser);

// --- GET User Count ---
// This route is typically for administrators only.
router.get(`/get/count`, authJwt.verifyToken, authJwt.isAdmin, userController.getUserCount);

module.exports = router;