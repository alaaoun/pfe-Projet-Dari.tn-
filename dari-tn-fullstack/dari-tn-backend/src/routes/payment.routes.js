'use strict';

const router = require('express').Router();
const { authenticate } = require('../middlewares/auth.middleware');
const ctrl = require('../controllers/payment.controller');

router.post('/appointments', authenticate, ctrl.createAppointmentPayment);
router.get('/flouci/callback', ctrl.flouciCallback);

module.exports = router;