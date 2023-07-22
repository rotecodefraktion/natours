const mongoose = require('mongoose');
const multer = require('multer');
const AppError = require('../modules/appError');
const APIFeatures = require('../modules/apiFeatures');
const catchAsync = require('../modules/catchAsync');
const response = require('../modules/response');

//########### Factory Handler functions ###########

exports.createOne = (Model, route) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.create(req.body);
    response(res, 200, doc, route);
  });

exports.getAll = (Model, route) =>
  catchAsync(async (req, res, next) => {
    const features = await new APIFeatures(Model.find(), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();
    // execute query
    //const doc = await features.query.explain();
    const doc = await features.query;

    if (!doc) {
      return next(new AppError(`No documents found`, 404));
    }

    // Send response
    response(res, 200, doc, route);
  });

exports.getOne = (Model, route, popOptions) =>
  catchAsync(async (req, res, next) => {
    let query = Model.findById(req.params.id);
    if (popOptions) query = query.populate(popOptions);
    const doc = await query;

    if (!doc) {
      return next(
        new AppError(`No document found with ID ${req.params.id}`, 404)
      );
    }
    response(res, 200, doc, route);
  });

exports.updateOne = (Model, route) =>
  catchAsync(async (req, res, next) => {
    const options = { new: true, runValidators: true };
    if (!req.params.id) {
      return next(new AppError(`No document ID provided`, 404));
    }

    if (mongoose.Types.ObjectId.isValid(req.params.id) === false) {
      return next(new AppError(`Invalid document ID provided`, 404));
    }
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, options);
    if (!doc) {
      return next(
        new AppError(`No document found with ID ${req.params.id}`, 404)
      );
    }
    response(res, 200, doc, route);
  });

exports.deleteOne = (Model) =>
  catchAsync(async (req, res, next) => {
    await Model.findByIdAndDelete(req.params.id);
    response(res, 204, null);
  });

exports.multerUpload = (fieldType) =>
  catchAsync(async (req, res, next) => {
    const multerStorage = multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, 'public/img/users');
      },
      filename: (req, file, cb) => {
        // user-<user id>-<timestamp>.jpeg
        const ext = file.mimetype.split('/')[1];
        file.filename = `user-${req.user.id}-${Date.now()}.${ext}`;
        cb(null, file.filename);
      },
    });

    const multerFilter = (req, file, cb) => {
      if (file.mimetype.startsWith('image')) {
        cb(null, true);
      } else {
        cb(
          new AppError('Not an image! Please upload only images.', 400),
          false
        );
      }
    };

    const upload = multer({
      storage: multerStorage,
      multerFilter: multerFilter,
    });

    upload.single(fieldType);
    next();
  });
