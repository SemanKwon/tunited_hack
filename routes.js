var models = require('./models');
var Youtube = require("youtube-api");


exports.routes = function (app) {
  var PRE = '/api';

  app.get(PRE + '/users', login);
  app.post(PRE + '/users', login);

  app.get(PRE + '/youtube/search', searchYT);

  // list api
  app.post(PRE + '/lists', postLists);
  app.get(PRE + '/lists', getLists);
  app.get(PRE + '/lists/:list_id', getList);
  app.put(PRE + '/lists/:list_id', putLists);
  app.delete(PRE + '/lists/:list_id', deleteLists);
  app.post(PRE + '/lists/:list_id', postListsSong);
  app.delete(PRE + '/lists/:list_id/:song_id', deleteListsSong);
};

function login(req, res, next) {
  var user_id = req.param('user_id');

  if (!user_id)
    return res.send(400);

  models.getUser({ user_id: user_id }, function (err, data) {
    req.session.user_id = user_id;
    res.json(data[0]);
  });
}

function searchYT(req, res, next) {
  var q = req.param('q');
  Youtube.authenticate({
    type: "oauth",
    token: 'AIzaSyAZNZHr-okZBzoq2DZZBPeYYb5O56FFPzE'
  });

  Youtube.channels.list({
    "part": "id",
    "mySubscribers": true,
    "maxResults": 50
  }, function (err, data) {
    console.log(err, data);
  });

  /*Youtube.search.list({
    part: 'snippet',
    q: 'psy'
  }, function (err, data) {
    console.log(err);
    console.log(data);
    res.send(err);
  });*/
}

function postLists(req, res, next) {
  var options = {
    user_id: req.session.user_id,
    folder_name: req.param('folder_name')
  };

  if (!options.user_id || !options.folder_name)
    return res.send(400);

  models.addList(options, function (err, data) {
    if (err) return res.send(500, err);

    res.json(data);
  });
}

function getLists(req, res, next) {
  var options = {
    user_id: req.session.user_id
  };

  models.getLists(options, function (err, data) {
    if (err) return res.send(500, err);

    res.json(data);
  });
}

function getList(req, res, next) {
  var options = {
    user_id: req.session.user_id,
    list_id: req.param('list_id')
  };

  models.getList(options, function (err, data) {
    if (err) return res.send(500, err);

    res.json(data);
  });
}

function putLists(req, res, next) {

}

function deleteLists(req, res, next) {
  var options = {
    user_id: req.session.user_id,
    list_id: req.param('list_id')
  };

  models.deleteList(options, function (err, data) {
    if (err) return res.send(500, err);

    res.json(data);
  });
}

function postListsSong(req, res, next) {
  var options = {
    user_id: req.session.user_id,
    list_id: req.param('list_id'),
    song_id: req.param('song_id')
  };

  models.addSong(options, function (err, data) {
    if (err) return res.send(500, err);

    res.json(data);
  });
}

function deleteListsSong(req, res, next) {
  var options = {
    user_id: req.session.user_id,
    list_id: req.param('list_id'),
    song_id: req.param('song_id')
  };

  models.deleteSong(options, function (err, data) {
    if (err) return res.send(500, err);

    res.json(data);
  });
}
