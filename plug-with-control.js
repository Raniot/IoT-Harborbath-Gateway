var mqtt = require('mqtt');
var config = require('./config.json'); 

var thngId=config.thngId; 
var thngUrl='/thngs/'+thngId;
var thngApiKey=config.thngApiKey;

resources = require('./resources/model');
var pirModel = resources.pi.sensors.pir;
var tempModel = resources.pi.sensors.temperature;
var humiModel = resources.pi.sensors.humidity;

var status=false;

var client = mqtt.connect("mqtts://mqtt.evrythng.com:8883", {
  username: 'authorization',
  password: thngApiKey 
});

client.on('connect', function () {
  client.subscribe(thngUrl+'/properties/');
  client.subscribe(thngUrl+'/actions/all');
  updateProperty('livenow',true);

  resources.observe(changes => {
    changes.forEach(change => {
      if(checkModel(pirModel,change)){
        updateProperty ('pir',change.value);
      }
      else if(checkModel(tempModel,change)){
        updateProperty ('temp',change.value);
      }
      else if(checkModel(humiModel,change)){
        updateProperty ('humi',change.value);
      }
    });
  });
});

function checkModel(model, change){
  if (change.type === 'update' && model === change.path.slice(0, -1).reduce((obj, i) => obj[i], resources)) {return true;}
  return false;
}


client.on('message', function(topic, message) {
  var property = JSON.parse(message);
  var splittedTopic = topic.split('/');
  if (splittedTopic[1] && splittedTopic[1] === "thngs"){
    if (splittedTopic[2] && splittedTopic[2] === thngId){
      if (splittedTopic[3] && splittedTopic[3] === "properties"){
        console.log('Property was updated: '+property[0].key+'='+property[0].value); 
      } else if (splittedTopic[3] && splittedTopic[3] === "actions"){
        var action = JSON.parse(message);
        handleAction(action); 
      }
    }
  }
});

function handleAction(action) {
  switch(action.type) {
    case '_setLED1':
      console.log('ACTION: _setLED1 changed to: '+action.customFields.status);
      status=Boolean(action.customFields.status);
      updateProperty ('led1',status);
      resources.pi.actuators.leds['1'].value = status;
      break;
    case '_setLED2':
      console.log('ACTION: _setLED2 changed to: '+action.customFields.status);
      status=Boolean(action.customFields.status);
      updateProperty ('led2',status);
      resources.pi.actuators.leds['2'].value = status;
      break;
    case '_setLevel':
      console.log('ACTION: _setLevel changed to: '+action.customFields.level);
      break;
    default:
      console.log('ACTION: Unknown action type: '+action.type);
      break;
  }
}

function updateProperty(property,value) {
  client.publish(thngUrl+'/properties/'+property, '[{"value": '+value+'}]');
}

process.on('SIGINT', function() { 
  updateProperty('livenow',false);
	client.end();
  process.exit();
});