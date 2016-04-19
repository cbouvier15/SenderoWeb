// ********************************************************
// Dependencies and Settings
// ********************************************************
var __ = require('underscore');
var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
require('socket.io-stream')(io);
var MongoClient = require('mongodb').MongoClient;

var fs = require('fs'),
    xml2js = require('xml2js');

/***
 * Read and parse serverConf.xml to get streamingServer address
 */
var senderoServerUDPPort;
var parser = new xml2js.Parser();
fs.readFile(__dirname + '/public/conf/serverConf.xml', function(err, data) {
    parser.parseString(data, function (err, result) {
        senderoServerUDPPort = result.Configuration.$.senderoServerUDPPort ? result.Configuration.$.senderoServerUDPPort : 8080;
    });
});

var dgram = require('dgram');
var udpSocket = dgram.createSocket('udp4');

app.use(express.static('public'));

var dashbboardClient = [];
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
    var connectedUsers = 0;;

    // Listen for Sendero Server connection
    udpSocket.on('message', function(data, rinfo) {
      /*
       * Streaming
       */
      if (Math.random() > 0.2)
        io.sockets.emit('frame', {
          timestamp: data.readUIntBE(0, 8), // Read an 8 byte unsigned int that is BigEndian.
          sequence: data.readUIntBE(8, 1), // Read a 1 byte unsigned int.
          data: data.slice(9) // discard the timestamp from frameBuffer
        });

    });

    udpSocket.on('listening', function(){
      var address = udpSocket.address();
      console.log(`\n  ---->   Listening for Sendero Server streaming packets in ${address.port} udp port\n\n`);
    });

    udpSocket.on('error', function(err) {
      console.log(`--------------> Streaming Server error:\n${err.stack}`);
      udpSocket.close();
    });

    udpSocket.bind(senderoServerUDPPort);
    
    // Listen for Socket.io connections
    io.on('connection', function(client){

      console.log("Connected client: ", client.id);
      connectedUsers++;
      // client.on('sendFrame', function(frameData){
      //   client.broadcast.emit('frame', {
      //     timestamp: frameData.readUIntBE(0, 8), // Read an 8 byte unsigned int that is BigEndian.
      //     data: frameData.slice(8) // discard the timestamp from frameBuffer
      //   });
      // });

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
        console.log("Stats received from: ", client.id);
        stats.clientId = client.id;
        collection.insert(stats);
        if (dashbboardClient.length > 0){
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
                  count: {$sum: 1}
                }
              }
            ], function(err, result) {
              var data = result[0];
              data.clients = connectedUsers;
              for (var i = dashbboardClient.length - 1; i >= 0; i--) {
                dashbboardClient[i].emit('refreshStats', data, stats);
              }
            });
        }
      });

      /*
       * Dashboard user
       */
      client.on('registerAdmin', function(){
        console.log("Admin Registered with Id: ", client.id);
        dashbboardClient.push(client);
      });

      /*
       * User Disconnection
       */
      client.on('disconnect', function() {
        console.log("User disconnected: ", client.id);
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
server.listen(8082, function () {
  console.log("*********************************************");
  console.log("*** SenderoWeb listening on port 8082 ... ***");
  console.log("*********************************************");
});

function exitHandler(options, err) {
  server.close();
  if (err) console.log(err.stack);
  if (options.exit) process.exit();
}

//do something when app is closing
process.on('exit', exitHandler.bind(null,{cleanup:true}));

//catches ctrl+c event
process.on('SIGINT', exitHandler.bind(null, {exit:true}));

//catches uncaught exceptions
process.on('uncaughtException', exitHandler.bind(null, {exit:true}));
