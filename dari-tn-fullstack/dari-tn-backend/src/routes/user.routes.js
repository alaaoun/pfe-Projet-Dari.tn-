'use strict';

const router = require('express').Router();
const { body } = require('express-validator');
const { validate } = require('../middlewares/validate');
const { authenticate, requireRole } = require('../middlewares/auth.middleware');
const ctrl = require('../controllers/user.controller');

// GET /api/users/profile — utilisateur connecté
router.get('/profile', authenticate, ctrl.getProfile);

// PUT /api/users/profile
router.put('/profile', authenticate, [
  body('first_name').optional().trim().isLength({ min: 1, max: 100 }),
  body('last_name').optional().trim().isLength({ min: 1, max: 100 }),
  body('phone').optional().isMobilePhone('any'),
  body('avatar_url').optional().isURL(),
  validate,
], ctrl.updateProfile);

// GET /api/users/:id/listings — annonces publiques d'un agent
router.get('/:id/listings', ctrl.getUserListings);

// ── Admin uniquement ──────────────────────────────────────────
router.get('/', authenticate, requireRole('admin'), ctrl.listUsers);

router.patch('/:id/status', authenticate, requireRole('admin'), [
  body('is_active').optional().isBoolean(),
  body('role').optional().isIn(['user', 'agent', 'admin']),
  validate,
], ctrl.setUserStatus);

module.exports = router;
