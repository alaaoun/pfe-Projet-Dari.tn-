'use strict';

const router = require('express').Router();
const { body } = require('express-validator');
const { validate } = require('../middlewares/validate');
const { chatWithAssistant } = require('../controllers/chatbot.controller');

router.post('/', [
  body('message').trim().notEmpty().withMessage('Le message est requis.'),
  validate,
], chatWithAssistant);

module.exports = router;
