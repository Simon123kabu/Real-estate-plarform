const subscriptionService = require('../services/subscription.service');

/**
 * Middleware to check listing quota for agents before creating properties.
 */
const checkListingQuota = async (req, res, next) => {
  try {
    const quota = await subscriptionService.getQuotaStatus(req.session.userId);
    
    if (!quota.canCreateListing) {
      return res.status(403).json({
        success: false,
        message: 'You have reached the listing limit for your current subscription plan. Please upgrade to post more listings.',
        data: {
          plan: quota.plan,
          effectivePlan: quota.effectivePlan,
          maxActiveListings: quota.maxActiveListings,
          activeListings: quota.activeListings
        }
      });
    }

    // Attach quota status to request to avoid querying the DB again in controllers
    req.subscriptionQuota = quota;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = checkListingQuota;
