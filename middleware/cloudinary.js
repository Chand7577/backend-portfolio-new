const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Configure Cloudinary using env vars
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

console.log('Cloudinary Configured:', !!process.env.CLOUDINARY_CLOUD_NAME);

// Multer-Cloudinary storage — images go into the "projects" folder
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'portfolio/projects',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    // Auto-compress & convert to WebP/AVIF for future uploads
    transformation: [
      { quality: 'auto:good', fetch_format: 'auto', flags: 'strip_profile' },
    ],
    // Pre-generate a web-optimised 1200px wide variant
    eager: [
      { width: 1200, crop: 'limit', quality: 'auto:good', fetch_format: 'auto' },
    ],
    eager_async: true,
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB per file
});

module.exports = { cloudinary, upload };
