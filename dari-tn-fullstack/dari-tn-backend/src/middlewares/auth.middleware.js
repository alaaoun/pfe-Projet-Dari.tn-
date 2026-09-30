'use strict';

const { verifyAccess } = require('../utils/jwt');
const { User } = require('../models');

/**
 * Vérifie le JWT dans le header Authorization: Bearer <token>
 */
async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Token d\'authentification manquant.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyAccess(token);

    const user = await User.findByPk(decoded.id, {
      attributes: { exclude: ['password_hash'] },
    });

    if (!user || !user.is_active) {
      return res.status(401).json({ success: false, message: 'Utilisateur introuvable ou désactivé.' });
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expiré.', code: 'TOKEN_EXPIRED' });
    }
    return res.status(401).json({ success: false, message: 'Token invalide.' });
  }
}

/**
 * Middleware optionnel : attache l'utilisateur si token présent, sans bloquer.
 */
async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const decoded = verifyAccess(authHeader.split(' ')[1]);
      const user = await User.findByPk(decoded.id, { attributes: { exclude: ['password_hash'] } });
      if (user && user.is_active) req.user = user;
    }
  } catch (_) {}
  next();
}

/**
 * Factory : vérifie que l'utilisateur a au moins l'un des rôles indiqués.
 */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ success: false, message: 'Non authentifié.' });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Accès refusé — rôle insuffisant.' });
    }
    next();
  };
}

module.exports = { authenticate, optionalAuth, requireRole };
