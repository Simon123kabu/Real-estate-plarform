const User         = require('../models/User');
const AppError     = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { hashPassword, comparePassword } = require('../utils/hashPassword');
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

module.exports = { register, login, logout, getMe };
