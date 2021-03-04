const errorCreator = require('../errorCreator/errorCreator');
const { validationResult } = require('express-validator');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const User = require('../models/users-models');

const getUserData = (req, res, next) => {
  User.findById(req.params.id)
    .populate('recipes', 'likes')
    .exec()
    .then((user) => {
      if (!user) {
        return next(errorCreator('No such user exists!'));
      }
      const totalLikes = user.recipes.reduce((prev, curr) => {
        return prev + curr.likes;
      }, 0);
      res.status(200).json({ user, totalLikes });
    })
    .catch((err) => {
      console.log(err);
      next(errorCreator("Can't fetch the user data at this moment!"));
    });
};

const LikedRecipes = (req, res, next) => {
  User.findById(req.userId)
    .populate('likedRecipes')
    .exec((err, user) => {
      if (err) {
        return next(errorCreator("Can't find the requested user!"));
      }
      res.status(200).json({ user });
    });
};

const addNewUser = (req, res, next) => {
  const error = validationResult(req);
  if (!error.isEmpty()) {
    return next(errorCreator(error.errors[0].msg, 422));
  }
  User.findOne({ email: req.body.email })
    .then((user) => {
      if (user) {
        return next(
          errorCreator('An user already exists with this email!', 409)
        );
      }
      bcrypt
        .hash(req.body.password, 12)
        .then((password) => {
          const newUser = new User({
            name: req.body.name,
            image: req.body.image,
            password,
            email: req.body.email,
            userName: req.body.userName,
            age: req.body.age,
            socialMedia: req.body.socialMedia,
            location: req.body.location,
          });
          return newUser.save();
        })
        .then((user) => {
          res.status(200).json({ newUser: user });
        });
    })
    .catch((err) => {
      console.log(err);
      next(errorCreator("Can't create a new user at this moment!"));
    });
};

const editUserData = (req, res, next) => {
  const error = validationResult(req);
  if (!error.isEmpty()) {
    return next(
      errorCreator(
        'Please check all the informations entered or enter all the required informations!'
      )
    );
  }
  const { name, image, email, userName, age, socialMedia, location } = req.body;
  const newUser = {
    name,
    image,
    email,
    userName,
    age,
    socialMedia,
    location,
  };

  User.findByIdAndUpdate(req.params.id, { ...newUser })
    .then(() => {
      res.status(201).json('Successfully updated the user data!');
    })
    .catch(() => {
      next(errorCreator("Can't updated the user data at this moment!"));
    });
};

const loginUser = (req, res, next) => {
  const { email, password } = req.body;
  let userData;
  User.findOne({ email: email })
    .then((user) => {
      if (!user) {
        return next(errorCreator('An user with such email is not found!', 401));
      }
      userData = user;
      return bcrypt.compare(password, user.password);
    })
    .then((isValid) => {
      if (!isValid) {
        return next(errorCreator('The password entered is incorrect!', 401));
      }

      const token = jwt.sign(
        {
          email: userData.email,
          userId: userData._id.toString(),
        },
        process.env.JWT_KEY,
        {
          expiresIn: '1h', // token will become invalid after one hour
        }
      );
      res.status(200).json({ token, userId: userData._id.toString() });
    })
    .catch((err) => {
      console.log(err);
      next(errorCreator('Please try to log in after a few moments!', 401));
    });
};

const logUserOut = (req, res, next) => {
  res.status(200).json({ message: 'You are logged out!' });
};

exports.getUserData = getUserData;
exports.LikedRecipes = LikedRecipes;
exports.addNewUser = addNewUser;
exports.editUserData = editUserData;
exports.loginUser = loginUser;
exports.logUserOut = logUserOut;
