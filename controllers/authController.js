const { promisify } = require('util');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const catchAsync = require('../modules/catchAsync');
const AppError = require('../modules/appError');
const User = require('../models/userModel');
const Email = require('../modules/email');
const { send } = require('process');
const { create } = require('../models/tourModel');

//########### Handler functions for Users ###########

const signToken = async (id) =>
  jwt.sign({ id: id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

const createToken = async (user, statusCode, req, res) => {
  const token = await signToken(user._id);

  const status = statusCode === 201 ? 'created' : 'success';
  let xforwarded = false;
  console.log(req.headers);
  if (req.headers != undefined) {
    if (req.headers['x-forwarded-proto'] ?? false) {
      if (req.headers['x-forwarded-proto'] === 'https') {
        // only send cookie over https if in production#
        xforwarded = true;
      }
    }
  }

  const cookieOptions = {
    expires: new Date( // set cookie expiration date
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000 // convert to milliseconds
    ),
    httpOnly: true,
    secure: req.secure || req.headers['x-forwarded-proto'] === 'https', // only send cookie over https if in production
  };
  if (process.env.NODE_ENV === 'production') ctrue; // only send cookie over https if in production

  res.cookie('jwt', token, cookieOptions); // send cookie to client browser  (only in memory)
  //console.log(res.cookie);
  // Remove password from output
  user.password = undefined;
  return token;
};
const createSendToken = async (user, statusCode, req, res) => {
  const token = await createToken(user, statusCode, req, res);

  const status = statusCode === 201 ? 'created' : 'success';

  res.status(statusCode).json({
    status,
    token,
    data: {
      user,
    },
    cookie: res.cookie,
  });
};

// #### Create User ####

exports.signup = catchAsync(async (req, res, next) => {
  /// BAD BAD BAD never do this, even not in development
  //const newUSer = await User.create(req.body);

  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
  });

  const signupToken = await newUser.createSignupToken();
  await newUser.save({ validateBeforeSave: false });

  try {
    const validateUrl = `${req.protocol}://${req.headers.host}${req.baseUrl}/signup/${signupToken}`;
    const validateEmail = `${req.protocol}://${req.headers.host}/signup/${signupToken}`;
    await new Email(newUser, validateEmail).sendwelcome();

    const message = `Welcome to Natours! Please validate your email address by clicking on the following link: ${validateUrl}.\nIf you didn't sign up for Natours, please ignore this email!`;

    res.status(200).json({
      status: 'success',
      message,
      validateUrl,
    });
  } catch (err) {
    //console.log(err);
    return next(
      new AppError(
        'There was an error sending the email, please try again later',
        500
      )
    );
  }
});

exports.validateSignup = catchAsync(async (req, res, next) => {
  // Get user based on the token
  const hashedToken = crypto // Hash the token from the URL
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    signupToken: hashedToken,
    signupTokenExpires: { $gt: Date.now() },
  }).setOptions({ ignoreInactiveUsers: true });

  if (!user) {
    return next(
      new AppError(
        `Signup Token is invalid or has expired, please request a new token at ${req.protocol}://${req.headers.host}/signup`,
        400
      )
    );
  }

  user.signupToken = undefined;
  user.signupTokenExpires = undefined;
  user.active = true;

  await user.save({ validateBeforeSave: false });
  // Update changedPasswordAt property for the user
  // Log the user in, send JWT
  //console.log(req.url);
  if (req.api) {
    createSendToken(user, 200, req, res);
  } else {
    const token = await createToken(user, 200, req, res);
    res.redirect('/me');
  }
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new AppError('Please provide email and password', 400));
  }

  const user = await User.findOne({ email }).select('+password');
  if (!user) return next(new AppError('User does not exist', 401));

  const correct = await user.correctPassword(password, user.password);
  if (!correct) {
    return next(new AppError('Incorrect email or password', 401));
  }

  createSendToken(user, 200, req, res);
});

