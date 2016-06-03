// Sonos Queue Song
var sonos = require('sonos');

module.exports = function(RED) {
    'use strict';

    function Node(n) {
      
        RED.nodes.createNode(this,n);
		
		var playnode = RED.nodes.getNode(n.playnode); 
		this.client = new sonos.Sonos(playnode.ipaddress);
		
		this.songuri = n.songuri;
		this.position = n.position;
		if (this.position === "empty") {
			this.position = "";
		}
		this.positioninqueue = n.positioninqueue;
		
		var node = this;
        
        this.on('input', function (msg) {            
            var payload = typeof msg.payload === 'object' ? msg.payload : {};
			
			var _songuri = node.songuri;
			if (payload.songuri) {
				_songuri = payload.songuri;
			}
			
			if (node.position === "next" || payload.position === "next") {
				node.log("Queueing URI next: " + _songuri);
				node.client.queueNext(_songuri, function (err, result) {
					msg.payload = result;
					node.send(msg);
					if (err) {
						node.log(JSON.stringify(err));
					}
					node.log(JSON.stringify(result));
				});
			} else if (node.position === "directplay" || payload.position === "directplay") {
				node.log("Direct play URI: " + _songuri);
				node.client.play(_songuri, function (err, result) {
					msg.payload = result;
					node.send(msg);
					if (err) {
						node.log(JSON.stringify(err));
					}
					node.log(JSON.stringify(result));
				});
			} else {				
				// Default is queueing to the end of a queue
				var set_position = 0;
				// Evaluate different inputs (json payload preferred, node option second, default third)
				if (payload.position) {
					set_position = payload.position;
				} else if (node.positioninqueue) {
					if (isNaN(node.positioninqueue) == false) {
						set_position = parseInt(node.positioninqueue, 10);
					}
				}
				// Queue song now
				node.log("Queuing at " + set_position + " URI: " + _songuri );
				node.client.queue(_songuri, set_position, function (err, result) {
					msg.payload = result;
					node.send(msg);
					if (err) {
						node.log(JSON.stringify(err));
					}
					node.log(JSON.stringify(result));
				});
			}

		});
		
	}

    RED.nodes.registerType('sonos-queue', Node);
};