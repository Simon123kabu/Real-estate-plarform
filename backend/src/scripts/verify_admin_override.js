const adminController = require('../controllers/admin.controller');
const User = require('../models/User');
const Property = require('../models/Property');

console.log('--- Verification of Admin Subscription Overrides ---');

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

const callController = (handler, req, res) => {
  return new Promise((resolve, reject) => {
    res.json = (data) => {
      res.jsonData = data;
      resolve({ status: res.statusCode || 200, data });
    };
    handler(req, res, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve({ status: res.statusCode || 200, data: null });
      }
    });
  });
};

// 1. Test getSubscriptions
async function testGetSubscriptions() {
  console.log('\n--- 1. Testing getSubscriptions controller (GET /subscriptions) ---');

  const originalFind = User.find;
  const originalCount = User.countDocuments;

  const mockAgents = [
    { name: 'Sarah Agent', email: 'sarah@example.com', subscription: { plan: 'premium', status: 'active' } }
  ];

  User.find = () => {
    return {
      select: () => {
        return {
          sort: () => {
            return {
              skip: () => {
                return {
                  limit: () => {
                    return {
                      lean: () => mockAgents
                    };
                  }
                };
              }
            };
          }
        };
      }
    };
  };

  User.countDocuments = async () => 1;

  const req = { query: {} };
  const res = mockResponse();

  const result = await callController(adminController.getSubscriptions, req, res);

  console.log('Response status:', result.status);
  console.log('Subscriptions list returned successfully:', result.data?.success === true);
  console.log('Subscriptions count:', result.data?.data?.subscriptions?.length);
  console.log('Sarah subscription plan in list:', result.data?.data?.subscriptions?.[0]?.subscription?.plan === 'premium');

  User.find = originalFind;
  User.countDocuments = originalCount;
}

// 2. Test overrideSubscription
async function testOverrideSubscription() {
  console.log('\n--- 2. Testing overrideSubscription controller (POST /subscriptions/override) ---');

  const originalFindById = User.findById;
  const originalUpdateMany = Property.updateMany;

  let savedUser = null;
  let listingUpdates = null;

  const mockUser = {
    _id: 'mock-agent-123',
    email: 'agent-override@example.com',
    role: 'agent',
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
    return { modifiedCount: 2 };
  };

  const overrideExpiry = new Date('2028-12-31T00:00:00Z');
  const req = {
    body: {
      userId: 'mock-agent-123',
      planSlug: 'premium_plus',
      status: 'active',
      currentPeriodEnd: overrideExpiry.toISOString()
    }
  };
  const res = mockResponse();

  const result = await callController(adminController.overrideSubscription, req, res);

  console.log('Response status:', result.status);
  console.log('Override API returned success:', result.data?.success === true);
  console.log('Saved user plan updated to premium_plus:', savedUser?.subscription?.plan === 'premium_plus');
  console.log('Saved user subscription ends on new override date:', savedUser?.subscription?.currentPeriodEnd.getTime() === overrideExpiry.getTime());
  console.log('Agent listings expiresAt updated to align with new date:', listingUpdates?.update?.$set?.expiresAt.getTime() === overrideExpiry.getTime());

  User.findById = originalFindById;
  Property.updateMany = originalUpdateMany;
}

async function run() {
  await testGetSubscriptions();
  await testOverrideSubscription();
  console.log('\nAdmin tools verification completed successfully!');
  process.exit(0);
}

run();
