var msgpack = require('msgpack5')();
var encode = msgpack.encode;
var json2html = require('node-json2html');

module.exports = function () {
  return function (req, res, next) {
    console.info('Representation converter middleware called!');
    if (req.result) {
      switch (req.accepts(['json', 'html', 'application/x-msgpack'])) {
        case 'html':
          console.info('HTML representation selected!');
          if(req.result.name) //easy way to see if it is a sensor or actuator
            var transform = {'tag': 'div', 'html': '${name} : ${value} <br> Description: ${description}'};
          else{
            var htmlString = "";
            Object.keys(req.result).forEach(element =>   {
              url = req.url + '/' + element;
              htmlString += '<br> <a href='+ url +'>' + element + '</a> '
            });
            var transform = {'tag': 'div', 'html': 'This page contains the following subpages' + htmlString};
          }
          res.send(json2html.transform(req.result, transform));
          return;
        case 'application/x-msgpack':
          console.info('MessagePack representation selected!');
          res.type('application/x-msgpack');
          res.send(encode(req.result));
          return;
        default:
          console.info('Defaulting to JSON representation!');
          res.send(req.result);
          return;
      }
    }
    else {
      next();
    }
  }
};