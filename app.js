const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const { celebrate, errors, Joi } = require('celebrate');
require('dotenv').config();

const { PORT, DB_URL } = process.env;
const router = require('./routes');
const { signup, signin, signout } = require('./controllers/users');
const auth = require('./middlewares/auth');
const { requestLogger, errorLogger } = require('./middlewares/logger');
const processingErrors = require('./middlewares/processingErrors');

const app = express();
mongoose.connect(DB_URL, {
  useNewUrlParser: true,
}).then(() => {
  console.log('Connected to MongoDB');
});
app.use(cors({
  credentials: true,
  origin: 'http://localhost:3001',
}));
app.use(helmet());
app.use(cookieParser());
app.use(express.json());
app.use(requestLogger);
app.post('/signup', celebrate({
  body: Joi.object().keys({
    email: Joi.string().required().email(),
    password: Joi.string().required().min(2),
    name: Joi.string().required().min(2).max(30),
  }),
}), signup);
app.post('/signin', celebrate({
  body: Joi.object().keys({
    email: Joi.string().required().email(),
    password: Joi.string().required().min(2),
  }),
}), signin);
app.post('/signout', auth, signout);
app.use(auth, router);
app.use(errorLogger);
app.use(errors());
app.use(processingErrors);

app.listen(PORT, () => {
  console.log(`Connected to ${PORT} port`);
});
