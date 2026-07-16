require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/database');
const User = require('../models/User');

const inspect = async () => {
  await connectDB();
  const users = await User.find().lean();
  console.log('All Users in DB:');
  users.forEach(u => {
    console.log(`- Name: ${u.name}, Role: ${u.role}, Subscription:`, u.subscription);
  });
  await mongoose.connection.close();
};

inspect();
