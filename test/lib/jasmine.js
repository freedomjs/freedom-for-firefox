const {Cu} = require("chrome");
var {setTimeout, clearTimeout,
     setInterval, clearInterval} = require("sdk/timers");
const self = require("sdk/self");

Cu.import("resource://gre/modules/Services.jsm");


var context = {exports: {}};
var specFiles = [];


Services.scriptloader.loadSubScript(self.data.url("../lib/jasmine-2.0.0/jasmine.js"), context);
Services.scriptloader.loadSubScript(self.data.url("../lib/jasmine-2.0.0/console.js"), context);
var jasmine = context.exports.core(context.exports);
var env = jasmine.getEnv();

/**
 * Create the Jasmine environment. This is used to run all specs in a project.
 */
var jasmineInterface = {
  describe: function(description, specDefinitions) {
    return env.describe(description, specDefinitions);
  },

  xdescribe: function(description, specDefinitions) {
    return env.xdescribe(description, specDefinitions);
  },

  it: function(desc, func) {
    return env.it(desc, func);
  },

  xit: function(desc, func) {
    return env.xit(desc, func);
  },

  beforeEach: function(beforeEachFunction) {
    return env.beforeEach(beforeEachFunction);
  },

  afterEach: function(afterEachFunction) {
    return env.afterEach(afterEachFunction);
  },

  expect: function(actual) {
    return env.expect(actual);
  },

  pending: function() {
    return env.pending();
  },

  spyOn: function(obj, methodName) {
    return env.spyOn(obj, methodName);
  },

  jsApiReporter: new jasmine.JsApiReporter({
    timer: new jasmine.Timer()
  })
};

extend(context, jasmineInterface);

// From https://github.com/pivotal/jasmine/issues/493#issuecomment-31630393
var ConsoleReporter = context.exports.ConsoleReporter();
var reporterOptions = {
  timer: new jasmine.Timer(),
  showColors: true,
  print: function () {
    //console.log.apply(console, arguments);
    dump.apply(undefined, arguments);
  }};
env.addReporter(new ConsoleReporter(reporterOptions));

/**
 * Expose the interface for adding custom equality testers.
 */
jasmine.addCustomEqualityTester = function(tester) {
  env.addCustomEqualityTester(tester);
};

/**
 * Expose the interface for adding custom expectation matchers
 */
jasmine.addMatchers = function(matchers) {
  return env.addMatchers(matchers);
};

/**
 * Expose the mock interface for the JavaScript timeout functions
 */
jasmine.clock = function() {
  return env.clock;
};

function executeSpecs() {
  specFiles.forEach(function(specFile) {
    try {
      Services.scriptloader.loadSubScript(specFile, context);
    } catch (e) {
      console.warn("Error while loading file: " + specFile + 
                   ". " + e.message);
    }
  });
  env.execute();
}

function addSpec(location) {
  // Check if the file exists
  try {
    self.data.load(location);
  } catch (e) {
    if (e.name === "NS_ERROR_FILE_NOT_FOUND") {
      throw new Error("No such file: " + location);
    }
    throw e;
  }
  specFiles.push(location);
}

exports.executeSpecs = executeSpecs;
exports.addSpec = addSpec;

// /**
//  * Helper function for readability above.
//  */
function extend(destination, source) {
  for (var property in source) destination[property] = source[property];
  return destination;
}
