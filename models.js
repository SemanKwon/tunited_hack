var mysql      = require('mysql');

var pool = mysql.createPool({
  host     : 'localhost',
  user     : 'root',
  password : '',
  database : 'tunited'
});

exports.get = function (options, callback) {
  pool.getConnection(function(err, conn){
    conn.query('SELECT NOW()', function (err, rows) {
      conn.release();
      callback(err, rows);
    });
  })
};
