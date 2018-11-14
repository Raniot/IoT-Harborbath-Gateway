'use strict';
var MqttCloud = require('azure-iot-device-mqtt').Mqtt;
var DeviceClient = require('azure-iot-device').Client
var Message = require('azure-iot-device').Message;
var connectionString = 'HostName=raniot-iothub.azure-devices.net;DeviceId=MyRasp;SharedAccessKey=jmiXcH5OpLZA+DmJSmrZhM4aTHtLVApnMjzghyUUMw0=';
var clientCloud = DeviceClient.fromConnectionString(connectionString, MqttCloud);
var mqtt = require('mqtt');
var client  = mqtt.connect('mqtt://84.238.67.87:2000');
var mosca = require('mosca');
var settings = { port:2000 }

var server = new mosca.Server(settings);

server.on('ready', function(){
  
console.log("server broker ready");
});

var gateCloseMessage = "Close"
var gateOpenMessage = "Open"
var counter = 0;
var maxCount = 150
var gateOpen = true

function closeGates() {
  gateOpen = false;
  client.publish('Node/gate', gateCloseMessage); 
  console.log('Gate close');
}

function openGates() {
  gateOpen = true
  client.publish('Node/gate', gateOpenMessage);
  console.log('Gate open');
}

function sendMessageToCloud(message){
  var msg = new Message(JSON.stringify(message));
  clientCloud.sendEvent(msg, (err) => {
    if (err) {
      console.error('send error: ' + err.toString());
    } else {
      console.log('message sent');
    }
  })
}

client.on('connect', function () {
    console.log('connected')
    client.subscribe('Gateway/message')
})

client.on('message', function (topic, message) {
  console.log('message: ' + message)
  var jsonContents = JSON.parse(message);
  console.log(jsonContents);
  jsonContents.Sensors.forEach(jsonContent => { 
    console.log(jsonContent);
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

      jsonContents.Sensors[0].Value = counter;
    }
  })
  jsonContents.Timestamp = Date.now();
  console.log(jsonContents);
  sendMessageToCloud(jsonContents)
})



