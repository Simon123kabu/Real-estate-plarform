const subscriptionService = require('../services/subscription.service');

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

    req.subscriptionQuota = quota;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = checkListingQuota;
