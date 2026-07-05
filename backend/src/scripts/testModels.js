require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/database');
const User = require('../models/User');
const Property = require('../models/Property');
const Favorite = require('../models/Favorite');

const run = async () => {
  try {
    await connectDB();

    // 1. Clean up any leftover test data from previous runs
    await User.deleteMany({ email: 'testagent@example.com' });
    await Property.deleteMany({ title: 'Test Property - Delete Me' });

    // 2. Create a test agent
    const agent = await User.create({
      name: 'Test Agent',
      email: 'testagent@example.com',
      password: 'password123',
      role: 'agent',
    });
    console.log('User created:', agent._id.toString());

    // 3. Create a test property linked to that agent
    const property = await Property.create({
      title: 'Test Property - Delete Me',
      description: 'A sample listing for verifying the schema.',
      price: 150000,
      listingType: 'sale',
      propertyType: 'apartment',
      address: '123 Test Street',
      city: 'Accra',
      region: 'Greater Accra',
      agent: agent._id,
    });
    console.log('Property created:', property._id.toString());

    // 4. Create a test favorite linking the agent (acting as a buyer here) to the property
    const favorite = await Favorite.create({
      user: agent._id,
      property: property._id,
    });
    console.log('Favorite created:', favorite._id.toString());

    // 5. Confirm the documents actually round-trip correctly with populate
    const check = await Favorite.findById(favorite._id)
      .populate('user', 'name email')
      .populate('property', 'title price');
    console.log('Populated favorite:', JSON.stringify(check, null, 2));

    console.log('\n✅ All models working correctly.');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
};

run();