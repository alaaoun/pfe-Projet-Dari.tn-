'use strict';

const { Favorite, Listing, ListingImage, User } = require('../models');

async function getFavorites(req, res, next) {
  try {
    const listings = await Listing.findAll({
      include: [
        { model: User, as: 'favoritedBy', where: { id: req.user.id }, attributes: [] },
        { model: ListingImage, as: 'images', where: { is_cover: true }, required: false, limit: 1 },
      ],
      attributes: { exclude: ['search_vector'] },
      order: [['created_at', 'DESC']],
    });
    res.json({ success: true, data: listings });
  } catch (err) { next(err); }
}

async function toggleFavorite(req, res, next) {
  try {
    const { listingId } = req.params;
    const key = { user_id: req.user.id, listing_id: listingId };

    const listing = await Listing.findByPk(listingId);
    if (!listing) return res.status(404).json({ success: false, message: 'Annonce introuvable.' });

    const existing = await Favorite.findOne({ where: key });
    if (existing) {
      await existing.destroy();
      return res.json({ success: true, favorited: false, message: 'Retiré des favoris.' });
    }

    await Favorite.create(key);
    res.status(201).json({ success: true, favorited: true, message: 'Ajouté aux favoris.' });
  } catch (err) { next(err); }
}

module.exports = { getFavorites, toggleFavorite };
