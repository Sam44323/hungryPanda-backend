const { validationResult } = require('express-validator');
const errorCreator = require('../errorCreator/errorCreator');
const { ObjectId } = require('mongodb');
const User = require('../models/users-models');
const { ADD_LIKES, REMOVE_LIKES } = require('../constants/server-constants');
const { deleteFiles } = require('../constants/fileFunctions');

const Recipe = require('../models/recipes-models');

//helper functions

const errorCreatorFunction = (req, error) => {
  if (req.file) {
    deleteFiles(req.file.path.replace(/\\/g, '/'));
  }
  return errorCreator(error, 422);
};

//main controller functions

const getAllRecipes = (req, res, next) => {
  Recipe.find({ creatorId: { $ne: req.userId } })
    .then((recipes) => {
      res.status(200).json({ recipes });
    })
    .catch((err) => {
      next(
        errorCreator(
          "Can't fetch the recipes now, please try after some moments!"
        )
      );
    });
};

const getRecipe = (req, res, next) => {
  const recipeId = req.params.id;
  Recipe.findById(recipeId)
    .populate('creatorId', 'userName')
    .exec((err, recipe) => {
      if (err) {
        return next(errorCreator("Can't find the requested recipe!"));
      }
      res.status(200).json({ recipe });
    });
};

const getRecipesByUsers = (req, res, next) => {
  User.findById(req.params.cid)
    .then((user) => {
      if (!user) {
        return next(
          errorCreator("Can't find the recipes for the requested user!", 400)
        );
      }
      return Recipe.find({ creatorId: req.params.cid });
    })
    .then((recipes) => {
      res.status(200).json({ recipes });
    })
    .catch((err) => {
      next(errorCreator("Can't find the recipes for the requested user!", 400));
    });
};

const addNewRecipe = (req, res, next) => {
  const time = JSON.parse(req.body.cookTime);
  const error = validationResult(req);
  if (!error.isEmpty()) {
    return next(errorCreatorFunction(req, error.errors[0].msg));
  } else if (
    JSON.parse(req.body.keyIngred).length === 0 ||
    JSON.parse(req.body.ingredients).length === 0
  ) {
    return next(
      errorCreatorFunction(req, 'Please enter at-least 1 ingredients!')
    );
  } else if (time.hours < 0 || time.minutes < 1 || time.minutes > 59) {
    return next(
      errorCreatorFunction(req, 'Please enter valid preparation time!')
    );
  } else if (!req.file) {
    return next(errorCreator('Image is required for creating a recipe', 422));
  }

  const image = req.file.path.replace(/\\/g, '/');
  const newRecipe = new Recipe({
    name: req.body.name,
    image,
    cookTime: time,
    description: req.body.description,
    keyIngred: JSON.parse(req.body.keyIngred),
    ingredients: JSON.parse(req.body.ingredients),
    procedure: req.body.procedure,
    creatorId: ObjectId(req.userId),
  });
  newRecipe
    .save()
    .then((recipe) => {
      return User.findById(req.userId).then((user) => {
        user.recipes.push(recipe._id);
        user.totalRecipes++;
        return user.save();
      });
    })
    .then(() => {
      res.status(200).json({ message: 'Created a new recipe!' });
    })
    .catch(() => {
      next(
        errorCreator("Can't create a recipe at this moment! please try again")
      );
    });
};

const updateRecipe = (req, res, next) => {
  const time = JSON.parse(req.body.cookTime);
  const error = validationResult(req);
  if (!error.isEmpty()) {
    return next(errorCreatorFunction(req, error.errors[0].msg));
  } else if (
    JSON.parse(req.body.keyIngred).length === 0 ||
    JSON.parse(req.body.ingredients).length === 0
  ) {
    return next(
      errorCreatorFunction(req, 'Please enter at-least 1 ingredients!')
    );
  } else if (time.hours < 0 || time.minutes < 1 || time.minutes > 59) {
    return next(
      errorCreatorFunction(req, 'Please enter valid preparation time!')
    );
  }

  const updateRecipe = {
    name: req.body.name,
    cookTime: time,
    description: req.body.description,
    keyIngred: JSON.parse(req.body.keyIngred),
    ingredients: JSON.parse(req.body.ingredients),
    procedure: req.body.procedure,
  };

  Recipe.findById(req.params.id)
    .then((recipe) => {
      if (req.file) {
        deleteFiles(recipe.image);
        updateRecipe.image = req.file.path.replace(/\\/g, '/');
      }
      return Recipe.findByIdAndUpdate(req.params.id, updateRecipe);
    })
    .then(() => {
      res.status(200).json({ message: 'Updated the recipe!' });
    })
    .catch(() => {
      next(errorCreator("Can't updated the requested recipe at this moment"));
    });
};

const updateLikeValue = (req, res) => {
  let type;
  let userId;
  let recipeId;
  Recipe.findById(req.params.id)
    .then((recipe) => {
      if (!recipe) {
        return next(errorCreator('No such recipe exists!', 404));
      }
      recipeId = recipe._id;
      userId = recipe.creatorId;
      const includeCurrUser = recipe.likedBy.includes(req.userId);
      if (includeCurrUser) {
        recipe.likedBy = recipe.likedBy.filter((user) => user !== req.userId);
        recipe.likes -= 1;
        type = REMOVE_LIKES;
      } else {
        recipe.likedBy.push(req.userId);
        recipe.likes += 1;
        type = ADD_LIKES;
      }
      return recipe.save();
    })
    .then(() => {
      return User.findById(req.userId);
    })
    .then((user) => {
      if (type === ADD_LIKES) {
        user.likedRecipes.push(recipeId);
      } else {
        user.likedRecipes = user.likedRecipes.filter(
          (rId) => rId.toString() !== recipeId.toString()
        );
      }
      return user.save();
    })
    .then(() => {
      return Recipe.find({ creatorId: { $ne: req.userId } });
    })
    .then((recipes) => {
      res.status(200).json({ recipes });
    })
    .catch((err) => {
      console.log(err);
      next(errorCreator("Can't update the like value, please try again!"));
    });
};

const deleteRecipe = (req, res, next) => {
  let recipeLikes;
  Recipe.findById(req.params.id)
    .then((recipe) => {
      if (recipe.creatorId.toString() !== req.userId.toString()) {
        return next(
          errorCreator('You are not authenticated to delete this recipe', 404)
        );
      }
      recipeLikes = recipe.likes;
      deleteFiles(recipe.image);
      return User.findById(req.userId);
    })
    .then((user) => {
      user.recipes = user.recipes.filter(
        (recipe) => recipe.toString() !== req.params.id.toString()
      );
      user.totalRecipes--;
      user.totalLikes -= recipeLikes;
      return user.save();
    })
    .then(() => {
      return User.updateMany(
        { likedRecipes: req.params.id },
        { $pull: { likedRecipes: ObjectId(req.params.id) } },
        { multi: true }
      );
    })
    .then(() => Recipe.findByIdAndDelete(req.params.id))
    .then(() => {
      res.status(200).json({ message: 'Successfully deleted the recipe!' });
    })
    .catch((err) => {
      console.log(err);
      next(errorCreator("Can't delete the requested recipe!"));
    });
};

exports.getAllRecipes = getAllRecipes;
exports.getRecipe = getRecipe;
exports.getRecipesByUser = getRecipesByUsers;
exports.addNewRecipe = addNewRecipe;
exports.updateRecipe = updateRecipe;
exports.updateLikeValue = updateLikeValue;
exports.deleteRecipe = deleteRecipe;
