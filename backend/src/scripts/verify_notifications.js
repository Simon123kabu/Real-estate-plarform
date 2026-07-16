require('dotenv').config();
const emailService = require('../services/email.service');
const expireSubscriptionsJob = require('../jobs/expireSubscriptions.job');
const mongoose = require('mongoose');
const connectDB = require('../config/database');
const User = require('../models/User');

console.log('--- Verification of Email Service & Subscription Expiry Jobs ---');

// 1. Test sending a live success email to user's inbox
async function testLiveEmails() {
  console.log('\n--- 1. Testing live HTML emails sending via Gmail SMTP ---');
  const recipient = process.env.EMAIL_USER;

  if (!recipient || recipient.startsWith('your_gmail_address')) {
    console.log('❌ Skipping live email test: EMAIL_USER is not set in .env.');
    return;
  }

  console.log(`Sending success, reminder, and expired test emails to: ${recipient}...`);

  // 1a. Test Success Activation Email
  const successResult = await emailService.sendSubscriptionSuccessEmail(
    recipient,
    'Simon Test Agent',
    'Premium',
    new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year from now
  );
  console.log('- Welcome/Success Email sent result:', successResult ? 'Success' : 'Failed');

  // 1b. Test 14-day Reminder Email
  const reminderResult = await emailService.sendExpiryReminderEmail(
    recipient,
    'Simon Test Agent',
    'Premium Plus',
    14,
    new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 14 days from now
  );
  console.log('- 14-day Renewal Reminder Email sent result:', reminderResult ? 'Success' : 'Failed');

  // 1c. Test Subscription Expired Email
  const expiredResult = await emailService.sendSubscriptionExpiredEmail(
    recipient,
    'Simon Test Agent'
  );
  console.log('- Subscription Expired Alert Email sent result:', expiredResult ? 'Success' : 'Failed');
}

// 2. Test checkAndExpireSubscriptions range filtering queries logic
async function testJobFilteringQueries() {
  console.log('\n--- 2. Testing Expiry Scheduler Query Logic ---');
  
  const originalFind = User.find;
  let queryFilters = [];

  User.find = async (query) => {
    queryFilters.push(query);
    return []; // Return empty to bypass updating anything in DB during dry-run test
  };

  await expireSubscriptionsJob.checkAndExpireSubscriptions();

  console.log(`Job performed ${queryFilters.length} DB query checks.`);
  
  // Verify 14-day check query structure
  const reminder14Query = queryFilters[0];
  console.log('Reminder query contains currentPeriodEnd check:', reminder14Query?.['subscription.currentPeriodEnd'] !== undefined);
  console.log('Reminder query filters for ACTIVE status:', reminder14Query?.['subscription.status'] === 'active');
  
  // Verify expiration check query structure
  const expiryQuery = queryFilters[2];
  console.log('Expiry query filters out EXPIRED status:', expiryQuery?.['subscription.status']?.$ne === 'expired');
  console.log('Expiry query target dates in the past (lte):', expiryQuery?.['subscription.currentPeriodEnd']?.$lte !== undefined);

  User.find = originalFind;
}

async function run() {
  try {
    await connectDB();
    await testLiveEmails();
    await testJobFilteringQueries();
    console.log('\nNotifications & Job verification completed successfully!');
  } catch (error) {
    console.error('❌ Verification script error:', error.message);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

run();
