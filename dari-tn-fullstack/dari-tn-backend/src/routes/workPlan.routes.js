'use strict';

const router = require('express').Router();
const { authenticate } = require('../middlewares/auth.middleware');
const ctrl = require('../controllers/workPlan.controller');

router.use(authenticate);
router.get('/', ctrl.getWorkPlan);
router.put('/', ctrl.saveWorkPlan);
router.post('/confirm', ctrl.confirmWorkPlan);

module.exports = router;