const User = require('../models/User');
const Property = require('../models/Property');
const SUBSCRIPTION_PLANS = require('../constants/subscriptionPlans');
const SUBSCRIPTION_STATUS = require('../constants/subscriptionStatus');
const LISTING_VISIBILITY = require('../constants/listingVisibility');
const emailService = require('./email.service');
const AppError = require('../utils/AppError');

/**
 * Resolves the user's active paid subscription plan or falls back to 'free'.
 * @param {Object} user - User document
 * @returns {string} Effective plan slug
 */
function getEffectivePlan(user) {
  if (!user || !user.subscription) {
    return SUBSCRIPTION_PLANS.FREE;
  }
  const now = new Date();
  const { plan, status, currentPeriodEnd, cancelAtPeriodEnd } = user.subscription;

  // Active and term hasn't ended
  if (status === SUBSCRIPTION_STATUS.ACTIVE && currentPeriodEnd && currentPeriodEnd > now) {
    return plan;
  }

  // Cancelled but term hasn't ended (grace period access until period end)
  if (cancelAtPeriodEnd && currentPeriodEnd && currentPeriodEnd > now) {
    return plan;
  }

  return SUBSCRIPTION_PLANS.FREE;
}

/**
 * Returns limits and duration for a given subscription plan slug.
 * @param {string} planSlug - Plan identifier ('free', 'premium', 'premium_plus')
 * @returns {Object} plan limits object
 */
function getPlanLimits(planSlug) {
  switch (planSlug) {
    case SUBSCRIPTION_PLANS.PREMIUM:
      return { maxActiveListings: 5, listingDurationDays: 365 };
    case SUBSCRIPTION_PLANS.PREMIUM_PLUS:
      return { maxActiveListings: 10, listingDurationDays: 365 };
    case SUBSCRIPTION_PLANS.FREE:
    default:
      return { maxActiveListings: 1, listingDurationDays: 90 };
  }
}

/**
 * Checks active property listing counts against plan limits.
 * @param {string} userId - User ObjectId string
 * @returns {Object} Quota status object
 */
async function getQuotaStatus(userId) {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError('User not found.', 404);
  }

  // Count active listings: visibility is 'active' AND not expired
  const activeListings = await Property.countDocuments({
    agent: userId,
    visibility: LISTING_VISIBILITY.ACTIVE,
    expiresAt: { $gt: new Date() }
  });

  const now = new Date();
  const isExpired = user.subscription?.currentPeriodEnd && user.subscription.currentPeriodEnd <= now;

  const effectivePlan = getEffectivePlan(user);
  const limits = getPlanLimits(effectivePlan);
  const canCreateListing = !isExpired && (activeListings < limits.maxActiveListings);

  return {
    plan: user.subscription?.plan || SUBSCRIPTION_PLANS.FREE,
    effectivePlan,
    status: user.subscription?.status || SUBSCRIPTION_STATUS.ACTIVE,
    maxActiveListings: limits.maxActiveListings,
    activeListings,
    canCreateListing,
    subscriptionEndsAt: user.subscription?.currentPeriodEnd || null,
    listingDurationDays: limits.listingDurationDays
  };
}

/**
 * Calculates listing expiration date which aligns with the user's subscription end date.
 * @param {Object} user - User document
 * @returns {Date} Expiration date
 */
function calculateExpiresAt(user) {
  if (user && user.subscription && user.subscription.currentPeriodEnd) {
    return new Date(user.subscription.currentPeriodEnd);
  }
  // Default fallback if no subscription is present (e.g. 90 days from now)
  return new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
}

/**
 * Helper to resolve Paystack Plan Code to internal Plan Slug
 * @param {string} planCode - Paystack plan code
 * @returns {string} Plan Slug
 */
function getPlanSlugFromCode(planCode) {
  if (planCode === process.env.PAYSTACK_PLAN_PREMIUM) {
    return SUBSCRIPTION_PLANS.PREMIUM;
  }
  if (planCode === process.env.PAYSTACK_PLAN_PREMIUM_PLUS) {
    return SUBSCRIPTION_PLANS.PREMIUM_PLUS;
  }
  return SUBSCRIPTION_PLANS.FREE;
}

/**
 * Updates a user's subscription records and aligns properties based on a verified Paystack event.
 * @param {Object} eventPayload - The verified Paystack event payload (containing event and data)
 * @returns {Promise<Object|null>} Updated User document or null
 */
