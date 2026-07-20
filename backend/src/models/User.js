const mongoose = require('mongoose');
const ROLES = require('../constants/roles');
const AGENT_STATUS = require('../constants/agentStatus');
const SUBSCRIPTION_PLANS = require('../constants/subscriptionPlans');
const SUBSCRIPTION_STATUS = require('../constants/subscriptionStatus');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 8,
      select: false, // excludes password from query results by default
    },
    role: {
      type: String,
      enum: Object.values(ROLES),
      default: ROLES.BUYER,
    },
    agentStatus: {
      type: String,
      enum: Object.values(AGENT_STATUS),
      default: AGENT_STATUS.APPROVED,
    },
    phone: {
      type: String,
      trim: true,
    },
    profileImage: {
      type: String,
      default: '',
    },
    subscription: {
      plan: {
        type: String,
        enum: Object.values(SUBSCRIPTION_PLANS),
        default: SUBSCRIPTION_PLANS.FREE,
      },
      status: {
        type: String,
        enum: Object.values(SUBSCRIPTION_STATUS),
        default: SUBSCRIPTION_STATUS.ACTIVE,
      },
      paystackCustomerCode: {
        type: String,
      },
      paystackSubscriptionCode: {
        type: String,
      },
      paystackEmail: {
        type: String,
      },
      currentPeriodStart: {
        type: Date,
        default: Date.now,
      },
      currentPeriodEnd: {
        type: Date,
        default: () => new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days free period
      },
      cancelAtPeriodEnd: {
        type: Boolean,
        default: false,
      },
    },
    // ---- Password Reset Fields ----
    // Token is stored as a SHA-256 hash for security.
    // The plain token is emailed to the user; we never store it raw.
    passwordResetToken: {
      type: String,
      select: false, // never returned in normal queries
    },
    passwordResetExpires: {
      type: Date,
      select: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);