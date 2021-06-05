const JWT = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const User = require('../model/User');

const JWTsecret = process.env.JWT_KEY;


exports.login = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    const login = await User.findOne({ username: username });
    if (!login) {
      return res.status(404).json({message: 'Data Not Found'})
    }
    const compare = bcrypt.compareSync(password, login.password);
    if (!compare) {
      return res.status(401).json({message: 'password not match'})
    }
    const token = JWT.sign({ _id: login._id }, JWTsecret, { expiresIn: '24h' });
    res.status(200).json({message: 'Login Succes', token: token})
  } catch (error) {
    next(error);
  }
};
