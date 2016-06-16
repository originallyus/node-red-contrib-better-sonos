// Sonos State node
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
        var checkState = function() {
			node.client.getCurrentState(function (err, state) {
				if (err) {
					node.log(JSON.stringify(err));
                    node.status({fill:"red", shape:"ring",text:JSON.stringify(err)});
				} else {
                    var value = state;
                    if (value != node.prevValue) {
                        node.prevValue = value;
                        var msg = { payload:value };
                        node.send(msg);
                    }
                    node.status({});
                }
                node.tout = setTimeout(checkState, node.timer);
			});
        };
        node.tout = setTimeout(checkState, node.timer);
        node.on("close", function() {
            if (node.tout) { clearTimeout(node.tout); }
        });
	}

    RED.nodes.registerType('sonos-state', Node);
};
