// Desc: Booking Controller
const Booking = require('../models/bookingModel');

const stripe = require('stripe')(
  'sk_test_51NVKDBGB3eeV2MLOEPnIgWg0Z4ZNdkXhi6w05BUn1MNp5iJjGYAy1kxnhiz5LtRxORFxFK86PWTUiU2Zh8A1qMk400XVHiBavp'
);
const Tour = require('../models/tourModel');
const catchAsync = require('../modules/catchAsync');

const response = require('../modules/response');
const AppError = require('../modules/appError');

//########### Handler functions for Tours ###########

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  // 1) Get the currently booked tour
  const tour = await Tour.findById(req.params.tourId);

  // 2) Create checkout session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'payment',
    // workaround for tests
    success_url: `${req.protocol}://${req.get('host')}/?tour=${
      req.params.tourId
    }&user=${req.user.id}&price=${tour.price}`,
    //
    cancel_url: `${req.protocol}://${req.get('host')}/tours/${tour.slug}`,
    customer_email: req.user.email,
    client_reference_id: req.params.tourId,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: 'usd',
          unit_amount: tour.price * 100,
          product_data: {
            name: `${tour.name} Tour`,
            description: tour.summary,
            images: [`https://www.natours.dev/img/tours/${tour.imageCover}`],
          },
        },
      },
    ],
  });

  // 3) Create session as response
  res.status(200).json({
    status: 'success',
    session,
  });
});

exports.createBookingCheckout = catchAsync(async (req, res, next) => {
  // only temporary solution
  const { tour, user, price } = req.query;
  if (!tour && !user && !price) return next();

  await Booking.create({ tour, user, price });
  res.redirect(req.originalUrl.split('?')[0]);
});
