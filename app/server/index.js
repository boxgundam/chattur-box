const APPPATH = '../client/';
const DATABASE = './app/app_data/Chattur.db';

const http = require('http');
const path = require('path');
const express = require('express');
const socketio = require('socket.io');
const sqlite3 = require('sqlite3').verbose();

const app = express();

app.use(express.json());
app.use(express.urlencoded({extended: false }));

app.use(express.static(path.join(__dirname, `${APPPATH}/public`)));

// Initialize database
const db = new sqlite3.Database(DATABASE);

app.set('db', db);

db.serialize(function () {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        avatar TEXT NOT NULL
    );
  `);
});

// Routes
app.use('/', function (req, res, next) {
  res.send('Page Not Found');
});

let port = normalizePort(process.env.PORT || '3000');
app.set('port', port);

const server = http.createServer(app);

// Add sockets
app.set('io', socketio(server));

new(require('./sockets.js'))(app);

// Listen on provided port, on all network interfaces.
server.listen(port);
server.on('error', onError);
server.on('listening', onListening);

// Event listener for HTTP server "error" event.
function onError(error) {
  if (error.syscall !== 'listen')
    throw error;

  let bind = typeof port === 'string' ? 'Pipe ' + port : 'Port ' + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
}

// Event listener for HTTP server "listening" event.
function onListening() {
  let addr = server.address();
  let bind = typeof addr === 'string' ? 'pipe ' + addr : 'port ' + addr.port;
  console.info('Listening on ' + bind);
}

// Normalize a port into a number, string, or false.
function normalizePort(val) {
  let port = parseInt(val, 10);

  if (isNaN(port))
    return val;

  if (port >= 0)
    return port;

  return false;
}