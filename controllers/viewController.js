//const express = require('express');
const catchAsync = require('../modules/catchAsync');
const Tour = require('../models/tourModel');
const Booking = require('../models/bookingModel');
const AppError = require('../modules/appError');
const APIFeatures = require('../modules/apiFeatures');
const authController = require('../controllers/authController');

exports.getOverview = catchAsync(async (req, res, next) => {
  const tours = await Tour.find();
  res.status(200).render('overview', {
    title: 'All Tours',
    tours,
  });
});

exports.getTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findOne({ slug: req.params.slug })
    .populate({
      path: 'guides',
      fields: 'name photo',
    })
    .populate({
      path: 'reviews',
      fields: 'review rating user',
    });
  if (!tour) {
    return next(new AppError('No tour found with that name', 404));
  }

  res.status(200).render('tour', {
    title: `${tour.name} Tour`,
    tour,
    env: process.env,
  });
});

exports.getLoginForm = (req, res) => {
  res.status(200).render('login', {
    title: 'Log into your account',
  });
};

exports.getAccount = (req, res) => {
  res.status(200).render('account', {
    title: 'My Account',
  });
};

exports.returnPhotoName = (req, res) => {
  //console.log('req.file_', req.file);
  res.status(200).json({
    status: 'success',
    data: req.file.filename,
  });
};

exports.getResetForm = (req, res) => {
  res.status(200).render('reset', {
    title: 'Reset Password',
    token: req.params.token,
  });
};

exports.getManageTours = catchAsync(async (req, res) => {
  let { sort, order, limit, page } = { ...req.query };
  //console.log('FIELD: sort, order, limit, page', sort, order, limit, page);
  //console.log(req.query);
  if (!req.query.sort) req.query.sort = sort = 'name';
  if (order == undefined) order = 1;
  if (page == undefined) page = 1;
  if (!limit) page = 1;

  page = parseInt(page);
  order = parseInt(order);
  limit = parseInt(limit);

  if (order === -1 && !sort.startsWith('-')) {
    sort = `-${sort}`;
    req.query.sort = sort;
  }
  if (!req.query.order) req.query.order = order;
  if (!req.query.limit) req.query.limit = limit;
  if (!req.query.page) req.query.page = page;

  //console.log('FIELD: sort, order, limit, page', sort, order, limit, page);
  /*console.log(
    'REQ: sort, order, limit, page',
    req.query.sort,
    req.query.order,
    req.query.limit,
    req.query.page
  );*/

  const features = await new APIFeatures(Tour.find(), req.query)
    .filter()
    .sort()
    .limitFields();

  const docNum = await features.countDocuments();
  const lastpage = !limit ? true : page * limit >= docNum ? true : false;
  //const lastpage = false;

  /*console.log(
    'sort, order, limit, page, docNum, lastpage:',
    sort,
    order,
    limit,
    page,
    docNum,
    lastpage
  );*/
  await features.paginate();
  //console.log('features.query', features.query);
  const tours = await features.query;
  res.status(200).render('managetours', {
    title: 'Manage Tours',
    tours,
    sort: req.query.sort.replace('-', ''),
    order,
    limit,
    page,
    lastpage,
  });
});

exports.getSignupForm = (req, res) => {
  res.status(200).render('signup', {
    title: 'Signup',
  });
};

exports.getMyTours = async (req, res, next) => {
  // 1) Find all bookings
  const bookings = await Booking.find({ user: req.user.id });

  // 2) Find tours with the returned IDs
  const tourIDs = bookings.map((el) => el.tour);
  const tours = await Tour.find({ _id: { $in: tourIDs } });

  res.status(200).render('booking', {
    title: 'My Tours',
    tours,
  });
};
