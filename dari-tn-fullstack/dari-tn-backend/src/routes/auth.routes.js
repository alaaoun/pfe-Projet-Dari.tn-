'use strict';

const router = require('express').Router();
const { body } = require('express-validator');
const { validate } = require('../middlewares/validate');
const { authenticate } = require('../middlewares/auth.middleware');
const ctrl = require('../controllers/auth.controller');

const passwordRules = body('password')
  .isLength({ min: 8 }).withMessage('Le mot de passe doit contenir au moins 8 caractères.')
  .matches(/[A-Z]/).withMessage('Le mot de passe doit contenir au moins une majuscule.')
  .matches(/[0-9]/).withMessage('Le mot de passe doit contenir au moins un chiffre.');

// POST /api/auth/register
router.post('/register', [
  body('first_name').trim().notEmpty().withMessage('Prénom requis.').isLength({ max: 100 }),
  body('last_name').trim().notEmpty().withMessage('Nom requis.').isLength({ max: 100 }),
  body('email').isEmail().normalizeEmail().withMessage('Email invalide.'),
  passwordRules,
  body('phone').optional().isMobilePhone('any').withMessage('Numéro de téléphone invalide.'),
  validate,
], ctrl.register);

// POST /api/auth/login
router.post('/login', [
  body('email').isEmail().normalizeEmail().withMessage('Email invalide.'),
  body('password').notEmpty().withMessage('Mot de passe requis.'),
  validate,
], ctrl.login);

// POST /api/auth/refresh
router.post('/refresh', [
  body('refreshToken').notEmpty().withMessage('Token requis.'),
  validate,
], ctrl.refreshToken);

// POST /api/auth/logout
router.post('/logout', ctrl.logout);

// GET /api/auth/me
router.get('/me', authenticate, ctrl.me);

// PUT /api/auth/change-password
router.put('/change-password', authenticate, [
  body('currentPassword').notEmpty().withMessage('Mot de passe actuel requis.'),
  passwordRules.withMessage('Nouveau mot de passe invalide.'),
  validate,
], ctrl.changePassword);

module.exports = router;
