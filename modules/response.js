module.exports = (res, statusCode, data, route) => {
  let status = '';
  switch (true) {
    case statusCode >= 200 && statusCode <= 299:
      status = 'success';
      break;
    case statusCode >= 400 && statusCode <= 499:
      status = 'fail';
      break;
    default:
      status = 'error';
  }

  if (data == null) {
    //console.log('data', data);
    res.status(statusCode).json({
      status,
      data: null,
    });
  } else {
    const results = !data.length ? 1 : data.length;
    res.status(statusCode).json({
      status,
      results,
      data: { [route]: data },
    });
  }
};
