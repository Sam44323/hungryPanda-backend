const jwt = require('jsonwebtoken');
const errorCreator = require('../errorCreator/errorCreator');

//FOR AUTHENTICATION PURPOSES

module.exports = (req, res, next) => {
  if (!req.get('Authorization')) {
    return next(errorCreator('Unauthenticated User!', 500));
  }
  const token = req.get('Authorization').split(' ')[1];
  let decodedToken;
  try {
    decodedToken = jwt.verify(token, 'HUNGRY_PANDA_JWT_SECRET');
  } catch (err) {
    return next(errorCreator('Unauthenticated User!', 500));
  }
  if (!decodedToken) {
    return next(errorCreator('Unauthenticated User!', 500));
  }
  req.userId = decodedToken.userId;
  next();
};
