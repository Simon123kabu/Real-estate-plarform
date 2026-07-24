const User         = require('../models/User');
const Property     = require('../models/Property');
const Favorite     = require('../models/Favorite');
const AppError     = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const ROLES        = require('../constants/roles');
const AGENT_STATUS = require('../constants/agentStatus');
const PROPERTY_STATUS = require('../constants/propertyStatus');
const LISTING_VISIBILITY = require('../constants/listingVisibility');

// ---------------------------------------------------------------------------
// GET /api/admin/stats — dashboard KPIs
// ---------------------------------------------------------------------------

const getStats = asyncHandler(async (req, res) => {
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [
    totalUsers,
    totalAgents,
    totalBuyers,
    totalAdmins,
    totalListings,
    availableListings,
    soldOrRentedListings,
    newUsersThisWeek,
    newListingsThisWeek,
    pendingAgents,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ role: ROLES.AGENT }),
    User.countDocuments({ role: ROLES.BUYER }),
    User.countDocuments({ role: ROLES.ADMIN }),
    Property.countDocuments(),
    Property.countDocuments({ status: PROPERTY_STATUS.AVAILABLE }),
    Property.countDocuments({
      status: { $in: [PROPERTY_STATUS.SOLD, PROPERTY_STATUS.RENTED] },
    }),
    User.countDocuments({ createdAt: { $gte: oneWeekAgo } }),
    Property.countDocuments({ createdAt: { $gte: oneWeekAgo } }),
    User.countDocuments({ role: ROLES.AGENT, agentStatus: AGENT_STATUS.PENDING }),
  ]);

  res.status(200).json({
    success: true,
    data: {
      totalUsers,
      totalAgents,
      totalBuyers,
      totalAdmins,
      totalListings,
      availableListings,
      soldOrRentedListings,
      newUsersThisWeek,
      newListingsThisWeek,
      pendingAgents,
    },
  });
});

// ---------------------------------------------------------------------------
// GET /api/admin/users — paginated user list
// ---------------------------------------------------------------------------

const getUsers = asyncHandler(async (req, res) => {
  const page  = Math.max(1, parseInt(req.query.page)  || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
  const skip  = (page - 1) * limit;

  const filter = {};
  if (req.query.role) filter.role = req.query.role;
  if (req.query.search && req.query.search.trim()) {
    const regex = { $regex: req.query.search.trim(), $options: 'i' };
    filter.$or = [{ name: regex }, { email: regex }];
  }

  const [users, total] = await Promise.all([
    User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    User.countDocuments(filter),
  ]);

  const formattedUsers = users.map((u) => {
    if (u.role !== ROLES.AGENT) {
      delete u.agentStatus;
    }
    return u;
  });

  res.status(200).json({
    success:     true,
    count:       users.length,
    total,
    totalPages:  Math.ceil(total / limit),
    currentPage: page,
    data:        formattedUsers,
  });
});

// ---------------------------------------------------------------------------
// GET /api/admin/users/:id — single user with listing count
// ---------------------------------------------------------------------------

const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('-password').lean();
  if (!user) throw new AppError('User not found.', 404);

  if (user.role !== ROLES.AGENT) {
    delete user.agentStatus;
  }

  const listingCount = await Property.countDocuments({ agent: user._id });

  res.status(200).json({
    success: true,
    data: { ...user, listingCount },
  });
});

// ---------------------------------------------------------------------------
// PATCH /api/admin/users/:id/role — change role (buyer/agent only)
// ---------------------------------------------------------------------------

const changeUserRole = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new AppError('User not found.', 404);

  if (user._id.toString() === req.session.userId) {
    throw new AppError('You cannot change your own role.', 403);
  }

  if (user.role === ROLES.ADMIN) {
    throw new AppError('Cannot change the role of an admin account.', 403);
  }

  const { role } = req.body;
  user.role = role;
  user.agentStatus = AGENT_STATUS.APPROVED;
  await user.save();

  const updated = user.toObject();
  delete updated.password;
  if (updated.role !== ROLES.AGENT) {
    delete updated.agentStatus;
  }

  res.status(200).json({
    success: true,
    message: `User role updated to ${role}.`,
    data: updated,
  });
});

