const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');
const Schema = mongoose.Schema;

const userSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  userName: {
    type: String,
    required: true,
  },
  age: {
    type: Number,
    min: 0,
  },
  image: {
    type: String,
  },
  location: {
    type: String,
    required: true,
  },
  socialMedia: [
    {
      name: {
        type: String,
      },
      value: {
        type: String,
      },
      hasValue: {
        type: Boolean,
      },
    },
  ],
  recipes: [
    {
      type: Schema.Types.ObjectId,
      ref: 'Recipe',
      default: [],
    },
  ],
  likedRecipes: [
    {
      type: Schema.Types.ObjectId,
      ref: 'Recipe',
      default: [],
    },
  ],
  totalRecipes: {
    type: Number,
    default: 0,
  },
});

userSchema.plugin(uniqueValidator);

module.exports = mongoose.model('User', userSchema);