exports.isLoggedIn = catchAsync(async (req, res, next) => {
  // Get token and check if it is there
  if (req.cookies.jwt && req.cookies.jwt !== 'loggedout') {
    const decode = await promisify(jwt.verify)(
      req.cookies.jwt,
      process.env.JWT_SECRET
    );
    //check if user still exists
    const user = await User.findById(decode.id);
    if (!user) return next();

    // Check if user changed password after the token was issued
    if (user.changedPasswordAfter(decode.iat)) {
      return next();
    }
    // Grant access to protected route
    res.locals.user = user; // pass user to the next middleware (pug templates)
  } // pass user to the next middleware
  next();
});

exports.logout = (req, res, next) => {
  const expires = new Date(Date.now() + 10 * 1000); // expires in 10 seconds
  res.cookie('jwt', 'loggedout', {
    expires, // expires in 10 seconds
    httpOnly: true,
  });

  res.status(200).json({
    status: 'success',
    token: 'loggedout',
  });
};

exports.protect = catchAsync(async (req, res, next) => {
  let token;
  // Get token and check if it is there
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt && req.cookies.jwt !== 'loggedout') {
    token = req.cookies.jwt;
  }
  if (!token) {
    return next(new AppError('Please log in to get access', 401));
  }
  //verify token
  const decode = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  //check if user still exists
  const user = await User.findById(decode.id);
  if (!user)
    return next(new AppError('Token belongs to not existing User', 401));

  // Check if user changed password after the token was issued
  if (user.changedPasswordAfter(decode.iat)) {
    return next(
      new AppError('User recently changed password, please login again', 401)
    );
  }
  // Grant access to protected route
  req.user = user; // pass user to the next middleware
  res.locals.user = user; // pass user to the next middleware (pug templates)
  next();
});

exports.restrictTo = // Wrapper function around middleware function for parameterization

    (...roles) =>
    (req, res, next) => {
      if (!roles.includes(req.user.role)) {
        return next(
          new AppError('You do not have permission to perform this action', 403)
        );
      }
      next();
    };

//
exports.forgotPassword = catchAsync(async (req, res, next) => {
  // Get user based on POSTed email
  const user = await User.findOne({ email: req.body.email });
  if (!user)
    return next(new AppError('There is no user with this emailaddress', 404));

  // Create random reset token
  const resetToken = await user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  // Send it to user's email

  try {
    const resetAPIUrl = `${req.protocol}://${req.headers.host}${req.baseUrl}/resetPassword/${resetToken}`;
    const resetURL = `${req.protocol}://${req.headers.host}/resetPassword/${resetToken}`;
    const from = `${process.env.FROM_NOREPLY_NAME} <${process.env.FROM_NOREPLY_EMAIL}>`;
    await new Email(user, resetURL, from).sendPasswordReset();
    //const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to: ${resetURL}.\nIf you didn't forget your password, please ignore this email!`;

    const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to: ${resetAPIUrl}.\nIf you didn't forget your password, please ignore this email!`;

    res.status(200).json({
      status: 'success',
      message,
      reset: resetAPIUrl,
    });
  } catch (err) {
    //console.log(err);
    return next(
      new AppError(
        'There was an error sending the email, please try again later',
        500
      )
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  // Get user based on the token
  const hashedToken = crypto // Hash the token from the URL
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  // If token has not expired and there is a user, set the new password
  if (!user) {
    return next(
      new AppError(
        'Token is invalid or has expired, please request a new token',
        400
      )
    );
  }

  if (req.body.password !== req.body.passwordConfirm) {
    return next(new AppError('Passwords do not match', 400));
  }

  if (req.body.password.length < 8) {
    return next(
      new AppError('Password must be at least 8 characters long', 400)
    );
  }

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;

  await user.save();
  // Update changedPasswordAt property for the user
  // Log the user in, send JWT
  createSendToken(user, 200, req, res);
});

// Update password for logged in user
exports.updatePassword = catchAsync(async (req, res, next) => {
  if (req.body.password !== req.body.passwordConfirm) {
    return next(new AppError('Passwords do not match', 400));
  }

  const updatedUser = await User.findById(req.params.id);
  updatedUser.password = req.body.password;
  updatedUser.passwordConfirm = req.body.passwordConfirm;
  await updatedUser.save();
  // Update changedPasswordAt property for the user
  // Log the user in, send JWT
  createSendToken(updatedUser, 200, req, res);
});
