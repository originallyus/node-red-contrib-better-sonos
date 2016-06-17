// Sonos Get node
var sonos = require('sonos');

module.exports = function(RED) {
    'use strict';

    function Node(config) {
      
        RED.nodes.createNode(this,config);
		
		var playnode = RED.nodes.getNode(config.playnode); 
		this.client = new sonos.Sonos(playnode.ipaddress);

        this.timer = config.updateInterval;

		var node = this;
        var check;
        switch (config.dataType) {
        case "state":
            node.prevValue = null;
            check = function() {
                node.client.getCurrentState(function (err, state) {
                    if (err) {
                        node.log(JSON.stringify(err));
                        node.status({fill:"red", shape:"ring",text:JSON.stringify(err)});
                    } else {
                        var value = state;
                        if (!config.onchangeonly || value != node.prevValue) {
                            node.prevValue = value;
                            var msg = { payload:value };
                            node.send(msg);
                        }
                        node.status({});
                    }
                    node.tout = setTimeout(check, node.timer);
                });
            };
            break;
        case "volume":
            node.prevValue = null;
            check = function() {
                node.client.getVolume(function (err, volume) {
                    if (err) {
                        node.log(JSON.stringify(err));
                        node.status({fill:"red", shape:"ring",text:JSON.stringify(err)});
                    } else {
                        var value = volume;
                        if (!config.onchangeonly || value != node.prevValue) {
                            node.prevValue = value;
                            var msg = { payload:value };
                            node.send(msg);
                        }
                        node.status({});
                    }
                    node.tout = setTimeout(check, node.timer);
                });
            };
            break;
        case "track":
            node.prevValue = null;
            check = function() {
                node.client.currentTrack(function (err, track) {
                    if (err) {
                        node.log(JSON.stringify(err));
                        node.status({fill:"red", shape:"ring",text:JSON.stringify(err)});
                    } else {
                        var value = track;
                        if (!config.onchangeonly || JSON.stringify(value) !== JSON.stringify(node.prevValue)) {
                            node.prevValue = value;
                            var msg = { payload:value };
                            node.send(msg);
                        }
                        node.status({});
                    }
                    node.tout = setTimeout(check, node.timer);
                });
            };
            break;
        case "seek":
            node.prevValue1 = null;
            node.prevValue2 = null;
            node.prevValue3 = null;
            check = function() {
                node.client.currentTrack(function (err, track) {
                    if (err) {
                        node.log(JSON.stringify(err));
                        node.status({fill:"red", shape:"ring",text:JSON.stringify(err)});
                    } else {
                        var value1 = 1000 * track.position / track.duration;
                        var value2 = track.position;
                        var value3 = track.duration;
                        if (!config.onchangeonly
                            || value1 != node.prevValue1
                            || value2 != node.prevValue2
                            || value3 != node.prevValue3) {
                            node.prevValue1 = value1;
                            node.prevValue2 = value2;
                            node.prevValue3 = value3;
                            var msg = { payload: value1, position:value2, duration:value3 };
                            node.send(msg);
                        }
                        node.status({});
                    }
                    node.tout = setTimeout(check, node.timer);
                });
            };
            break;
        default:
            node.log("Wrong data type: " + config.dataType);
            break;
        }
        node.tout = setTimeout(check, node.timer);
        node.on("close", function() {
            if (node.tout) { clearTimeout(node.tout); }
        });
	}

    RED.nodes.registerType('sonos-get', Node);
};