// ---------------------------------------------------------------------------
// DELETE /api/admin/users/:id — remove user and cascade related data
// ---------------------------------------------------------------------------

const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new AppError('User not found.', 404);

  if (user._id.toString() === req.session.userId) {
    throw new AppError('You cannot delete your own account.', 403);
  }

  if (user.role === ROLES.ADMIN) {
    throw new AppError('Cannot delete an admin account.', 403);
  }

  const userProperties = await Property.find({ agent: user._id }).select('_id');
  const propertyIds = userProperties.map((p) => p._id);

  await Promise.all([
    Property.deleteMany({ agent: user._id }),
    Favorite.deleteMany({
      $or: [{ user: user._id }, { property: { $in: propertyIds } }],
    }),
  ]);

  await user.deleteOne();

  res.status(200).json({
    success: true,
    message: 'User and associated data deleted successfully.',
  });
});

// ---------------------------------------------------------------------------
// GET /api/admin/agents/pending — agents awaiting approval
// ---------------------------------------------------------------------------

const getPendingAgents = asyncHandler(async (req, res) => {
  const page  = Math.max(1, parseInt(req.query.page)  || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
  const skip  = (page - 1) * limit;

  const filter = { role: ROLES.AGENT, agentStatus: AGENT_STATUS.PENDING };

  const [agents, total] = await Promise.all([
    User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    User.countDocuments(filter),
  ]);

  res.status(200).json({
    success:     true,
    count:       agents.length,
    total,
    totalPages:  Math.ceil(total / limit),
    currentPage: page,
    data:        agents,
  });
});

// ---------------------------------------------------------------------------
// PATCH /api/admin/users/:id/approve — approve pending agent
// ---------------------------------------------------------------------------

const approveAgent = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new AppError('User not found.', 404);

  if (user.role !== ROLES.AGENT) {
    throw new AppError('Only users with the agent role can be approved or unblocked.', 400);
  }

  user.agentStatus = AGENT_STATUS.APPROVED;
  await user.save();

  const updated = user.toObject();
  delete updated.password;

  res.status(200).json({
    success: true,
    message: 'Agent approved/unblocked successfully.',
    data: updated,
  });
});

// ---------------------------------------------------------------------------
// PATCH /api/admin/users/:id/reject — reject pending agent
// ---------------------------------------------------------------------------

const rejectAgent = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new AppError('User not found.', 404);

  if (user.role !== ROLES.AGENT) {
    throw new AppError('Only users with the agent role can be rejected or blocked.', 400);
  }

  user.agentStatus = AGENT_STATUS.REJECTED;
  await user.save();

  const updated = user.toObject();
  delete updated.password;

  res.status(200).json({
    success: true,
    message: 'Agent blocked/rejected successfully.',
    data: updated,
  });
});

// ---------------------------------------------------------------------------
// GET /api/admin/properties — all listings (paginated, filterable)
// ---------------------------------------------------------------------------

