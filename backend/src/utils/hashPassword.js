const bcrypt = require('bcryptjs');

// How many "rounds" bcrypt will run its hashing algorithm.
// 12 rounds means bcrypt will hash 2^12 = 4096 times internally.
// Higher = slower to crack, but also slightly slower for the server.
// 12 is the production sweet-spot (login ~300ms, completely safe).
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
