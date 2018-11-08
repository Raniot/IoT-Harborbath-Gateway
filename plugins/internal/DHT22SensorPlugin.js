var resources = require('./../../resources/model'),
  utils = require('./../../utils/utils.js');

var model = resources.pi.sensors;
var pluginName = 'Temperature & Humidity';
var localParams = {'simulate': false, 'frequency': 5000};

exports.start = (params) => {
  localParams = params;
  if (params.simulate) {
    simulate();
  } else {
    connectHardware();
  }
};
exports.stop = function () {
  if (params.simulate) {
    clearInterval(interval);
  } else {
    sensor.unexport();
  }
  console.info('%s plugin stopped!', pluginName);
};

function connectHardware() {
 var sensorDriver = require('node-dht-sensor');
  var sensor = {
    initialize: () => {
      return sensorDriver.initialize(22, model.temperature.gpio); //#A
    },
    read: () => {
      var readout = sensorDriver.read(); //#B
      model.temperature.value = parseFloat(readout.temperature.toFixed(2));
      model.humidity.value = parseFloat(readout.humidity.toFixed(2)); //#C
      showValue();

      setTimeout( () => {
        sensor.read(); //#D
      }, localParams.frequency);
    }
  };
  if (sensor.initialize()) {
    console.info('Hardware %s sensor started!', pluginName);
    sensor.read();
  } else {
    console.warn('Failed to initialize sensor!');
  }
};

function simulate() {
  interval = setInterval( () => {
    model.temperature.value = utils.randomInt(0, 40);
    model.humidity.value = utils.randomInt(0, 100);
    showValue();
  }, localParams.frequency);
  console.info('Simulated %s sensor started!', pluginName);
};

function showValue() {
  console.info('Temperature: %s C, humidity %s \%',
    model.temperature.value, model.humidity.value);
};