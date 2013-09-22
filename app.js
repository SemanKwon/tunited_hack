var express = require('express')
  , http = require('http')
  , path = require('path');

var app = express();
var RedisStore = require('connect-redis')(express);

app.configure(function(){
  app.set('env', 'development');
  app.enable('trust proxy');
  /*app.use(function(req, res, next){
    console.log(req.method + ' ' + req.originalUrl);
    console.log(req.body);
    console.log(req.session);
    next();
  });*/
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser('tunited.tv'));
  var sessionStore = new RedisStore();
  app.use(express.session({ cookie:{ path:'/' }, secret:"songjihyo", store:sessionStore }));
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
  app.use(express.errorHandler({ showStack: true, dumpExceptions: true }));
});

var io = require('socket.io').listen(1126);
var sockets = [];

io.sockets.on('connection', function (socket) {
  sockets.push(socket);
  /*socket.on('my other event', function (data) {
    console.log(data);
  });*/
});

require('./routes').routes(app, sockets);

var port = 1125;
http.createServer(app).listen(port, function(){
  console.log("Tunited server listening on port " + port + ' ' + app.get('env') + ' mode!');
});

