const errorCreator = (message, code = 404) => {
  const error = new Error(message);
  error.code = code;
  return error;
};

module.exports = errorCreator;
