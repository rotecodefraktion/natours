/* eslint-disable import/newline-after-import */
const express = require('express');
const router = express.Router();
const tourController = require('../controllers/toursController');
const authController = require('../controllers/authController');
const reviewRouter = require('./reviewRoutes');

// router.param('id', tourController.checkID);

router.use('/:tourId/reviews', reviewRouter);

router // Aliasing
  .route('/top-5-cheap')
  .get(tourController.aliasTopTours, tourController.getAllTours);

router // Aggregation Pipeline
  .route('/tour-stats')
  .get(tourController.getTourStats);

router //
  .route('/monthly-plan/:year')
  .get(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide', 'guide'),
    tourController.monthlyPlan
  );

router
  .route('/tours-within/:distance/center/:latlng/unit/:unit')
  .get(tourController.getToursWithin);

router.route('/distances/:latlng/unit/:unit').get(tourController.getDistances);

router
  .route('/') //
  .get(tourController.getAllTours)
  .post(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.createTour
  );

router
  .route('/:id') //
  .get(tourController.getTour)
  .patch(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.uploadTourImages,
    tourController.resizeTourImages,
    tourController.updateTour
  )
  .delete(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.deleteTour
  );

module.exports = router;
