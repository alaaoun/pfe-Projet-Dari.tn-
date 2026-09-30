'use strict';

const router = require('express').Router();
const { authenticate } = require('../middlewares/auth.middleware');
const ctrl = require('../controllers/favorite.controller');

// GET  /api/favorites        — liste des favoris de l'utilisateur
router.get('/', authenticate, ctrl.getFavorites);

// POST /api/favorites/:listingId — toggle favori
router.post('/:listingId', authenticate, ctrl.toggleFavorite);

module.exports = router;
