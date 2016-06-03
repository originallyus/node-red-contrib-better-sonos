# SONOS for NodeRED

A set of nodes to control SONOS via NodeRED. Uses the sonos [NPM Module](https://github.com/bencevans/node-sonos).

Currently very early alpha version ... development ongoing.

Open points / not tested yet:
* manipulating playlists
* zone configurations / grouping feature
* controlling stereo and or surround configurations
* automatic detection of play configuration

Known issues:
* status is only set according to input, not requested from player

Planned upcoming features:
* annoucement node (should play a jingle or a text to speech thing and then continue with current playlist)

## Installation

`npm install node-red-contrib-sonos`

## Implemented Nodes

Control - controls one SONOS player, by reacting on a JSON payload. 
Available modes: 
* `"mode":play,pause,stop` 
* `"track":next,previous`
* `"volume":1..100,mute,unmute`

Current Track - returns the currently played track

Queue - controls one SONOS player, by reacting on a JSON payload.
Available modes:
* `"songuri":<uri of the song to be queued>`
* `"position":0..<max_queue_length>,next`

```
[{"id":"5633ed23.863ce4","type":"inject","z":"cf7e64ed.43eed8","name":"","topic":"","payload":"{\"mode\":\"play\"}","payloadType":"json","repeat":"","crontab":"","once":false,"x":384,"y":902,"wires":[["405194b2.76386c"]]},{"id":"975103b.6a3eb","type":"inject","z":"cf7e64ed.43eed8","name":"","topic":"","payload":"{\"mode\":\"stop\"}","payloadType":"json","repeat":"","crontab":"","once":false,"x":377,"y":957,"wires":[["405194b2.76386c"]]},{"id":"9030486.2c905b8","type":"inject","z":"cf7e64ed.43eed8","name":"","topic":"","payload":"{\"mode\":\"pause\"}","payloadType":"json","repeat":"","crontab":"","once":false,"x":375,"y":1025,"wires":[["405194b2.76386c"]]},{"id":"dec0ad1a.c834a","type":"inject","z":"cf7e64ed.43eed8","name":"","topic":"","payload":"{\"track\":\"next\"}","payloadType":"json","repeat":"","crontab":"","once":false,"x":383,"y":1090,"wires":[["405194b2.76386c"]]},{"id":"9c7dd2ad.c3596","type":"inject","z":"cf7e64ed.43eed8","name":"","topic":"","payload":"{\"track\":\"previous\"}","payloadType":"json","repeat":"","crontab":"","once":false,"x":385,"y":1144,"wires":[["405194b2.76386c"]]},{"id":"405194b2.76386c","type":"sonos-control","z":"cf7e64ed.43eed8","playnode":"","name":"","x":635,"y":997,"wires":[]}]
```
