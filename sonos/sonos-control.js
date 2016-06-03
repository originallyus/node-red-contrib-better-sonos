// Sonos Play Node - control play/pause/stop function
var sonos = require('sonos');

module.exports = function(RED) {
    'use strict';

    function Node(n) {
      
        RED.nodes.createNode(this,n);

		this.mode = n.mode;
		this.track = n.track;
		this.volume = n.volume;
		if (this.volume === "empty") {
			this.volume = "";
		}
		this.volume_value = n.volume_value;
		
        var node = this;
        
        this.on('input', function (msg) {
            
            var playnode = RED.nodes.getNode(n.playnode);            
            var payload = typeof msg.payload === 'object' ? msg.payload : {};
			var client = new sonos.Sonos(playnode.ipaddress);
			
			
			// (TBD: discuss if automatic play with track and volume 
			// settings, maybe depending on a node setting "enforce automatic play")
			if (payload.mode || node.mode) {
				var _mode = node.mode;
				if (payload.mode) {
					node.log("Node setting overwritten by input: " + payload.mode);
					_mode = payload.mode;
				}
				switch (_mode) {
					case "pause":
						client.pause(function(err, result) {
							msg.payload = result;
							if (err) {
								node.log(JSON.stringify(err));
							};
							//node.log(JSON.stringify(result));
							node.log("paused");
							node.status({fill:"red",shape:"ring",text:"paused"});
						});
						break;
					case "stop":
						client.stop(function(err, result) {
							msg.payload = result;
							if (err) {
								node.log(JSON.stringify(err));
							}
							//node.log(JSON.stringify(result));
							node.log("stopped");
							node.status({fill:"red",shape:"ring",text:"stopped"});
						});
						break;
					default:
						client.play(function(err, result) {
							msg.payload = result;
							if (err) {
								node.log(JSON.stringify(err));
							}
							//node.log(JSON.stringify(result));
							node.log("playing");
							node.status({fill:"green",shape:"ring",text:"playing"});
						});
				}
			}
			// evaluate requested track setting
			if (payload.track || node.track) {
				var _track = node.track;
				if (payload.track) {
					node.log("Node setting overwritten by input: " + payload.track);
					_track = payload.track;
				}
				switch (_track) {
					case "next":	
						client.next(function(err, result) {
							msg.payload = result;
							if (err) {
								node.log(JSON.stringify(err));
							}
							//node.log(JSON.stringify(result));
							node.log("next track requested");
						});
						break;
					case "previous":
						client.previous(function(err, result) {
							msg.payload = result;
							if (err) {
								node.log(JSON.stringify(err));
							}
							//node.log(JSON.stringify(result));
							node.log("previous track requested");
						});
						break;
				}
			}
			// evaluate volume setting
			if (payload.volume || node.volume) {
				var _volume = node.volume;
				if (payload.volume) {
					node.log("Node setting overwritten by input: " + payload.volume);
					_volume = payload.volume;
				} else if (node.volume === "volume") {
					node.log("Node setting overwritten by input: " + node.volume_value);
					_volume = node.volume_value;
				}
				var volume_val = parseInt(_volume);
				if (volume_val >= 0 && volume_val <= 100) { 
					client.setVolume(String(_volume), function(err, result) {
						msg.payload = result;
						if (err) {
							node.log(JSON.stringify(err));
						}
						node.log("Volume changed to " + String(_volume));
					});
				} else if (_volume === "mute") {
					client.setMuted(true, function(err, result) {
						msg.payload = result;
						if (err) {
							node.log(JSON.stringify(err));
						}
						node.log("Volume muted");
					});
				} else if (_volume === "unmute") {
					client.setMuted(false, function(err, result) {
						msg.payload = result;
						if (err) {
							node.log(JSON.stringify(err));
						}
						node.log("Volume unmuted");
					});
				} else {
					node.log("Illegal volume value requested: " + String(_volume));
				}
			}
			
			node.send(msg);
        });
    }

    RED.nodes.registerType('sonos-control', Node);
};