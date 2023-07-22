/* eslint-disable import/newline-after-import */
const mongoose = require('mongoose');
const Tour = require('./tourModel');

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'A review must have a description'],
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: [true, 'A review must have a rating'],
    },
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'Review must belong to a tour.'],
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Review must belong to a user'],
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Static method
// Calculate the average rating of a tour
reviewSchema.statics.calcAverageRatings = async function (tourId) {
  // this points to the current model
  const stats = await this.aggregate([
    { $match: { tour: tourId } },
    {
      $group: {
        _id: '$tour',
        nRatings: { $sum: 1 },
        avgRating: { $avg: '$rating' },
      },
    },
  ]);
  //console.log('stats', stats);
  if (stats.length > 0) {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: stats[0].nRatings,
      ratingsAverage: stats[0].avgRating,
    });
  } else {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: 0,
      ratingsAverage: 4.5,
    });
  }
};

reviewSchema.pre(/^find/, function (next) {
  // populate the guides field with the user data
  //this.populate({
  //  path: 'tour',
  //  select: 'name',
  //})
  this.populate({
    path: 'user',
    select: 'name photo',
  });
  next();
});

reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

reviewSchema.post(/findOneAnd/, async (doc) => {
  await doc.constructor.calcAverageRatings(doc.tour);
});

reviewSchema.post('save', function () {
  // this points to the current review document after it was saved
  // this.constructor points to the current model and is the same as Review
  // Review is not defined yet, so we use this.constructor
  this.constructor.calcAverageRatings(this.tour);
}); // post middleware doesn't get access to next()

const Review = mongoose.model('Review', reviewSchema);
module.exports = Review;
