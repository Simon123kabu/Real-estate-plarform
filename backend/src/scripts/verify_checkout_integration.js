require('dotenv').config();
const paystackService = require('../services/paystack.service');

const run = async () => {
  console.log('--- Verifying Paystack Checkout API Integration ---');
  
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  const premiumPlan = process.env.PAYSTACK_PLAN_PREMIUM;
  const premiumPlusPlan = process.env.PAYSTACK_PLAN_PREMIUM_PLUS;

  console.log(`Secret Key Loaded: ${secretKey ? 'Yes (starts with ' + secretKey.substring(0, 8) + '...)' : 'No'}`);
  console.log(`Premium Plan Code: ${premiumPlan}`);
  console.log(`Premium Plus Plan Code: ${premiumPlusPlan}`);

  if (!secretKey || secretKey.startsWith('sk_test_your_secret_key')) {
    console.error('❌ Please set a valid PAYSTACK_SECRET_KEY in your .env file.');
    process.exit(1);
  }

  // 1. Initialize checkout transaction for Premium
  try {
    console.log('\nInitializing Premium Plan checkout session...');
    const result = await paystackService.initializeTransaction(
      'alex@example.com',
      990000, // 9,900 NGN
      premiumPlan,
      { userId: 'mock-agent-id', planCode: premiumPlan },
      'http://localhost:5173/subscription/callback'
    );

    console.log('✅ Success! Paystack responded with checkout details:');
    console.log(`- Reference: ${result.reference}`);
    console.log(`- Checkout URL: ${result.authorization_url}`);
    
    if (result.authorization_url && result.authorization_url.startsWith('https://checkout.paystack.com')) {
      console.log('🎉 URL is a valid Paystack checkout domain!');
    }
  } catch (error) {
    console.error('❌ Failed to initialize Premium Checkout:', error.message);
  }

  // 2. Initialize checkout transaction for Premium Plus
  try {
    console.log('\nInitializing Premium Plus Plan checkout session...');
    const result = await paystackService.initializeTransaction(
      'alex@example.com',
      1790000, // 17,900 NGN
      premiumPlusPlan,
      { userId: 'mock-agent-id', planCode: premiumPlusPlan },
      'http://localhost:5173/subscription/callback'
    );

    console.log('✅ Success! Paystack responded with checkout details:');
    console.log(`- Reference: ${result.reference}`);
    console.log(`- Checkout URL: ${result.authorization_url}`);
    
    if (result.authorization_url && result.authorization_url.startsWith('https://checkout.paystack.com')) {
      console.log('🎉 URL is a valid Paystack checkout domain!');
    }
  } catch (error) {
    console.error('❌ Failed to initialize Premium Plus Checkout:', error.message);
  }
};

run();
