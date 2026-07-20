const crypto       = require('crypto');
const User         = require('../models/User');
const AppError     = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { hashPassword, comparePassword } = require('../utils/hashPassword');
const { uploadToCloudinary, deleteFromCloudinary } = require('../utils/cloudinary');
const emailService = require('../services/email.service');
const ROLES        = require('../constants/roles');
const AGENT_STATUS = require('../constants/agentStatus');

// ============================================================
// REGISTER  —  POST /api/auth/register
// ============================================================
const register = asyncHandler(async (req, res) => {
  const { name, email, password, role, phone } = req.body;

  // Duplicate email check
  const existing = await User.findOne({ email });
  if (existing) throw new AppError('An account with this email already exists.', 409);

  const hashed = await hashPassword(password);

  const userRole = role || ROLES.BUYER;
  const agentStatus = AGENT_STATUS.APPROVED;

  const user = await User.create({
    name,
    email,
    password: hashed,
    role: userRole,
    agentStatus,
    phone: phone || '',
  });

  const responseData = {
    id:    user._id,
    name:  user.name,
    email: user.email,
    role:  user.role,
  };
  if (user.role === ROLES.AGENT) {
    responseData.agentStatus = user.agentStatus;
  }

  res.status(201).json({
    success: true,
    message: 'Account created successfully. You can now log in.',
    data: responseData,
  });
});

// ============================================================
// LOGIN  —  POST /api/auth/login
// ============================================================
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Include password field (excluded by default in schema)
  const user = await User.findOne({ email }).select('+password');
  if (!user) throw new AppError('Invalid email or password.', 401);

  const isMatch = await comparePassword(password, user.password);
  if (!isMatch) throw new AppError('Invalid email or password.', 401);

  // Store minimal data in session
  req.session.userId      = user._id.toString();
  req.session.role        = user.role;
  req.session.agentStatus = user.agentStatus || AGENT_STATUS.APPROVED;

  const responseData = {
    id:    user._id,
    name:  user.name,
    email: user.email,
    role:  user.role,
  };
  if (user.role === ROLES.AGENT) {
    responseData.agentStatus = user.agentStatus;
  }

  res.status(200).json({
    success: true,
    message: 'Logged in successfully.',
    data: responseData,
  });
});

// ============================================================
// LOGOUT  —  POST /api/auth/logout
// ============================================================
const logout = (req, res, next) => {
  req.session.destroy((err) => {
    if (err) return next(new AppError('Logout failed.', 500));
    res.clearCookie('connect.sid');
    res.status(200).json({ success: true, message: 'Logged out successfully.' });
  });
};

// ============================================================
// GET ME  —  GET /api/auth/me
// ============================================================
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.session.userId).lean();
  if (!user) throw new AppError('User not found.', 404);
  
  if (user.role !== ROLES.AGENT) {
    delete user.agentStatus;
    delete user.subscription;
  }
  
  res.status(200).json({ success: true, data: user });
});

// ============================================================
// UPLOAD PROFILE IMAGE  —  POST /api/auth/me/profile-image
// ============================================================
const uploadProfileImage = asyncHandler(async (req, res) => {
  const user = await User.findById(req.session.userId);
  if (!user) throw new AppError('User not found.', 404);

  if (!req.file) {
    throw new AppError('No image file provided.', 400);
  }

  // If user already has a profile picture, delete it from Cloudinary to clean up space
  if (user.profileImage) {
    await deleteFromCloudinary(user.profileImage);
  }

  // Upload the new image to Cloudinary (under 'profile_images' folder)
  const secureUrl = await uploadToCloudinary(req.file.buffer, 'profile_images');

  user.profileImage = secureUrl;
  await user.save();

  res.status(200).json({
    success: true,
    message: 'Profile image updated successfully.',
    data: {
      profileImage: user.profileImage,
    },
  });
});

// ============================================================
// UPDATE PROFILE  —  PATCH /api/auth/me
// ============================================================
const updateProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.session.userId);
  if (!user) throw new AppError('User not found.', 404);

  // Only allow name and phone to be updated here
  const { name, phone } = req.body;

  if (name !== undefined) user.name = name.trim();
  if (phone !== undefined) user.phone = phone.trim();

  await user.save();

  // Rebuild a clean response without password or reset fields
  const updated = user.toObject();
  delete updated.password;
  delete updated.passwordResetToken;
  delete updated.passwordResetExpires;

  if (updated.role !== ROLES.AGENT) {
    delete updated.agentStatus;
    delete updated.subscription;
  }

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully.',
    data: updated,
  });
});

// ============================================================
// FORGOT PASSWORD  —  POST /api/auth/forgot-password
// ============================================================
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  // Find user — always return the same generic message to prevent email enumeration
  const user = await User.findOne({ email });
  if (!user) {
    return res.status(200).json({
      success: true,
      message: 'If that email exists in our system, a reset link has been sent.',
    });
  }

  // Generate a cryptographically random 32-byte token (64 hex chars)
  const plainToken = crypto.randomBytes(32).toString('hex');

  // Store the SHA-256 hash on the user — never the plain token
  user.passwordResetToken   = crypto.createHash('sha256').update(plainToken).digest('hex');
  user.passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  await user.save();

  // Construct the reset URL: the frontend page that calls POST /api/auth/reset-password
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  const resetUrl  = `${clientUrl}/reset-password?token=${plainToken}`;

  // Send email (fire-and-forget — email service won't crash the request on failure)
  emailService.sendPasswordResetEmail(user.email, user.name, resetUrl);

  res.status(200).json({
    success: true,
    message: 'If that email exists in our system, a reset link has been sent.',
  });
});

// ============================================================
// RESET PASSWORD  —  POST /api/auth/reset-password
// ============================================================
const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;

  if (!token) throw new AppError('Reset token is required.', 400);

  // Hash the incoming plain token to compare against DB
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  // Find user where token matches AND has not expired
  const user = await User.findOne({
    passwordResetToken:   hashedToken,
    passwordResetExpires: { $gt: new Date() },
  }).select('+passwordResetToken +passwordResetExpires');

  if (!user) {
    throw new AppError('Reset token is invalid or has expired. Please request a new one.', 400);
  }

  // Apply new password
  user.password             = await hashPassword(password);
  user.passwordResetToken   = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  res.status(200).json({
    success: true,
    message: 'Password reset successfully. You can now log in with your new password.',
  });
});

module.exports = {
  register,
  login,
  logout,
  getMe,
  uploadProfileImage,
  updateProfile,
  forgotPassword,
  resetPassword,
};

