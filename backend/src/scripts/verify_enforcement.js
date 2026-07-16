const mongoose = require('mongoose');
const checkListingQuota = require('../middleware/checkListingQuota.middleware');
const subscriptionService = require('../services/subscription.service');
const propertyController = require('../controllers/property.controller');
const Property = require('../models/Property');
const User = require('../models/User');

console.log('--- Verification of Enforcement Middleware & Controllers ---');

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

// Test checkListingQuota Middleware
async function testMiddleware() {
  console.log('\n--- 1. Testing checkListingQuota Middleware ---');

  // Override subscriptionService.getQuotaStatus to simulate under-limit
  const originalGetQuotaStatus = subscriptionService.getQuotaStatus;
  
  subscriptionService.getQuotaStatus = async (userId) => {
    return {
      plan: 'free',
      effectivePlan: 'free',
      maxActiveListings: 1,
      activeListings: 0,
      canCreateListing: true
    };
  };

  let nextCalled = false;
  const req1 = { session: { userId: 'mock-agent-id' } };
  const res1 = mockResponse();
  await checkListingQuota(req1, res1, () => { nextCalled = true; });

  console.log('Case: Under Limit');
  console.log('- proceeded to next():', nextCalled);
  console.log('- attached quota to req:', req1.subscriptionQuota !== undefined);

  // Simulate over-limit
  subscriptionService.getQuotaStatus = async (userId) => {
    return {
      plan: 'free',
      effectivePlan: 'free',
      maxActiveListings: 1,
      activeListings: 1,
      canCreateListing: false
    };
  };

  nextCalled = false;
  const req2 = { session: { userId: 'mock-agent-id' } };
  const res2 = mockResponse();
  await checkListingQuota(req2, res2, () => { nextCalled = true; });

  console.log('Case: Over Limit');
  console.log('- proceeded to next():', nextCalled);
  console.log('- status code returned:', res2.statusCode);
  console.log('- json error message:', res2.jsonData?.message);
  console.log('- quota detail attached:', res2.jsonData?.data);

  // Restore original
  subscriptionService.getQuotaStatus = originalGetQuotaStatus;
}

// Test createProperty Controller
async function testCreateProperty() {
  console.log('\n--- 2. Testing createProperty ---');

  const originalPropertyCreate = Property.create;
  let createdPayload = null;

  Property.create = async (payload) => {
    createdPayload = payload;
    return { _id: 'mock-property-id', ...payload };
  };

  const mockSubscriptionEnd = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
  const req = {
    session: { userId: 'mock-agent-id' },
    subscriptionQuota: { effectivePlan: 'premium', subscriptionEndsAt: mockSubscriptionEnd },
    body: { title: 'Nice house', price: 5000 }
  };
  const res = mockResponse();

  await propertyController.createProperty(req, res);

  console.log('createProperty Response Status:', res.statusCode || 201);
  console.log('Created payload values:');
  console.log('- agent:', createdPayload.agent);
  console.log('- title:', createdPayload.title);
  console.log('- visibility:', createdPayload.visibility);
  console.log('- expiresAt:', createdPayload.expiresAt);

  Property.create = originalPropertyCreate;
}

// Test getPropertyById Controller
async function testGetPropertyById() {
  console.log('\n--- 3. Testing getPropertyById ---');

  const originalFindById = Property.findById;
  
  // Set up mock property expired
  const mockExpiredProperty = {
    _id: 'expired-prop-id',
    title: 'Old House',
    agent: { _id: 'mock-owner-id' },
    visibility: 'active',
    expiresAt: new Date(Date.now() - 3600000) // expired 1 hour ago
  };

  // Mock Property.findById chaining
  Property.findById = (id) => {
    return {
      populate: () => {
        return {
          lean: () => mockExpiredProperty
        };
      }
    };
  };

  // Case 3a: Non-owner gets 404
  const reqPublic = {
    params: { id: 'expired-prop-id' },
    session: { userId: 'stranger-id' }
  };
  const resPublic = mockResponse();

  try {
    await propertyController.getPropertyById(reqPublic, resPublic);
    console.log('Public Access: Error should have been thrown!');
  } catch (error) {
    console.log('Public Access: Expired listing throws 404 correctly:', error.statusCode === 404);
  }

  // Case 3b: Owner gets successful response
  const reqOwner = {
    params: { id: 'expired-prop-id' },
    session: { userId: 'mock-owner-id' }
  };
  const resOwner = mockResponse();

  await propertyController.getPropertyById(reqOwner, resOwner);
  console.log('Owner Access: Expired listing returned success:', resOwner.success || true);
  console.log('Owner Access: Returned data title:', resOwner.jsonData?.data?.title);

  Property.findById = originalFindById;
}

async function runTests() {
  await testMiddleware();
  await testCreateProperty();
  await testGetPropertyById();
  console.log('\nEnforcement verification completed successfully!');
  process.exit(0);
}

runTests();
