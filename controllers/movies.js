const mongoose = require('mongoose');

const Movies = require('../models/movie');
const BadRequest = require('../errors/BadRequest');
const NotFoundError = require('../errors/NotFoundErr');
const ForbiddenRequest = require('../errors/ForbiddenRequest');

module.exports.getMovies = (req, res, next) => Movies.find({})
  .orFail()
  .then((movies) => res.send({ data: movies }))
  .catch(next);

module.exports.postMovies = (req, res, next) => {
  const {
    country, director, duration, year, description, image, trailerLink, thumbnail, movieId, nameRU, nameEN,
  } = req.body;

  return Movies.create({
    country, director, duration, year, description, image, trailerLink, thumbnail, movieId, nameRU, nameEN, owner: req.user._id,
  })
    .then((movies) => res.status(201).send({ data: movies }))
    .catch((err) => {
      if (err instanceof mongoose.Error.ValidationError) {
        next(new BadRequest('Ошибка данных'));
      } else {
        next(err);
      }
    });
};

module.exports.deleteMovies = (req, res, next) => {
  Movies.findById(req.params.movieId)
    .orFail(new NotFoundError('Такого фильма не существует'))
    .then((movie) => {
      if (movie.owner.toString() !== req.user._id) {
        throw new ForbiddenRequest('Нельзя удалить чужой фильм');
      }

      return Movies.findByIdAndDelete(req.params.movieId)
        .then((result) => res.send({ data: result }));
    })
    .catch((err) => {
      if (err instanceof mongoose.Error.CastError) {
        next(new BadRequest('Ошибка данных'));
      } else {
        next(err);
      }
    });
};
