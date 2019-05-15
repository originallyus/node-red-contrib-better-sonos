'use strict';

class SonosHelper
{
    constructor() {
    }

    validateConfigNode(node, configNode)
    {
        if (configNode === undefined || configNode === null) {
            node.status({fill:"red", shape:"ring", text:"please select a config node"});
            return false;
        }
        var hasSerialNum = configNode.serialnum !== undefined && configNode.serialnum !== null && configNode.serialnum.trim().length > 5;
        var hasIpAddress = configNode.ipaddress !== undefined && configNode.ipaddress !== null && configNode.ipaddress.trim().length > 5;
        if (!hasSerialNum && !hasIpAddress) {
            node.status({fill:"red", shape:"ring", text:"missing serial number or IP Address in config node"});
            return false;
        }

        //clear node status
        node.status({});
        return true;
    }

    preprocessInputMsg(node, configNode, msg, callback)
    {
        var isValid = this.validateConfigNode(node, configNode);
        if (!isValid)
            return;

        //use IP Address if user set it
        var hasIpAddress = configNode.ipaddress !== undefined && configNode.ipaddress !== null && configNode.ipaddress.trim().length > 5;
        if (hasIpAddress) {
            if (callback)
                callback(configNode);
            return;
        }

        //first find the Sonos IP address from given serial number
        this.findSonos(node, configNode.serialnum, function(err, device) {
            if (err) {
                node.error(JSON.stringify(err));
		console.log(err, '<======== error');
                node.status({fill:"red", shape:"dot", text:"error looking for device " + configNode.serialnum});
                return;
            }
            if (device === null) {
                node.status({fill:"red", shape:"dot", text:"device " + configNode.serialnum + " not found"});
                return; 
            }

            console.log("Found Sonos device " + configNode.serialnum + " at " + device.ipaddress);

            if (callback)
                callback(device);
        });
    }

    findSonos(node, serialNumber, callback) 
    {
        var foundMatch = false;
        var sonos = require("sonos");
        
        const search = sonos.DeviceDiscovery({ timeout: 30000 });

        search.on('DeviceAvailable', function (device, model){
            device.deviceDescription()
            .then((info) => {
                //Inject additional property
                if (info.friendlyName !== undefined && info.friendlyName !== null)
                    info.ipaddress = info.friendlyName.split("-")[0].trim();
                if (device.host)
                    info.ipaddress = device.host;

                //We use 2 different ways to obtain serialnum Sonos API
                if (info.serialNum !== undefined && info.serialNum !== null)
                    if (info.serialNum.trim().toUpperCase() == serialNumber.trim().toUpperCase())
                        foundMatch = true;
                
                if (device.serialNumber !== undefined && device.serialNumber !== null)
                    if (device.serialNumber.trim().toUpperCase() == serialNumber.trim().toUpperCase())
                        foundMatch = true;

                if (foundMatch && callback)
                    callback(null, info);
            })
            .catch((err) => {
                node.error(JSON.stringify(err));
                callback(err, null);
                return;
            });
        });

        setTimeout(function(){
            if (!foundMatch && callback)
                callback(null, null);
        }, 30000);
    }
    
    handleSonosApiRequest(promise, node, msg, successString, failureString, callback){
        promise
            .then((result) => {
                this.handleSonosApiRequestSuccess(node, result, msg, successString);
		if (callback)
			callback(result);
            })
            .catch((err) => {
                this.handleSonosApiRequestError(node, err, failureString);
            });
    }

    handleSonosApiRequestSuccess(node, result, msg, successString){
        msg.payload = result;
        if (!successString)
            successString = "request success";
        node.status({fill:"blue", shape:"dot", text:successString});
    }

    handleSonosApiRequestError(node, err, failureString){
        node.error(err);
        console.log(err);
        if(!failureString)
            failureString = "failed to execute request";
        node.status({fill:"red", shape:"dot", text:failureString});
    }
}
module.exports = SonosHelper;
