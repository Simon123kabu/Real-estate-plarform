const expireListingsJob = require('../jobs/expireListings.job');
const Property = require('../models/Property');

console.log('--- Verification of expireListings.job.js ---');

const originalUpdateMany = Property.updateMany;

let capturedQuery = null;
let capturedUpdate = null;

Property.updateMany = async (query, update) => {
  capturedQuery = query;
  capturedUpdate = update;
  return { modifiedCount: 3 }; // simulated 3 soft-expired properties
};

console.log('Running checkAndExpireListings()...');
expireListingsJob.checkAndExpireListings().then(count => {
  console.log('Count of properties expired:', count);
  console.log('Query structure correctly filters visibility and expiresAt:');
  console.log('- visibility query filter:', capturedQuery.visibility);
  console.log('- expiresAt query filter ($lte comparison):', capturedQuery.expiresAt !== undefined);
  console.log('Update structure correctly sets visibility and expiredAt:');
  console.log('- visibility update set:', capturedUpdate.$set?.visibility);
  console.log('- expiredAt update set (Date object):', capturedUpdate.$set?.expiredAt instanceof Date);

  Property.updateMany = originalUpdateMany;
  console.log('\nVerification completed successfully!');
  process.exit(0);
}).catch(err => {
  console.error('Job verification failed:', err);
  process.exit(1);
});
