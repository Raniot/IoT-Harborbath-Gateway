var resources = require('./../../resources/model');

var actuator, actuator2, interval;
var model = resources.pi.actuators.leds['1'];
var model2 = resources.pi.actuators.leds['2'];
var pluginName = model.name;
var localParams = {'simulate': false, 'frequency': 2000};

exports.start = (params) => {
  localParams = params;
  resources.observe(changes => {
    changes.forEach(change => {
      if (change.type === 'update' &&
          model === change.path.slice(0, -1).reduce((obj, i) => obj[i], resources)) {
        switchOnOff(change.value);
      }
      if (change.type === 'update' &&
        model2 === change.path.slice(0, -1).reduce((obj, i) => obj[i], resources)) {
      switchOnOff2(change.value);
      }
    });
  });

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


function switchOnOff(value) {
  if (!localParams.simulate) {
    actuator.write(value === true ? 1 : 0, function () {
      console.info('Changed value of %s to %s', pluginName, value);
    });
  }
};

function switchOnOff2(value) {
  if (!localParams.simulate) {
    actuator2.write(value === true ? 1 : 0, function () {
      console.info('Changed value of %s to %s', pluginName, value);
    });
  }
};

function connectHardware() {
  var Gpio = require('onoff').Gpio;
  actuator = new Gpio(model.gpio, 'out');
  actuator2 = new Gpio(model2.gpio, 'out');
  console.info('Hardware %s actuator started!', pluginName);
};

function simulate() {
  interval = setInterval(() => {
    if (model.value) {
      model.value = false;
    } else {
      model.value = true;
    }
  }, localParams.frequency);
  console.info('Simulated %s actuator started!', pluginName);
};