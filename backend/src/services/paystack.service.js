const crypto = require('crypto');
const AppError = require('../utils/AppError');

/**
 * Initializes a new checkout transaction page with a subscription plan.
 * @param {string} email - Customer email
 * @param {number} amountInKobo - Price in Kobo (100 kobo = 1 unit)
 * @param {string} planCode - Plan code from Paystack PLN_...
 * @param {Object} metadata - Optional custom metadata fields
 * @param {string} callbackUrl - URL to redirect the agent to after payment completion
 * @returns {Promise<Object>} Paystack response data (authorization_url, access_code, reference)
 */
async function initializeTransaction(email, amountInKobo, planCode, metadata = {}, callbackUrl) {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) {
    throw new AppError('Paystack secret key is not configured.', 500);
  }

  const response = await fetch('https://api.paystack.co/transaction/initialize', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${secretKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email,
      amount: amountInKobo,
      plan: planCode,
      metadata,
      callback_url: callbackUrl
    })
  });

  const result = await response.json();
  if (!result.status) {
    throw new AppError(`Paystack initialization failed: ${result.message}`, 400);
  }

  return result.data;
}

/**
 * Verifies the status of a specific Paystack transaction.
 * @param {string} reference - Paystack transaction reference string
 * @returns {Promise<Object>} Verification details
 */
async function verifyTransaction(reference) {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) {
    throw new AppError('Paystack secret key is not configured.', 500);
  }

  const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${secretKey}`
    }
  });

  const result = await response.json();
  if (!result.status) {
    throw new AppError(`Paystack transaction verification failed: ${result.message}`, 400);
  }

  return result.data;
}

/**
 * Validates HMAC-SHA512 signatures sent by Paystack webhooks to prevent spoofing.
 * @param {string} bodyString - Plain stringified request body
 * @param {string} signature - x-paystack-signature header value
 * @returns {boolean} True if signature is valid
 */
function verifyWebhookSignature(bodyString, signature) {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) return false;

  const hash = crypto
    .createHmac('sha512', secretKey)
    .update(bodyString)
    .digest('hex');

  return hash === signature;
}

module.exports = {
  initializeTransaction,
  verifyTransaction,
  verifyWebhookSignature
};
