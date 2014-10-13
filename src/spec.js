Components.utils.import("resource://gre/modules/devtools/Console.jsm");
Components.utils.import("resource://gre/modules/Timer.jsm");
Components.utils.import('resource://gre/modules/Services.jsm');

XMLHttpRequest = Components.Constructor("@mozilla.org/xmlextras/xmlhttprequest;1", "nsIXMLHttpRequest");

var hiddenWindow = Services.appShell.hiddenDOMWindow;
mozRTCPeerConnection = hiddenWindow.mozRTCPeerConnection;
mozRTCSessionDescription = hiddenWindow.mozRTCSessionDescription;
mozRTCIceCandidate = hiddenWindow.mozRTCIceCandidate;

Blob = hiddenWindow.Blob;

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

var LoggingReporter = function(cb) {
  this.cb = cb;
  this.specDone = function(result) {
    this.cb(result);
  };
  this.jasmineDone = function() {
    var results = jasmineInterface.jsApiReporter.specs();
    this.cb(results);
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
runTests = function(done) {
  var loggingReporter = new LoggingReporter(done);
  env.addReporter(loggingReporter);


  require('../spec/tcp_socket.unit.spec');
  require('../spec/udp_socket.unit.spec');
  require('../spec/provider.integration.spec');

  var specs = [];
  spiderSpecs(specs, env.topSuite());

  env.execute();
  return specs;
};

EXPORTED_SYMBOLS = ["runTests"];
