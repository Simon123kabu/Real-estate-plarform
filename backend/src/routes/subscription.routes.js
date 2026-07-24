const express = require('express');
const router = express.Router();
const { getPlans, getSubscriptionStatus, initializeCheckout, handleWebhook } = require('../controllers/subscription.controller');
const { isAuthenticated, isAgent } = require('../middleware/auth.middleware');

router.get('/plans', getPlans);

router.post('/webhook', handleWebhook);

router.get('/me', isAuthenticated, isAgent, getSubscriptionStatus);
router.post('/checkout', isAuthenticated, isAgent, initializeCheckout);

module.exports = router;
