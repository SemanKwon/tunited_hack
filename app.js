var express = require('express')
  , http = require('http');

var app = express();
var RedisStore = require('connect-redis')(express);

app.configure(function(){
  app.set('env', 'development');
  app.enable('trust proxy');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser('tunited.tv'));
  var sessionStore = new RedisStore();
  app.use(express.session({ cookie:{ path:'/' }, secret:"songjihyo", store:sessionStore }));
  app.use(app.router);
  //app.use(express.static(path.join(__dirname, '../public')));
  app.use(express.errorHandler({ showStack: true, dumpExceptions: true }));
});

require('./routes').routes(app);

var port = 1125;
http.createServer(app).listen(port, function(){
  console.log("Tunited server listening on port " + port + ' ' + app.get('env') + ' mode!');
});

