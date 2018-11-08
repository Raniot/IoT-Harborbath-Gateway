var resources = require('./../../resources/model');

var sensor;
var model = resources.pi.sensors.pir;
var pluginName = resources.pi.sensors.pir.name;
var localParams = {'simulate': false, 'frequency': 2000};

exports.start =(params) => {
  localParams = params;
  if (localParams.simulate) {
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
  var Gpio = require('onoff').Gpio;
  sensor = new Gpio(model.gpio, 'in', 'both');
  sensor.watch((err, value) => {
    if (err) exit(err);
    model.value = !!value;
    showValue();
  })
  console.info('Hardware %s sensor started!', pluginName);
};

function simulate() {
  setInterval(() => {
    model.value = !model.value;
    showValue();
  }, localParams.frequency);
  console.info('Simulated %s sensor started!', pluginName);
};

function showValue() {
  console.info(model.value ? 'there is someone!' : 'not anymore!');
};