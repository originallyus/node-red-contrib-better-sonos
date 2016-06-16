// Sonos Seek node
var sonos = require('sonos');

module.exports = function(RED) {
    'use strict';

    function Node(n) {
      
        RED.nodes.createNode(this,n);
		
		var playnode = RED.nodes.getNode(n.playnode); 
		this.client = new sonos.Sonos(playnode.ipaddress);
		
		var node = this;

        node.timer = 200;
        node.prevValue1 = null;
        node.prevValue2 = null;
        node.prevValue3 = null;
        var checkSeek = function() {
			node.client.currentTrack(function (err, track) {
				if (err) {
					node.log(JSON.stringify(err));
                    node.status({fill:"red", shape:"ring",text:JSON.stringify(err)});
				} else {
                    var value1 = track.position / track.duration;
                    var value2 = track.position;
                    var value3 = track.duration;
                    if (   value1 != node.prevValue1
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
                node.tout = setTimeout(checkSeek, node.timer);
			});
        };
        node.tout = setTimeout(checkSeek, node.timer);
        node.on("close", function() {
            if (node.tout) { clearTimeout(node.tout); }
        });
	}

    RED.nodes.registerType('sonos-seek', Node);
};
