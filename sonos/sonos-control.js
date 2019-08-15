var SonosHelper = require('./SonosHelper.js');
var helper = new SonosHelper();

module.exports = function(RED) {
	'use strict';

	function Node(config) {
	  
		RED.nodes.createNode(this, config);
		var node = this;
		var configNode = RED.nodes.getNode(config.confignode);

		var isValid = helper.validateConfigNode(node, configNode);
		if (!isValid)
			return;

		//clear node status
		node.status({});

		//Hmmm?
		node.mode = config.mode;
		node.track = config.track;
		node.volume = config.volume;
		if (node.volume === "empty")
			node.volume = "";
		node.volume_value = config.volume_value;
		
		//handle input message
		node.on('input', function (msg) {
			helper.preprocessInputMsg(node, configNode, msg, function(device) {
				handleInputMsg(node, configNode, msg, device.ipaddress);
			});
		});
	}

	//------------------------------------------------------------------------------------

	function handleInputMsg(node, configNode, msg, ipaddress)
	{
		var sonos = require('sonos');
		var client = new sonos.Sonos(ipaddress);
		if (client === null || client === undefined) {
			node.status({fill:"red", shape:"dot", text:"sonos client is null"});
			return;
		}

		//Convert payload to lowercase string
		var payload = "";
		if (msg.payload !== null && msg.payload !== undefined && msg.payload) 
			payload = "" + msg.payload;
		payload = payload.toLowerCase();

		//Handle simple string payload format, rather than specific JSON format previously
		if (payload === "play" || payload === "pause" || payload === "stop" || payload === "toggle" || payload === "playpause") {
			payload = {mode: payload};
		}
		else if (payload === "next" || payload === "previous") {
			payload = {track: payload};
		}
		else if (payload === "mute" || payload === "unmute" || payload === "vol_up" || payload === "vol_down" || payload === "vol+" || payload === "vol+") {
			payload = {volume: payload};
		}
		else if (payload.startsWith("+") && parseInt(payload) > 0 && parseInt(payload) <= 100) {
			payload = {volume: "vol_up", volstep: parseInt(payload)};
		}
		else if (payload.startsWith("-") && parseInt(payload) < 0 && parseInt(payload) >= -100) {
			payload = {volume: "vol_down", volstep: -parseInt(payload)};
		}
		else if (!isNaN(parseInt(payload)) && parseInt(payload) >= 0 && parseInt(payload) <= 100) {
			payload = {volume: "vol_set", volume_value: payload};
		}
		else if (payload === "flush" || payload === "clear") {
			payload = {command: "flush"};
		}

		//Grouping
		else if (payload === "join" || payload === "join_group" || payload === "joingroup" || payload === "join group") {
			payload = "join_group";
			handleGroupingCommand(node, configNode, msg, client, payload);
		}
		else if (payload === "leave" || payload === "leave_group" || payload === "leavegroup" || payload === "leave group") {
			payload = "leave_group";
			handleGroupingCommand(node, configNode, msg, client, payload);
		}
		
		//Use payload values only if config via dialog is empty
		var _mode = payload.mode;
		if (node.mode)
			_mode = node.mode;
		var _track = payload.track;
		if (node.track)
			_track = node.track;
		var _volume = payload.volume;
		if (node.volume)
			_volume = node.volume;
		var _command = payload.command;
		if (node.command)
			_command = node.command;

		// simple control commands
		if (_mode)
			handleCommand(node, configNode, msg, client, _mode);
		if (_track)
			handleCommand(node, configNode, msg, client, _track);
		if (_volume)
			handleCommand(node, configNode, msg, client, _volume);
		if (_command)
			handleCommand(node, configNode, msg, client, _command);

		// commands with parameters
		if (payload.volume || node.volume)
			handleVolumeCommand(node, configNode, msg, client, payload);

		node.send(msg);
	}

	//------------------------------------------------------------------------------------

	function handleCommand(node, configNode, msg, client, cmd)
	{
		switch (cmd) 
		{
			case "pause":
				helper.handleSonosApiRequest(client.pause(), node, msg, "paused", null);
				break;
			case "stop":
				helper.handleSonosApiRequest(client.stop(), node, msg, "stopped", null);
				break;
			case "toggle":
			case "playpause":
				//Retrieve current playing state
				client.getCurrentState()
					.then((state) => {
						if (state === null || state === undefined) {
							node.status({fill:"red", shape:"dot", text:"invalid current state retrieved"});
							return;	
						}

						//Toggle playing state
						if (state === "playing") {
							helper.handleSonosApiRequest(client.pause(), node, msg, "paused", null);
						}
						else {
							helper.handleSonosApiRequest(client.play(), node, msg, "playing", null);
						}
					})
					.catch((err) => {
						node.error(JSON.stringify(err));
						node.status({fill:"red", shape:"dot", text:"failed to retrieve current state"});
					});
				break;
			case "play":
			case "playing":
				helper.handleSonosApiRequest(client.play(), node, msg, "playing", null);
				break;
			case "next":
				helper.handleSonosApiRequest(client.next(), node, msg, "next", null);
				break;
			case "previous":
				helper.handleSonosApiRequest(client.previous(), node, msg, "previous", null);
				break;

			case "mute":
				helper.handleSonosApiRequest(client.setMuted(true), node, msg, "muted", null);
				break;
			case "unmute":
				helper.handleSonosApiRequest(client.setMuted(false), node, msg, "muted", null);
				break;

			case "flush":
				helper.handleSonosApiRequest(client.flush(), node, msg, "muted", null);
				break;
		}
	}

	function handleVolumeCommand(node, configNode, msg, client, payload)
	{
		var _volumeFunction;
		var _volumeValue;

		//Use payload values as default
		if (payload.volume) {
			if (payload.volume === "vol_up" || payload.volume === "volup" || payload.volume === "vol+") {
				_volumeFunction = "vol_up";
				_volumeValue = payload.volstep;
				
			} else if (payload.volume === "vol_down" || payload.volume === "voldown" || payload.volume === "vol-") {
				_volumeFunction = "vol_down";
				_volumeValue = payload.volstep;
					
			} else if (payload.volume === "mute") {
				_volumeFunction = "mute";
					
			} else if (payload.volume === "unmute") {
				_volumeFunction = "unmute";
					
			} else if (payload.volume === "vol_set") {
				_volumeFunction = "vol_set";
				_volumeValue = payload.volume_value;
			}
		}
		
		//Use payload values only if config via dialog is empty
		if (node.volume === "volume") {
			_volumeFunction = "vol_set";
			_volumeValue = node.volume_value;

		} else if (node.volume === "vol_up") {
			_volumeFunction = "vol_up";
			_volumeValue = node.volume_value;

		} else if (node.volume === "vol_down") {
			_volumeFunction = "vol_down";
			_volumeValue = node.volume_value;

		} else if (node.volume === "mute") {
			_volumeFunction = "mute";

		} else if (node.volume === "unmute") {
			_volumeFunction = "unmute";
		}
		
		switch (_volumeFunction) 
		{
			case "vol_set":
				var volume_val = parseInt(_volumeValue);
				if (isNaN(volume_val) || volume_val < 0 || volume_val > 100) {
					node.status({fill:"red", shape:"dot", text:"invalid value for volume"});
					break;
				}
				helper.handleSonosApiRequest(client.setVolume(String(_volumeValue)), node, msg, "vol: " + String(_volumeValue), null);
				break;

			
			case "vol_up":
				var volume_step = parseInt(_volumeValue);
				if (isNaN(volume_step) || volume_step > 100 || volume_step <= 0)
					volume_step = 5;
				client.getVolume()
					.then((result) => {
						var volume_val = parseInt(result) + volume_step;
						volume_val = Math.min(100, volume_val);
						volume_val = Math.max(0, volume_val);
						helper.handleSonosApiRequest(client.setVolume(volume_val), node, msg, "vol: " + String(volume_val), null);
					})
					.catch((err) => {
						node.error(JSON.stringify(err));
						node.status({fill:"red", shape:"dot", text:"failed to execute request"});
					});
				break;

			case "vol_down":
				var volume_step = parseInt(_volumeValue);
				if (isNaN(volume_step) || volume_step > 100 || volume_step <= 0)
					volume_step = 5;
				client.getVolume()
					.then((result) => {
						var volume_val = parseInt(result) - volume_step;
						volume_val = Math.min(100, volume_val);
						volume_val = Math.max(0, volume_val);
						helper.handleSonosApiRequest(client.setVolume(volume_val), node, msg, "vol: " + String(volume_val), null);
					})
					.catch((err) => {
						node.error(JSON.stringify(err));
						node.status({fill:"red", shape:"dot", text:"failed to execute request"});
					});
				break;
		}
	}

	function handleGroupingCommand(node, configNode, msg, client, payload)
	{
		if (payload === "leave_group") {
			helper.handleSonosApiRequest(client.leaveGroup(),node, msg, "left group", null);
		}

		if (payload === "join_group") {
			//validation
			var deviceName = msg.topic;
			if (!deviceName) {
				node.error(JSON.stringify(err));
				node.status({fill:"red", shape:"dot", text:"msg.topic is not defined"});
				return;
			}

			helper.handleSonosApiRequest(client.joinGroup(deviceName),node, msg, "joined group with " + deviceName, null);
		}
	}
	
	RED.nodes.registerType('better-sonos-control', Node);
};
