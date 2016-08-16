// Sonos Current Track node
var sonos = require('sonos');

module.exports = function(RED) {
    'use strict';

    function Node(n) {
      
        RED.nodes.createNode(this,n);
        var playnode = RED.nodes.getNode(n.playnode); 
        this.client = new sonos.Sonos(playnode.ipaddress);	
        var node = this;
        
        this.on('input', function (msg) {
            if (msg.payload.get == 'track') {
			
                node.client.currentTrack(function (err, track) {
                    msg.payload = track;
                    node.send(msg);
                    if (err) {
                        node.log(JSON.stringify(err));
                    }
                    node.log(JSON.stringify(track));
                });
            }
            if (msg.payload.get == 'volume') {
			
                node.client.getVolume(function (err, volume) {
                    msg.payload = volume;
                    node.send(msg);
                    if (err) {
                        node.log(JSON.stringify(err));
                    }
                    //node.log(JSON.stringify(vome));
                });
            }
        });
		
    }

    RED.nodes.registerType('sonos-query', Node);
};