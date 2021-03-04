let configValue = {
  MONGO_URI: `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.ncbfj.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`,
};

module.exports = configValue;
