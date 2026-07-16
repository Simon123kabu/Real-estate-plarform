require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/database');
const User = require('../models/User');

const debug = async () => {
  await connectDB();
  const agents = await User.find({ role: 'agent' });
  console.log(`Found ${agents.length} agents.`);
  for (const agent of agents) {
    console.log(`Email: ${agent.email}`);
    console.log('subscription object in doc:', agent.subscription);
    console.log('subscription.currentPeriodEnd:', agent.subscription?.currentPeriodEnd);
    console.log('!agent.subscription:', !agent.subscription);
    console.log('!agent.subscription.currentPeriodEnd:', !agent.subscription?.currentPeriodEnd);
  }
  await mongoose.connection.close();
};

debug();
