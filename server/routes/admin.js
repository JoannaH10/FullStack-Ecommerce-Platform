// server/routes/admin.js
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminControllers.js');
const categoryController = require('../controllers/categoryController.js');
const userController = require('../controllers/userController.js'); 


// Existing routes
router.get('/', adminController.dashboard);
router.get('/dashboard', adminController.dashboard); 
router.get('/products', adminController.products); 
router.get('/bundles', adminController.bundles); 
router.get('/orders', adminController.orders); 
router.get('/reviews', adminController.reviews); 
router.get('/c&c', adminController.c_c); 

router.get('/users', adminController.users); 
router.delete('/users/:id', userController.deleteUser);


module.exports = router;