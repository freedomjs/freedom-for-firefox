Components.utils.import("resource://gre/modules/devtools/Console.jsm");
Components.utils.import("resource://gre/modules/Timer.jsm");
Components.utils.import('resource://gre/modules/Services.jsm');

XMLHttpRequest = Components.Constructor("@mozilla.org/xmlextras/xmlhttprequest;1", "nsIXMLHttpRequest");

var hiddenWindow = Services.appShell.hiddenDOMWindow;
mozRTCPeerConnection = hiddenWindow.mozRTCPeerConnection;
mozRTCSessionDescription = hiddenWindow.mozRTCSessionDescription;
mozRTCIceCandidate = hiddenWindow.mozRTCIceCandidate;

Blob = hiddenWindow.Blob;
WebSocket = hiddenWindow.WebSocket;
FileReader = hiddenWindow.FileReader;

var jasmineRequire = require('jasmine-core/lib/jasmine-core/jasmine');
jasmine = jasmineRequire.core(jasmineRequire);

var theGlobal = {
  setTimeout: setTimeout,
  clearTimeout: clearTimeout
};

jasmine.getGlobal = function(g) {
  return g;
}.bind({}, theGlobal);

var env = jasmine.getEnv({
  global: theGlobal
});
var jasmineInterface = jasmineRequire.interface(jasmine, env);

// Jasmine interface (like describe) need to be on the global scope.
// Only way I can find to do that is set them as raw symbols.
for (var property in jasmineInterface) {
  eval(property + " = jasmineInterface['" + property + "'];");
}

var LoggingReporter = function(onTest, finished) {
  this.cb = onTest;
  this.finished = finished;
  this.specDone = function(result) {
    this.cb(result);
  };
  this.jasmineDone = function() {
    var results = jasmineInterface.jsApiReporter.specs();

    this.finished(results);
  }
}

spiderSpecs = function(speclist, suite) {
  if (suite.children) {
    suite.children.forEach(spiderSpecs.bind({}, speclist));
  } else if (suite.getSpecName) {
    speclist.push(suite.getSpecName(suite));
  }
};

// Begin Jasmine Run, return list of all tests.
runTests = function(onTest, finished) {
  var loggingReporter = new LoggingReporter(onTest, finished);
  env.addReporter(loggingReporter);


  require('../spec/core.tcpsocket.unit.spec');
  require('../spec/core.udpsocket.unit.spec');
  require('../spec/provider.integration.spec');

  var specs = [];
  spiderSpecs(specs, env.topSuite());

  env.execute();
  return specs;
};

EXPORTED_SYMBOLS = ["runTests"];
