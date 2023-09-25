const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const User = require('../models/user');
const NotFoundError = require('../errors/NotFoundErr');
const BadRequest = require('../errors/BadRequest');
const ConflictErr = require('../errors/ConflictErr');

const { JWT_SECRET = 'hellow-worlds' } = process.env;

module.exports.getMe = (req, res, next) => User.findById(req.user._id)
  .orFail(new NotFoundError('Пользователь не найден'))
  .then((user) => res.send({ data: user }))
  .catch((err) => {
    if (err instanceof mongoose.Error.CastError) {
      next(new BadRequest('Неправильный ID'));
    } else {
      next(err);
    }
  });

module.exports.patchMe = (req, res, next) => {
  const { email, name } = req.body;

  return User.findByIdAndUpdate(req.user._id, { email, name }, { new: true, runValidators: true })
    .orFail(new NotFoundError('Пользователь не найден'))
    .then((user) => res.send({ data: user }))
    .catch(next);
};

module.exports.signup = (req, res, next) => {
  const { email, password, name } = req.body;

  bcrypt.hash(password, 10)
    .then((hash) => User.create({
      name, email, password: hash,
    }))
    .then((user) => res.status(201).send({
      name: user.name, email,
    }))
    .catch((err) => {
      if (err instanceof mongoose.Error.ValidationError) {
        next(new BadRequest('Ошибка данных'));
      } else if (err.code === 11000) {
        next(new ConflictErr('Такая почта уже используется'));
      } else {
        next(err);
      }
    });
};

module.exports.signin = (req, res, next) => {
  const { email, password } = req.body;

  return User.findUserByCredentials(email, password)
    .then((user) => {
      const token = jwt.sign(
        { _id: user._id },
        JWT_SECRET,
        {
          expiresIn: '7d',
        },
      );

      res.cookie('jwt', token, {
        maxAge: 3600000,
        httpOnly: true,
      });

      res.send({
        _id: user._id, name: user.name, email, token,
      });
    })
    .catch(next);
};

module.exports.signout = (req, res, next) => {
  res.status(202).clearCookie('jwt').send('Cookie cleared');
  return next();
};
