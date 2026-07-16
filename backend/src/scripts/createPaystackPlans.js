require('dotenv').config();

const createPlan = async (name, amountInKobo, interval) => {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey || secretKey.startsWith('sk_test_your_secret_key')) {
    throw new Error('Please set a valid PAYSTACK_SECRET_KEY in your .env file before running this script.');
  }

  const response = await fetch('https://api.paystack.co/plan', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${secretKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name,
      amount: amountInKobo,
      interval
    })
  });

  const result = await response.json();
  if (!result.status) {
    throw new Error(`Failed to create plan "${name}": ${result.message}`);
  }

  return result.data;
};

const run = async () => {
  console.log('--- Creating Paystack Test Plans Programmatically ---');
  try {
    // 1. Create Premium Plan (e.g. 9,900 NGN annually)
    console.log('Creating Premium Plan...');
    const premiumPlan = await createPlan('Premium', 990000, 'annually');
    console.log(`✅ Created: "${premiumPlan.name}"`);
    console.log(`   Plan Code: ${premiumPlan.plan_code}`);

    // 2. Create Premium Plus Plan (e.g. 17,900 NGN annually)
    console.log('Creating Premium Plus Plan...');
    const premiumPlusPlan = await createPlan('Premium Plus', 1790000, 'annually');
    console.log(`✅ Created: "${premiumPlusPlan.name}"`);
    console.log(`   Plan Code: ${premiumPlusPlan.plan_code}`);

    console.log('\n🎉 Both plans created successfully!');
    console.log('Copy these values into your .env file:');
    console.log(`PAYSTACK_PLAN_PREMIUM=${premiumPlan.plan_code}`);
    console.log(`PAYSTACK_PLAN_PREMIUM_PLUS=${premiumPlusPlan.plan_code}`);
  } catch (error) {
    console.error('❌ Error creating plans:', error.message);
  }
};

run();
