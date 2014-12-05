// Jasmine needs to replace these when a clock is installed, but gets confused
var {setTimeout, setInterval,
     clearTimeout, clearInterval} = require("sdk/timers");

const {Cu} = require("chrome");
const { atob, btoa } = Cu.import("resource://gre/modules/Services.jsm", {});
const self = require("sdk/self");
var Request = require("sdk/request").Request;

var underTest = null;
var tests = [];
var pendingReports = 0;
var onFinish = null;

var testDone = function(res) {
  pendingReports += 1;
  console.info('- ' + res.fullName);
  var req = Request({
    url: 'http://localhost:9989/put',
    content: btoa(JSON.stringify(res)),
    overrideMimeType: "text/plain; charset=latin1",
    onComplete: function (response) {
      pendingReports -= 1;
      if (onFinish && pendingReports === 0) {
        onFinish();
      }
    }
  });
  req.post();
};

var completeTesting = function() {
  //Cu.unload(underTest);

  var system = require("sdk/system");
  system.exit(0);
};

var fileDone = function(res) {
  console.log('Testing Finished');
  if (pendingReports > 0) {
    onFinish = completeTesting();
  } else {
    completeTesting();
  }
};

var finishLoad = function() {
  var jsm;
  try {
    jsm = Cu.import(underTest);
  } catch (e) {
    console.error('Exception importing ' + underTest);
    console.error(e);
  }
  var symbols = jsm.EXPORTED_SYMBOLS;
  symbols.forEach(function(symbol) {
    console.log('Executing ' + underTest + ': ' + symbol);
    try {
      var retVal = jsm[symbol](testDone, fileDone);
      tests = tests.concat(retVal);
    } catch (e) {
      console.error(e);
    }
  });

  /*
  tests = ['simple test'];
  setTimeout(testDone.bind({}, {fullName: 'simple test', status: 'passed'}), 100);
  setTimeout(fileDone.bind({}, {fullName: 'simple test', status: 'passed'}), 500);
  */
};
