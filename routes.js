var models = require('./models');

exports.routes = function (app) {
  var PRE = '/api';

  app.get(PRE + '/', function (req, res, next) {
    models.get({}, function (err, data) {
      res.send(data);
    });
  });
};
