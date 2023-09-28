const router = require('express').Router();
const userRouter = require('./users');
const moviesRouter = require('./movies');

const NotFoundError = require('../errors/NotFoundErr');

router.use('/users', userRouter);
router.use('/movies', moviesRouter);
router.patch('*', (req, res, next) => {
  next(new NotFoundError('Страница не найдена'));
});

module.exports = router;
