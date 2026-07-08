const express = require('express');
const router = express.Router();
const { getProperties } = require('../controllers/property.controller');

router.get('/', getProperties);

module.exports = router;