var mysql = require('mysql')
  , Step = require('step')
  , _ = require('underscore');

var pool = mysql.createPool({
  host     : 'localhost',
  user     : 'root',
  password : 'tunited',
  database : 'tunited'
});

exports.getUser = function (options, callback) {
  var sql = 'SELECT user_id, id, name, profile_photo FROM users WHERE user_id='
    + mysql.escape(options.user_id);

  pool.getConnection(function(err, conn){
    conn.query(sql, function (err, rows) {
      conn.release();
      callback(err, rows);
    });
  });
};


exports.addList = function (options, callback) {
  var sql = 'INSERT INTO lists SET ?';
  var post = { user_id: options.user_id, folder_name: options.folder_name };

  pool.getConnection(function(err, conn){
    conn.query(sql, post, function (err, result) {
      conn.release();
      callback(err, { list_id: result.insertId });
    });
  });
};

exports.getLists = function (options, callback) {
  var sql = 'SELECT * FROM (SELECT * FROM lists WHERE user_id=' + mysql.escape(options.user_id) + ') l'
    + ' LEFT JOIN listitems USING(list_id) LEFT JOIN songs USING(song_id)';

  pool.getConnection(function(err, conn){
    conn.query(sql, function (err, results) {
      conn.release();
      callback(err, renderLists(results));
    });
  })
};

exports.getList = function (options, callback) {
  var sql = 'SELECT * FROM (SELECT * FROM lists WHERE list_id=' + mysql.escape(options.list_id) + ') l'
    + ' LEFT JOIN listitems USING(list_id) LEFT JOIN songs USING(song_id)';

  pool.getConnection(function(err, conn){
    conn.query(sql, function (err, results) {
      conn.release();
      callback(err, renderList(results[0]));
    });
  })
};

exports.deleteList = function (options, callback) {

  pool.getConnection(function(err, conn){
    Step(
      function deleteSongs() {
        var sql = 'DELETE FROM listitems WHERE user_id=' + mysql.escape(options.user_id)
          + ' AND list_id=' + mysql.escape(options.list_id);

        conn.query(sql, this);
      },
      function deleteList(err) {
        var sql = 'DELETE FROM lists WHERE user_id=' + mysql.escape(options.user_id)
          + ' AND list_id=' + mysql.escape(options.list_id);

        conn.query(sql, this);
      },
      function end(err) {
        conn.release();
        callback(err, {});
      }
    );
  });
};

exports.addSong = function (options, callback) {

  pool.getConnection(function(err, conn){
    Step(
      function selectListitem() {
        var sql = 'SELECT * FROM listitems WHERE list_id=' + mysql.escape(options.list_id)
          + ' AND song_id=' + mysql.escape(options.song_id);

        conn.query(sql, this);
      },
      function insert(err, data) {
        if (data.length)
          return null;

        var sql = 'INSERT INTO listitems SET ?';
        var post= { list_id: options.list_id, song_id: options.song_id, user_id: options.user_id };

        conn.query(sql, this);
      },
      function end() {
        conn.release();
        callback(err, {});
      }
    );
  });
};

exports.deleteSong = function (options, callback) {
  var sql = 'DELETE FROM listitems WHERE list_id=' + mysql.escape(options.list_id)
    + ' AND song_id=' + mysql.escape(options.song_id);

  pool.getConnection(function(err, conn){
    conn.query(sql, function (err, results) {
      conn.release();
      callback(err, {});
    });
  });
};

function renderLists(rows) {
  var data = [];

  rows.forEach(function(r){
    var found = _.find(data, function(d){ return d.list_id == r.list_id; });

    if (found) {
      found.songs.push(renderSong(r));
    } else {
      data.push(renderList(r));
    }
  });

  return data;
}

function renderList(row) {
  return {
    list_id: row.list_id,
    folder_name: row.folder_name,
    songs: row.song_id? [ renderSong(row) ] : []
  }
}

function renderSong(row) {
  return {
    song_id: row.song_id,
    title: row.title,
    description: row.description,
    thumb_url: row.thumb_url,
    youtube_url: row.youtube_url,
    play_count: row.play_count
  }
}

function renderHosts(rows) {
  var data = [];

  rows.forEach(function(r){
    var found = _.find(data, function(d){ return d.host_id == r.host_id; });

    if (found) {
      found.list.songs.push(renderSong(r));
    } else {
      data.push(renderHost(r));
    }
  });

  return data;
}

function renderHost(row) {
  return {
    host_id: row.host_id,
    user_id: row.user_id,
    list: renderList(row)
  }
}

exports.getHosts = function (options, callback) {
  var sql = 'SELECT * FROM hosts left join lists using(list_id) left join listitems using(list_id)'
    + ' left join songs using(song_id)';

  pool.getConnection(function(err, conn){
    conn.query(sql, function (err, results) {
      conn.release();
      callback(err, renderHosts(results));
    });
  });
};

exports.createHost = function (options, callback) {
  var conn
    , new_list_id;

  Step(

    function getConn() {
      pool.getConnection(this);
    },

    function insertTempList(err, connection) {
      conn = connection;

      var sql = 'INSERT INTO lists (folder_name, user_id) SELECT folder_name, '+ mysql.escape(options.user_id)
        + ' FROM lists WHERE list_id=' + mysql.escape(options.list_id);
      conn.query(sql, this);
    },

    function insertSong(err, result) {
      new_list_id = result.insertId;

      var sql = 'INSERT INTO listitems (list_id, song_id, user_id)'
        + ' SELECT '+ new_list_id + ', song_id, ' + mysql.escape(options.user_id)
        + ' FROM listitems WHERE list_id=' + mysql.escape(options.list_id);

      conn.query(sql, this);
    },

    function insertHost(err, result) {

      var sql = 'INSERT INTO hosts SET ?';
      var post = { user_id: options.user_id, list_id: new_list_id };
      conn.query(sql, post, this);
    },

    function end(err, result) {
      conn.release();
      callback(err, { host_id: result.insertId });
    }
  );
};

exports.deleteHost = function (options, callback) {
  var sql = 'DELETE FROM hosts WHERE user_id=' + mysql.escape(options.user_id)
    + ' AND host_id=' + mysql.escape(options.host_id);

  pool.getConnection(function(err, conn){
    conn.query(sql, function (err, result) {
      conn.release();
      callback(err, {});
    });
  });
};

exports.connectHost = function (options, callback) {
  var conn;

  Step(
    function getConn() {
      pool.getConnection(this);
    },
    function selectHost(err, connection) {
      conn = connection;
      var sql = 'SELECT * FROM hosts WHERE host_id=' + mysql.escape(options.host_id);

      conn.query(sql, this);
    },
    function selectConnect(err, data) {
      if (!data.length) throw err;

      var sql = 'SELECT * FROM connects WHERE host_id=' + mysql.escape(options.host_id)
        + ' AND user_id=' + mysql.escape(options.user_id);

      conn.query(sql, this);
    },
    function connect(err, data) {
      if (err) throw err;

      if (data.length) return null;

      var sql = 'INSERT INTO connects SET ?';
      var post = { user_id: options.user_id, host_id: options.host_id, b_active: 1 };

      conn.query(sql, post, this);
    },
    function end(err, data) {
      conn.release();

      callback(err, {});
    }
  );
};

exports.disconnectHost = function (options, callback) {
  var sql = 'DELETE FROM connects WHERE user_id=' + mysql.escape(options.user_id)
    + ' AND host_id=' + mysql.escape(options.host_id);

  pool.getConnection(function(err, conn){
    conn.query(sql, function (err, result) {
      conn.release();
      callback(err, {});
    });
  });
};


