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
var maxCount = 20
var gateOpen = true
var timeInterval = 5*60*1000 // in ms 900000 = 15 min
var tempArray = []
var humidityArray = []
var luxArray = []

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
      console.log('message sent ' + Date.now());
    }
  })
}

function getAvgOfTemp(){
  var sum = 0, l = tempArray.length; 
  for( var i = 0; i < l; i++){
    sum += tempArray[i];
  }
  tempArray = [];
  if(l == 0){
    return 0;
  }
  return sum / l;
}

function getAvgOfHumidity(){
  var sum = 0, l = humidityArray.length;
  for( var i = 0; i < l; i++){
    sum += humidityArray[i];
  }
  humidityArray = [];
  if(l == 0){
    return 0;
  }
  return sum / l;
}

function getAvgOfLux(){
  var sum = 0, l = luxArray.length;
  for( var i = 0; i < l; i++){
    sum += luxArray[i];
  }
  luxArray = [];
  if(l == 0){
    return 0;
  }
  return sum / l;
}

function senddataToCloud(){
  var avgTemp = getAvgOfTemp()
  var avgHumidity = getAvgOfHumidity();
  var avgLux = getAvgOfLux();
  
  var jsonMessage = {};
  var Sensors = []
  var temp = {
    "Type": "Temperature", 
    "Value": avgTemp, 
    "Unit": "degrees celcius"
  }

  var humidity = {
    "Type": "Humidity", 
    "Value": avgHumidity, 
    "Unit": "percentage"
  }

  var human = {
    "Type": "Human counter", 
    "Value": counter, 
    "Unit": "humans"
  }

  var lux = {
    "Type": "Lux", 
    "Value": avgLux, 
    "Unit": "lumen"
  }

  jsonMessage.Sensors = Sensors;
  jsonMessage.Sensors.push(temp)
  jsonMessage.Sensors.push(humidity)
  jsonMessage.Sensors.push(human)
  jsonMessage.Sensors.push(lux)
  jsonMessage.Timestamp = Date.now();

  console.log('data sent to cloud: ' + jsonMessage.Timestamp)
  sendMessageToCloud(jsonMessage)
}

client.on('connect', function () {
    console.log('connected')
    client.subscribe('Gateway/message')
    setInterval(function() {
      console.log("method called "+ Date.now());
      senddataToCloud();
    }, timeInterval);
})

client.on('message', function (topic, message) {
  if(topic == "Gateway/message") {
    console.log("recieved a message: " + message)
    var jsonContents = JSON.parse(message);
    jsonContents.Sensors.forEach(jsonContent => { 
      if(jsonContent.Type == 'Human counter')
      {
        counter += jsonContent.Value;
        checkForGate();
      }
      else if(jsonContent.Type == 'Temperature'){
        tempArray.push(jsonContent.Value);
      }
      else if(jsonContent.Type == 'Humidity'){
        humidityArray.push(jsonContent.Value);
      }
      else if(jsonContent.Type == 'Lux'){
        luxArray.push(jsonContent.Value);
      }
    })
  }
})

function checkForGate(){
  if(counter < 0){
    counter = 0;
  } else if (counter >= maxCount && gateOpen)
  {
    closeGates()
  } else if (!gateOpen && counter < maxCount) {
    openGates()
  }
}

