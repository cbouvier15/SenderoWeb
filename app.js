// ********************************************************
// Dependencies
// ********************************************************
var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
require('socket.io-stream')(io);

// ********************************************************
// Configuration
// ********************************************************
app.use(express.static('public'));

io.on('connection', function(client){

  console.log("Connected client...");

  client.on('sendFrame', function(frameData){
    client.broadcast.emit('frame', {
      timestamp: frameData.readUIntBE(0, 8), // Read an 8 byte unsigned int that is BigEndian.
      data: frameData.slice(8) // discard the timestamp from frameData
    });
  });

});

// ********************************************************
// Routing
// ********************************************************

// Main view
app.get('/', function (req, res) {
  res.sendFile(__dirname + '/views/index.html');
});

// Web/Mobile app
app.get('/web', function (req, res) {
    res.sendFile(__dirname + '/views/web.html');
});

// Cardboard App
app.get('/cardboard', function (req, res) {
    res.sendFile(__dirname + '/views/cardboard.html');
});

// ********************************************************
// Running
// ********************************************************
server.listen(8080, function () {
  console.log("*********************************************");
  console.log("*** SenderoWeb listening on port 8080 ... ***");
  console.log("*********************************************");
});