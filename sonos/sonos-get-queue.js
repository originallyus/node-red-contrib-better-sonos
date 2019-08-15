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

		//handle input message
		node.on('input', function (msg) {
			helper.preprocessInputMsg(node, configNode, msg, function(device) {
				getSonosCurrentQueue(node, msg, device.ipaddress);
			});
		});
	}

	//------------------------------------------------------------------------------------------

	function getSonosCurrentQueue(node, msg, ipaddress) 
	{
		var sonos = require('sonos');
		var client = new sonos.Sonos(ipaddress);
		if (client === null || client === undefined) {
			node.status({fill:"red", shape:"dot", text:"sonos client is null"});
			return;
		}

		client.getQueue()
		.then(queueObj => {
			if (queueObj === null || queueObj === undefined || queueObj.items === undefined || queueObj.items === null) {
				node.status({fill:"red", shape:"dot", text:"invalid current queue retrieved"});
				return;
			}
			
			var tracksArray = queueObj.items;

			//massage albumArtURL
			tracksArray.forEach(function(trackObj) {
				if (trackObj.albumArtURL !== undefined && trackObj.albumArtURL !== null) {
					var port = 1400;
					trackObj.albumArtURI = trackObj.albumArtURL;
					trackObj.albumArtURL = "http://" + ipaddress + ":" + port + trackObj.albumArtURI;
				}
			});

			//Output data
			msg.payload = tracksArray;

			//Send output
			node.send(msg);
		})
		.catch(err => {
			if (err === "{}") {
				node.error(JSON.stringify(err));
				node.status({fill:"blue", shape:"dot", text:"queue is empty"});
				msg.payload = [];
				node.send(msg);
			}
			else {
				node.error(JSON.stringify(err));
				node.status({fill:"red", shape:"dot", text:"failed to retrieve current queue"});
			}
		});
	}
	
	RED.nodes.registerType('better-sonos-get-queue', Node);
};