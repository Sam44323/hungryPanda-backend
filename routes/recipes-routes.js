const { Router } = require('express');
const { body } = require('express-validator');

const router = Router();
const recipesControllers = require('../controllers/recipes-controllers');
const authMiddleware = require('../middleware/authMiddleware');

//GETTING ALL THE RECIPES(EXPLORE)
router.get('/explore', authMiddleware, recipesControllers.getAllRecipes);

//GETTING A PARTICULAR RECIPE FOR THE GIVEN PARAMETER
router.get('/recipe/:id', authMiddleware, recipesControllers.getRecipe);

//GETTING THE RECIPE BY THE USER ID
router.get(
  '/myrecipes/:cid',
  authMiddleware,
  recipesControllers.getRecipesByUser
);

//CREATING A NEW RECIPE
router.post(
  '/addrecipe',
  authMiddleware,
  [
    body('name').notEmpty().withMessage('Please enter the name of the recipe!'),
    body('image')
      .notEmpty()
      .withMessage('Please enter an image for the recipe!'),
    body('cookTime.hours')
      .notEmpty()
      .isFloat({ min: 0 })
      .withMessage('Please enter a valid hour!'),
    body('cookTime.minutes')
      .notEmpty()
      .isFloat({ min: 1, max: 59 })
      .withMessage('Please enter a valid minute!'),
    body('keyIngred')
      .isArray({ min: 1 })
      .withMessage('Please enter at-least 1 ingredient!'),
    body('ingredients')
      .isArray({ min: 1 })
      .withMessage('Please enter at-least 1 ingredient!'),
    body('description')
      .isLength({ min: 10, max: 400 })
      .withMessage('Please enter a description between 10 to 400 words!'),
    body('procedure')
      .isLength({ min: 30 })
      .withMessage(
        'Please enter the procedure for prepration of at-least 30 words!'
      ),
  ],
  recipesControllers.addNewRecipe
);

//UPDATING A RECIPE
router.patch(
  '/updateRecipe/:id',
  authMiddleware,
  [
    body('name').notEmpty().withMessage('Please enter the name of the recipe!'),
    body('image')
      .notEmpty()
      .withMessage('Please enter an image for the recipe!'),
    body('cookTime.hours')
      .notEmpty()
      .isFloat({ min: 0 })
      .withMessage('Please enter a valid hour!'),
    body('cookTime.minutes')
      .notEmpty()
      .isFloat({ min: 1, max: 59 })
      .withMessage('Please enter a valid minute!'),
    body('description')
      .isLength({ min: 10, max: 400 })
      .withMessage('Please enter a description between 10 to 400 words!'),
    body('keyIngred')
      .isArray({ min: 1 })
      .withMessage('Please enter at-least 1 ingredient!'),
    body('ingredients')
      .isArray({ min: 1 })
      .withMessage('Please enter at-least 1 ingredient!'),
    body('procedure')
      .isLength({ min: 30 })
      .withMessage(
        'Please enter the procedure for prepration of at-least 30 words!'
      ),
  ],
  recipesControllers.updateRecipe
);

//UPDATING THE LIKE COUNTER FOR A RECIPE
router.patch(
  '/updatelike/:id',
  authMiddleware,
  recipesControllers.updateLikeValue
);

//DELETING A RECIPE
router.delete(
  '/deleterecipe/:id',
  authMiddleware,
  recipesControllers.deleteRecipe
);

module.exports = router;
