/* eslint-disable import/newline-after-import */
const express = require('express');
const router = express.Router();
const viewController = require('../controllers/viewController');
const authController = require('../controllers/authController');
const bookingController = require('../controllers/bookingController');

const CSP = 'Content-Security-Policy';
const POLICY =
  "default-src 'self' https://*.mapbox.com  https://js.stripe.com/v3/  ;" +
  "base-uri 'self';block-all-mixed-content;" +
  "font-src 'self' https: data:;" +
  "frame-ancestors 'self';" +
  "img-src 'self' data:;" +
  "object-src 'none';" +
  "script-src https://cdnjs.cloudflare.com https://api.mapbox.com  https://js.stripe.com/v3/ 'unsafe-eval' 'self' blob: ;" +
  "script-src-attr 'none';" +
  "style-src 'self' https: 'unsafe-inline';" +
  "worker-src 'self' blob:;" +
  "connect-src 'self' https://*.mapbox.com ws://localhost:1234 ws://127.0.0.1:1234 ;";

router.use((req, res, next) => {
  res.setHeader(CSP, POLICY);
  next();
});

//router.use(authController.isLoggedIn);

router.get(
  '/',
  bookingController.createBookingCheckout,
  authController.isLoggedIn,
  viewController.getOverview
);
router.get('/login', authController.isLoggedIn, viewController.getLoginForm);
router.get('/logout', authController.isLoggedIn, authController.logout);
router.get('/tour/:slug', authController.isLoggedIn, viewController.getTour);
router.get('/me', authController.protect, viewController.getAccount);
router.get(
  '/managetours',
  authController.protect,
  authController.restrictTo('admin'),
  viewController.getManageTours
);
router.get('/mytours', authController.protect, viewController.getMyTours);

router.get('/signup/', viewController.getSignupForm);
router.get('/signup/:token', authController.validateSignup);
router.get('/resetPassword/:token', viewController.getResetForm);

module.exports = router;
