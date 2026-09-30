'use strict';

const router = require('express').Router();
const { body, param } = require('express-validator');
const { validate } = require('../middlewares/validate');
const { authenticate, optionalAuth, requireRole } = require('../middlewares/auth.middleware');
const ctrl = require('../controllers/listing.controller');

const VALID_TYPES = ['Appartement','Villa','Maison','Bureau','Terrain','Garage','Local commercial','Ferme'];
const VALID_TRANS = ['Vente','Location'];
const VALID_STATUS = ['active','pending','sold','rented','archived'];

const listingBodyRules = [
  body('title').trim().notEmpty().withMessage('Titre requis.').isLength({ max: 255 }),
  body('transaction').isIn(VALID_TRANS).withMessage('Transaction invalide.'),
  body('property_type').isIn(VALID_TYPES).withMessage('Type de bien invalide.'),
  body('city').trim().notEmpty().withMessage('Ville requise.'),
  body('governorate').trim().notEmpty().withMessage('Gouvernorat requis.'),
  body('price').isFloat({ min: 0 }).withMessage('Prix invalide.'),
  body('surface').optional().isFloat({ min: 0 }),
  body('rooms').optional().isInt({ min: 0 }),
  body('bedrooms').optional().isInt({ min: 0 }),
  body('bathrooms').optional().isInt({ min: 0 }),
  body('latitude').optional().isFloat({ min: -90, max: 90 }),
  body('longitude').optional().isFloat({ min: -180, max: 180 }),
  body('is_new').optional().isBoolean(),
  body('is_furnished').optional().isBoolean(),
  body('has_parking').optional().isBoolean(),
  body('has_elevator').optional().isBoolean(),
  body('has_pool').optional().isBoolean(),
  body('has_garden').optional().isBoolean(),
  body('has_terrace').optional().isBoolean(),
  body('has_ac').optional().isBoolean(),
  body('price_negotiable').optional().isBoolean(),
];

// ── Routes publiques ──────────────────────────────────────────
router.get('/',    optionalAuth, ctrl.getListings);
router.get('/:id', optionalAuth, ctrl.getListing);

// ── Routes authentifiées ──────────────────────────────────────
router.get('/user/me', authenticate, ctrl.getMyListings);

router.post('/', authenticate, [...listingBodyRules, validate], ctrl.createListing);

router.put('/:id', authenticate, [...listingBodyRules, validate], ctrl.updateListing);

router.delete('/:id', authenticate, ctrl.deleteListing);

router.patch('/:id/status', authenticate, [
  body('status').isIn(VALID_STATUS).withMessage('Statut invalide.'),
  validate,
], ctrl.updateStatus);

// Contact annonceur (public)
router.post('/:id/message', [
  body('sender_name').trim().notEmpty().withMessage('Nom requis.'),
  body('sender_email').isEmail().withMessage('Email invalide.'),
  body('body').trim().isLength({ min: 10, max: 2000 }).withMessage('Message trop court ou trop long.'),
  body('sender_phone').optional().isMobilePhone('any'),
  validate,
], ctrl.sendMessage);

module.exports = router;
