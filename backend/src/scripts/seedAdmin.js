require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/database');
const User = require('../models/User');
const ROLES = require('../constants/roles');
const AGENT_STATUS = require('../constants/agentStatus');
const { hashPassword } = require('../utils/hashPassword');

const run = async () => {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    console.error('❌ ADMIN_EMAIL and ADMIN_PASSWORD must be set in your .env file.');
    process.exit(1);
  }

  if (password.length < 8) {
    console.error('❌ ADMIN_PASSWORD must be at least 8 characters.');
    process.exit(1);
  }

  try {
    await connectDB();

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      if (existing.role === ROLES.ADMIN) {
        console.log(`ℹ️  Admin account already exists for ${email}. No changes made.`);
      } else {
        existing.role = ROLES.ADMIN;
        existing.agentStatus = AGENT_STATUS.APPROVED;
        existing.password = await hashPassword(password);
        await existing.save();
        console.log(`✅ Existing user promoted to admin: ${email}`);
      }
    } else {
      const hashed = await hashPassword(password);
      const admin = await User.create({
        name: 'Platform Admin',
        email: email.toLowerCase(),
        password: hashed,
        role: ROLES.ADMIN,
        agentStatus: AGENT_STATUS.APPROVED,
      });
      console.log(`✅ Admin account created: ${admin.email} (${admin._id})`);
    }
  } catch (error) {
    console.error('❌ Seed failed:', error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
    process.exit();
  }
};

run();
