if (typeof Components !== 'undefined') {
  // In JSM
  Components.utils.import("resource://gre/modules/Promise.jsm");

  exports.Promise = Promise;
} else {
  // In Web Worker
  // Note: Uses full path in es6 to prevent recursion.
  exports.Promise = require('es6-promise/dist/es6-promise').Promise;
}
