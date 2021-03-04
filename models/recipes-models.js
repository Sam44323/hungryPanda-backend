const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const recipeSchema = new Schema({
  name: {
    type: String,
    required: true,
    minlength: 1,
  },
  image: {
    type: String,
    required: true,
  },
  cookTime: {
    hours: {
      type: Number,
      required: true,
    },
    minutes: {
      type: Number,
      required: true,
    },
  },
  description: {
    type: String,
    required: true,
    minlength: 5,
  },
  keyIngred: [
    {
      type: String,
      minlength: 1,
    },
  ],
  ingredients: [
    {
      _id: 0, // for switching off the _id property in the ingredients array
      type: String,
      required: true,
    },
  ],
  procedure: {
    type: String,
    required: true,
    minlength: 10,
  },
  likes: {
    type: Number,
    default: 0,
  },
  likedBy: [
    {
      type: String,
      default: [],
    },
  ],
  creatorId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
});

module.exports = mongoose.model('Recipe', recipeSchema);
