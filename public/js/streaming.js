/**
  *
  * Steraming
  * Module to manage the data streaming.
  * Author: dernster, alarrosa14, kitab15.
  */

var Streaming = function(){

	// ###########################################################
    // Private
    // ###########################################################

	var streaming_server;
	var buffer = [];
	var buffering = true;

	var BUFFERING_TIME_SECONDS = 3;
	var FRAME_PER_SECOND = 24; 
	var FRAME_RATE_MS = 1000/FRAME_PER_SECOND;

	// First time buffering controller
	function isBuffering(){
		if (buffering){
			buffering = (buffer.length < (BUFFERING_TIME_SECONDS * FRAME_PER_SECOND));
		}
		return buffering;
	};

	// ###########################################################
    // Public Methods
    // ###########################################################

    // Initialize module
	function init(streaming_server_url){
		streaming_server = io.connect(streaming_server_url);
	};

	// Receive and store a new frame
	function receive(){
		streaming_server.on('frame', function(frame){
			buffer.push(frame);
		});
	};

	// Extract the oldest frame from the buffer and play it.
	function play(pixels){
		setInterval(function(){

			if (!isBuffering() && buffer.length > 0){

				console.log("Buffer Size " + buffer.length);
				var frame = buffer.pop();
				var d = new Date();
				var n = d.getMilliseconds();
				console.log("Millis " + n);
				ThreeHelper.update(frame, pixels);
				ThreeHelper.render();
			}
		}, FRAME_RATE_MS);
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