const bcrypt = require('bcrypt');
const User = require('../model/User');


exports.createuser = async (req, res, next) => {
  try {
    const { username, password, status } = req.body;
    const finduser = await User.findOne({ username: username.toLowerCase() });

    if (finduser) {
      res.status(400).json({status: 400, message: msg})
    }
    const passwordHash = bcrypt.hashSync(password, 10);
    const user = await new User({
      username: username,
      password: passwordHash,
      status: status,
    }).save();
    res.status(200).json({status: 200, message: 'Data Successfully inputed', user})
  } catch (error) {
    next(error);
  }
};