'use strict';

const router   = require('express').Router();
const multer   = require('multer');
const path     = require('path');
const fs       = require('fs');
const { authenticate } = require('../middlewares/auth.middleware');
const ctrl     = require('../controllers/upload.controller');

// Stockage temporaire local avant upload Cloudinary
const tmpDir = path.join(process.cwd(), 'tmp');
if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, tmpDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error('Seules les images JPG, PNG et WebP sont acceptées.'), false);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024, files: 10 }, // 10 Mo, max 10 fichiers
});

// POST /api/upload/listings/:listingId/images
router.post(
  '/listings/:listingId/images',
  authenticate,
  upload.array('images', 10),
  ctrl.uploadImages
);

// DELETE /api/upload/images/:imageId
router.delete('/images/:imageId', authenticate, ctrl.deleteImage);

// PATCH /api/upload/images/:imageId/cover
router.patch('/images/:imageId/cover', authenticate, ctrl.setCover);

module.exports = router;
