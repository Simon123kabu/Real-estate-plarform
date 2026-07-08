# Backend Development Guide — Real Estate Platform

This document describes how backend work is done on this project: the structure, the conventions, the step-by-step workflow for adding new features, and the lessons learned so far. Use it as a reference whenever picking backend work back up — for yourself, or for anyone else joining the project later.

---

## 1. Overview

A Node.js / Express REST API backend for a real estate listing platform. It handles property listings, agents, buyers, and (planned) favorites and authentication. MongoDB Atlas is the database, accessed through Mongoose. The frontend is a separate React application that consumes this API over HTTP.

## 2. Tech Stack

| Layer | Choice |
|---|---|
| Runtime | Node.js |
| Framework | Express |
| Database | MongoDB Atlas |
| ODM | Mongoose |
| Password hashing (planned) | bcryptjs |
| Auth tokens (planned) | jsonwebtoken (JWT) |
| File uploads (planned) | Multer |
| Input validation (planned) | express-validator |
| Dev tooling | nodemon |

## 3. Project Structure

```
backend/
├── src/
│   ├── config/
│   │   └── database.js          # MongoDB connection logic only — no business logic
│   ├── constants/
│   │   ├── roles.js
│   │   ├── listingTypes.js
│   │   ├── propertyStatus.js
│   │   └── propertyTypes.js
│   ├── controllers/
│   │   └── property.controller.js
│   ├── middleware/               # planned: auth middleware (Phase 9)
│   ├── models/
│   │   ├── User.js
│   │   ├── Property.js
│   │   └── Favorite.js
│   ├── routes/
│   │   └── property.routes.js
│   ├── scripts/
│   │   └── testModels.js         # manual verification script, never auto-run
│   ├── services/                 # planned
│   ├── utils/                    # planned
│   ├── validators/               # planned
│   ├── app.js                    # Express app, middleware, routes, error handling
│   └── server.js                 # boots the app: env, DB connection, listen
├── uploads/
│   ├── properties/
│   └── profiles/
├── .env                          # real values — never committed
├── .env.example                  # same keys, blank values — committed
├── .gitignore
└── package.json
```

## 4. Environment Setup

**Required `.env` keys:**

| Key | Purpose |
|---|---|
| `PORT` | Port the Express server listens on |
| `MONGO_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` | Signing secret for JWTs (used from Phase 9 onward) |

**To run locally:**

```bash
npm install
npm run dev
```

You should see `MongoDB connected: ...` followed by `Server running on port ...`. If you don't see both lines, something in the startup chain didn't complete — see the Troubleshooting section.

**Things that have tripped this up before, worth double-checking:**
- The Atlas connection string template uses `<password>` — both angle brackets must be deleted, not just the placeholder text inside them.
- If the real password contains special characters (`@ : / ? #`), they must be URL-encoded (`@` → `%40`, etc.) or the URI parser breaks.
- `server.js` must actually **call** `startServer()` at the bottom of the file — defining the function isn't enough.

## 5. Architecture Conventions

**Layering** — each file type has exactly one job:
- **`models/`** — schema shape, validation rules, and relationships only. No business logic.
- **`controllers/`** — the actual logic: query the database, shape the response, handle errors.
- **`routes/`** — map an HTTP verb + path to a controller function. No logic beyond that mapping.
- **`config/`** — infrastructure setup (currently just the DB connection). Nothing app-specific.
- **`constants/`** — fixed string values (roles, property types, statuses, listing types) imported everywhere instead of hardcoded strings, so there's one source of truth and no typos across files.

**Response shape convention** — every endpoint responds in one of these two shapes, so the frontend can rely on a consistent contract:

Success:
```json
{ "success": true, "count": 4, "data": [ /* ... */ ] }
```

Failure:
```json
{ "success": false, "message": "Description of what went wrong" }
```

**`app.js` ordering matters** — the 404 handler and the global error handler must be the *last* two `app.use()` calls, in that order. Express matches middleware top to bottom; anything registered after a catch-all never runs.

## 6. Workflow: Adding a New Backend Feature

This is the exact sequence used to build the properties endpoint, and the pattern to repeat for every future feature (auth, CRUD, favorites, search):

