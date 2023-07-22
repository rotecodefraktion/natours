const multer = require('multer');
const sharp = require('sharp');

const Tour = require('../models/tourModel');

//const APIFeatures = require('../modules/apiFeatures');
const catchAsync = require('../modules/catchAsync');
const factory = require('./handlerFactory');
const response = require('../modules/response');
const AppError = require('../modules/appError');

//########### Handler functions for Tours ###########

exports.setFilter = (req, res, next) => {
  req.filter = {};
  // Get Filter for all reviews for a tour
  if (req.params.tourId) {
    req.filter.tour = req.params.tourId;
    req.query.tour = req.params.tourId;
  }
  // Get Filter for all reviews for a user
  if (!req.params.tourId && req.body.user) {
    req.filter.user = req.body.user;
    req.query.user = req.body.user;
  }
  // Get add All Filters to query
  return next();
};

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image! Please upload only images.', 400), false);
  }
};

const upload = multer({
  storage: multerStorage,
  multerFilter: multerFilter,
});

exports.uploadTourImages = upload.fields([
  { name: 'imageCover', maxCount: 1 },
  { name: 'images', maxCount: 3 },
]);

exports.resizeTourImages = catchAsync(async (req, res, next) => {
  //console.log('req.files', req.files);
  if (!req.files.imageCover || !req.files.images) return next();
  // 1) Cover Image
  req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;
  const basePath = 'public/img/tours/';
  await sharp(req.files.imageCover[0].buffer)
    .resize(2000, 1333)
    .toFormat('jpeg')
    .jpeg({ quality: 75 })
    .toFile(`${basePath}/${req.body.imageCover}`);
  // 2) Images
  req.body.images = [];
  await Promise.all(
    req.files.images.map(async (file, i) => {
      const filename = `tour-${req.params.id}-${Date.now()}-${i + 1}.jpeg`;
      await sharp(file.buffer)
        .resize(2000, 1333)
        .toFormat('jpeg')
        .jpeg({ quality: 75 })
        .toFile(`${basePath}/${filename}`);
      req.body.images.push(filename);
    })
  );
  next();
});

// #### Aliasing ####
exports.aliasTopTours = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name,duration,difficulty,price,ratingsAverage';
  next();
};

// #### Aggregation Pipeline ####
exports.monthlyPlan = catchAsync(async (req, res, next) => {
  const monthInNames = [
    '',
    'january',
    'february',
    'march',
    'april',
    'may',
    'june',
    'july',
    'august',
    'september',
    'october',
    'november',
    'december',
  ];

  const year = req.params.year * 1;
  const plan = await Tour.aggregate([
    {
      $unwind: '$startDates',
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },
    {
      $group: {
        _id: { $month: '$startDates' },
        numTourStarts: { $sum: 1 },
        tours: { $push: '$name' },
      },
    },
    {
      $addFields: {
        month: {
          $arrayElemAt: [monthInNames, '$_id'],
        },
      },
    },
    { $sort: { _id: 1 } },
    { $project: { _id: 0 } },
  ]);
  response(res, 200, plan);
});

exports.getToursWithin = catchAsync(async (req, res, next) => {
  // /tours-within/:distance/center/:latlng/unit/:unit
  const { distance, latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');

  if (!lat || !lng) {
    return next(
      new AppError(
        'Please provide latitude and longitude in the format lat,lng.',
        400
      )
    );
  }

  if (unit !== 'mi' && unit !== 'km') {
    return next(
      new AppError('Please provide unit in the format mi or km.', 400)
    );
  }

  const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;
  const tours = await Tour.find({
    startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } },
  });
  response(res, 200, tours, 'tours');
});

exports.getDistances = catchAsync(async (req, res, next) => {
  const { latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');

  const multiplier = unit === 'mi' ? 0.000621371 : 0.001;

  if (!lat || !lng) {
    next(
      new AppError(
        'Please provide latitutr and longitude in the format lat,lng.',
        400
      )
    );
  }

  const distances = await Tour.aggregate([
    {
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [lng * 1, lat * 1],
        },
        distanceField: 'distance',
        distanceMultiplier: multiplier,
      },
    },
    {
      $project: {
        distance: 1,
        name: 1,
      },
    },
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      data: distances,
    },
  });
});

exports.getTourStats = catchAsync(async (req, res, next) => {
  const stats = await Tour.aggregate([
    {
      $match: { ratingsAverage: { $gte: 4.5 } },
    },
    {
      $group: {
        _id: { $toUpper: '$difficulty' },
        numTours: { $sum: 1 }, //add 1 for each document
        numRatings: { $sum: '$ratingsQuantity' },
        avgRating: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
      },
    },
    {
      $sort: {
        avgPrice: 1,
      },
    },
  ]);
  // Send response
  response(res, 200, stats);
});

// #### CRUD ####
exports.getAllTours = factory.getAll(Tour, 'tours');
exports.getTour = factory.getOne(Tour, 'tour', { path: 'reviews' });
exports.createTour = factory.createOne(Tour, 'tour');
exports.updateTour = factory.updateOne(Tour, 'tour');
exports.deleteTour = factory.deleteOne(Tour);
