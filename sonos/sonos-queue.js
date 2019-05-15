var SonosHelper = require('./SonosHelper.js');
var helper = new SonosHelper();

module.exports = function(RED) {
	'use strict';

	function Node(n) {
	  
		RED.nodes.createNode(this, n);
		var node = this;
		var configNode = RED.nodes.getNode(n.confignode);

		var isValid = helper.validateConfigNode(node, configNode);
		if (!isValid)
			return;

		//clear node status
		node.status({});

		//Hmmm?		
		node.songuri = n.songuri;
		node.position = n.position;
		if (node.position === "empty") {
			node.position = "";
		}
		node.positioninqueue = n.positioninqueue;

		//handle input message
		node.on('input', function (msg) {
			helper.preprocessInputMsg(node, configNode, msg, function(device) {
				setSonosQueue(node, msg, device.ipaddress);
			});
		});
	}

	function setSonosQueue(node, msg, ipaddress)
	{
		var sonos = require('sonos');
		var client = new sonos.Sonos(ipaddress);
		if (client === null || client === undefined) {
			node.status({fill:"red", shape:"dot", text:"sonos client is null"});
			return;
		}

		var payload = typeof msg.payload === 'object' ? msg.payload : {};

		var _songuri = node.songuri;
		if (payload.songuri)
			_songuri = payload.songuri;
		
		if (node.position === "next" || payload.position === "next") {
			node.log("Queueing URI next: " + _songuri);
			helper.handleSonosApiRequest(client.queueNext(_songuri), node, msg, null, null);
		} 
		else if (node.position === "directplay" || payload.position === "directplay") {
			node.log("Direct play URI: " + _songuri);
			helper.handleSonosApiRequest(client.play(_songuri), node, msg, null, null);
		} 
		else {				
			// Default is append to the end of current queue
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
			helper.handleSonosApiRequest(client.queue(_songuri, set_position), node, msg, null, null);
		}
	}

	RED.nodes.registerType('better-sonos-queue', Node);
};