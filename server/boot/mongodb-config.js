/**
 * Created by anil on 5/4/17.
 */
var MongoClient = require("mongodb").MongoClient,
  _db;
module.exports = function (server) {
  // Connection URL
  var config = {
    useNewUrlParser: true,
    connectTimeoutMS: 30000,
    socketTimeoutMS: 720000,
  };

  var url = server.dataSources.mongoDB.settings.url;
  MongoClient.connect(url, config, function (err, client) {
    _db = client.db();
    console.log("Connected correctly to mongo server");
  });
};

module.exports.getDb = (connectType) => {
  return _db;
};
