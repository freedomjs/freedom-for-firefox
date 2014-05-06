Components.utils.import("resource://gre/modules/devtools/Console.jsm");
Components.utils.import("resource://gre/modules/Timer.jsm");
Components.utils.import('resource://gre/modules/Services.jsm');
// This module does not support all of es6 promise functionality.
// Components.utils.import("resource://gre/modules/Promise.jsm");
const XMLHttpRequest = Components.Constructor("@mozilla.org/xmlextras/xmlhttprequest;1", "nsIXMLHttpRequest");
Components.utils.importGlobalProperties(['URL']);

var hiddenWindow = Services.appShell.hiddenDOMWindow;
var mozRTCPeerConnection = hiddenWindow.mozRTCPeerConnection;
var mozRTCSessionDescription = hiddenWindow.mozRTCSessionDescription;
var mozRTCIceCandidate = hiddenWindow.mozRTCIceCandidate;

var freedom;

function setupFreedom(manifest, debug) {
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
    location: manifestLocation,
    debug: debug || false
  };

