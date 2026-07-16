const subscriptionService = require('../services/subscription.service');
const paystackService = require('../services/paystack.service');
const SUBSCRIPTION_PLANS = require('../constants/subscriptionPlans');
const PaymentEvent = require('../models/PaymentEvent');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

/**
 * GET /api/subscription/plans
 * Public route to list available plans and limits.
 */
const getPlans = (req, res) => {
  res.status(200).json({
    success: true,
    data: [
      {
        name: 'Free',
        slug: SUBSCRIPTION_PLANS.FREE,
        price: 0,
        maxActiveListings: 1,
        listingDurationDays: 90,
        features: ['1 active listing during 90-day trial period', 'Standard public visibility']
      },
      {
        name: 'Premium',
        slug: SUBSCRIPTION_PLANS.PREMIUM,
        price: 99, // suggested pricing
        maxActiveListings: 5,
        listingDurationDays: 365,
        features: ['Up to 5 active listings', 'Lifespan aligned with subscription duration', 'Email renewal reminders']
      },
      {
        name: 'Premium Plus',
        slug: SUBSCRIPTION_PLANS.PREMIUM_PLUS,
        price: 179, // suggested pricing
        maxActiveListings: 10,
        listingDurationDays: 365,
        features: ['Up to 10 active listings', 'Lifespan aligned with subscription duration', 'Email renewal reminders', 'Featured listing tags']
      }
    ]
  });
};

/**
 * GET /api/subscription/me
 * Authenticated agent route to get current quota and active listing usage.
 */
const getSubscriptionStatus = asyncHandler(async (req, res) => {
  const status = await subscriptionService.getQuotaStatus(req.session.userId);
  res.status(200).json({
    success: true,
    data: status
  });
});

/**
 * POST /api/subscription/checkout
 * Authenticated agent route to initiate a checkout subscription plan session.
 */
const initializeCheckout = asyncHandler(async (req, res) => {
  const { planSlug, callbackUrl } = req.body || {};
  if (!planSlug) {
    throw new AppError('Plan slug is required.', 400);
  }

  // 1. Validate plan and determine plan code/price
  let planCode;
  let amountInKobo;
  if (planSlug === SUBSCRIPTION_PLANS.PREMIUM) {
    planCode = process.env.PAYSTACK_PLAN_PREMIUM;
    amountInKobo = 990000; // 9,900 NGN or equivalent base currency
  } else if (planSlug === SUBSCRIPTION_PLANS.PREMIUM_PLUS) {
    planCode = process.env.PAYSTACK_PLAN_PREMIUM_PLUS;
    amountInKobo = 1790000; // 17,900 NGN or equivalent base currency
  } else {
    throw new AppError('Invalid paid plan slug selected.', 400);
  }

  if (!planCode) {
    throw new AppError(`Plan code for ${planSlug} is not configured on the server.`, 500);
  }

  // 2. Fetch logged-in user profile
  const user = await User.findById(req.session.userId);
  if (!user) {
    throw new AppError('User not found.', 404);
  }

  // 3. Setup redirect callback
  const redirectUrl = callbackUrl || `${process.env.CLIENT_URL || 'http://localhost:5173'}/subscription/callback`;

  // 4. Initialize Paystack checkout transaction
  const metadata = {
    userId: user._id.toString(),
    planCode
  };

  const transactionData = await paystackService.initializeTransaction(
    user.email,
    amountInKobo,
    planCode,
    metadata,
    redirectUrl
  );

  res.status(200).json({
    success: true,
    data: {
      authorizationUrl: transactionData.authorization_url,
      reference: transactionData.reference
    }
  });
});

/**
 * POST /api/subscription/webhook
 * Public webhook endpoint called asynchronously by Paystack.
 */
const handleWebhook = asyncHandler(async (req, res) => {
  const signature = req.headers['x-paystack-signature'];
  if (!signature) {
    throw new AppError('Signature header is missing.', 400);
  }

  // 1. Verify that webhook source signature matches merchant secret
  const isSignatureValid = paystackService.verifyWebhookSignature(req.rawBody || '', signature);
  if (!isSignatureValid) {
    throw new AppError('Signature verification failed.', 401);
  }

  const { event, data } = req.body || {};
  const eventId = data?.id ? String(data.id) : null;

  // 2. Idempotency Check (prevent double processing of identical events)
  if (eventId) {
    const existingEvent = await PaymentEvent.findOne({ eventId });
    if (existingEvent) {
      console.log(`[Webhook] Duplicate event received and ignored: ${eventId}`);
      return res.status(200).json({ success: true, message: 'Event already processed.' });
    }
  }

  // 3. Create auditing ledger entry
  const paymentLog = await PaymentEvent.create({
    eventId: eventId || `hash_${Date.now()}`,
    event,
    data,
    status: 'pending'
  });

  try {
    // 4. Apply subscription logic and align properties expiresAt
    await subscriptionService.applySubscriptionFromPaystackEvent(req.body);

    paymentLog.status = 'processed';
    paymentLog.processedAt = new Date();
    await paymentLog.save();

    res.status(200).json({ success: true, message: 'Webhook processed successfully.' });
  } catch (error) {
    console.error(`[Webhook Process Error]: ${error.message}`);
    paymentLog.status = 'failed';
    paymentLog.errorMessage = error.message;
    await paymentLog.save();

    // Paystack requests returning 200/201 to prevent retries loop
    res.status(200).json({ success: false, message: `Webhook logging failed: ${error.message}` });
  }
});

module.exports = {
  getPlans,
  getSubscriptionStatus,
  initializeCheckout,
  handleWebhook
};
