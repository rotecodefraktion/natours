/* eslint-disable import/newline-after-import */
const mongoose = require('mongoose');
const slugify = require('slugify');
const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have a name'], // validator
      unique: true,
      minLength: 10,
      maxLength: 20,
    },
    duration: {
      type: Number,
      required: [true, 'A tour must hava a duration'],
      min: 1,
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a group size'],
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have a difficulty'],
      enum: {
        values: ['easy', 'medium', 'difficult', 'hard'],
        messages:
          'Please pick a valid difficulty, only easy, medium and hard are allowed',
      },
    },
    guides: [{ type: mongoose.Schema.ObjectId, ref: 'User' }],
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: 1,
      max: 5,
      set: (val) => Math.round(val * 10) / 10,
      // 4.6666 => 5 to get 4.5 * 10 round divide by 10
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, 'A tour must have a price'], // validator
    },
    priceDiscount: {
      type: Number,
      message: 'Discount price ({VALUE}) should be below regular price',
      // validator function only works on create and save
      validate: {
        validator: function (val) {
          return val < this.price;
        },
      },
    },
    summary: {
      type: String,
      trim: true,
      required: [true, 'A tour must have a description'], // validator
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      required: [true, 'A tour must have a cover image'], // validator
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false, // hide this field from the output of the query
    },
    startDates: [Date],
    slug: String,
    secretTour: { type: Boolean, default: false },

    startLocation: {
      // GeoJSON
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'],
      },
      coordinates: [Number], // [longitude, latitude]
      address: String,
      description: String,
    },
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point'],
        },
        coordinates: [Number], // [longitude, latitude]
        address: String,
        description: String,
        day: Number,
      },
    ],
  },
  {
    autoIndex: true,
    toJSON: { virtuals: true }, // show virtual properties in the output
    toObject: { virtuals: true }, // show virtual properties in the output
  }
);

tourSchema.virtual('durationWeeks').get(function () {
  return this.duration / 7;
});

tourSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour',
  localField: '_id',
});

tourSchema.index({ slug: 1 });
tourSchema.index({ price: 1, ratingsAverage: -1 });
tourSchema.index({ startLocation: '2dsphere' });

/* tourSchema.virtual('month').get(function () {
  let returnString = '';
  // eslint-disable-next-line array-callback-return
  if (!this.startDates) return returnString;
  this.startDates.forEach((el) => {
    const date = new Date();
    date.setMonth(el.getMonth() - 1);
    const month = date.toLocaleString('en-US', { month: 'long' });
    returnString += returnString === '' ? month : `, ${month}`;
  });
  return returnString;
}); */

// ########### MIDDLEWARES ###########
/*tourSchema.post('save', function (doc, next) {
  // doc is the document that is saved this is the current query if needed then function (doc, next)
  console.log('Query took ', Date.now() - this.start, ' milliseconds');
  next();
});

tourSchema.post(/^find/, function (doc, next) {
  // doc is the document that is saved this is the current query if needed then function (doc, next)
  console.log('Query took ', Date.now() - this.start, ' milliseconds');
  next();
});*/

// ########### QUERY MIDDLEWARES ###########
// pre find hook runs before .find() and .findOne()
// example of excluding secret tours from the output
tourSchema.pre(/^find/, function (next) {
  this.find({ secretTour: { $ne: true } });
  this.start = Date.now();
  next();
});

tourSchema.pre(/^find/, function (next) {
  // populate the guides field with the user data
  this.populate({
    path: 'guides',
    select: '-__v -passwordChangedAt',
  });
  next();
});

// pre save hook runs before .save() and .create() not on .insertMany()
tourSchema.pre('save', function (next) {
  //console.log('this', this);
  this.start = Date.now();
  next();
});

tourSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true });
  //console.log('this.slug', this.slug);
  //console.log('this', this);
  next();
});

// ########### AGGREGATION MIDDLEWARES ###########
tourSchema.pre('aggregate', function (next) {
  this.pipeline().push({
    $match: { secretTour: { $ne: true } },
  });
  next();
});

const Tour = mongoose.model('Tour', tourSchema);
module.exports = Tour;
