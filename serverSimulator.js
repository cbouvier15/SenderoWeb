var io = require('socket.io-client');
// var socket = io.connect('http://app.sendero.uy:8080');
var socket = io.connect('http://localhost:8080');

console.log("Connected");

// Add a connect listener
socket.on('connect', function(socket) {
    console.log('Connected!');
});

console.log("Waiting");

var data_white = [];
var data_black = [];
var counter = 0;
var id = 0;

for (var i = 0; i <= 270; i++) {
	data_white.push(255);
	data_black.push(0);
}

setTimeout(function(){
	setInterval(function(){
		
		var timestamp = Date.now();

		if (counter < 12){
			counter = counter + 1;
			var frame = {
			  'id': id,
		      'timestamp': timestamp,
		      'data': data_white
		    };
		}else{
			counter = counter + 1;
			var frame = {
			  'id': id,
		      'timestamp': timestamp,
		      'data': data_black
		    };
		}

		if (counter == 24){
			counter = 0;
		}

		console.log(id + '-' + timestamp);
		id = id + 1;
		socket.emit('sendFrame', frame);
		
	}, 1000/24);
}, 5000);