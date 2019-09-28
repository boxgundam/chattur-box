const APPPATH = '../client/';

const http = require('http');
const path = require('path');
const express = require('express');
const app = express();
// const sockets = require('./sockets.js');

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(express.static(path.join(__dirname, `${APPPATH}/public`)));

// Routes
app.use('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

var port = normalizePort(process.env.PORT || '3000');
app.set('port', port);

const server = http.createServer(app);

// new sockets();

// Listen on provided port, on all network interfaces.
server.listen(port);
server.on('error', onError);
server.on('listening', onListening);

// Event listener for HTTP server "error" event.
function onError(error) {
  if (error.syscall !== 'listen')
    throw error;

  var bind = typeof port === 'string' ? 'Pipe ' + port : 'Port ' + port;

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
  var addr = server.address();
  var bind = typeof addr === 'string' ? 'pipe ' + addr : 'port ' + addr.port;
  console.info('Listening on ' + bind);
}

// Normalize a port into a number, string, or false.
function normalizePort(val) {
  var port = parseInt(val, 10);
  
  if (isNaN(port))
    return val;

  if (port >= 0) 
    return port;

  return false;
}
