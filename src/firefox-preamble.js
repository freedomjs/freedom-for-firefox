Components.utils.import("resource://gre/modules/devtools/Console.jsm");
Components.utils.import("resource://gre/modules/Timer.jsm");
// This module does not support all of es6 promise functionality.
// Components.utils.import("resource://gre/modules/Promise.jsm");
const XMLHttpRequest = Components.Constructor("@mozilla.org/xmlextras/xmlhttprequest;1", "nsIXMLHttpRequest");
this.URL = new URL(this.__URI__);

var freedom;

function setupFreedom(options, manifest) {
  if (this.freedom) {
    return this.freedom;
  }

  var lastSlash = manifest.lastIndexOf("/");
  var manifestLocation = manifest.substring(0, lastSlash + 1);
  //var manifestFilename = manifest.substring(lastSlash + 1);
  firefox_config = {
    isApp: false,
    manifest: manifest,
    portType: 'Worker',
    stayLocal: true,
    location: manifestLocation
  };

