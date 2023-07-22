/* eslint-disable import/newline-after-import */
const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const authController = require('../controllers/authController');

router.use(authController.protect);

router.get('/checkout-session/:tourId', bookingController.getCheckoutSession);

module.exports = router;
