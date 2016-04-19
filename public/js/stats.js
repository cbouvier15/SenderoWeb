/**
  *
  * Stats
  * Module to keep, manage and send streaming statistics.
  * Authors: dernster, alarrosa14, kitab15.
  */

var Stats = function(){

	// ###########################################################
    // Private
    // ###########################################################

    var SEND_STATS_INTERVAL_MS = 30000;
    var SEND_STATS = true;
    var READY_TO_SEND = false;

	var stats = {
		'timestamp' : 0,

		'receivedPackets': 0,
		'delayedPackets': 0,
		'discardedPackets': 0,

		'currentOffset': 0, 
		'currentJitter': 0,
		
		'tsFrameRateMean': 0,
		'tsFrameRateStdev': 0,

		'arrFrameRateMean': 0,
		'arrFrameRatStdev': 0,

		'ptFrameRateMean': 0,
		'ptFrameRateStdev': 0,

		'rpFrameRateMean': 0,
		'rpFrameRateStdev': 0,

		'bufferSizeMean': 0,

		'calculatedPacketsPlayed': 0,
		'misorderedPackets': 0,

	};

	var tsPrev = 0, arrPrev = 0, ptPrev = 0, rptPrev = 0;
	var tsSum = 0, arrSum = 0, ptSum = 0, rptSum = 0, buffSum = 0;
	var tsSum_2 = 0, arrSum_2 = 0, ptSum_2 = 0, rptSum_2 = 0;
	var tsQty = 1, arrQty = 1, ptQty = 1, rptQty = 1, bufQty = 1;

	var _streaming_server = null;
	var first_time = true;

	// ###########################################################
    // Public Methods
    // ###########################################################

	function init(streaming_server){
		_streaming_server = streaming_server;
		if (SEND_STATS){
			activateStreamingStats();
		}
	};

	function mean(sum, n){
		return sum/n;
	}

	function stdev(sum, sum_2, n){
		return Math.sqrt((n*sum_2) - Math.pow(sum,2))/n;
	}

	function activateStreamingStats(){
		setInterval(function(){

			if (READY_TO_SEND){
				stats.tsFrameRateMean = mean(tsSum,tsQty);
				stats.tsFrameRateStdev = stdev(tsSum, tsSum_2,tsQty);

				stats.arrFrameRateMean = mean(arrSum,arrQty);
				stats.arrFrameRatStdev = stdev(arrSum, arrSum_2,arrQty);

				stats.ptFrameRateMean = mean(ptSum,ptQty);
				stats.ptFrameRateStdev = stdev(ptSum, ptSum_2,ptQty);

				stats.rpFrameRateMean = mean(rptSum,rptQty);
				stats.rpFrameRateStdev = stdev(rptSum, rptSum_2,rptQty);

				stats.bufferSizeMean = mean(buffSum,bufQty);

				stats.timestamp = Date.now();

				_streaming_server.emit('stat', stats);
			}
		}, SEND_STATS_INTERVAL_MS);
	};

	function addPacketDetails(ts, arr, pt, rpt, buff){
		if (first_time){
			first_time = false;
		}else{
			tsSum += ts-tsPrev;
			tsSum_2 += Math.pow(ts-tsPrev, 2);
			tsQty += 1;
			arrSum += arr-arrPrev;
			arrSum_2 += Math.pow(arr-arrPrev, 2);
			arrQty += 1;
			ptSum += pt-ptPrev;
			ptSum_2 += Math.pow(pt-ptPrev, 2);
			ptQty += 1;
			rptSum += rpt-rptPrev;
			rptSum_2 += Math.pow(rpt-rptPrev, 2);
			rptQty += 1;
			buffSum += buff;
			bufQty += 1;
		}
		tsPrev = ts;
		arrPrev = arr;
		ptPrev = pt;
		rptPrev = rpt;
	}

	function AddReceivedPackets(){
		stats.receivedPackets += 1;
		READY_TO_SEND = true;
	}

	function AddDelayedPackets(){
		stats.delayedPackets += 1;
	}

	function AddDiscardedPackets(){
		stats.discardedPackets += 1;
	}

	function currentOffset(newVal){
		stats.currentOffset = newVal;
	}

	function addCalculatedPacketsPlayed() {
		stats.calculatedPacketsPlayed++;
	}

	function addMisorderedPackets(count) {
		stats.misorderedPackets += count;
	}

	function currentJitter(newVal){
		stats.currentJitter = newVal;
	}

	// ###########################################################
	// Stats
	// ###########################################################

	var oPublic = {
		init: init,
		addPacketDetails: addPacketDetails,
		AddReceivedPackets: AddReceivedPackets,
		AddDelayedPackets: AddDelayedPackets,
		AddDiscardedPackets: AddDiscardedPackets,
		addCalculatedPacketsPlayed: addCalculatedPacketsPlayed,
		addMisorderedPackets: addMisorderedPackets,
		currentOffset: currentOffset,
		currentJitter: currentJitter,
	};
	return oPublic;

}();