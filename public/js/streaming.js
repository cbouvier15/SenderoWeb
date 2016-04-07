/**
  *
  * Steraming
  * Module to manage the data streaming.
  * Authors: dernster, alarrosa14, kitab15.
  */

var Streaming = function(){

	// ###########################################################
    // Private
    // ###########################################################

	var streaming_server;
	var buffer = [];

	var FIXED_BUFFERING_TIME_MS = 200;
	var CHECK_RATE = 1000/300;
	var OFFSET_CALCULATION_BUFFER_SIZE = 720;

	Array.prototype.min = function() {
	  return Math.min.apply(null, this);
	};

	// ###########################################################
    // Public Methods
    // ###########################################################

    // Initialize module
	function init(streaming_server_url){
		streaming_server = io.connect(streaming_server_url);
	};

	// ------------------------------------------------------------
	// Playout time calculations
	// ------------------------------------------------------------

	// 1. Base playout time calculation
	// Keep a moving average of the most recently 30 seconds of playout
	var index = 0;
	var d = new Array(OFFSET_CALCULATION_BUFFER_SIZE);
	d.fill(Number.MAX_SAFE_INTEGER);
	var min = Number.MAX_SAFE_INTEGER;

	function base_playout_time_calculation(packet){
		var d_n = packet.arrival_time - packet.timestamp;

		d[index] = d_n;
		index = ((index + 1) % OFFSET_CALCULATION_BUFFER_SIZE);
		
		var offset = d.min();
		min = offset;
		// return base_playout_time for the current packet
		return offset;
	}

	// 2. Jitter compensation
	var prev_jitter = 0;
	var prev_packet_arrival_time = 0;
	var prev_packet_timestamp = 0;

	function jitter_estimation(packet){
		// Relative difference 
		D_i_j = (prev_packet_arrival_time - prev_packet_timestamp) - (packet.arrival_time - packet.timestamp)
		// Current jitter
		Ji = prev_jitter + ((Math.abs(D_i_j) - prev_jitter)/16);
		// Update prev
		prev_jitter = Ji;
		prev_packet_arrival_time = packet.arrival_time;
		prev_packet_timestamp = packet.timestamp;
		// Fixed playout time
		return 3*Ji;
	};

	// Receive and store a new frame
	// Frame format
	// {
	//  id: int
	//	timestamp: epoch milliseconds,
	//  data: []
	// }
	function receive(){
		streaming_server.on('frame', function(frame){

			// Arrival time registering
			frame.arrival_time = Date.now();
			
			// Base playout time calculation
			var base = base_playout_time_calculation(frame);
			
			// Jitter compensation
			var jitter = jitter_estimation(frame);
			
			// Payout time
			frame.playout_time = frame.timestamp + base + jitter + FIXED_BUFFERING_TIME_MS;

			// Insert into playout buffer
			if (frame.playout_time >= frame.arrival_time){
				buffer.push(frame);
			}
			// else{
				// Discarded frame
				// console.log("Discarded frame", frame.id, frame.playout_time, frame.arrival_time);
			// }
		});
	};

	// Extract the oldest frame from the buffer and play it.
	// function play(pixels){
	// 	setInterval(function(){

	// 		if (buffer.length > 0) {
	// 			var now = Date.now();
	// 			var next = buffer[0].playout_time;

	// 			if (now - next <= CHECK_RATE){
	// 				var frame = buffer.shift();
	// 				// Playout frame
	// 				ThreeHelper.update(frame.data, pixels);
	// 				ThreeHelper.render();
	// 				console.log(frame.id, now, frame.timestamp, frame.arrival_time, frame.playout_time);
	// 			}else{
	// 				// CHECK_RATE * 3 is based on stats
	// 				if (now-next > CHECK_RATE*3){
	// 					var frame;
	// 					do {
	// 						frame = buffer.shift();
	// 						// console.log("Discard frame", frame.id);
	// 					} while (frame !== undefined && now - frame.playout_time - (FIXED_BUFFERING_TIME_MS) > (FIXED_BUFFERING_TIME_MS/2));
	// 				}
	// 			}
	// 		} else {
	// 			console.log("Is buffering... ", buffer.length);
	// 		}
	// 	}, CHECK_RATE);
	// };

	function play(pixels){
		setInterval(function(){

			if (buffer.length > 0) {
				var now = Date.now();
				// XXX: Fix the inactive tab issue
				if (now > buffer[0].playout_time) {
					var frame = buffer.shift();

					// Playout frame
					ThreeHelper.update(frame.data, pixels);
					ThreeHelper.render();
					// console.log(frame.id, now, frame.timestamp, frame.arrival_time, frame.playout_time, buffer.length);
				}
			} else {
				console.log("Is buffering... ", buffer.length);
			}
		}, CHECK_RATE);
	};

	// ###########################################################
    // Three Helper
    // ###########################################################

    var oPublic = {
      init: init,
      receive: receive,
      play: play,
    };
    return oPublic;

}();