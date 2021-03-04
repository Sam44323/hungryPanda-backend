const express = require('express');
const bodyparser = require('body-parser');
const mongoose = require('mongoose');
const apiKeys = require('../config');
const multer = require('multer');

const app = express();
const recipesRoutes = require('./routes/recipes-routes');
const usersRoutes = require('./routes/user-routes');

//THE FILE STORAGE CONFIGURATION

//change the file name for storing the file in the server

const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'images');
  },
  filename: (req, file, cb) => {
    cb(null, new Date().toISOString().replace(/:/g, '-') + file.originalname);
  },
});

// THE FILE TYPE FILTER FOR STORING

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === 'image/png' ||
    file.mimetype === 'image/jpg' ||
    file.mimetype === 'image/jpeg'
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

app.use(bodyparser.json({ extended: false }));
app.use(
  multer({ storage: fileStorage, fileFilter: fileFilter }).single('image')
);
app.use('/images', express.static('./images'));
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE');
  next();
});

app.use('/hungrypandaAPI/recipes', recipesRoutes);
app.use('/hungrypandaAPI/users', usersRoutes);

app.use((req, res) => {
  res.status(404).json({ message: 'Please check the url' });
});

app.use((error, req, res, next) => {
  if (res.headerSent) {
    return next(error);
  }
  res.status(error.code || 500);
  res.json({ message: error.message || 'An unknown error occured!' });
});

mongoose
  .connect(apiKeys.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
    useCreateIndex: true,
  })
  .then(() => {
    console.log('Connected to the database');
    app.listen(process.env.PORT || 5000, () => {
      console.log('Connected to the server!');
    });
  })
  .catch((err) => {
    console.log(err);
    console.log("Can't connect to the database");
  });
