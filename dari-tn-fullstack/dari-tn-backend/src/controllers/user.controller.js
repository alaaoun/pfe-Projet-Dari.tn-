'use strict';

const bcrypt = require('bcryptjs');
const { User, Listing, ListingImage } = require('../models');

function safeUser(user) {
  const u = user.toJSON ? user.toJSON() : { ...user };
  delete u.password_hash;
  return u;
}

// ── GET /users/profile ────────────────────────────────────────
async function getProfile(req, res, next) {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password_hash'] },
    });
    res.json({ success: true, data: user });
  } catch (err) { next(err); }
}

// ── PUT /users/profile ────────────────────────────────────────
async function updateProfile(req, res, next) {
  try {
    const allowed = ['first_name', 'last_name', 'phone', 'avatar_url'];
    const updates = {};
    allowed.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

    await User.update(updates, { where: { id: req.user.id } });
    const updated = await User.findByPk(req.user.id, { attributes: { exclude: ['password_hash'] } });

    res.json({ success: true, data: updated });
  } catch (err) { next(err); }
}

// ── GET /users/:id/listings ───────────────────────────────────
async function getUserListings(req, res, next) {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: ['id', 'first_name', 'last_name', 'avatar_url', 'role', 'created_at'],
    });
    if (!user) return res.status(404).json({ success: false, message: 'Utilisateur introuvable.' });

    const listings = await Listing.findAll({
      where: { user_id: user.id, status: 'active' },
      attributes: { exclude: ['search_vector'] },
      include: [{ model: ListingImage, as: 'images', where: { is_cover: true }, required: false, limit: 1 }],
      order: [['created_at', 'DESC']],
    });

    res.json({ success: true, data: { user, listings } });
  } catch (err) { next(err); }
}

// ── Admin : GET /users (liste) ────────────────────────────────
async function listUsers(req, res, next) {
  try {
    const { page = 1, limit = 20, role } = req.query;
    const where = {};
    if (role) where.role = role;

    const { count, rows } = await User.findAndCountAll({
      where,
      attributes: { exclude: ['password_hash'] },
      order: [['created_at', 'DESC']],
      limit: Math.min(parseInt(limit), 100),
      offset: (parseInt(page) - 1) * parseInt(limit),
    });

    res.json({
      success: true,
      data: {
        users: rows,
        pagination: { total: count, page: parseInt(page), pages: Math.ceil(count / parseInt(limit)) },
      },
    });
  } catch (err) { next(err); }
}

// ── Admin : PATCH /users/:id/status ──────────────────────────
async function setUserStatus(req, res, next) {
  try {
    const { is_active, role } = req.body;
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'Utilisateur introuvable.' });

    if (req.user.id === user.id) {
      if (role && role !== user.role) {
        return res.status(400).json({ success: false, message: 'Vous ne pouvez pas modifier votre propre rôle.' });
      }
      if (is_active === false) {
        return res.status(400).json({ success: false, message: 'Vous ne pouvez pas désactiver votre propre compte.' });
      }
    }

    const updates = {};
    if (is_active !== undefined) updates.is_active = is_active;
    if (role) updates.role = role;

    await user.update(updates);
    res.json({ success: true, data: safeUser(user) });
  } catch (err) { next(err); }
}

module.exports = { getProfile, updateProfile, getUserListings, listUsers, setUserStatus };
