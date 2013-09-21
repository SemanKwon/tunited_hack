// router

exports.routes = function (app) {
  app.get('/', function (req, res, next) {
    res.send('OK!');
  });
};
