const cron = require('node-cron');
const Property = require('../models/Property');
const LISTING_VISIBILITY = require('../constants/listingVisibility');

/**
 * Perform soft expiration updates for expired listings.
 * @returns {Promise<number>} Number of modified documents
 */
const checkAndExpireListings = async () => {
  const now = new Date();
  try {
    const result = await Property.updateMany(
      {
        visibility: LISTING_VISIBILITY.ACTIVE,
        expiresAt: { $lte: now }
      },
      {
        $set: {
          visibility: LISTING_VISIBILITY.EXPIRED,
          expiredAt: now
        }
      }
    );
    console.log(`[Job: Listing Expiration] Successfully soft-expired ${result.modifiedCount} listing(s).`);
    return result.modifiedCount;
  } catch (error) {
    console.error('[Job: Listing Expiration] Error running expiration update query:', error.message);
    throw error;
  }
};

const start = () => {
  cron.schedule('0 0 * * *', async () => {
    console.log('[Job: Listing Expiration] Executing scheduled daily check...');
    await checkAndExpireListings();
  });
  console.log('[Job: Listing Expiration] Scheduled daily listing expiration task at 00:00.');
};

module.exports = {
  checkAndExpireListings,
  start
};
