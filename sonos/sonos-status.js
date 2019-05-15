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
				getSonosCurrentTrack(node, msg, device.ipaddress);
			});
		});
	}

	//------------------------------------------------------------------------------------------

	function getSonosCurrentTrack(node, msg, ipaddress) 
	{
		var sonos = require('sonos');
		var client = new sonos.Sonos(ipaddress);
		if (client === null || client === undefined) {
			node.status({fill:"red", shape:"dot", text:"sonos client is null"});
			return;
		}

		client.currentTrack()
		.then((trackObj) => {
			if (trackObj === null || trackObj === undefined) {
				node.status({fill:"red", shape:"dot", text:"invalid current track retrieved"});
				return;	
			}

			//massage albumArtURL property
			if (trackObj.albumArtURI !== undefined && trackObj.albumArtURI !== null) {
				var port = 1400;
				trackObj.albumArtURL = "http://" + ipaddress + ":" + port + trackObj.albumArtURI;
			}
			
			//Output data
			msg.payload = trackObj.title;
			msg.track = trackObj;

			getSonosVolume(node, msg, ipaddress);
		}).catch((err) => {
			node.error(JSON.stringify(err));
			node.status({fill:"red", shape:"dot", text:"failed to retrieve current track"});
		});
	}
	
	function getSonosVolume(node, msg, ipaddress) 
	{
		var sonos = require('sonos');
		var client = new sonos.Sonos(ipaddress);
		if (client === null || client === undefined) {
			node.status({fill:"red", shape:"dot", text:"sonos client is null"});
			return;
		}

		client.getVolume().then((volume) => {
			if (volume === null || volume === undefined) {
				node.status({fill:"red", shape:"dot", text:"invalid volume retrieved"});
				return;	
			}
			if (volume < 0 || volume > 100) {
				node.status({fill:"red", shape:"dot", text:"invalid volume range retrieved"});
				return;
			}

			//Output data
			msg.volume = volume;
			msg.normalized_volume = volume / 100.0;
			
			getSonosCurrentState(node, msg, ipaddress);
		}).catch((err) => {
			node.error(JSON.stringify(err));
			node.status({fill:"red", shape:"dot", text:"failed to retrieve volume"});
		});
	}

	function getSonosCurrentState(node, msg, ipaddress) 
	{
		var sonos = require('sonos');
		var client = new sonos.Sonos(ipaddress);
		if (client === null || client === undefined) {
			node.status({fill:"red", shape:"dot", text:"sonos client is null"});
			return;
		}

		client.getCurrentState().then((state) => {
			if (state === null || state === undefined) {
				node.status({fill:"red", shape:"dot", text:"invalid current state retrieved"});
				return;	
			}

			//Output data
			msg.state = state;

			getSonosMuted(node, msg, ipaddress);
		}).catch((err) => {
			node.error(JSON.stringify(err));
			node.status({fill:"red", shape:"dot", text:"failed to retrieve current state"});
		});
	}

	function getSonosMuted(node, msg, ipaddress) 
	{
		var sonos = require('sonos');
		var client = new sonos.Sonos(ipaddress);
		if (client === null || client === undefined) {
			node.status({fill:"red", shape:"dot", text:"sonos client is null"});
			return;
		}

		client.getMuted().then((muted) => {
			if (muted === null || muted === undefined) {
				node.status({fill:"red", shape:"dot", text:"invalid Mute status retrieved"});
				return;	
			}

			//volume + current track
			var text = "";
			if (muted)
				text += "muted • ";
			text += "vol:" + msg.volume;
			if (msg.payload)
				text += " • " + msg.payload;
			node.status({fill:"green", shape:"dot", text:text});
			
			//Output data
			msg.muted = muted;

			//Send output
			node.send(msg);
		}).catch((err) => {
			node.error(JSON.stringify(err));
			node.status({fill:"red", shape:"dot", text:"failed to retrieve Mute status"});
		});
	}
	
	RED.nodes.registerType('better-sonos-status', Node);
};