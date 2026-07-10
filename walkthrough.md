# Phase 2 Walkthrough — Property Schema & CRUD APIs

## What Was Built

### 1. Updated Property Schema — [Property.js](file:///c:/Users/Flexow/Desktop/Intern%20Project/Real-estate-plarform/backend/src/models/Property.js)

Three new **optional** fields added (backward-compatible with manually inserted documents):

| Field | Type | Default | Purpose |
|---|---|---|---|
| `featured` | Boolean | `false` | Flag for homepage highlights |
| `amenities` | [String] | `[]` | e.g. `['pool', 'gym', 'parking']` |
| `coordinates.lat/lng` | Number | — | Future map view |

Also: two new indexes (`listingType + status`, `featured`) and area documented as **square feet**.

---

### 2. Cloudinary Utility — [cloudinary.js](file:///c:/Users/Flexow/Desktop/Intern%20Project/Real-estate-plarform/backend/src/utils/cloudinary.js)

- Wraps `cloudinary.uploader.upload_stream` in a Promise
- Applies auto-quality, width limit (1200px), and auto-format (WebP/AVIF) on upload
- Used by the controller — no routes touch it directly

---

### 3. Upload Middleware — [upload.middleware.js](file:///c:/Users/Flexow/Desktop/Intern%20Project/Real-estate-plarform/backend/src/middleware/upload.middleware.js)

- Multer `memoryStorage` — no files written to disk
- Accepts JPEG, PNG, WebP only
- 5 MB per-file limit
- Exports `uploadSingle` and `uploadMultiple` (up to 10 files)

---

### 4. Property Validator — [property.validator.js](file:///c:/Users/Flexow/Desktop/Intern%20Project/Real-estate-plarform/backend/src/validators/property.validator.js)

Three rule sets following the same pattern as `auth.validator.js`:

| Export | Used on |
|---|---|
| `createPropertyRules` | `POST /api/properties` |
| `updatePropertyRules` | `PUT /api/properties/:id` |
| `statusUpdateRules` | `PATCH /api/properties/:id/status` |

---

### 5. Property Controller — [property.controller.js](file:///c:/Users/Flexow/Desktop/Intern%20Project/Real-estate-plarform/backend/src/controllers/property.controller.js)

| Handler | Responsibility |
|---|---|
| `getProperties` | Filtering + sorting + pagination (`Promise.all` for count+docs) |
| `getPropertyById` | Single doc with agent populated |
| `createProperty` | Injects `agent: req.session.userId` automatically |
| `updateProperty` | Ownership check, strips `agent` & `images` from body |
| `deleteProperty` | Hard delete with ownership check |
| `updatePropertyStatus` | Patches `status` only |
| `uploadPropertyImages` | Parallel Cloudinary uploads, enforces 10-image cap |

---

### 6. Property Routes — [property.routes.js](file:///c:/Users/Flexow/Desktop/Intern%20Project/Real-estate-plarform/backend/src/routes/property.routes.js)

```
GET    /api/properties               — public
GET    /api/properties/:id           — public
POST   /api/properties               — isAgent
PUT    /api/properties/:id           — isAgent
DELETE /api/properties/:id           — isAgent
PATCH  /api/properties/:id/status   — isAgent
POST   /api/properties/:id/images   — isAgent + uploadMultiple
```

---

## Quick Testing Guide

### 1. Get all properties (public)
```
GET http://localhost:5000/api/properties
```

### 2. Filter + paginate
```
GET http://localhost:5000/api/properties?city=Nairobi&listingType=rent&page=1&limit=6&sort=price_asc
```

### 3. Get single property
```
GET http://localhost:5000/api/properties/<id>
```

### 4. Login as agent first
```
POST http://localhost:5000/api/auth/login
{ "email": "...", "password": "..." }
```

### 5. Create property (requires agent session cookie)
```
POST http://localhost:5000/api/properties
{
  "title": "Modern 3BR Apartment",
  "description": "Spacious apartment in the heart of the city.",
  "price": 85000,
  "listingType": "sale",
  "propertyType": "apartment",
  "address": "123 Main St",
  "city": "Nairobi",
  "region": "Nairobi County",
  "bedrooms": 3,
  "bathrooms": 2,
  "area": 1400,
  "amenities": ["pool", "parking", "gym"]
}
```

### 6. Upload images
```
POST http://localhost:5000/api/properties/<id>/images
Content-Type: multipart/form-data
Field name: "images"  (up to 10 files)
```

> [!IMPORTANT]
> Make sure your `.env` file has `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET` set before testing the image upload endpoint.

---

## Verification Result

| Check | Result |
|---|---|
| All modules load without errors | ✅ |
| No existing files broken | ✅ |
| Manually inserted documents compatible | ✅ (additive-only schema change) |
