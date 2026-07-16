const mongoose = require('mongoose');
const User = require('../models/User');
const Property = require('../models/Property');
const SUBSCRIPTION_PLANS = require('../constants/subscriptionPlans');
const SUBSCRIPTION_STATUS = require('../constants/subscriptionStatus');
const LISTING_VISIBILITY = require('../constants/listingVisibility');

console.log('--- Loading Models & Constants Verification ---');
console.log('Subscription Plans:', SUBSCRIPTION_PLANS);
console.log('Subscription Status:', SUBSCRIPTION_STATUS);
console.log('Listing Visibility:', LISTING_VISIBILITY);

console.log('\n--- Checking User Schema Fields ---');
const userPaths = User.schema.paths;
console.log('subscription.plan path config:', userPaths['subscription.plan']?.options);
console.log('subscription.status path config:', userPaths['subscription.status']?.options);
console.log('subscription.paystackCustomerCode path config:', userPaths['subscription.paystackCustomerCode']?.options);
console.log('subscription.paystackSubscriptionCode path config:', userPaths['subscription.paystackSubscriptionCode']?.options);

console.log('\n--- Checking Property Schema Fields ---');
const propertyPaths = Property.schema.paths;
console.log('expiresAt path config:', propertyPaths['expiresAt']?.options);
console.log('visibility path config:', propertyPaths['visibility']?.options);
console.log('expiredAt path config:', propertyPaths['expiredAt']?.options);

console.log('\n--- Checking Property Indexes ---');
const indexes = Property.schema.indexes();
console.log('Property Indexes:', JSON.stringify(indexes, null, 2));

console.log('\nVerification completed successfully!');
process.exit(0);
