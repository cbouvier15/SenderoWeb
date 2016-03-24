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
	var buffering = true;

	var BUFFERING_TIME_SECONDS = 1;
	var FRAME_PER_SECOND = 24; 
	var FRAME_RATE_MS = 1000/FRAME_PER_SECOND;
	var NEXT_PLAYOUT_TIME = FRAME_RATE_MS;

	var PRINT_BASE_PLAYOUT_TIME = false;
	var PRINT_JITTER_COMPENSATION = false;
	var GENERATE_DEBUG_NOISE = false;

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
	var d = [];

	function base_playout_time_calculation(packet){
		var d_n = packet.arrival_time - packet.timestamp;
		d.push(d_n);
		var offset = d.min();

		if (PRINT_BASE_PLAYOUT_TIME){
			console.log('d(n)=', d_n);
			console.log('T_L(n)=', packet.timestamp);
			console.log('T_R(n)=', packet.arrival_time);
			console.log('offset=', offset);
			console.log('base_playout_time(n)=', packet.timestamp + offset);
			console.log('--------------------');
		}

		// return base_playout_time for the current packet
		// base_playout_time(n) = packet.timestamp + offset
		return packet.timestamp + offset;
	}

	// 2. Jitter compensation
	var prev_jitter = 0;
	var prev_packet_arrival_time = 0;
	var prev_packet_timestamp = 0;

	function jitter_estimation(packet, base_playout_time){
		// Relative difference 
		D_i_j = (prev_packet_arrival_time - prev_packet_timestamp) - (packet.arrival_time - packet.timestamp)
		// Current jitter
		Ji = prev_jitter + ((Math.abs(D_i_j) - prev_jitter)/16);
		// Update prev
		prev_jitter = Ji;
		prev_packet_arrival_time = packet.arrival_time;
		prev_packet_timestamp = packet.timestamp;

		if (PRINT_JITTER_COMPENSATION){
			console.log('D_i_j=', D_i_j);
			console.log('D_i_j=', Ji);
			console.log('--------------------');
		}

		// Fixed playout time
		return base_playout_time + 3*Ji;
	};

	// Generate random noise to simulate playout variable components
	function generate_random_noise(packet){
		var noise = Math.random()*20;
		return packet.arrival_time + noise;
	}

	// Receive and store a new frame
	// Frame format
	// {
	//	timestamp: epoch milliseconds,
	//  data: []
	// }
	function receive(){
		streaming_server.on('frame', function(frame){
			
			// Arrival time registering
			frame.arrival_time = Date.now();
			
			if (GENERATE_DEBUG_NOISE){
				frame.arrival_time = generate_random_noise(frame);
			}
			// Base playout time calculation
			var base_playout_time = base_playout_time_calculation(frame);
			// Jitter compensation
			var fixed_playout_time = jitter_estimation(frame, base_playout_time);
			frame.playout_time = fixed_playout_time;

			// Insert into playout buffer
			buffer.push(frame);
		});
	};

	// Extract the oldest frame from the buffer and play it.
	function play(pixels){
		setInterval(function(){

			if (!isBuffering() && buffer.length > 0){
				
				// Get frame from Buffer
				var frame = buffer.shift();
				frame.real_playout_time = Date.now();
				
				// Playout frame
				ThreeHelper.update(frame.data, pixels);
				ThreeHelper.render();

				// Schedule next frame
				NEXT_PLAYOUT_TIME = frame.real_playout_time - buffer[0].playout_time;
			}else{
				console.log("Is buffering...");
			}
		}, NEXT_PLAYOUT_TIME);
	};

	// First time buffering controller
	function isBuffering(){
		buffering = (buffer.length < (BUFFERING_TIME_SECONDS * FRAME_PER_SECOND));
		return buffering;
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