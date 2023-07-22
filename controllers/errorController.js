const AppError = require('../modules/appError');

const sendDevelopmentError = (err, req, res) => {
  if (req.originalUrl.startsWith('/api')) {
    res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack,
    });
  } else {
    res.status(err.statusCode).render('error', {
      title: 'Something went wrong!',
      statusCode: err.statusCode,
      msg: err.message,
      stack: err.stack,
    });
  }
};

const sendProductionsError = (err, req, res) => {
  if (req.originalUrl.startsWith('/api')) {
    if (err.isOperational) {
      res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      });
    } else {
      console.error('ERROR 💥💥💥💥\n', err);
      res.status(500).json({
        status: 'error',
        message: 'Something went wrong! :(',
      });
    }
  } else {
    if (err.isOperational) {
      res.status(500).render('error', {
        title: 'Ups something went wrong!',
        statusCode: err.statusCode,
        msg: err.message,
      });
    } else {
      res.status(500).render('error', {
        title: 'Sorry something went terrible wrong!',
        statusCode: 500,
        msg: 'Our support team was informed. Please try again later.',
      });
    }
  }
};

const handleCastErrorDB = (err) =>
  new AppError(`Invalid ${err.path}: ${err.value}.`, 400);

const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);

  const message = `Invalid input data: ${errors.join('. ')}`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = (err) => {
  err.local = err.message.match(
    /.+(duplicate key error).+index: (.+) dup key:/
  );
  const value = err.message.match(/(["'])(\\?.)*?\1/)[0];
  let message = `Duplicate field value: ${value}. Please use different value!`;
  if (err.local[1] === 'duplicate key error') {
    if (err.local[2] === 'tour_1_user_1')
      message = `You have already reviewed this tour!`;
  }
  return new AppError(message, 400);
};

const handleJWTError = (err) => {
  if (err.name === 'TokenExpiredError') {
    //err.isOperational = true;

    err.status = 'fail';
    return new AppError(`Your token is expired. Please log in again!`, 401);
  }
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendDevelopmentError(err, req, res);
  } else {
    //if (process.env.NODE_ENV === 'production') {
    let error = { ...err };
    error.message = err.message;
    error.stack = err.stack;

    if (error.stack.startsWith('CastError:')) error = handleCastErrorDB(error);
    if (error.stack.startsWith('ValidationError:'))
      error = handleValidationErrorDB(error);
    if (err.code === 11000) error = handleDuplicateFieldsDB(error);
    if (error.name === 'TokenExpiredError') error = handleJWTError(error);
    sendProductionsError(error, req, res);
  }
};
