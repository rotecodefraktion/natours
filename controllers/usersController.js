const catchAsync = require('../modules/catchAsync');
const User = require('../models/userModel');
const AppError = require('../modules/appError');
const filterObj = require('../modules/filterObj');
const factory = require('./handlerFactory');
const response = require('../modules/response');
const multer = require('multer');
const sharp = require('sharp');

// ######### HANDLER FUNCTIONS ##########

/* For multer-storage-local to DISK 
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
}); */

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

exports.uploadUserPhoto = upload.single('photo');

exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
  //console.log('req.file', req.file);
  if (!req.file) return next();
  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;
  const basePath = 'public/img/users/';
  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 80 })
    .toFile(`${basePath}${req.file.filename}`); // req.file.buffer is the image buffer
  //console.log('req.file.filename', req.file.filename);
  next();
});

exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  //console.log('me', req.params.id);
  next();
};

exports.setInactive = catchAsync(async (req, res, next) => {
  req.user.active = false;
  await req.user.save({ validateBeforeSave: false });
  response(res, 200, req.user, 'user');
});

exports.verifyPassword = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.id).select('+password +active');
  const { passwordCurrent } = req.body;
  if (!passwordCurrent)
    return next(new AppError('Please provide the current password', 400));

  const correct = await user.correctPassword(passwordCurrent, user.password);
  if (!correct) {
    return next(new AppError('Current password is wrong', 401));
  }
  req.user = user;
  next();
});

exports.updateMe = catchAsync(async (req, res, next) => {
  // 1. Create error if user POSTs password data

  if (req.body.password || req.body.passwordConfirm) {
    next(
      new AppError(
        'This route is not for password updates. Please use /updateMyPassword',
        400
      )
    );
  }
  req.body = filterObj(req.body, 'name', 'email', 'photo');
  req.body.photo = req.body.photo.split('/').pop();
  //console.log('body', req.body);

  if (req.file) req.body.photo = req.file.filename;
  next();
});

exports.createUser = (req, res, next) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not yet implemented, please use /signup',
  });
};

// Factory functions
exports.getAllUsers = factory.getAll(User, 'users');
exports.getUser = factory.getOne(User, 'user');
exports.updateUser = factory.updateOne(User, 'user');
exports.deleteUser = factory.deleteOne(User);
