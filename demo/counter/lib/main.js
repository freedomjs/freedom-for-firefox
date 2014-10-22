var toggle = require('sdk/ui/button/toggle');
var self = require('sdk/self');
var panels = require('sdk/panel');
const {Cu} = require('chrome');

Cu.import(self.data.url('freedom-for-firefox.jsm'));

var button = toggle.ToggleButton({
  id: "counter-demo",
  label: "Counter",
  icon: {
    "16": "./counter.png",
    "32": "./counter.png",
    "64": "./counter.png"
  },
  onChange: handleClick
});

var panel = panels.Panel({
  contentURL: self.data.url('panel.html'),
  contentScriptFile: self.data.url('panel.js'),
  onHide: handleHide
});

panel.port.on("click", function() {
  counter.click(1);
});

var counter;

function handleClick(state) {
  if (!counter) {
    freedom(self.data.url('counter.json'), {portType: 'backgroundFrame'}).then(function (constructor) {
      counter = constructor(0);
      counter.on('update', function (n) {
        panel.port.emit('update', n);
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
