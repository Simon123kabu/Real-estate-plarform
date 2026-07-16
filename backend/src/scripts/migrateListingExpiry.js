require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/database');
const User = require('../models/User');
const Property = require('../models/Property');
const SUBSCRIPTION_PLANS = require('../constants/subscriptionPlans');
const SUBSCRIPTION_STATUS = require('../constants/subscriptionStatus');
const LISTING_VISIBILITY = require('../constants/listingVisibility');

const migrate = async () => {
  try {
    await connectDB();
    console.log('Connected to database. Starting migration...');

    // 1. Backfill agent subscriptions
    const agents = await User.find({
      role: 'agent',
      $or: [
        { 'subscription': { $exists: false } },
        { 'subscription.currentPeriodEnd': { $exists: false } }
      ]
    });
    console.log(`Found ${agents.length} agent(s) needing subscription backfill.`);

    let agentUpdates = 0;
    for (const agent of agents) {
      // Force set subscription properties to ensure Mongoose saves them
      agent.subscription = {
        plan: SUBSCRIPTION_PLANS.FREE,
        status: SUBSCRIPTION_STATUS.ACTIVE,
        currentPeriodStart: agent.createdAt || new Date(),
        currentPeriodEnd: new Date((agent.createdAt || new Date()).getTime() + 90 * 24 * 60 * 60 * 1000), // 90 days from registration
        cancelAtPeriodEnd: false
      };
      await agent.save();
      agentUpdates++;
      console.log(`Updated subscription for agent: ${agent.email} (${agent._id})`);
    }
    console.log(`Successfully updated ${agentUpdates} agent subscription(s).`);

    // 2. Backfill property expiries and visibilities
    const properties = await Property.find();
    console.log(`Found ${properties.length} property listing(s) to verify.`);

    let propertyUpdates = 0;
    for (const property of properties) {
      let changed = false;

      if (!property.expiresAt) {
        const agent = await User.findById(property.agent);
        if (agent && agent.subscription && agent.subscription.currentPeriodEnd) {
          property.expiresAt = agent.subscription.currentPeriodEnd;
        } else {
          // Fallback: 90 days from property creation date
          property.expiresAt = new Date(property.createdAt.getTime() + 90 * 24 * 60 * 60 * 1000);
        }
        changed = true;
      }

      if (!property.visibility) {
        property.visibility = LISTING_VISIBILITY.ACTIVE;
        changed = true;
      }

      if (changed) {
        await property.save();
        propertyUpdates++;
        console.log(`Updated expiresAt/visibility for property: "${property.title}" (${property._id})`);
      }
    }
    console.log(`Successfully migrated ${propertyUpdates} property listing(s).`);
    console.log('Migration completed successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed.');
    process.exit();
  }
};

migrate();