const getProperties = asyncHandler(async (req, res) => {
  const page  = Math.max(1, parseInt(req.query.page)  || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
  const skip  = (page - 1) * limit;

  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.city) {
    filter.city = { $regex: req.query.city, $options: 'i' };
  }
  if (req.query.agentId) filter.agent = req.query.agentId;

  const [properties, total] = await Promise.all([
    Property.find(filter)
      .populate('agent', 'name email phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Property.countDocuments(filter),
  ]);

  res.status(200).json({
    success:     true,
    count:       properties.length,
    total,
    totalPages:  Math.ceil(total / limit),
    currentPage: page,
    data:        properties,
  });
});

// ---------------------------------------------------------------------------
// GET /api/admin/properties/:id — single listing
// ---------------------------------------------------------------------------

const getPropertyById = asyncHandler(async (req, res) => {
  const property = await Property.findById(req.params.id)
    .populate('agent', 'name email phone profileImage')
    .lean();
  if (!property) throw new AppError('Property not found.', 404);

  res.status(200).json({ success: true, data: property });
});

// ---------------------------------------------------------------------------
// PATCH /api/admin/properties/:id/status — override listing status
// ---------------------------------------------------------------------------

const updatePropertyStatus = asyncHandler(async (req, res) => {
  const property = await Property.findById(req.params.id);
  if (!property) throw new AppError('Property not found.', 404);

  property.status = req.body.status;
  await property.save();

  const updated = await Property.findById(property._id)
    .populate('agent', 'name email phone')
    .lean();

  res.status(200).json({ success: true, data: updated });
});

// ---------------------------------------------------------------------------
// DELETE /api/admin/properties/:id — remove listing
// ---------------------------------------------------------------------------

const deleteProperty = asyncHandler(async (req, res) => {
  const property = await Property.findById(req.params.id);
  if (!property) throw new AppError('Property not found.', 404);

  await property.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Property deleted successfully.',
  });
});

module.exports = {
  getStats,
  getUsers,
  getUserById,
  changeUserRole,
  deleteUser,
  getPendingAgents,
  approveAgent,
  rejectAgent,
  getProperties,
  getPropertyById,
  updatePropertyStatus,
  deleteProperty,
};

// ---------------------------------------------------------------------------
// GET /api/admin/subscriptions — list agent subscriptions
// ---------------------------------------------------------------------------

const getSubscriptions = asyncHandler(async (req, res) => {
  const page  = Math.max(1, parseInt(req.query.page)  || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
  const skip  = (page - 1) * limit;

  const filter = { role: ROLES.AGENT };
  if (req.query.plan) filter['subscription.plan'] = req.query.plan;
  if (req.query.status) filter['subscription.status'] = req.query.status;
  if (req.query.search && req.query.search.trim()) {
    const regex = { $regex: req.query.search.trim(), $options: 'i' };
    filter.$or = [{ name: regex }, { email: regex }];
  }

  const [agents, total] = await Promise.all([
    User.find(filter)
      .select('name email phone subscription createdAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    User.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    data: {
      subscriptions: agents,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    }
  });
});

// ---------------------------------------------------------------------------
// POST /api/admin/subscriptions/override — manual override
// ---------------------------------------------------------------------------

const overrideSubscription = asyncHandler(async (req, res) => {
  const { userId, planSlug, status, currentPeriodEnd } = req.body || {};
  if (!userId || !planSlug) {
    throw new AppError('userId and planSlug are required.', 400);
  }

  const user = await User.findById(userId);
  if (!user || user.role !== ROLES.AGENT) {
    throw new AppError('Agent user not found.', 404);
  }

  const targetStatus = status || 'active';
  const targetEnd = currentPeriodEnd
    ? new Date(currentPeriodEnd)
    : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // default to 1 year

  user.subscription = {
    plan: planSlug,
    status: targetStatus,
    currentPeriodStart: new Date(),
    currentPeriodEnd: targetEnd,
    cancelAtPeriodEnd: false
  };

  await user.save();

  // Align property listing lifetimes
  await Property.updateMany(
    { agent: user._id, visibility: LISTING_VISIBILITY.ACTIVE },
    { $set: { expiresAt: targetEnd } }
  );

  res.status(200).json({
    success: true,
    message: `Subscription overridden successfully for agent ${user.email}.`,
    data: user.subscription
  });
});

module.exports = {
  getStats,
  getUsers,
  getUserById,
  changeUserRole,
  deleteUser,
  getPendingAgents,
  approveAgent,
  rejectAgent,
  getProperties,
  getPropertyById,
  updatePropertyStatus,
  deleteProperty,
  getSubscriptions,
  overrideSubscription
};
