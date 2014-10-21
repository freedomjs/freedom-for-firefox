// Jasmine needs to replace these when a clock is installed, but gets confused
var {setTimeout, setInterval,
     clearTimeout, clearInterval} = require("sdk/timers");

const {Cu} = require("chrome");
const { atob, btoa } = Cu.import("resource://gre/modules/Services.jsm", {});
const self = require("sdk/self");
var Request = require("sdk/request").Request;

var files = [];
var tests = [];
var results = {};
var onFinish = null;

var done = function(res) {
  var req = Request({
    url: 'http://localhost:9989/put',
    content: btoa(JSON.stringify(res))
  });
  req.post();
  if (res.fullName) {
    if (typeof results[res.fullName] === 'function') {
      results[res.fullName](res.status);
    }
    results[res.fullName] = res.status;
  }
};

var finishLoad = function() {
  files.forEach(function(file) {
    var symbols = file.EXPORTED_SYMBOLS;
    symbols.forEach(function(symbol) {
      var retVal = file[symbol](done);
      tests = tests.concat(retVal);
    });
  });
}

exports.waitFor = function(test, cb) {
  if (results[test]) {
    cb(results[test]);
  } else {
    results[test] = cb;
  }
};

exports.initJasmine = function() {
  if (tests.length) {
    return tests;
  } else {
    console.error('Specs not loaded sucessfully. Failing');
    results['Startup'] = 'Failed';
    return ['Startup'];
  }
};
