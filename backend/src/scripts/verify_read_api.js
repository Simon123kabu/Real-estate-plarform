const subscriptionController = require('../controllers/subscription.controller');
const authController = require('../controllers/auth.controller');
const subscriptionService = require('../services/subscription.service');
const User = require('../models/User');

console.log('--- Verification of Subscription Controllers & Read APIs ---');

// Mock response helper
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

// 1. Test getPlans
function testGetPlans() {
  console.log('\n--- 1. Testing getPlans controller (GET /plans) ---');
  const req = {};
  const res = mockResponse();

  subscriptionController.getPlans(req, res);

  console.log('Response status code:', res.statusCode);
  console.log('Response success field:', res.jsonData?.success);
  console.log('Returned plans list length:', res.jsonData?.data?.length);
  res.jsonData?.data?.forEach(plan => {
    console.log(`- Plan: "${plan.name}" (slug: ${plan.slug}), Max Listings: ${plan.maxActiveListings}, Price: $${plan.price}`);
  });
}

// 2. Test getSubscriptionStatus
async function testGetSubscriptionStatus() {
  console.log('\n--- 2. Testing getSubscriptionStatus controller (GET /me) ---');

  const originalGetQuotaStatus = subscriptionService.getQuotaStatus;
  subscriptionService.getQuotaStatus = async (userId) => {
    return {
      plan: 'premium',
      effectivePlan: 'premium',
      status: 'active',
      maxActiveListings: 5,
      activeListings: 2,
      canCreateListing: true,
      subscriptionEndsAt: new Date('2027-07-15T00:00:00Z'),
      listingDurationDays: 365
    };
  };

  const req = { session: { userId: 'mock-agent-id' } };
  const res = mockResponse();

  await subscriptionController.getSubscriptionStatus(req, res);

  console.log('Response status code:', res.statusCode);
  console.log('Quota details:');
  console.log('- effectivePlan:', res.jsonData?.data?.effectivePlan);
  console.log('- activeListings:', res.jsonData?.data?.activeListings);
  console.log('- maxActiveListings:', res.jsonData?.data?.maxActiveListings);
  console.log('- canCreateListing:', res.jsonData?.data?.canCreateListing);

  subscriptionService.getQuotaStatus = originalGetQuotaStatus;
}

// 3. Test getMe cleanup for non-agents
async function testGetMeCleanup() {
  console.log('\n--- 3. Testing authController.getMe subscription cleanup ---');

  const originalFindById = User.findById;

  // Mock User.findById for Buyer role
  User.findById = (id) => {
    return {
      lean: () => ({
        _id: 'mock-buyer-id',
        name: 'John Buyer',
        role: 'buyer',
        subscription: { plan: 'free' } // should be removed
      })
    };
  };

  const reqBuyer = { session: { userId: 'mock-buyer-id' } };
  const resBuyer = mockResponse();

  await authController.getMe(reqBuyer, resBuyer);
  console.log('Buyer response status code:', resBuyer.statusCode);
  console.log('Buyer details:');
  console.log('- role:', resBuyer.jsonData?.data?.role);
  console.log('- has subscription field:', resBuyer.jsonData?.data?.subscription !== undefined);

  // Mock User.findById for Agent role
  User.findById = (id) => {
    return {
      lean: () => ({
        _id: 'mock-agent-id',
        name: 'Sarah Agent',
        role: 'agent',
        subscription: { plan: 'premium' } // should be preserved
      })
    };
  };

  const reqAgent = { session: { userId: 'mock-agent-id' } };
  const resAgent = mockResponse();

  await authController.getMe(reqAgent, resAgent);
  console.log('Agent response status code:', resAgent.statusCode);
  console.log('Agent details:');
  console.log('- role:', resAgent.jsonData?.data?.role);
  console.log('- has subscription field:', resAgent.jsonData?.data?.subscription !== undefined);
  console.log('- plan type:', resAgent.jsonData?.data?.subscription?.plan);

  User.findById = originalFindById;
}

async function run() {
  testGetPlans();
  await testGetSubscriptionStatus();
  await testGetMeCleanup();
  console.log('\nRead API verification completed successfully!');
  process.exit(0);
}

run();
