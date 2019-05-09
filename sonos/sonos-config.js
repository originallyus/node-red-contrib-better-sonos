module.exports = function(RED) 
{
    function SonosPlayerNode(config) {
        RED.nodes.createNode(this, config);

        this.serialnum = config.serialnum;
        this.ipaddress = config.ipaddress;
    }

    //Build API to auto detect IP Addresses
    RED.httpAdmin.get("/sonosSearch", function(req, res) {
        RED.log.debug("GET /sonosSearch");
        discoverSonos(function(devices) {
            RED.log.debug("GET /sonosSearch: " + devices.length + " found");
            res.json(devices);
        });
    });

    function discoverSonos(discoveryCallback) 
    {
        RED.log.debug("Start Sonos discovery");

        var sonos = require("sonos");

        var devices = [];
        const search = sonos.DeviceDiscovery({ timeout: 5000 });

        search.on('DeviceAvailable', function (device, model){
            device.deviceDescription()
            .then((info) => {
                var label = "" + info.friendlyName + " (" + info.roomName + ")";
                console.log(devices, '<======= devices array');
                devices.push({
                    label:label,
                    value:info.serialNum
                });
            })
            .catch((err) => {
                console.log(err);
                return;
            });
        });

        setTimeout(function(){
            search.destroy();
        }, 5000);

  
        //Add a bit of delay for all devices to be discovered
        if (discoveryCallback) {
            setTimeout(function() { 
                discoveryCallback(devices);
            }, 5000);
        }
    }

    RED.nodes.registerType("better-sonos-config", SonosPlayerNode);
};