const express = require('express');
const router  = express.Router();

const {
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
  overrideSubscription,
} = require('../controllers/admin.controller');

const {
  userListQueryRules,
  propertyListQueryRules,
  roleChangeRules,
  statusUpdateRules,
  handleValidationErrors,
} = require('../validators/admin.validator');

const validateObjectId = require('../middleware/validateObjectId.middleware');

// GET /api/admin/stats
router.get('/stats', getStats);

// GET /api/admin/agents/pending — must be before /users/:id
router.get('/agents/pending', userListQueryRules, handleValidationErrors, getPendingAgents);

// GET /api/admin/users
router.get('/users', userListQueryRules, handleValidationErrors, getUsers);

// GET /api/admin/users/:id
router.get('/users/:id', ...validateObjectId('id'), getUserById);

// PATCH /api/admin/users/:id/role
router.patch(
  '/users/:id/role',
  ...validateObjectId('id'),
  roleChangeRules,
  handleValidationErrors,
  changeUserRole
);

// PATCH /api/admin/users/:id/approve
router.patch('/users/:id/approve', ...validateObjectId('id'), approveAgent);

// PATCH /api/admin/users/:id/reject
router.patch('/users/:id/reject', ...validateObjectId('id'), rejectAgent);

// DELETE /api/admin/users/:id
router.delete('/users/:id', ...validateObjectId('id'), deleteUser);

// GET /api/admin/properties
router.get('/properties', propertyListQueryRules, handleValidationErrors, getProperties);

// GET /api/admin/properties/:id
router.get('/properties/:id', ...validateObjectId('id'), getPropertyById);

// PATCH /api/admin/properties/:id/status
router.patch(
  '/properties/:id/status',
  ...validateObjectId('id'),
  statusUpdateRules,
  handleValidationErrors,
  updatePropertyStatus
);

// DELETE /api/admin/properties/:id
router.delete('/properties/:id', ...validateObjectId('id'), deleteProperty);

// GET /api/admin/subscriptions
router.get('/subscriptions', userListQueryRules, handleValidationErrors, getSubscriptions);

// POST /api/admin/subscriptions/override
router.post('/subscriptions/override', overrideSubscription);

module.exports = router;
