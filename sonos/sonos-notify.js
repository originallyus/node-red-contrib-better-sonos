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
		node.notificationuri = n.notificationuri;

		//handle input message
		node.on('input', function (msg) {
			helper.preprocessInputMsg(node, configNode, msg, function(device) {
				playSonosNotification(node, msg, device.ipaddress);
			});
		});
	}

	function playSonosNotification(node, msg, ipaddress)
	{
		var sonos = require('sonos');
		var client = new sonos.Sonos(ipaddress);
		if (client === null || client === undefined) {
			node.status({fill:"red", shape:"dot", text:"sonos client is null"});
			return;
		}

		var payload = typeof msg.payload === 'object' ? msg.payload : {};

		var _notificationuri = node.notificationuri;
		if (payload.notificationuri)
			_notificationuri = payload.notificationuri;

		if (_notificationuri && _notificationuri != ""){
			node.log("Playing notficiation with URI: " + _notificationuri);

			helper.handleSonosApiRequest(
				client.playNotification(
					{
						uri: notificationuri, 
						metadata: null, 
						onlyWhenPlaying: false, 
						volume: 30
					})
					.then((success) => {
						console.log('Did play notification %j', success);
						//console.log('===> This is the PID we are going to exit %s', process.pid);
						//process.exit();
					})
					.catch((err) => {
						console.log('Did NOT play notification %j', err);
					})
					.finally(() => {
						console.log('===> This is the PID we are going to exit %s', process.pid);
						//process.exit();
					}),
				node, msg, "playing", null);
		}
		
		msg.payload = payload;
		node.send(msg); 
	}

	RED.nodes.registerType('better-sonos-notify', Node);
};