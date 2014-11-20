var toggle = require('sdk/ui/button/toggle');
var self = require('sdk/self');
var panels = require('sdk/panel');
const {Cu} = require('chrome');

Cu.import(self.data.url('freedom-for-firefox.jsm'));

var button = toggle.ToggleButton({
  id: "aboutme-demo",
  label: "AboutMe",
  icon: {
    "16": "./aboutme.png",
    "32": "./aboutme.png",
    "64": "./aboutme.png"
  },
  onChange: handleClick
});

var panel = panels.Panel({
  contentURL: self.data.url('panel.html'),
  contentScriptFile: self.data.url('panel.js'),
  onHide: handleHide
});

panel.port.on("start", function() {
  aboutme.emit('start', '');
});

var aboutme;

function handleClick(state) {
  if (!aboutme) {
    freedom(self.data.url('aboutme.json')).then(function (constructor) {
      aboutme = constructor(0);
      aboutme.on('profile', function (data) {
        panel.port.emit('profile', data);
      });
    });
  }
  if (state.checked) {
    panel.show({
      position: button
    });
  }
}

function handleHide() {
  button.state('window', {checked: false});
}
