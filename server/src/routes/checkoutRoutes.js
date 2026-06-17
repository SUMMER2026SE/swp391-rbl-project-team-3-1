const express = require('express');
const router = express.Router();
const checkoutController = require('../controllers/checkoutController');
const authMiddleware = require('../middlewares/authMiddleware');

// Public routes – không cần token
router.get('/trainers', checkoutController.getTrainers);
router.get('/plans', checkoutController.getPlans);
router.get('/services', checkoutController.getServices);
router.post('/payos/create-payment', checkoutController.createPayosPayment);
router.get('/payos/status/:orderCode', checkoutController.getPayosStatus);
router.post('/check-email', checkoutController.checkEmail);
router.post('/guest-register-checkout', checkoutController.guestCheckoutAndRegister);
router.get('/homepage-config', checkoutController.getHomepageConfig);

// Protected routes – cần token
router.post('/loggedIn-checkout', authMiddleware, checkoutController.loggedInCheckout);

module.exports = router;
