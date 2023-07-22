const mongoose = require('mongoose');
const crypto = require('crypto');
const brcypt = require('bcryptjs');

const validator = require('validator');

const userSchema = new mongoose.Schema({
  // name, email, photo, password, passwordConfirm
  name: {
    type: String,
    required: [true, 'A user must have a username'],
    unique: true,
    minLength: 4,
    maxLength: 20,
  },
  email: {
    type: String,
    required: [true, 'A user must have an email'],
    unique: true,
    minLength: 5,
    validate: [validator.isEmail, 'Please provide a valid email'],
  },
  role: {
    type: String,
    enum: {
      values: ['user', 'admin', 'guide', 'lead-guide'],
      messages: 'You must select a valid role',
    },
    default: 'user',
    select: true,
  },

  photo: {
    type: String,
    default: 'default.jpg',
  },

  active: {
    type: Boolean,
    default: false,
    select: false,
  },

  password: {
    type: String,
    required: [true, 'A user must have a password'],
    select: false,
    validate: {
      validator: function (val) {
        const reg =
          /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&._])[A-Za-z\d@$!%*?&:_]{8,}$/;
        return reg.test(val);
      },
      message: `Password must contain at least one uppercase letter, one lowercase letter, one number and one special character and must be at least 8 characters long`,
    },
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please confirm your password'],
    validate: {
      message: 'Passwords do not match',
      validator: function (val) {
        return val === this.password;
      },
    },
  },
  passwordResetToken: String,
  passwordResetExpires: Date, // Date when the token expires
  signupToken: String, //Signup token
  signupTokenExpires: Date, // Date when the token expires
  changedTimestamp: Date,
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  this.password = await brcypt.hash(this.password, 12);
  this.passwordConfirm = undefined;
  next();
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || this.isNew) return next();
  this.passwordChangedAt = Date.now() - 1000; // 1 second delay to ensure the token is created after the password is changed  (in case the token is created before the password is changed)
  next();
});

// Filter out inactive users
userSchema.pre(/^find/, function (next) {
  if (this.options.ignoreInactiveUsers) return next();
  this.find({ active: { $ne: false } });
  next();
});

userSchema.pre(/^find/, function (next) {
  this.select('-__v');
  next();
});

// Compare Passwords for login
userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  // retrun true if the passwords match
  return await brcypt.compare(candidatePassword, userPassword);
};

// Check if the user changed the password after the token was issued
userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    // get ChangePassword timestamp in seconds
    const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000);
    //console.log(changedTimestamp, JWTTimestamp);
    // Return true if the password was changed after the token was issued
    return JWTTimestamp < changedTimestamp;
  }
  // Return false if the password was not changed after the token was issued
  return false;
};

userSchema.methods.createPasswordResetToken = async function () {
  // Create a random token
  const resetToken = crypto.randomBytes(32).toString('hex'); // Create a random token
  // Encrypt the token and store it in the database
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex'); // Encrypt the token and store it in the database
  // Set the expiration time to 10 minutes and store it in the database
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // Set the expiration time to 10 minutes
  // Send the unencrypted token to the user
  return resetToken;
};

userSchema.methods.createSignupToken = async function () {
  // Create a random token
  const randomToken = crypto.randomBytes(32).toString('hex'); // Create a random token
  // Encrypt the token and store it in the database
  this.signupToken = crypto
    .createHash('sha256')
    .update(randomToken)
    .digest('hex'); // Encrypt the token and store it in the database
  // Set the expiration time to 10 minutes and store it in the database
  this.signupTokenExpires = Date.now() + 10 * 60 * 1000; // Set the expiration time to 10 minutes
  // Send the unencrypted token to the user
  return randomToken;
};

const User = mongoose.model('User', userSchema);
module.exports = User;
