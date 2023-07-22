const dotenv = require('dotenv');

// eslint-disable-next-line import/no-extraneous-dependencies
const mongoose = require('mongoose');

dotenv.config({ path: './config.env' });

// start listenining to caught exception before any code is executed
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  console.log(err.name, err.message);
  console.log(err);
  process.exit(1);
});

const app = require('./app');

const port = dotenv.PORT || 8000;

const DB =
  process.env.DB_ENV === 'local'
    ? process.env.DATABASE_LOCAL
    : process.env.DATABASE.replace(
        '<DATABASE_PASSWORD>',
        process.env.DATABASE_PASSWORD
      )
        .replace('<DATABASE_NAME>', process.env.DATABASE_NAME)
        .replace('<DATABASE_SCHEMA>', process.env.DATABASE_SCHEMA)
        .replace('<DATABASE_USER>', process.env.DATABASE_USER);

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    //useCreateIndex: true, // https://mongoosejs.com/docs/deprecations.html#createindex
    //useFindAndModify: false, // https://mongoosejs.com/docs/deprecations.html#findandmodify
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log(
      process.env.DB_ENV === 'local'
        ? 'Local DB connection successful!'
        : 'Cloud DB connection successful!'
    );
  });

mongoose.set('autoIndex', true);
const server = app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});

process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION! 💥 Shutting down...');
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});

process.on('SIGTERM', () => {
  console.error('SIGTERM received: ... Shutting down gracefully');
  server.close(() => {
    console.log('Process terminated!');
  });
});
