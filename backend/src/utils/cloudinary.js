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

/**
 * Helper to extract the Cloudinary public ID from a secure URL.
 * E.g., https://res.cloudinary.com/cloud_name/image/upload/v1672531199/profile_images/user_123.jpg
 * returns 'profile_images/user_123'
 *
 * @param {string} url - The full Cloudinary secure URL
 * @returns {string|null} - The extracted public ID or null if invalid
 */
const extractPublicId = (url) => {
  if (!url || typeof url !== 'string') return null;
  const parts = url.split('/image/upload/');
  if (parts.length < 2) return null;

  let publicIdWithFormat = parts[1];
  const versionMatch = publicIdWithFormat.match(/^v\d+\//);
  if (versionMatch) {
    publicIdWithFormat = publicIdWithFormat.substring(versionMatch[0].length);
  }

  const dotIndex = publicIdWithFormat.lastIndexOf('.');
  if (dotIndex !== -1) {
    return publicIdWithFormat.substring(0, dotIndex);
  }
  return publicIdWithFormat;
};

/**
 * Delete a file from Cloudinary by its secure URL.
 *
 * @param {string} url - The full Cloudinary secure URL
 * @returns {Promise<object|null>} - Cloudinary deletion response
 */
const deleteFromCloudinary = async (url) => {
  if (!url) return null;
  const publicId = extractPublicId(url);
  if (!publicId) return null;
  return cloudinary.uploader.destroy(publicId);
};

module.exports = { uploadToCloudinary, deleteFromCloudinary };
