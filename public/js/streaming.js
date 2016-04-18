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

    var Buffer, lz4;

    var streaming_server;
    var buffer = new Array(256);
    var countOfFramesInBuff = 0;
    var frameToPlayIdx = -1;

    var FIXED_BUFFERING_TIME_MS = 300;
    var CHECK_RATE = 1000/300;
    var OFFSET_CALCULATION_BUFFER_SIZE = 720;

    Array.prototype.min = function() {
      return Math.min.apply(null, this);
    };

    // ###########################################################
    // Public Methods
    // ###########################################################

    // Initialize module
    function init(streaming_server_url, _Buffer, _lz4){
        Buffer = _Buffer;
        lz4 = _lz4;
        streaming_server = io.connect(streaming_server_url);
		Stats.init(streaming_server);
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
    //  timestamp: epoch milliseconds,
    //  data: []
    // }
    function receive(){
        streaming_server.on('frame', function(frame){

            Stats.AddReceivedPackets();

            // Arrival time registering
            frame.arrival_time = Date.now();
            
            // Base playout time calculation
            var base = base_playout_time_calculation(frame);
            
            // Jitter compensation
            var jitter = jitter_estimation(frame);
            
            // Payout time
            frame.playout_time = frame.timestamp + base + jitter + FIXED_BUFFERING_TIME_MS;

            var frameDataBuffer = new Buffer(new Uint8Array(frame.data));
            
            try {
                frame.data = lz4.decode(frameDataBuffer);
            } catch(e) {
                // data was not lz4 encoded -> do nothing!   
            }

            if (frameToPlayIdx === -1)
                frameToPlayIdx = frame.sequence;

            // Insert into playout buffer
            if (frame.playout_time >= frame.arrival_time){
                buffer[frame.sequence] = frame;
                countOfFramesInBuff++;
            } else {
                // Delayed frame
                Stats.AddDelayedPackets();
            }
        });
    };

	function play(pixels){
		setInterval(function(){

            if (countOfFramesInBuff > 0) {
                var now = Date.now();
                var frame;

                var bufferIter = frameToPlayIdx;

                while (!buffer[bufferIter])
                    bufferIter = (bufferIter + 1) % 256;

                while (countOfFramesInBuff > 0 && now > buffer[bufferIter].playout_time) {
                    countOfFramesInBuff--;
                    frame = buffer[bufferIter];
                    buffer[bufferIter] = null;
                    if (countOfFramesInBuff > 0)
                        while (!buffer[bufferIter])
                            bufferIter = (bufferIter + 1) % 256;
                }

                if (frame && now > frame.playout_time) {
                    frameToPlayIdx = (frame.sequence + 1) % 256;
                    console.log(frameToPlayIdx);

                    // Playout frame
                    ThreeHelper.update(frame.data, pixels);
                    ThreeHelper.render();
                    Stats.addPacketDetails(frame.timestamp, frame.arrival_time, frame.playout_time, now, buffer.length);
                }

            } else {
             // console.log("Is buffering... ", buffer.length);
            }
		}, CHECK_RATE);
	};

	// ###########################################################
    // Streaming
    // ###########################################################

    var oPublic = {
      init: init,
      receive: receive,
      play: play
    };
    return oPublic;

}();