async function applySubscriptionFromPaystackEvent(eventPayload) {
  const { event, data } = eventPayload;

  if (!event || !data) {
    throw new AppError('Invalid event payload structure.', 400);
  }

  // Handle successful subscriptions / billing renewals
  if (event === 'subscription.create' || event === 'charge.success') {
    const isSubscriptionPayment = data.plan || (data.metadata && data.metadata.planCode);
    if (!isSubscriptionPayment) return null;

    const email = data.customer?.email;
    const customerCode = data.customer?.customer_code;
    const subscriptionCode = data.subscription_code || data.metadata?.subscriptionCode;
    const planCode = data.plan?.plan_code || data.metadata?.planCode;

    // Resolve user by custom metadata userId first, then fallback to email
    const userId = data.metadata?.userId;
    let user;
    if (userId) {
      user = await User.findById(userId);
    }
    if (!user && email) {
      user = await User.findOne({ email: email.toLowerCase() });
    }

    if (!user) {
      throw new AppError(`User not found for subscription event: ${email || userId}`, 404);
    }

    const planSlug = getPlanSlugFromCode(planCode);
    const periodStart = data.createdAt ? new Date(data.createdAt) : new Date();
    // Default subscription period is 1 year from start if next_payment_date is missing
    const periodEnd = data.next_payment_date
      ? new Date(data.next_payment_date)
      : new Date(periodStart.getTime() + 365 * 24 * 60 * 60 * 1000);

    user.subscription = {
      plan: planSlug,
      status: SUBSCRIPTION_STATUS.ACTIVE,
      paystackCustomerCode: customerCode,
      paystackSubscriptionCode: subscriptionCode,
      paystackEmail: email,
      currentPeriodStart: periodStart,
      currentPeriodEnd: periodEnd,
      cancelAtPeriodEnd: false
    };

    await user.save();
    console.log(`[Webhook] User ${user.email} subscription updated to ${planSlug} (Ends: ${periodEnd.toISOString()})`);

    // Extend all active property listings of the agent to match the new subscription expiry
    const listingUpdateResult = await Property.updateMany(
      { agent: user._id, visibility: LISTING_VISIBILITY.ACTIVE },
      { $set: { expiresAt: periodEnd } }
    );
    console.log(`[Webhook] Extended expiresAt for ${listingUpdateResult.modifiedCount} active properties of user ${user.email}`);

    // Trigger success notification (non-blocking)
    const prettyPlanName = planSlug === SUBSCRIPTION_PLANS.PREMIUM ? 'Premium' : 'Premium Plus';
    emailService.sendSubscriptionSuccessEmail(user.email, user.name, prettyPlanName, periodEnd);

    return user;
  }

  // Handle subscription cancellations
  if (event === 'subscription.disable') {
    const subscriptionCode = data.subscription_code;
    const email = data.customer?.email;

    let user;
    if (subscriptionCode) {
      user = await User.findOne({ 'subscription.paystackSubscriptionCode': subscriptionCode });
    }
    if (!user && email) {
      user = await User.findOne({ email: email.toLowerCase() });
    }

    if (!user) {
      throw new AppError(`User not found for subscription cancellation: ${email || subscriptionCode}`, 404);
    }

    // Set cancelAtPeriodEnd to true so they keep access until the period ends
    user.subscription.cancelAtPeriodEnd = true;
    await user.save();
    console.log(`[Webhook] Canceled renewal for user ${user.email}. Plan stays active until ${user.subscription.currentPeriodEnd.toISOString()}`);

    return user;
  }

  return null;
}

/**
 * Handles expiration of a user's subscription, deactivating their plan and listings.
 * @param {string} userId - User ObjectId string
 * @returns {Promise<Object|null>} Updated User document or null
 */
async function handleSubscriptionExpired(userId) {
  const user = await User.findById(userId);
  if (!user) return null;

  user.subscription.status = SUBSCRIPTION_STATUS.EXPIRED;
  await user.save();

  // Expire all active listings for this agent
  const result = await Property.updateMany(
    { agent: userId, visibility: LISTING_VISIBILITY.ACTIVE },
    { $set: { visibility: LISTING_VISIBILITY.EXPIRED, expiredAt: new Date() } }
  );

  console.log(`[Subscription Service] Subscription expired for user ${user.email}. Soft-expired ${result.modifiedCount} listing(s).`);

  // Trigger expiration notification (non-blocking)
  emailService.sendSubscriptionExpiredEmail(user.email, user.name);

  return user;
}

module.exports = {
  getEffectivePlan,
  getPlanLimits,
  getQuotaStatus,
  calculateExpiresAt,
  applySubscriptionFromPaystackEvent,
  handleSubscriptionExpired
};
