const mongoose = require('mongoose');

const Userschema = mongoose.Schema({
  socialId: { type: String },
  email: { type: String },
  name: { type: String },
});
module.exports = mongoose.model('User', Userschema);
