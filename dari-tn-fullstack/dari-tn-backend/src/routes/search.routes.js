'use strict';

const router = require('express').Router();
const ctrl = require('../controllers/search.controller');

// GET /api/search?q=...          — recherche full-text PostgreSQL
router.get('/', ctrl.fullTextSearch);

// POST /api/search/natural — transforme une demande libre en filtres
router.post('/natural', ctrl.naturalSearch);

// GET /api/search/suggest?q=...  — autocomplétion rapide
router.get('/suggest', ctrl.suggest);

// GET /api/search/map-stats      — données carte par ville
router.get('/map-stats', ctrl.mapStats);

module.exports = router;
