/**
 * upload.middleware.js
 * --------------------
 * Configures Multer with in-memory storage so file buffers are
 * available on req.file / req.files without writing anything to disk.
 * The buffers are then passed directly to Cloudinary's upload_stream.
 *
 * Exports:
 *   uploadSingle  - for endpoints that accept one file at a time
 *   uploadMultiple - for endpoints that accept up to 10 images
 */

const multer = require('multer');

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE_MB = 5;

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error('Invalid file type. Only JPEG, PNG, and WebP images are allowed.'),
      false
    );
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE_MB * 1024 * 1024, // bytes
  },
});

/** Accept a single file in a field named "image" */
const uploadSingle = upload.single('image');

/** Accept up to 10 files in a field named "images" */
const uploadMultiple = upload.array('images', 10);

module.exports = { uploadSingle, uploadMultiple };
