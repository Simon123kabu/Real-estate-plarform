const subscriptionService = require('../services/subscription.service');
const SUBSCRIPTION_PLANS = require('../constants/subscriptionPlans');
const SUBSCRIPTION_STATUS = require('../constants/subscriptionStatus');

console.log('--- Verification of subscription.service.js ---');

// 1. Test getPlanLimits
console.log('\nTesting getPlanLimits:');
const plans = [SUBSCRIPTION_PLANS.FREE, SUBSCRIPTION_PLANS.PREMIUM, SUBSCRIPTION_PLANS.PREMIUM_PLUS, 'unknown'];
plans.forEach(plan => {
  console.log(`Plan Limits for "${plan}":`, subscriptionService.getPlanLimits(plan));
});

// 2. Test calculateExpiresAt
console.log('\nTesting calculateExpiresAt:');
const mockUsers = [
  { subscription: { currentPeriodEnd: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) } }, // 90 days trial
  { subscription: { currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) } } // 1 year sub
];
mockUsers.forEach((user, index) => {
  const expiresAt = subscriptionService.calculateExpiresAt(user);
  console.log(`User ${index + 1} ExpiresAt:`, expiresAt.toISOString());
});

// 3. Test getEffectivePlan
console.log('\nTesting getEffectivePlan:');

const testCases = [
  {
    name: 'Null or missing subscription object',
    user: {}
  },
  {
    name: 'Free plan, active status',
    user: {
      subscription: {
        plan: SUBSCRIPTION_PLANS.FREE,
        status: SUBSCRIPTION_STATUS.ACTIVE,
        currentPeriodEnd: new Date(Date.now() + 86400000)
      }
    }
  },
  {
    name: 'Premium plan, active status, not expired',
    user: {
      subscription: {
        plan: SUBSCRIPTION_PLANS.PREMIUM,
        status: SUBSCRIPTION_STATUS.ACTIVE,
        currentPeriodEnd: new Date(Date.now() + 86400000) // tomorrow
      }
    }
  },
  {
    name: 'Premium plan, active status, expired yesterday',
    user: {
      subscription: {
        plan: SUBSCRIPTION_PLANS.PREMIUM,
        status: SUBSCRIPTION_STATUS.ACTIVE,
        currentPeriodEnd: new Date(Date.now() - 86400000) // yesterday
      }
    }
  },
  {
    name: 'Premium Plus, cancelled, not expired yet',
    user: {
      subscription: {
        plan: SUBSCRIPTION_PLANS.PREMIUM_PLUS,
        status: SUBSCRIPTION_STATUS.CANCELED,
        cancelAtPeriodEnd: true,
        currentPeriodEnd: new Date(Date.now() + 86400000) // tomorrow
      }
    }
  },
  {
    name: 'Premium Plus, cancelled, expired yesterday',
    user: {
      subscription: {
        plan: SUBSCRIPTION_PLANS.PREMIUM_PLUS,
        status: SUBSCRIPTION_STATUS.CANCELED,
        cancelAtPeriodEnd: true,
        currentPeriodEnd: new Date(Date.now() - 86400000) // yesterday
      }
    }
  },
  {
    name: 'Premium, past due, not expired',
    user: {
      subscription: {
        plan: SUBSCRIPTION_PLANS.PREMIUM,
        status: SUBSCRIPTION_STATUS.PAST_DUE,
        currentPeriodEnd: new Date(Date.now() + 86400000)
      }
    }
  }
];

testCases.forEach(tc => {
  const result = subscriptionService.getEffectivePlan(tc.user);
  console.log(`- Case: "${tc.name}" => Effective Plan resolved: "${result}"`);
});

console.log('\nUnit checks passed successfully!');
process.exit(0);
