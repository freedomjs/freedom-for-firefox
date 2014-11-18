var toggle = require('sdk/ui/button/toggle');
var self = require('sdk/self');
var panels = require('sdk/panel');
const {Cu} = require('chrome');

Cu.import(self.data.url('freedom-for-firefox.jsm'));

var button = toggle.ToggleButton({
  id: "ticatak-demo",
  label: "TicTak",
  icon: {
    "16": "./tictak.png",
    "32": "./tictak.png",
    "64": "./tictak.png"
  },
  onChange: handleClick
});

var panel = panels.Panel({
  contentURL: self.data.url('panel.html'),
  contentScriptFile: self.data.url('panel.js'),
  onHide: handleHide
});

panel.port.on("click", function() {
  tictak.click(1);
});

var tictak;

function handleClick(state) {
  if (!tictak) {
    freedom(self.data.url('tictak.json'), {
      portType: 'backgroundFrame',
      source: self.data.url('freedom-frame.js')
    }).then(function (constructor) {
      tictak = constructor(0);
      tictak.on('update', function (n) {
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
