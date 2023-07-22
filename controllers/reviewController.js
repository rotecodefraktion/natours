const Review = require('../models/reviewModel');
const factory = require('./handlerFactory');

//########### Handler functions for Reviews ###########

// #### Get All Reviews ####

exports.setFilter = (req, res, next) => {
  req.filter = {};
  // Get Filter for all reviews for a tour
  if (req.params.tourId) {
    req.filter.tour = req.params.tourId;
    req.query.tour = req.params.tourId;
  } else if (req.body.user) {
    req.filter.user = req.body.user;
    req.query.user = req.body.user;
  }
  // Get add All Filters to query

  return next();
};

exports.setTourUserIds = (req, res, next) => {
  if (!req.body.tour) req.body.tour = req.params.tourId;
  if (!req.body.user) req.body.user = req.user.id;
  if (req.user.role !== 'admin') {
    req.body.user = req.user.id;
  } else if (!req.body.user) {
    req.body.user = req.user.id;
  }
  return next();
};

// #### Get Review ####
exports.getAllReviews = factory.getAll(Review, 'reviews');
exports.getOneReview = factory.getOne(Review, 'review');
exports.createReview = factory.createOne(Review, 'review');
exports.updateReview = factory.updateOne(Review, 'review');
exports.deleteReview = factory.deleteOne(Review);
