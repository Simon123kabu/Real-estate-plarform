const multer  = require('multer');
const AppError = require('../utils/AppError');

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE_MB   = 5;

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError('Invalid file type. Only JPEG, PNG, and WebP images are allowed.', 400));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE_MB * 1024 * 1024, // bytes
  },
});

/**
 * Wraps a Multer middleware so that MulterError instances are converted
 * into AppError before being passed to next() — ensures the global error
 * handler returns a clean { success, message } response instead of a raw 500.
 *
 * @param {Function} multerMiddleware - The result of upload.single() or upload.array()
 * @returns {Function} Express middleware
 */
const wrapMulter = (multerMiddleware) => (req, res, next) => {
  multerMiddleware(req, res, (err) => {
    if (!err) return next();

    // Multer-specific errors (file too large, too many files, etc.)
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return next(new AppError(`File too large. Maximum size is ${MAX_FILE_SIZE_MB}MB.`, 400));
      }
      if (err.code === 'LIMIT_FILE_COUNT') {
        return next(new AppError('Too many files. Maximum is 10 images per upload.', 400));
      }
      return next(new AppError(err.message, 400));
    }

    // Our own AppError from fileFilter (wrong MIME type)
    if (err instanceof AppError) return next(err);

    // Any other unexpected error
    return next(new AppError('File upload failed.', 500));
  });
};

const uploadSingle = wrapMulter(upload.single('image'));

const uploadMultiple = wrapMulter(upload.array('images', 10));

module.exports = { uploadSingle, uploadMultiple };
