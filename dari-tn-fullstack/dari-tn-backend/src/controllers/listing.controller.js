'use strict';

const { Op } = require('sequelize');
const { Listing, ListingImage, User, Favorite, Message, sequelize } = require('../models');
const { generateUniqueSlug } = require('../utils/slugify');

const LIST_ATTRS = { exclude: ['search_vector'] };
const OWNER_ATTRS = ['id', 'first_name', 'last_name', 'phone', 'avatar_url', 'role'];
const IMAGE_ORDER = [['position', 'ASC']];

// ── GET /listings ─────────────────────────────────────────────
async function getListings(req, res, next) {
  try {
    const {
      page = 1, limit = 12, transaction, property_type,
      city, governorate, min_price, max_price,
      min_surface, max_surface, rooms, is_new, is_furnished,
      has_parking, has_pool, sort = 'created_at', order = 'DESC',
      status, admin,
    } = req.query;

    const allowedStatuses = ['active', 'pending', 'sold', 'rented', 'archived'];
    const showAllStatuses = admin === 'true' && req.user?.role === 'admin';
    const where = {};
    if (!showAllStatuses) {
      where.status = 'active';
    } else if (status && allowedStatuses.includes(status)) {
      where.status = status;
    }

    if (transaction)   where.transaction   = transaction;
    if (property_type) where.property_type = property_type;
    if (city)          where.city          = { [Op.iLike]: `%${city}%` };
    if (governorate)   where.governorate   = { [Op.iLike]: `%${governorate}%` };
    if (min_price || max_price) {
      where.price = {};
      if (min_price) where.price[Op.gte] = parseFloat(min_price);
      if (max_price) where.price[Op.lte] = parseFloat(max_price);
    }
    if (min_surface || max_surface) {
      where.surface = {};
      if (min_surface) where.surface[Op.gte] = parseFloat(min_surface);
      if (max_surface) where.surface[Op.lte] = parseFloat(max_surface);
    }
    if (rooms)       where.rooms       = { [Op.gte]: parseInt(rooms) };
    if (is_new)      where.is_new      = is_new === 'true';
    if (is_furnished) where.is_furnished = is_furnished === 'true';
    if (has_parking) where.has_parking  = true;
    if (has_pool)    where.has_pool     = true;

    const validSorts = ['created_at', 'price', 'surface', 'views_count'];
    const sortField = validSorts.includes(sort) ? sort : 'created_at';
    const sortOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const { count, rows } = await Listing.findAndCountAll({
      where,
      attributes: LIST_ATTRS,
      include: [
        { model: User, as: 'owner', attributes: OWNER_ATTRS },
        { model: ListingImage, as: 'images', where: { is_cover: true }, required: false, limit: 1 },
      ],
      order: [['featured', 'DESC'], [sortField, sortOrder]],
      limit: Math.min(parseInt(limit), 50),
      offset,
      distinct: true,
    });

    res.json({
      success: true,
      data: {
        listings: rows,
        pagination: {
          total: count, page: parseInt(page),
          pages: Math.ceil(count / parseInt(limit)),
          limit: parseInt(limit),
        },
      },
    });
  } catch (err) { next(err); }
}

// ── GET /listings/:id ─────────────────────────────────────────
async function getListing(req, res, next) {
  try {
    const { id } = req.params;
    const where = { status: 'active' };

    // Accepte UUID ou slug
    const isUUID = /^[0-9a-f-]{36}$/i.test(id);
    if (isUUID) where.id = id;
    else where.slug = id;

    const listing = await Listing.findOne({
      where,
      attributes: LIST_ATTRS,
      include: [
        { model: User, as: 'owner', attributes: OWNER_ATTRS },
        { model: ListingImage, as: 'images', order: IMAGE_ORDER },
      ],
    });

    if (!listing) return res.status(404).json({ success: false, message: 'Annonce introuvable.' });

    // Incrémenter les vues
    await listing.increment('views_count');

    // Vérifier si mis en favori par l'utilisateur connecté
    let isFavorited = false;
    if (req.user) {
      const fav = await Favorite.findOne({ where: { user_id: req.user.id, listing_id: listing.id } });
      isFavorited = !!fav;
    }

    res.json({ success: true, data: { listing, isFavorited } });
  } catch (err) { next(err); }
}

// ── POST /listings ────────────────────────────────────────────
async function createListing(req, res, next) {
  try {
    const slug = await generateUniqueSlug(req.body.title);
    const listing = await Listing.create({
      ...req.body,
      slug,
      user_id: req.user.id,
      status: req.user.role === 'admin' ? 'active' : 'pending',
    });

    res.status(201).json({ success: true, data: listing });
  } catch (err) { next(err); }
}

// ── PUT /listings/:id ─────────────────────────────────────────
async function updateListing(req, res, next) {
  try {
    const listing = await Listing.findByPk(req.params.id);
    if (!listing) return res.status(404).json({ success: false, message: 'Annonce introuvable.' });

    // Seul le propriétaire ou un admin peut modifier
    if (listing.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Accès refusé.' });
    }

    const forbidden = ['id', 'user_id', 'slug', 'views_count', 'created_at', 'updated_at'];
    forbidden.forEach(f => delete req.body[f]);

    await listing.update(req.body);
    res.json({ success: true, data: listing });
  } catch (err) { next(err); }
}

// ── DELETE /listings/:id ──────────────────────────────────────
async function deleteListing(req, res, next) {
  try {
    const listing = await Listing.findByPk(req.params.id);
    if (!listing) return res.status(404).json({ success: false, message: 'Annonce introuvable.' });

    if (listing.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Accès refusé.' });
    }

    await listing.destroy();
    res.json({ success: true, message: 'Annonce supprimée.' });
  } catch (err) { next(err); }
}

// ── GET /listings/user/me ─────────────────────────────────────
async function getMyListings(req, res, next) {
  try {
    const listings = await Listing.findAll({
      where: { user_id: req.user.id },
      attributes: LIST_ATTRS,
      include: [{ model: ListingImage, as: 'images', where: { is_cover: true }, required: false, limit: 1 }],
      order: [['created_at', 'DESC']],
    });
    res.json({ success: true, data: listings });
  } catch (err) { next(err); }
}

// ── POST /listings/:id/message ────────────────────────────────
async function sendMessage(req, res, next) {
  try {
    const listing = await Listing.findByPk(req.params.id);
    if (!listing) return res.status(404).json({ success: false, message: 'Annonce introuvable.' });

    const msg = await Message.create({
      listing_id: listing.id,
      ...req.body,
    });
    res.status(201).json({ success: true, data: msg, message: 'Message envoyé avec succès.' });
  } catch (err) { next(err); }
}

// ── PATCH /listings/:id/status ────────────────────────────────
async function updateStatus(req, res, next) {
  try {
    const listing = await Listing.findByPk(req.params.id);
    if (!listing) return res.status(404).json({ success: false, message: 'Annonce introuvable.' });

    if (listing.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Accès refusé.' });
    }

    await listing.update({ status: req.body.status });
    res.json({ success: true, data: listing });
  } catch (err) { next(err); }
}

module.exports = {
  getListings, getListing, createListing, updateListing,
  deleteListing, getMyListings, sendMessage, updateStatus,
};
