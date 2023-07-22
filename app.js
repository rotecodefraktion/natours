/* eslint-disable import/newline-after-import */
const path = require('path');
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const compression = require('compression'); // compress text sent to client
const xss = require('xss-clean'); // sanitize user input from malicious html code
const hpp = require('hpp'); // prevent parameter pollution
const mongoSanitize = require('express-mongo-sanitize'); // sanitize user input from malicious mongoDB operators
const cors = require('cors');
const cookieParser = require('cookie-parser');
const AppError = require('./modules/appError');
const globalErrorHandler = require('./controllers/errorController');
const tourRouter = require('./routes/tourRoutes');
const bookingRouter = require('./routes/bookingRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const viewRouter = require('./routes/viewRoutes');

const app = express();
app.use(compression());

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views')); // set path to views folder

// serve static files from public folder

app.use(express.static(path.join(__dirname, 'public')));

// Set security HTTP Headers
app.use(
  helmet({
    crossOriginEmbedderPolicy: false,
  })
);

// Further HELMET configuration for Security Policy (CSP)
const scriptSrcUrls = [
  'https://api.tiles.mapbox.com/',
  'https://api.mapbox.com/',
  'https://*.cloudflare.com',
  'https://js.stripe.com/v3/',
  'https://checkout.stripe.com',
  'unsafe-eval',
];
const styleSrcUrls = [
  'https://api.mapbox.com/',
  'https://api.tiles.mapbox.com/',
  'https://fonts.googleapis.com/',
  'https://www.myfonts.com/fonts/radomir-tinkov/gilroy/*',
  'checkout.stripe.com',
];
const connectSrcUrls = [
  'https://*.mapbox.com/',
  'https://*.cloudflare.com',
  'http://127.0.0.1:8000',
  'http://127.0.0.1:1234',
  '*.stripe.com',
];

const fontSrcUrls = ['fonts.googleapis.com', 'fonts.gstatic.com'];

// Compress all HTTP responses
const oneDay = 86400000;

app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: [],
      connectSrc: ["'self'", ...connectSrcUrls],
      scriptSrc: ["'self'", ...scriptSrcUrls],
      workerSrc: ["'self'", 'blob:'],
      styleSrc: ["'self'", "'unsafe-inline'", ...styleSrcUrls],
      objectSrc: [],
      imgSrc: ["'self'", 'blob:', 'data:'],
      fontSrc: ["'self'", ...fontSrcUrls],
      frameSrc: ['*.stripe.com', '*.stripe.network'],
    },
  })
);

console.log('Node running in', process.env.NODE_ENV, 'mode');
console.log(
  'DB running with',
  process.env.DB_ENV === 'local' ? 'local database' : 'cloud database'
);

// Global Middleware for all routes

// Development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Limit requests from same IP
const limiter = rateLimit({
  max: process.env.API_RATE_LIMIT_MAX, // n requests from same IP
  windowMs: process.env.API_RATE_LIMIT_WINDOW * 60 * 1000, // per x minutes
  message: `Too many requests from this IP, please try again in ${process.env.API_RATE_LIMIT_WINDOW} minutes`,
});

app.use('/api', limiter); // apply limiter to all routes starting with /api
// middleware to parse json data from body into req.body

// Limit to a maximum of 10kb
app.use(express.json({ limit: '10kb' }));
// cookie parser middleware
app.use(cookieParser());

// Sanitize user input from malicious mongoDB operators
app.use(mongoSanitize());

// Sanitize user input from malicious html code
app.use(xss());

// Prevent parameter pollution
app.use(
  hpp({
    whitelist: [
      // whitelist properties that can be duplicated
      'duration',
      'ratingsQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  })
);
//app.use(compression()); // compress text sent to client
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString(); // add a property to the request object
  //console.log(req.cookies);
  if (req.url.startsWith('/api/')) {
    req.api = true;
  } else {
    req.api = false;
  }
  console.log('req.requestTime', req.requestTime);
  console.log('req.url', req.url);
  console.log('req.query', req.query);
  console.log('req.params', req.params);
  next();
});

// ROUTES

// Pug Routes for rendering pages
app.use('/', viewRouter);
// API routes

app.use('/login', viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/booking', bookingRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);

app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);

module.exports = app;
