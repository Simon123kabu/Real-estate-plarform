const Property = require('../models/Property');
const User = require('../models/User'); // registers the User schema so populate('agent') works

const getProperties = async (req, res) => {
  try {
    const properties = await Property.find().populate('agent', 'name email phone');
    res.status(200).json({
      success: true,
      count: properties.length,
      data: properties,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = { getProperties };