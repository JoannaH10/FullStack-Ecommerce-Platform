// server/routes/main.js
const express = require('express');
const router = express.Router();
const mainController = require('../controllers/mainController'); // Correct path to your controller
const bundleController = require('../controllers/bundlesControllers'); 
const productController=require('../controllers/productsController'); 


// Define your routes here

// USE THIS LINE INSTEAD:
router.get('/', mainController.homepage); 

router.get('/contactus', (req, res) => {
    res.render('pages/contactus', { title: 'Contact US' });
});

router.post('/submit-contact', (req, res) => { // Changed route name from '/submit-contact-form' for clarity
    console.log("Form data received:", req.body);
    // Here you would process the form data (e.g., save to DB, send email)
    // For now, let's just redirect
    res.redirect('/contactus?message=success'); // Redirect with a success message
});

router.get('/bundles', bundleController.renderBundlesPage);

router.get('/explore', (req, res) => {
    res.render('pages/explore', { title: 'Explore Our Countries', showFooter: false, currentPage: 'explore' });
});

router.get('/faq', (req, res) => {
    res.render('pages/faq', { title: 'Snack Store - FAQ' });
});

router.get('/login', (req, res) => {
    res.render('pages/login', { title: 'LogIn/SignUp', showFooter: false, showHeader: true, currentPage: 'login' });
});

router.get('/favorites', (req, res) => {
    res.render('pages/favorites', { title: 'WishList' });
});

router.get('/cart', (req, res) => {
    res.render('pages/cart', { title: 'Shopping Cart' });
});

router.get('/checkout', (req, res) => {
    res.render('pages/checkout', { title: 'Proceed To CheckOut' });
});

router.get('/products', productController.getAllProducts);


module.exports = router;