1. **Confirm or extend the Mongoose model** — does the schema already support what this feature needs? If not, update the model first.
2. **Write the controller function** — the logic that actually queries/writes to the database and returns a response.
3. **Create or extend a routes file** — map the HTTP verb and path to the controller function.
4. **Wire the route into `app.js`** — one line: `app.use('/api/<resource>', require('./routes/<resource>.routes'));`
5. **Restart and test in isolation** — hit the endpoint directly with Postman or a browser *before* touching the frontend. This confirms the backend is correct on its own, so if something breaks later you know immediately whether the bug is backend or frontend.
6. **Commit to Git** once the endpoint is verified working.

Note: nodemon auto-restarts on `.js`/`.json` file changes, but **not** on `.env` changes — after editing `.env`, type `rs` in the terminal running `npm run dev` to force a restart.

## 7. Database Conventions

- **Mongoose enforces the schema — MongoDB itself does not.** MongoDB is schema-less by default. Validation, types, and enums only apply when data passes *through* Mongoose (i.e., through your backend code). Inserting data directly via Atlas's UI bypasses all of that.
- **Because of the above, manually entered data must match the schema by hand:** numeric fields need to be actual numbers (no quotes), and reference fields (like `agent` on `Property`) must be wrapped as `{ "$oid": "..." }` so MongoDB stores them as a real ObjectId, not a string.
- **`populate()` requires the referenced model to be registered.** If `Property.js` has `ref: 'User'` but nothing in the request's execution path ever does `require('../models/User')`, Mongoose throws `Schema hasn't been registered for model "User"`. The fix is to explicitly require every model a controller's `populate()` calls depend on.
- **`src/scripts/` holds one-off verification scripts** (e.g. `testModels.js`) that insert sample data and confirm relationships resolve correctly. These are run manually (`node src/scripts/testModels.js`) and are never triggered by the running server — safe to leave in the project.
- **Manual Atlas entry is a temporary bridge, not the long-term data path.** Once "create property" and "register user" endpoints exist, real data should flow through those instead, since Mongoose will then enforce correct types and validation automatically.

## 8. Authentication & Authorization (Planned — Phase 9)

Not yet built, but the design is settled:

- **Password hashing** — `bcryptjs` hashes passwords before saving; the raw password is never stored. Login compares a freshly-hashed attempt against the stored hash rather than reversing it (hashing is one-way).
- **Register / Login endpoints** — create a user (hashing the password first) and authenticate an existing user (comparing hashes), respectively.
- **JWT** — issued on successful login, proves identity on future requests via an `Authorization: Bearer <token>` header, without the server needing to store session state.
- **Auth middleware** — verifies the token on protected routes and attaches the identified user to `req.user` before the route handler runs.
- **Role-based restriction** — uses `constants/roles.js` to gate actions (e.g., only `agent` role can create a property listing).

**Important carry-over issue:** any user created manually through Atlas's UI (rather than through the app) has a **plaintext** password, since Atlas bypasses the hashing logic entirely. Once login compares against a hash, these manually-created users won't be able to log in. They'll need to be re-created through the real register endpoint once it exists.

## 9. Current API Reference

### `GET /api/properties`
- **Access:** Public
- **Returns:** all properties, with `agent` populated (name, email, phone)

```json
{
  "success": true,
  "count": 4,
  "data": [
    {
      "_id": "...",
      "title": "3-Bedroom Apartment in East Legon",
      "price": 250000,
      "listingType": "sale",
      "propertyType": "apartment",
      "status": "available",
      "bedrooms": 3,
      "bathrooms": 2,
      "area": 180,
      "city": "Accra",
      "region": "Greater Accra",
      "agent": { "_id": "...", "name": "John Mensah", "email": "...", "phone": "..." }
    }
  ]
}
```

### Planned endpoints

| Method | Path | Purpose | Phase |
|---|---|---|---|
| POST | `/api/auth/register` | Create a new user account | 9 |
| POST | `/api/auth/login` | Authenticate, issue JWT | 9 |
| GET | `/api/properties/:id` | Single property detail | 10 |
| POST | `/api/properties` | Create a listing (agent only) | 10 |
| PUT | `/api/properties/:id` | Update a listing (owning agent only) | 10 |
| DELETE | `/api/properties/:id` | Delete a listing (owning agent only) | 10 |
| POST | `/api/favorites` | Add a favorite (buyer only) | 11 |
| GET | `/api/favorites` | View own favorites (buyer only) | 11 |
| DELETE | `/api/favorites/:id` | Remove a favorite | 11 |
| GET | `/api/properties?city=&price=&bedrooms=` | Search/filter listings | 12 |

## 10. Git & Version Control Practices

- `.env` is listed in `.gitignore` and must **never** be committed — it holds real credentials.
- `.env.example` holds the same keys with blank values and **should** be committed, so anyone setting up the project knows what's required.
- Commit at natural checkpoints — end of a completed phase or feature, not mid-change.
- If a credential is ever accidentally committed and pushed, treat it as compromised: rotate the password/secret immediately. Deleting the commit afterward does not undo the exposure, since the data was already public once pushed.

## 11. Project Status Snapshot

| Phase | Status |
|---|---|
| 1 — Project structure | ✅ Done |
| 2 — Dependencies installed | ✅ Done |
| 3 — Express server (`app.js` / `server.js`) | ✅ Done |
| 4 — MongoDB Atlas connection | ✅ Done |
| 5 — Environment variables | ✅ Done |
| 6 — Constants | ✅ Done |
| 7 — Mongoose models (User, Property, Favorite) | ✅ Done |
| 8 — Models verified against Atlas | ✅ Done |
| Properties fetch endpoint (`GET /api/properties`) | ✅ Done |
| 9 — Authentication | ⬜ Planned |
| 10 — Property CRUD | ⬜ Planned |
| 11 — Favorites | ⬜ Planned |
| 12 — Search & filtering | ⬜ Planned |
| 13 — Image uploads | ⬜ Planned |
| 14 — Validation & centralized error handling | ⬜ Partially done (basic 404 + error handler exist; input validation pending) |
| Frontend integration | ⬜ Not started |

## 12. Known Cleanup Items

A running list of small things flagged during development, worth resolving when convenient:

- `constants/roles.js` currently has the key `USER` mapped to the value `'buyer'` — consider renaming the key to `BUYER` to match its value and avoid confusion when read elsewhere in the code (e.g. `ROLES.BUYER` reads clearer than `ROLES.USER` with a `'buyer'` value).
- Double-check manually entered property documents in Atlas for typos in `city`/`region` fields (one was caught: `"Acrra"` → `"Accra"`).
- The manually-created agent user's password is a plaintext placeholder, not a real hash — must be replaced by registering properly once Phase 9's register endpoint exists.
- No `ADMIN` role currently exists (only `agent` and `buyer`) — worth a deliberate decision on whether the platform needs one before Phase 9 locks in the auth logic around fixed roles.

## 13. Troubleshooting Reference

Issues actually hit during this build, and how they were resolved — useful if they resurface:

| Symptom | Cause | Fix |
|---|---|---|
| Server exits immediately with no output (`clean exit`), no errors | `startServer()` was defined but never called | Add `startServer();` at the bottom of `server.js` |
| `querySrv EBADNAME _mongodb._tcp....` | Malformed `MONGO_URI` — stray characters or leftover template brackets | Rebuild the URI carefully as one clean string, no extra characters |
| `bad auth : authentication failed` | Literal `<` `>` brackets left around the password from Atlas's template, or wrong DB user password | Remove the brackets entirely; confirm it's the database user's password, not the Atlas account login password |
| `Schema hasn't been registered for model "User"` | `populate('agent')` referenced `User`, but `User.js` was never `require()`'d anywhere in that request's execution path | Add `require('../models/User')` in the controller, even if the variable isn't used directly |
| Numeric fields (`price`, `bedrooms`, etc.) stored as strings | Manually inserted via Atlas UI with quoted numbers in JSON view | Re-insert with unquoted numbers, or edit the field's type directly in Atlas using the type dropdown |
| nodemon doesn't restart after editing `.env` | nodemon's default watch list covers `.js`/`.json`/etc., not `.env` | Type `rs` in the terminal running `npm run dev` to force a restart |

---

*This document should be updated as new phases are completed — treat it as a living reference, not a one-time snapshot.*
