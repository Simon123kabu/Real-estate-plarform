const bcrypt = require('bcryptjs');

const SALT_ROUNDS = 12;

/**
 * Hash a plain-text password.
 * Called during REGISTER — we NEVER store the plain password.
 *
 * @param {string} plainPassword  - The raw password from the request body
 * @returns {Promise<string>}     - The bcrypt hash (e.g. "$2a$12$...")
 */
const hashPassword = async (plainPassword) => {
  return bcrypt.hash(plainPassword, SALT_ROUNDS);
};

/**
 * Compare a plain-text password against a stored bcrypt hash.
 * Called during LOGIN — bcrypt rehashes the plain password with the
 * same salt embedded in the stored hash, then compares bit-by-bit.
 *
 * @param {string} plainPassword   - The raw password typed by the user at login
 * @param {string} hashedPassword  - The hash stored in the database
 * @returns {Promise<boolean>}     - true if they match, false otherwise
 */
const comparePassword = async (plainPassword, hashedPassword) => {
  return bcrypt.compare(plainPassword, hashedPassword);
};

module.exports = { hashPassword, comparePassword };
