'use strict';

const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
const { User, RefreshToken } = require('../models');
const { signAccess, signRefresh, verifyRefresh } = require('../utils/jwt');
const logger = require('../utils/logger');

// ── Helpers ──────────────────────────────────────────────────
function safeUser(user) {
  const u = user.toJSON ? user.toJSON() : { ...user };
  delete u.password_hash;
  return u;
}

function tokenPair(user) {
  const payload = { id: user.id, email: user.email, role: user.role };
  return {
    accessToken:  signAccess(payload),
    refreshToken: signRefresh(payload),
  };
}

// ── Register ──────────────────────────────────────────────────
async function register(req, res, next) {
  try {
    const { first_name, last_name, email, phone, password } = req.body;

    const exists = await User.findOne({ where: { email: email.toLowerCase() } });
    if (exists) return res.status(409).json({ success: false, message: 'Cet email est déjà utilisé.' });

    const hash = await bcrypt.hash(password, 12);
    const user = await User.create({
      first_name, last_name,
      email: email.toLowerCase(),
      phone: phone || null,
      password_hash: hash,
      role: 'user',
    });

    const { accessToken, refreshToken } = tokenPair(user);
    await RefreshToken.create({
      user_id: user.id, token: refreshToken,
      expires_at: new Date(Date.now() + 30 * 24 * 3600 * 1000),
    });

    res.status(201).json({ success: true, data: { user: safeUser(user), accessToken, refreshToken } });
  } catch (err) { next(err); }
}

// ── Login ─────────────────────────────────────────────────────
async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email: email.toLowerCase() } });

    if (!user || !user.is_active) {
      return res.status(401).json({ success: false, message: 'Email ou mot de passe incorrect.' });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ success: false, message: 'Email ou mot de passe incorrect.' });

    await user.update({ last_login_at: new Date() });

    const { accessToken, refreshToken } = tokenPair(user);
    await RefreshToken.create({
      user_id: user.id, token: refreshToken,
      expires_at: new Date(Date.now() + 30 * 24 * 3600 * 1000),
    });

    // Nettoyer les anciens tokens expirés
    await RefreshToken.destroy({ where: { user_id: user.id, expires_at: { [Op.lt]: new Date() } } });

    res.json({ success: true, data: { user: safeUser(user), accessToken, refreshToken } });
  } catch (err) { next(err); }
}

// ── Refresh Token ─────────────────────────────────────────────
async function refreshToken(req, res, next) {
  try {
    const { refreshToken: token } = req.body;
    if (!token) return res.status(400).json({ success: false, message: 'Token manquant.' });

    const stored = await RefreshToken.findOne({ where: { token } });
    if (!stored || stored.expires_at < new Date()) {
      return res.status(401).json({ success: false, message: 'Token de rafraîchissement invalide ou expiré.' });
    }

    const decoded = verifyRefresh(token);
    const user = await User.findByPk(decoded.id);
    if (!user || !user.is_active) return res.status(401).json({ success: false, message: 'Utilisateur introuvable.' });

    // Rotation des tokens
    await stored.destroy();
    const { accessToken, refreshToken: newRefresh } = tokenPair(user);
    await RefreshToken.create({
      user_id: user.id, token: newRefresh,
      expires_at: new Date(Date.now() + 30 * 24 * 3600 * 1000),
    });

    res.json({ success: true, data: { accessToken, refreshToken: newRefresh } });
  } catch (err) { next(err); }
}

// ── Logout ────────────────────────────────────────────────────
async function logout(req, res, next) {
  try {
    const { refreshToken: token } = req.body;
    if (token) await RefreshToken.destroy({ where: { token } });
    res.json({ success: true, message: 'Déconnecté avec succès.' });
  } catch (err) { next(err); }
}

// ── Me ────────────────────────────────────────────────────────
async function me(req, res) {
  res.json({ success: true, data: safeUser(req.user) });
}

// ── Change Password ───────────────────────────────────────────
async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findByPk(req.user.id);

    const valid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!valid) return res.status(400).json({ success: false, message: 'Mot de passe actuel incorrect.' });

    const hash = await bcrypt.hash(newPassword, 12);
    await user.update({ password_hash: hash });

    // Invalider tous les refresh tokens
    await RefreshToken.destroy({ where: { user_id: user.id } });

    res.json({ success: true, message: 'Mot de passe mis à jour. Reconnectez-vous.' });
  } catch (err) { next(err); }
}

module.exports = { register, login, refreshToken, logout, me, changePassword };
