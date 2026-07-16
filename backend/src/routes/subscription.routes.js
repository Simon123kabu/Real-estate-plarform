const express = require('express');
const router = express.Router();
const { getPlans, getSubscriptionStatus, initializeCheckout, handleWebhook } = require('../controllers/subscription.controller');
const { isAuthenticated, isAgent } = require('../middleware/auth.middleware');

// Public route to view plans
router.get('/plans', getPlans);

// Public webhook route called asynchronously by Paystack
router.post('/webhook', handleWebhook);

// Agent-only routes
router.get('/me', isAuthenticated, isAgent, getSubscriptionStatus);
router.post('/checkout', isAuthenticated, isAgent, initializeCheckout);

module.exports = router;
