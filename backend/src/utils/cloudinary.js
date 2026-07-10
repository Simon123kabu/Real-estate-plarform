/**
 * cloudinary.js
 * -------------
 * Configures the Cloudinary SDK using env vars and exports a
 * promise-based helper that uploads a raw Buffer (from Multer's
 * memoryStorage) to a given Cloudinary folder.
 *
 * Required env vars:
 *   CLOUDINARY_CLOUD_NAME
 *   CLOUDINARY_API_KEY
 *   CLOUDINARY_API_SECRET
 */

const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload a file buffer to Cloudinary.
 *
 * @param {Buffer} buffer        - Raw file buffer from Multer memoryStorage
 * @param {string} [folder='properties'] - Cloudinary folder to upload into
 * @returns {Promise<string>}    - Resolves to the secure Cloudinary URL
 */
const uploadToCloudinary = (buffer, folder = 'properties') => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
        transformation: [
          // Resize to a sensible max width while preserving aspect ratio
          { width: 1200, crop: 'limit' },
          // Auto-quality compression
          { quality: 'auto' },
          // Serve modern formats (WebP / AVIF) when supported
          { fetch_format: 'auto' },
        ],
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result.secure_url);
      }
    );

    stream.end(buffer);
  });
};

module.exports = { uploadToCloudinary };
