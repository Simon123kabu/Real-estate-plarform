const User = require('../models/User');
const { hashPassword, comparePassword } = require('../utils/hashPassword');

// ============================================================
// REGISTER
// POST /api/auth/register
// ============================================================
/**
 * Step-by-step what this does:
 *
 * 1. Destructure name, email, password, role from the request body.
 * 2. Check if a user with that email already exists in MongoDB.
 *    - If yes → respond 409 Conflict (no duplicate accounts).
 * 3. Hash the plain-text password using bcrypt (12 rounds).
 *    - The plain password is NEVER stored anywhere.
 * 4. Create a new User document in the database with the hashed password.
 * 5. Respond 201 with the new user's public data (no password field).
 */
const register = async (req, res) => {
  try {
    const { name, email, password, role, phone } = req.body;

    // --- Step 2: duplicate email check ---
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists.',
      });
    }

    // --- Step 3: hash the password ---
    const hashed = await hashPassword(password);

    // --- Step 4: save user ---
    const user = await User.create({
      name,
      email,
      password: hashed,   // ← bcrypt hash, NOT the original string
      role: role || 'buyer',
      phone: phone || '',
    });

    // --- Step 5: respond (omit password) ---
    return res.status(201).json({
      success: true,
      message: 'Account created successfully. You can now log in.',
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================
// LOGIN
// POST /api/auth/login
// ============================================================
/**
 * Step-by-step what this does:
 *
 * 1. Destructure email and password from the request body.
 * 2. Find the user by email in MongoDB.
 *    - Note: password field has `select: false` in the schema,
 *      so we must add .select('+password') to retrieve it here.
 *    - If user not found → respond 401 (generic message, no hints).
 * 3. Compare the plain-text password with the stored hash using bcrypt.
 *    - bcrypt.compare() internally re-hashes the plain password
 *      using the salt embedded in the stored hash, then compares.
 *    - If they don't match → respond 401.
 * 4. Authentication passed → store minimal user info in the session.
 *    - req.session.userId  = the user's MongoDB _id
 *    - req.session.role    = the user's role ('buyer' or 'agent')
 *    - express-session will sign & send a cookie to the browser.
 * 5. Respond 200 with public user data.
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // --- Step 2: find user (include password field) ---
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      // Generic message: don't reveal whether the email exists
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    // --- Step 3: compare plain password with stored hash ---
    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    // --- Step 4: set session data ---
    req.session.userId = user._id.toString();
    req.session.role   = user.role;
    // express-session saves this to MongoDB (via connect-mongo) and
    // sends a signed session cookie back to the browser automatically.

    // --- Step 5: respond ---
    return res.status(200).json({
      success: true,
      message: 'Logged in successfully.',
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================
// LOGOUT
// POST /api/auth/logout
// ============================================================
/**
 * Destroys the server-side session and clears the cookie.
 *
 * After this call the user's session cookie is invalid —
 * any protected route will respond 401 until they log in again.
 */
const logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Logout failed.' });
    }
    res.clearCookie('connect.sid'); // default session cookie name
    return res.status(200).json({ success: true, message: 'Logged out successfully.' });
  });
};

// ============================================================
// ME  (who am I?)
// GET /api/auth/me
// ============================================================
/**
 * Returns the currently logged-in user's profile.
 * Protected by isAuthenticated middleware — req.session.userId
 * is guaranteed to exist if this controller runs.
 */
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    return res.status(200).json({ success: true, data: user });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { register, login, logout, getMe };
