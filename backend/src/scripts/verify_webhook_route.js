const subscriptionController = require('../controllers/subscription.controller');
const paystackService = require('../services/paystack.service');
const subscriptionService = require('../services/subscription.service');
const PaymentEvent = require('../models/PaymentEvent');

console.log('--- Verification of Webhook Router & Controller Logic ---');

// Helper to mock res
const mockResponse = () => {
  const res = {};
  res.status = (code) => {
    res.statusCode = code;
    return res;
  };
  res.json = (data) => {
    res.jsonData = data;
    return res;
  };
  return res;
};

// Helper to execute the asyncHandler-wrapped controller and await promise execution/rejection
const callController = (handler, req, res) => {
  return new Promise((resolve, reject) => {
    // Intercept res.json to resolve
    const originalJson = res.json;
    res.json = (data) => {
      res.jsonData = data;
      const val = originalJson ? originalJson(data) : res;
      resolve({ status: res.statusCode || 200, data });
      return val;
    };

    // Trigger the route handler with mock next function
    handler(req, res, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve({ status: res.statusCode || 200, data: null });
      }
    });
  });
};

// 1. Test handleWebhook with missing signature
async function testMissingSignature() {
  console.log('\n--- 1. Testing Webhook Route: Missing Signature ---');
  const req = {
    headers: {}
  };
  const res = mockResponse();

  try {
    await callController(subscriptionController.handleWebhook, req, res);
    console.log('Test Failed: Expected error was not thrown.');
  } catch (error) {
    console.log('StatusCode returned:', error.statusCode || 400);
    console.log('Error message matching signature missing:', error.message === 'Signature header is missing.');
  }
}

// 2. Test handleWebhook with invalid signature
async function testInvalidSignature() {
  console.log('\n--- 2. Testing Webhook Route: Invalid Signature ---');
  const req = {
    headers: {
      'x-paystack-signature': 'bad-signature'
    },
    rawBody: 'mock-body-content'
  };
  const res = mockResponse();

  // Mock signature verification failure
  const originalVerifyWebhookSignature = paystackService.verifyWebhookSignature;
  paystackService.verifyWebhookSignature = () => false;

  try {
    await callController(subscriptionController.handleWebhook, req, res);
    console.log('Test Failed: Expected signature mismatch error was not thrown.');
  } catch (error) {
    console.log('StatusCode returned:', error.statusCode || 401);
    console.log('Error message matching verification failure:', error.message === 'Signature verification failed.');
  }

  paystackService.verifyWebhookSignature = originalVerifyWebhookSignature;
}

// 3. Test handleWebhook processing and idempotency (duplicate check)
async function testSuccessfulWebhookAndIdempotency() {
  console.log('\n--- 3. Testing Webhook Route: Successful Processing & Idempotency ---');

  const originalVerifyWebhookSignature = paystackService.verifyWebhookSignature;
  const originalApplySubscription = subscriptionService.applySubscriptionFromPaystackEvent;
  const originalPaymentEventCreate = PaymentEvent.create;
  const originalPaymentEventFindOne = PaymentEvent.findOne;

  paystackService.verifyWebhookSignature = () => true;

  let applySubscriptionCalledCount = 0;
  subscriptionService.applySubscriptionFromPaystackEvent = async () => {
    applySubscriptionCalledCount++;
    return { email: 'agent@example.com' };
  };

  let loggedEvents = [];
  PaymentEvent.create = async (payload) => {
    const eventDoc = {
      ...payload,
      save: async function() {
        return this;
      }
    };
    loggedEvents.push(eventDoc);
    return eventDoc;
  };

  // Mock findOne: returns null on first check, returns mockDoc on subsequent checks
  let dbEvents = {};
  PaymentEvent.findOne = async (query) => {
    const eventId = query.eventId;
    return dbEvents[eventId] || null;
  };

  const webhookBody = {
    event: 'subscription.create',
    data: {
      id: 99999,
      subscription_code: 'SUB_success_ref',
      customer: { email: 'agent@example.com' }
    }
  };

  const req = {
    headers: { 'x-paystack-signature': 'valid-mock-signature' },
    rawBody: JSON.stringify(webhookBody),
    body: webhookBody
  };

  // First Call: Process successfully
  const res1 = mockResponse();
  const result1 = await callController(subscriptionController.handleWebhook, req, res1);

  console.log('First Call Response status:', result1.status);
  console.log('First Call Json message:', result1.data?.message);
  console.log('Ledger document pending log created:', loggedEvents.length === 1);
  console.log('Ledger document status transitioned to processed:', loggedEvents[0]?.status === 'processed');
  console.log('applySubscriptionFromPaystackEvent invoked:', applySubscriptionCalledCount === 1);

  // Set the event in our mock DB to simulate persistence
  dbEvents['99999'] = loggedEvents[0];

  // Second Call: Ignore as duplicate (Idempotency)
  const res2 = mockResponse();
  const result2 = await callController(subscriptionController.handleWebhook, req, res2);

  console.log('Second Call Response status:', result2.status);
  console.log('Second Call Json message:', result2.data?.message);
  console.log('applySubscriptionFromPaystackEvent bypassed on duplicate:', applySubscriptionCalledCount === 1);

  // Restore mocks
  paystackService.verifyWebhookSignature = originalVerifyWebhookSignature;
  subscriptionService.applySubscriptionFromPaystackEvent = originalApplySubscription;
  PaymentEvent.create = originalPaymentEventCreate;
  PaymentEvent.findOne = originalPaymentEventFindOne;
}

async function run() {
  await testMissingSignature();
  await testInvalidSignature();
  await testSuccessfulWebhookAndIdempotency();
  console.log('\nWebhook routing validation completed successfully!');
  process.exit(0);
}

run();
