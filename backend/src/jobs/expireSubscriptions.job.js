const cron = require('node-cron');
const User = require('../models/User');
const subscriptionService = require('../services/subscription.service');
const emailService = require('../services/email.service');
const SUBSCRIPTION_STATUS = require('../constants/subscriptionStatus');

/**
 * Checks for upcoming subscription expiries and triggers reminders or soft-deactivations.
 */
const checkAndExpireSubscriptions = async () => {
  const now = new Date();

  try {
    // 1. Check for 14-day and 3-day reminders
    const reminderDays = [14, 3];
    for (const days of reminderDays) {
      const targetStart = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
      targetStart.setHours(0, 0, 0, 0);

      const targetEnd = new Date(targetStart.getTime() + 24 * 60 * 60 * 1000 - 1);

      const usersToRemind = await User.find({
        role: 'agent',
        'subscription.status': SUBSCRIPTION_STATUS.ACTIVE,
        'subscription.currentPeriodEnd': { $gte: targetStart, $lte: targetEnd }
      });

      console.log(`[Job: Subscription Expiry] Found ${usersToRemind.length} agent(s) due for a ${days}-day expiry reminder.`);

      for (const user of usersToRemind) {
        const planSlug = user.subscription?.plan;
        const prettyPlan = planSlug === 'premium' ? 'Premium' : 'Premium Plus';
        emailService.sendExpiryReminderEmail(
          user.email,
          user.name,
          prettyPlan,
          days,
          user.subscription.currentPeriodEnd
        );
      }
    }

    // 2. Check for subscriptions that have reached their expiration date
    const expiredUsers = await User.find({
      role: 'agent',
      'subscription.status': { $ne: SUBSCRIPTION_STATUS.EXPIRED },
      'subscription.currentPeriodEnd': { $lte: now }
    });

    console.log(`[Job: Subscription Expiry] Found ${expiredUsers.length} active subscription(s) that have expired.`);

    for (const user of expiredUsers) {
      await subscriptionService.handleSubscriptionExpired(user._id);
    }

  } catch (error) {
    console.error('[Job: Subscription Expiry] Error running subscription checks:', error.message);
  }
};

/**
 * Initializes the subscription background cron job.
 * Runs daily at 1:00 AM (0 1 * * *).
 */
const start = () => {
  // Run every day at 1:00 AM
  cron.schedule('0 1 * * *', () => {
    console.log('[Job: Subscription Expiry] Running daily checks...');
    checkAndExpireSubscriptions();
  });
  console.log('[Job: Subscription Expiry] Daily checks registered successfully.');
};

module.exports = {
  checkAndExpireSubscriptions,
  start
};
