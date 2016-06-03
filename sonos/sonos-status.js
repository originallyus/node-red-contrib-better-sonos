// Sonos Current Track node
var sonos = require('sonos');

module.exports = function(RED) {
    'use strict';

    function Node(n) {
      
        RED.nodes.createNode(this,n);
		
		var playnode = RED.nodes.getNode(n.playnode); 
		this.client = new sonos.Sonos(playnode.ipaddress);
		
		var node = this;

        var muteState = function
        
        this.on('input', function (msg) {            
            switch (msg.topic) {
            case "playback":
                if (typeof msg.payload === 'object') { //set
                    switch (msg.payload) {
                        case 'stopped':
                            node.client.stop(function (err, data) {
                                msg.payload = data;
                                node.send(msg);
                                if (err) {
                                    node.error(JSON.stringify(err));
                                }
                            });
                            break;
                        case 'playing':
                            node.client.play(function (err, data) {
                                msg.payload = data;
                                node.send(msg);
                                if (err) {
                                    node.error(JSON.stringify(err));
                                }
                            });
                            break;
                        case 'paused':
                            node.client.pause(function (err, data) {
                                msg.payload = data;
                                node.send(msg);
                                if (err) {
                                    node.error(JSON.stringify(err));
                                }
                            });
                        default:
                            node.error("Payload is wrong: " + JSON.stringify(msg));
                    }
                } else { //get
                    node.client.getCurrentState(function (err, data) {
                        msg.payload = data;
                        node.send(msg);
                        if (err) {
                            node.error(JSON.stringify(err));
                        }
                    });
                }
                break;
            case "muted":
                if (typeof msg.payload === 'object') { //set
                    switch (Boolean(msg.payload)) {
                        case true:
                            node.client.setMuted(true, function (err, data) {
                                msg.payload = data;
                                node.send(msg);
                                if (err) {
                                    node.error(JSON.stringify(err));
                                }
                            });
                            break;
                        case false:
                            node.client.setMuted(false, function (err, data) {
                                msg.payload = data;
                                node.send(msg);
                                if (err) {
                                    node.error(JSON.stringify(err));
                                }
                            });
                            break;
                        default:
                            node.error("Payload is wrong: " + JSON.stringify(msg));
                    }
                } else { //get
                    node.client.getMuted(function (err, data) {
                        msg.payload = data;
                        node.send(msg);
                        if (err) {
                            node.error(JSON.stringify(err));
                        }
                    });
                }
                break;
            case "volume":
                if (typeof msg.payload === 'object') { //set
                    var value = parseInt(msg.payload);
                    if (isNaN(value) && value >= 0 && value <= 100) {
                        node.client.setVolume(msg.payload, function (err, data) {
                            msg.payload = data;
                            node.send(msg);
                            if (err) {
                                node.error(JSON.stringify(err));
                            }
                        });
                    } else {
                        node.error("Payload is wrong: " + JSON.stringify(msg));
                    }
                } else { //get
                    node.client.getVolume(function (err, data) {
                        msg.payload = data;
                        node.send(msg);
                        if (err) {
                            node.error(JSON.stringify(err));
                        }
                    });
                }
                break;
            case "track":
                if (typeof msg.payload === 'object') { //set
                    //TODO: write Set part
                } else { //get
                    node.client.currentTrack(function (err, data) {
                        msg.payload = data;
                        node.send(msg);
                        if (err) {
                            node.error(JSON.stringify(err));
                        }
                    });
                }
                break;
            case "seek":
                if (typeof msg.payload === 'object') { //set
                    var value = parseInt(msg.payload);
                    if (isNaN(value) && value >= 0) {
                        node.client.seek(value, function (err, data) {
                            msg.payload = data ? value : 0;
                            node.send(msg);
                            if (err) {
                                node.error(JSON.stringify(err));
                            }
                        });
                    } else {
                        node.error("Payload is wrong: " + JSON.stringify(msg));
                    }
                } else { //get
                    node.client.currentTrack(function (err, data) {
                        msg.payload = data.position;
                        node.send(msg);
                        if (err) {
                            node.error(JSON.stringify(err));
                        }
                    });
                }
                break;
            default:
                node.error("Topic is wrong: " + JSON.stringify(msg));
            }
		});
		
	}

    RED.nodes.registerType('sonos-status', Node);
};
