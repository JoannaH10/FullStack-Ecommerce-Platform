const express = require('express');
const router = express.Router();
const bundleController = require('../controllers/bundlesControllers');

// --- PLACEHOLDER FOR AUTHENTICATION & VALIDATION MIDDLEWARE ---
// You will create these files under public/server/middleware/
// const { authenticateJWT, authorizeAdmin } = require('../../middleware/authMiddleware');
// const { validateBundleInput } = require('../../middleware/validationMiddleware');

// Note: The base URL for these routes will be /api/s1/bundles

// URL: /api/s1/bundles (can include ?limit, ?category, ?sortBy, ?sortOrder)
router.get('/', bundleController.getAllBundlesApi);

// URL: /api/s1/bundles/:id
router.get('/:id', bundleController.getBundleByIdApi);

// POST: Create a new bundle (Admin Only)
// URL: /api/s1/bundles
// Expected Body: JSON with bundle data (e.g., { name: "...", price: ..., image: "url/path" })
router.post(
    '/',
    // --- AUTHENTICATION (Uncomment when ready) ---
    // authenticateJWT,
    // authorizeAdmin,
    // --- VALIDATION (Uncomment when ready) ---
    // validateBundleInput,
    bundleController.createBundle
);

// PUT: Update an existing bundle by ID (Admin Only)
// URL: /api/s1/bundles/:id
// Expected Body: JSON with fields to update (e.g., { price: ..., description: ... })
router.put(
    '/:id',
    // --- AUTHENTICATION (Uncomment when ready) ---
    // authenticateJWT,
    // authorizeAdmin,
    // --- VALIDATION (Uncomment when ready) ---
    // validateBundleInput,
    bundleController.updateBundle
);

// DELETE: Delete a bundle by ID (Admin Only)
// URL: /api/s1/bundles/:id
router.delete(
    '/:id',
    // --- AUTHENTICATION (Uncomment when ready) ---
    // authenticateJWT,
    // authorizeAdmin,
    bundleController.deleteBundle
);

module.exports = router;