'use strict';
var MqttCloud = require('azure-iot-device-mqtt').Mqtt;
var DeviceClient = require('azure-iot-device').Client
var Message = require('azure-iot-device').Message;
var connectionString = 'HostName=raniot-iothub.azure-devices.net;DeviceId=MyRasp;SharedAccessKey=jmiXcH5OpLZA+DmJSmrZhM4aTHtLVApnMjzghyUUMw0=';
var clientCloud = DeviceClient.fromConnectionString(connectionString, MqttCloud);
var mqtt = require('mqtt');
var client  = mqtt.connect('mqtt://84.238.67.87:2000');
require('./plug-with-control')
var mosca = require('mosca');
var settingsToGateway = { port:2000 }
var settingsToNotes = { port:2001 }

var serverToGateway = new mosca.Server(settingsToGateway);
var serverToNotes = new mosca.Server(settingsToNotes);

serverToGateway.on('ready', function(){
console.log("serverToGateway broker ready");
});

serverToNotes.on('ready', function(){
console.log("serverToNotes broker ready");
});


var count = 0;
var maxCount = 150
var gateOpen = true

function closeGates() {
  gateOpen = false;
  console.log('Gate close');
}

function openGates() {
  gateOpen = true
  console.log('Gate open');
}

function sendMessageToCloud(message){
  clientCloud.sendEvent(message, (err) => {
    if (err) {2
      console.error('send error: ' + err.toString());
    } else {
      console.log('message sent');
    }
  })
}

client.on('connect', function () {
    client.subscribe('Gateway/message')
})

client.on('Gateway/message', function (topic, message) {
  console.log('message: ' + message)
  var jsonContents = JSON.parse(message);
  jsonContents.Sensors.forEach(jsonContent => { 
    if(jsonContent.Type == 'Human counter')
    {
      counter += jsonContent.Value;
      if(counter < 0){
        counter = 0;
      } else if (counter >= maxCount && gateOpen)
      {
        closeGates()
      } else if (!gateOpen) {
        openGates()
      }

      jsonContent.Value = counter;
    }
  })
  jsonContents[Timestamp] = Date.now();
  sendMessageToCloud(jsonContents)
})



