// Sonos Set node
var sonos = require('sonos');

module.exports = function(RED) {
    'use strict';

    function Node(config) {
      
        RED.nodes.createNode(this,config);
		
		var playnode = RED.nodes.getNode(config.playnode); 
		this.client = new sonos.Sonos(playnode.ipaddress);

		var node = this;
        node.on('input', function (msg) {
            switch (config.dataType) {
            case "state":
                switch (msg.payload) {
                case 'stopped':
                    node.client.stop(function(err, result) {
                        if (err) {
                            node.log(JSON.stringify(err));
                            node.status({fill:"red", shape:"ring",text:JSON.stringify(err)});
                        }
                    });
                    break;
                case 'playing':
                    node.client.play(function(err, result) {
                        if (err) {
                            node.log(JSON.stringify(err));
                            node.status({fill:"red", shape:"ring",text:JSON.stringify(err)});
                        }
                    });
                    break;
                case 'paused':
                    node.client.pause(function(err, result) {
                        if (err) {
                            node.log(JSON.stringify(err));
                            node.status({fill:"red", shape:"ring",text:JSON.stringify(err)});
                        }
                    });
                    break;
                default:
                    node.log("Wrong payload type: " + JSON.stringify(msg.payload));
                    break;
                }
                break;
            case "volume":
                node.client.setVolume(String(msg.payload), function(err, result) {
                    if (err) {
                        node.log(JSON.stringify(err));
                        node.status({fill:"red", shape:"ring",text:JSON.stringify(err)});
                    }
                });
                break;
            case "track":
                switch (msg.payload) {
                case 'previous':
                    node.client.previous(function(err, result) {
                        if (err) {
                            node.log(JSON.stringify(err));
                            node.status({fill:"red", shape:"ring",text:JSON.stringify(err)});
                        }
                    });
                    break;
                case 'next':
                    node.client.next(function(err, result) {
                        if (err) {
                            node.log(JSON.stringify(err));
                            node.status({fill:"red", shape:"ring",text:JSON.stringify(err)});
                        }
                    });
                    break;
                default:
                    node.log("Wrong payload type: " + JSON.stringify(msg.payload));
                    break;
                }
                break;
            case "seek":
            //TODO
                node.client.currentTrack(function (err, track) {
                    if (err) {
                        node.log(JSON.stringify(err));
                        node.status({fill:"red", shape:"ring",text:JSON.stringify(err)});
                    } else {
                        var value = msg.payload * track.duration / 1000;
                        node.client.seek(value, function (err, track) {
                            if (err) {
                                node.log(JSON.stringify(err));
                                node.status({fill:"red", shape:"ring",text:JSON.stringify(err)});
                            }
                        });
                    }
                });
                break;
            default:
                node.log("Wrong data type: " + config.dataType);
                break;
            }
        });
	}

    RED.nodes.registerType('sonos-set', Node);
};
