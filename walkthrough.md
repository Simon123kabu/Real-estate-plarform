# Security Hardening — Walkthrough

## Packages Installed
```
npm install express-rate-limit express-mongo-sanitize
```
3 packages added, **0 vulnerabilities** found in 169 packages.

---

## Files Changed

| File | What Changed |
|---|---|
| [rateLimiter.middleware.js](file:///c:/Users/Flexow/Desktop/Intern%20Project/Real-estate-plarform/backend/src/middleware/rateLimiter.middleware.js) | 🆕 Two-tier rate limiter |
| [app.js](file:///c:/Users/Flexow/Desktop/Intern%20Project/Real-estate-plarform/backend/src/app.js) | ✏️ 6 security fixes applied |
| [upload.middleware.js](file:///c:/Users/Flexow/Desktop/Intern%20Project/Real-estate-plarform/backend/src/middleware/upload.middleware.js) | ✏️ Multer errors now AppError |
| [auth.validator.js](file:///c:/Users/Flexow/Desktop/Intern%20Project/Real-estate-plarform/backend/src/validators/auth.validator.js) | ✏️ Password min raised to 8 |
| [.env](file:///c:/Users/Flexow/Desktop/Intern%20Project/Real-estate-plarform/backend/.env) | ✏️ Removed dead JWT_SECRET, added NODE_ENV + CLIENT_URL |
| [.env.example](file:///c:/Users/Flexow/Desktop/Intern%20Project/Real-estate-plarform/backend/.env.example) | ✏️ Fully rewritten — all variables documented |

---

## Fix-by-Fix Breakdown

### 1. Rate Limiting ✅
```
Auth routes   →  10 requests / 15 min / IP
All API       →  100 requests / 15 min / IP
```
After 10 failed login attempts, the attacker gets:
```json
{ "success": false, "message": "Too many attempts from this IP. Please try again after 15 minutes." }
```
Response headers also include `RateLimit-Remaining` and `RateLimit-Reset` for clients to respect.

---

### 2. Body Size Limits ✅
```js
// Before
app.use(express.json());

// After
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '50kb' }));
```
A 500MB JSON payload now gets rejected immediately — never touches memory or a controller.

---

### 3. NoSQL Injection Sanitization ✅
```js
app.use(mongoSanitize());
```
This middleware strips `$` and `.` from `req.body`, `req.query`, and `req.params` before any route handler runs. The attack payload `{ "email": { "$gt": "" } }` becomes `{ "email": {} }` — harmless.

---

### 4. CSRF Protection via `sameSite: 'lax'` ✅
```js
// Before
cookie: { httpOnly: true, secure: ..., maxAge: ... }

// After
cookie: { httpOnly: true, secure: ..., sameSite: 'lax', maxAge: ... }
```
`lax` means: the session cookie is **not sent** on cross-site POST, PUT, PATCH, DELETE requests. A malicious page on `evil.com` can no longer trigger state changes using the victim's cookie.

---

### 5. Session Persistence (connect-mongo) ✅
```js
// Before — RAM only, lost on restart
// (no store configured)

// After — persisted to MongoDB
store: MongoStore.create({
  mongoUrl:       process.env.MONGO_URI,
  collectionName: 'sessions',
  ttl:            86400,        // auto-expire after 24h
  autoRemove:     'native',
})
```
Sessions now survive server restarts. Logged-in users stay logged in. Sessions are stored in a `sessions` collection in your MongoDB database and automatically cleaned up when they expire.

---

### 6. Environment-aware Logging ✅
```js
// Before
app.use(morgan('dev'));

// After
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
```
Locally you still get the coloured dev format. In production you get Apache `combined` format which is what log aggregators (Datadog, Papertrail, etc.) expect.

---

### 7. Multer Errors → AppError ✅
All Multer errors (wrong file type, file too large, too many files) now go through `wrapMulter()` and arrive at the global error handler as proper `AppError` instances:

```json
// Wrong file type
{ "success": false, "message": "Invalid file type. Only JPEG, PNG, and WebP images are allowed." }

// File too large
{ "success": false, "message": "File too large. Maximum size is 5MB." }
```

---

### 8. Password Minimum Raised to 8 ✅
```js
// Before
body('password').isLength({ min: 6 })

// After
body('password').isLength({ min: 8 })
```

---

### 9 & 10. `.env` + `.env.example` Cleaned Up ✅
- Removed dead `JWT_SECRET` (project uses sessions, not JWT)
- Added `NODE_ENV=development` and `CLIENT_URL`
- `.env.example` now documents all 8 variables with comments explaining where to get each one

---

## Final Security Score

| Category | Before | After |
|---|---|---|
| Brute force protection | ❌ None | ✅ 10/15min on auth |
| API abuse prevention | ❌ None | ✅ 100/15min general |
| NoSQL injection | ❌ Vulnerable | ✅ Sanitized |
| CSRF | ⚠️ No sameSite | ✅ sameSite: lax |
| Body DoS | ❌ Unlimited | ✅ 10kb JSON limit |
| Session persistence | ⚠️ RAM only | ✅ MongoDB backed |
| Upload error format | ⚠️ Raw 500 | ✅ Clean AppError |
| Password strength | ⚠️ 6 chars | ✅ 8 chars |
| Production logging | ⚠️ dev format always | ✅ Environment-aware |
| Env documentation | ⚠️ Stale/incomplete | ✅ Complete |
| Security headers | ✅ helmet() | ✅ Unchanged |
| Password hashing | ✅ bcrypt 12 rounds | ✅ Unchanged |
| Cookie httpOnly | ✅ | ✅ Unchanged |
| Ownership checks | ✅ | ✅ Unchanged |
