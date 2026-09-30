'use strict';

const cloudinary = require('cloudinary').v2;
const { ListingImage, Listing } = require('../models');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * POST /api/upload/listings/:listingId/images
 * Upload une ou plusieurs images pour une annonce.
 * Multer traite les fichiers avant d'arriver ici.
 */
async function uploadImages(req, res, next) {
  try {
    const { listingId } = req.params;

    const listing = await Listing.findByPk(listingId);
    if (!listing) return res.status(404).json({ success: false, message: 'Annonce introuvable.' });

    if (listing.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Accès refusé.' });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'Aucun fichier reçu.' });
    }

    // Compter les images existantes pour la position et le is_cover
    const existingCount = await ListingImage.count({ where: { listing_id: listingId } });

    const uploads = await Promise.all(
      req.files.map((file, idx) =>
        cloudinary.uploader.upload(file.path, {
          folder: `dari-tn/listings/${listingId}`,
          transformation: [
            { width: 1200, height: 800, crop: 'limit', quality: 'auto', fetch_format: 'auto' },
          ],
        }).then(result => ({
          listing_id: listingId,
          url:       result.secure_url,
          public_id: result.public_id,
          is_cover:  existingCount === 0 && idx === 0,
          position:  existingCount + idx,
        }))
      )
    );

    const images = await ListingImage.bulkCreate(uploads);

    res.status(201).json({ success: true, data: images });
  } catch (err) { next(err); }
}

/**
 * DELETE /api/upload/images/:imageId
 */
async function deleteImage(req, res, next) {
  try {
    const image = await ListingImage.findByPk(req.params.imageId, {
      include: [{ model: Listing, as: 'listing' }],  // Attention: pas d'alias dans le modèle simple
    });
    if (!image) return res.status(404).json({ success: false, message: 'Image introuvable.' });

    const listing = await Listing.findByPk(image.listing_id);
    if (!listing) return res.status(404).json({ success: false, message: 'Annonce introuvable.' });

    if (listing.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Accès refusé.' });
    }

    // Supprimer de Cloudinary si public_id présent
    if (image.public_id) {
      await cloudinary.uploader.destroy(image.public_id).catch(() => {});
    }

    const wasCover = image.is_cover;
    await image.destroy();

    // Si c'était la cover, promouvoir la prochaine image
    if (wasCover) {
      const next = await ListingImage.findOne({
        where: { listing_id: image.listing_id },
        order: [['position', 'ASC']],
      });
      if (next) await next.update({ is_cover: true });
    }

    res.json({ success: true, message: 'Image supprimée.' });
  } catch (err) { next(err); }
}

/**
 * PATCH /api/upload/images/:imageId/cover
 * Définit une image comme photo de couverture.
 */
async function setCover(req, res, next) {
  try {
    const image = await ListingImage.findByPk(req.params.imageId);
    if (!image) return res.status(404).json({ success: false, message: 'Image introuvable.' });

    const listing = await Listing.findByPk(image.listing_id);
    if (listing.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Accès refusé.' });
    }

    // Retirer is_cover de toutes les images de l'annonce
    await ListingImage.update({ is_cover: false }, { where: { listing_id: image.listing_id } });
    await image.update({ is_cover: true });

    res.json({ success: true, message: 'Photo de couverture mise à jour.', data: image });
  } catch (err) { next(err); }
}

module.exports = { uploadImages, deleteImage, setCover };
