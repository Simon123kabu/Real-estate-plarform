const paystackService = require('../services/paystack.service');
const subscriptionService = require('../services/subscription.service');
const User = require('../models/User');
const Property = require('../models/Property');

console.log('--- Verification of Paystack Service & Webhook Handlers ---');

// 1. Test Webhook Signature verification
function testSignatureVerification() {
  console.log('\n--- 1. Testing verifyWebhookSignature ---');
  
  // Set up mock env key
  const originalKey = process.env.PAYSTACK_SECRET_KEY;
  process.env.PAYSTACK_SECRET_KEY = 'test_webhook_secret_key';

  const body = JSON.stringify({ event: 'test', data: { id: 1 } });
  
  // Create expected signature using crypto
  const crypto = require('crypto');
  const expectedSignature = crypto
    .createHmac('sha512', 'test_webhook_secret_key')
    .update(body)
    .digest('hex');

  const isValid = paystackService.verifyWebhookSignature(body, expectedSignature);
  const isInvalid = paystackService.verifyWebhookSignature(body, 'bad-signature');

  console.log('Valid signature verified successfully:', isValid === true);
  console.log('Invalid signature rejected successfully:', isInvalid === false);

  process.env.PAYSTACK_SECRET_KEY = originalKey;
}

// 2. Test applySubscriptionFromPaystackEvent (subscription.create)
async function testSubscriptionCreateWebhook() {
  console.log('\n--- 2. Testing subscription.create Event Handler ---');

  const originalFindById = User.findById;
  const originalPropertyUpdateMany = Property.updateMany;

  let savedUser = null;
  let listingUpdates = null;

  // Mock User document
  const mockUser = {
    _id: 'mock-agent-123',
    email: 'agent-webhook@example.com',
    subscription: { plan: 'free', status: 'active' },
    save: async function() {
      savedUser = this;
      return this;
    }
  };

  User.findById = async (id) => {
    if (id === 'mock-agent-123') return mockUser;
    return null;
  };

  Property.updateMany = async (query, update) => {
    listingUpdates = { query, update };
    return { modifiedCount: 3 };
  };

  // Mock event payload
  const mockEvent = {
    event: 'subscription.create',
    data: {
      subscription_code: 'SUB_test_code_123',
      createdAt: '2026-07-15T00:00:00.000Z',
      next_payment_date: '2027-07-15T00:00:00.000Z',
      customer: {
        customer_code: 'CUST_test_code_123',
        email: 'agent-webhook@example.com'
      },
      plan: {
        plan_code: 'PLN_premium_test_code_xxx' // let's mock it
      },
      metadata: {
        userId: 'mock-agent-123',
        planCode: 'PLN_premium_test_code_xxx'
      }
    }
  };

  // Temporarily override premium code to match what is in metadata
  const originalPremiumCode = process.env.PAYSTACK_PLAN_PREMIUM;
  process.env.PAYSTACK_PLAN_PREMIUM = 'PLN_premium_test_code_xxx';

  await subscriptionService.applySubscriptionFromPaystackEvent(mockEvent);

  console.log('User subscription plan updated to premium:', savedUser?.subscription?.plan === 'premium');
  console.log('User subscription status updated to active:', savedUser?.subscription?.status === 'active');
  console.log('Paystack subscription code set:', savedUser?.subscription?.paystackSubscriptionCode === 'SUB_test_code_123');
  console.log('Paystack customer code set:', savedUser?.subscription?.paystackCustomerCode === 'CUST_test_code_123');
  console.log('Properties expiresAt updated matching period end date:', listingUpdates?.update?.$set?.expiresAt.getTime() === new Date('2027-07-15T00:00:00.000Z').getTime());

  // Restore variables
  User.findById = originalFindById;
  Property.updateMany = originalPropertyUpdateMany;
  process.env.PAYSTACK_PLAN_PREMIUM = originalPremiumCode;
}

// 3. Test applySubscriptionFromPaystackEvent (subscription.disable)
async function testSubscriptionDisableWebhook() {
  console.log('\n--- 3. Testing subscription.disable Event Handler ---');

  const originalFindOne = User.findOne;
  let savedUser = null;

  const mockUser = {
    _id: 'mock-agent-123',
    email: 'agent-webhook@example.com',
    subscription: {
      plan: 'premium',
      status: 'active',
      currentPeriodEnd: new Date('2027-07-15T00:00:00.000Z'),
      cancelAtPeriodEnd: false
    },
    save: async function() {
      savedUser = this;
      return this;
    }
  };

  User.findOne = async (query) => {
    if (query['subscription.paystackSubscriptionCode'] === 'SUB_test_code_123') {
      return mockUser;
    }
    return null;
  };

  const mockEvent = {
    event: 'subscription.disable',
    data: {
      subscription_code: 'SUB_test_code_123',
      customer: {
        email: 'agent-webhook@example.com'
      }
    }
  };

  await subscriptionService.applySubscriptionFromPaystackEvent(mockEvent);

  console.log('User cancelAtPeriodEnd updated to true:', savedUser?.subscription?.cancelAtPeriodEnd === true);
  console.log('User subscription plan remains premium:', savedUser?.subscription?.plan === 'premium');

  User.findOne = originalFindOne;
}

async function run() {
  testSignatureVerification();
  await testSubscriptionCreateWebhook();
  await testSubscriptionDisableWebhook();
  console.log('\nPaystack services verification completed successfully!');
  process.exit(0);
}

run();
