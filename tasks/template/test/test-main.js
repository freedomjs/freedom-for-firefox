var main;

try {
  main = require('./main');
} catch (e) {
  console.error('Error Caught');
  console.error(e);
}

var tests = main.initJasmine();

tests.forEach(function(test) {
  exports["test " + test] = function(assert, done) {
    main.waitFor(test, function(result) {
      assert.ok(result, test);
      done(result);
    });
  }
});

console.log("Starting Tests");
require("sdk/test").run(exports);
