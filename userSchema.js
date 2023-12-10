const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  confirm_password: String,
  points:{
    type: Number,
    default: 0,
  },
  failedLoginAttempts: { type: Number, default: 0 },
  lastFailedLogin: { type: Date, default: null },
}, {timestamps: true});

const User = mongoose.model('User', userSchema);

module.exports = User;