// routes/categories.js
const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const authJwt = require('../middleware/authJwt');

router.get(`/`, categoryController.getAllCategories);
router.get(`/:id`, categoryController.getCategoryById);
router.post(`/`,/* authJwt.verifyToken, authJwt.isAdmin, */categoryController.createCategory);
router.put(`/:id`,/* authJwt.verifyToken, authJwt.isAdmin, */categoryController.updateCategory);
router.delete(`/:id`,/* authJwt.verifyToken, authJwt.isAdmin, */categoryController.deleteCategory);

module.exports = router;
