// Sonos Volume node
var sonos = require('sonos');

module.exports = function(RED) {
    'use strict';

    function Node(n) {
      
        RED.nodes.createNode(this,n);
		
		var playnode = RED.nodes.getNode(n.playnode); 
		this.client = new sonos.Sonos(playnode.ipaddress);
		

        this.timer = 500;
		var node = this;
        node.prevValue = null;
        var checkVolume = function() {
			node.client.getVolume(function (err, volume) {
				if (err) {
					node.log(JSON.stringify(err));
                    node.status({fill:"red", shape:"ring",text:JSON.stringify(err)});
				} else {
                    var value = volume;
                    if (value != node.prevValue) {
                        node.prevValue = value;
                        var msg = { payload:value };
                        node.send(msg);
                    }
                    node.status({});
                }
                node.tout = setTimeout(checkVolume, node.timer);
			});
        };
        node.tout = setTimeout(checkVolume, node.timer);
        node.on("close", function() {
            if (node.tout) { clearTimeout(node.tout); }
        });
	}

    RED.nodes.registerType('sonos-volume', Node);
};
