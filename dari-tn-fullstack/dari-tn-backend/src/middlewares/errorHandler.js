'use strict';

const logger = require('../utils/logger');

function notFound(req, res, next) {
  res.status(404).json({
    success: false,
    message: `Route introuvable : ${req.method} ${req.originalUrl}`,
  });
}

function errorHandler(err, req, res, next) {
  logger.error(err);

  // Erreurs de validation Sequelize
  if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
    const messages = err.errors.map(e => e.message);
    return res.status(400).json({ success: false, message: 'Erreur de validation.', errors: messages });
  }

  // Erreurs de clé étrangère
  if (err.name === 'SequelizeForeignKeyConstraintError') {
    return res.status(400).json({ success: false, message: 'Référence invalide.' });
  }

  // Erreurs CORS
  if (err.message && err.message.startsWith('CORS')) {
    return res.status(403).json({ success: false, message: err.message });
  }

  const statusCode = err.statusCode || err.status || 500;
  const message = statusCode < 500 ? err.message : 'Erreur interne du serveur.';

  res.status(statusCode).json({ success: false, message });
}

module.exports = { notFound, errorHandler };
