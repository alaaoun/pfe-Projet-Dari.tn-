'use strict';

const { validationResult } = require('express-validator');

/**
 * Middleware à placer après les règles express-validator.
 * Renvoie 422 si des erreurs de validation existent.
 */
function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
      message: 'Données invalides.',
      errors: errors.array().map(e => ({ field: e.path, message: e.msg })),
    });
  }
  next();
}

module.exports = { validate };
