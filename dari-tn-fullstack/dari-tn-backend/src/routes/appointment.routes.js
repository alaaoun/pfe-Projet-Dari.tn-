'use strict';

const router = require('express').Router();
const { body } = require('express-validator');
const { validate } = require('../middlewares/validate');
const { authenticate, requireRole } = require('../middlewares/auth.middleware');
const ctrl = require('../controllers/appointment.controller');

const appointmentStatusValues = ['pending', 'confirmed', 'rescheduled', 'cancelled', 'completed'];

router.get('/me', authenticate, ctrl.getMyAppointments);

router.get('/agent', authenticate, requireRole('agent', 'admin'), ctrl.getAgentAppointments);

router.patch('/:id/status', authenticate, [
  body('status').isIn(appointmentStatusValues).withMessage('Statut de rendez-vous invalide.'),
  body('scheduled_at').optional().isISO8601().withMessage('Date de rendez-vous invalide.'),
  body('agent_note').optional().trim().isLength({ max: 4000 }),
  validate,
], ctrl.updateAppointmentStatus);

router.patch('/:id/cancel', authenticate, ctrl.cancelAppointment);

module.exports = router;