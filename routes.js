// router

exports.routes = function (app) {
  var PRE = '/api';

  app.get(PRE + '/', function (req, res, next) {
    res.send('OK!');
  });
};
