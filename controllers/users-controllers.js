const errorCreator = require('../errorCreator/errorCreator');
const { validationResult } = require('express-validator');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { deleteFiles } = require('../constants/fileFunctions');

const User = require('../models/users-models');
const Recipes = require('../models/recipes-models');

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
    if (req.file) {
      deleteFiles(req.file.path.replace(/\\/g, '/'));
    }
    return next(errorCreator(error.errors[0].msg, 422));
  } else if (!req.file) {
    return next(errorCreator('Image is required for creating a recipe', 422));
  }

  const image = req.file.path.replace(/\\/g, '/');

  User.findOne({ email: req.body.email })
    .then((user) => {
      if (user) {
        deleteFiles(req.file.path.replace(/\\/g, '/'));
        return next(
          errorCreator('An user already exists with this email!', 409)
        );
      }
      bcrypt
        .hash(req.body.password, 12)
        .then((password) => {
          const newUser = new User({
            name: req.body.name,
            password,
            email: req.body.email,
            userName: req.body.userName,
            age: JSON.parse(req.body.age),
            image,
            socialMedia: JSON.parse(req.body.socialMedia),
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
    if (req.file) {
      deleteFiles(req.file.path.replace(/\\/g, '/'));
    }
    return next(
      errorCreator(
        'Please check all the informations entered or enter all the required informations!'
      )
    );
  } else if (JSON.parse(req.body.age) < 1) {
    return next(errorCreator('Please enter an age!', 422));
  }
  const { name, email, userName, age, socialMedia, location } = req.body;
  const newUser = {
    name,
    email,
    userName,
    age: JSON.parse(age),
    socialMedia: JSON.parse(socialMedia),
    location,
  };

  User.findById(req.params.id)
    .then((user) => {
      if (req.file) {
        deleteFiles(user.image);
        newUser.image = req.file.path.replace(/\\/g, '/');
      }
      return User.findByIdAndUpdate(req.params.id, { ...newUser });
    })
    .then(() => {
      res.status(201).json('Successfully updated the user data!');
    })
    .catch((err) => {
      console.log(err);
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
      //creating a JWT for the logged in user
      const token = jwt.sign(
        {
          email: userData.email,
          userId: userData._id.toString(),
        },
        'HUNGRY_PANDA_JWT_SECRET',
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

const deleteUser = (req, res, next) => {
  let recipesId;
  User.findById(req.userId)
    .select({ recipes: 1, image: 1, _id: 0 })
    .then((data) => {
      recipesId = data.recipes;
      deleteFiles(data.image);
      return Recipes.find({ _id: { $in: data.recipes } }).distinct('image');
    })
    .then((image) => {
      for (let item of image) {
        deleteFiles(item);
      }
      return User.updateMany(
        { likedRecipes: { $in: recipesId } },
        { $pullAll: { likedRecipes: recipesId } }
      );
    })
    .then(() =>
      Recipes.updateMany(
        { likedBy: req.userId },
        { $pull: { likedBy: req.userId }, $inc: { likes: -1 } }
      )
    )
    .then(() => Recipes.deleteMany({ _id: { $in: recipesId } }))
    .then(() => User.findByIdAndDelete(req.userId))
    .then(() => res.status(201).json({ message: 'Deleted the user!' }))
    .catch(() => {
      return next(errorCreator('Please try again!'));
    });
};

exports.getUserData = getUserData;
exports.LikedRecipes = LikedRecipes;
exports.addNewUser = addNewUser;
exports.editUserData = editUserData;
exports.loginUser = loginUser;
exports.logUserOut = logUserOut;
exports.deleteUser = deleteUser;
