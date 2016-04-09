// ********************************************************
// Dependencies and Settings
// ********************************************************
var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
require('socket.io-stream')(io);
var MongoClient = require('mongodb').MongoClient;

app.use(express.static('public'));

var dashbboardClient = null;
var connectedUsers = -1;

// ********************************************************
// Main
// ********************************************************

// Connect to senderoDB
MongoClient.connect("mongodb://localhost:27017/senderoDB", function(err, db) {
  
  // Connection error
  if(err) { 
    return console.dir(err); 
  }

  // Create or open Collection: streamingStats
  db.createCollection('streamingStats', function(err, collection) {

    // Listen for Socket.io connections
    io.on('connection', function(client){

      console.log("Connected client: %s", client.id);
      connectedUsers++;

      /*
       * Streaming
       */
      client.on('sendFrame', function(frameData){
        client.broadcast.emit('frame', {
            timestamp: frameData.readUIntBE(0, 8), // Read an 8 byte unsigned int that is BigEndian.
            data: frameData.slice(8) // discard the timestamp from frameData
          });
      });

      /*
       * Test Streaming
       */
      client.on('testFrame', function(frameData){
        client.broadcast.emit('frame', frameData);
      });

      /*
       * Stats
       */
      client.on('stat', function(stats){
        console.log("Stats received from: %s" + client.id);
        stats.clientId = client.id;
        collection.insert(stats);
        if (dashbboardClient){
          collection.aggregate(
            [
              {$group :
                {_id : null, 
                  tsMean: { $avg: "$tsFrameRateMean"}, 
                  tsStdev: { $avg: "$tsFrameRateStdev"}, 
                  arrMean: { $avg: "$arrFrameRateMean"}, 
                  arrStdev: { $avg: "$arrFrameRatStdev"}, 
                  ptMean: { $avg: "$ptFrameRateMean"}, 
                  ptStdev: { $avg: "$ptFrameRateStdev"}, 
                  rpMean: { $avg: "$rpFrameRateMean"}, 
                  rpStdev: { $avg: "$rpFrameRateStdev"}, 
                  buffMean: { $avg: "$bufferSizeMean"}, 
                  buffStdev: { $avg: "$bufferSizeStddev"}, 
                  count: {$sum: 1}
                }
              }
            ], function(err, result) {
              var data = result[0];
              data.clients = connectedUsers;
              dashbboardClient.emit('refreshStats', data, stats);
            });
        }
      });

      /*
       * Dashboard user
       */
      client.on('registerAdmin', function(){
        console.log("Admin Registered with Id: %s", client.id);
        dashbboardClient = client;
      });

      /*
       * User Disconnection
       */
      client.on('disconnect', function() {
        console.log('User disconnected: %s', client.id);
        connectedUsers--;
      });

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