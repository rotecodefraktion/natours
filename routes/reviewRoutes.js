/* eslint-disable import/newline-after-import */
const express = require('express');
const router = express.Router({ mergeParams: true });
const authController = require('../controllers/authController');
const reviewController = require('../controllers/reviewController');

router.use(authController.protect);

router
  .route('/')
  .get(reviewController.setFilter, reviewController.getAllReviews)
  .post(
    authController.restrictTo('user'),
    reviewController.setTourUserIds,
    reviewController.createReview
  );

router
  .route('/:id')
  .get(
    reviewController.setTourUserIds,
    reviewController.setFilter,
    reviewController.getOneReview
  )
  .patch(
    authController.protect,
    authController.restrictTo('user', 'admin'),
    reviewController.updateReview
  )
  .delete(
    authController.protect,
    authController.restrictTo('user', 'admin'),
    reviewController.deleteReview
  );

module.exports = router;
