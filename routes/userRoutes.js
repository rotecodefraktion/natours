/* eslint-disable import/newline-after-import */
const express = require('express');
const router = express.Router();
const userController = require('../controllers/usersController');
const authController = require('../controllers/authController');
const viewController = require('../controllers/viewController');

router.post('/signup', authController.signup);
router.post('/signup/:token', authController.validateSignup);
router.post('/login', authController.login);
router.get('/logout', authController.logout);

router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword/:token', authController.resetPassword);
router.get('/resetPassword/:token', viewController.getResetForm);

router.use(authController.protect); // Protect all routes after this middleware

router.patch(
  '/updatemypassword',
  userController.getMe,
  userController.verifyPassword,
  authController.updatePassword
);
router.get(
  '/me', //
  userController.getMe,
  userController.getUser
);

router.post(
  '/uploadImage',
  userController.getMe,
  userController.uploadUserPhoto,
  userController.resizeUserPhoto,
  viewController.returnPhotoName
);

router.patch(
  '/updateme',
  userController.getMe,
  userController.updateMe,
  userController.updateUser
);

router.delete(
  '/deleteme',
  userController.getMe,
  userController.verifyPassword,
  userController.setInactive
);

router.use(authController.restrictTo('admin')); // Restrict all routes after this middleware to admin

router
  .route('/') //
  .get(userController.getAllUsers)
  .post(userController.createUser);

router
  .route('/:id') //
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router;
