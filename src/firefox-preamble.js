Components.utils.import("resource://gre/modules/devtools/Console.jsm");
Components.utils.import("resource://gre/modules/Timer.jsm");
Components.utils.import('resource://gre/modules/Services.jsm');
// This module does not support all of es6 promise functionality.
// Components.utils.import("resource://gre/modules/Promise.jsm");
const XMLHttpRequest = Components.Constructor("@mozilla.org/xmlextras/xmlhttprequest;1", "nsIXMLHttpRequest");


var hiddenWindow = Services.appShell.hiddenDOMWindow;
var mozRTCPeerConnection = hiddenWindow.mozRTCPeerConnection;
var mozRTCSessionDescription = hiddenWindow.mozRTCSessionDescription;
var mozRTCIceCandidate = hiddenWindow.mozRTCIceCandidate;
// Replace Blob with blob that has prototype defined.
// See: https://bugzilla.mozilla.org/show_bug.cgi?id=1007318
var Blob = hiddenWindow.Blob;

var freedom;

// Fake the location object so that freedom detects that it is in a
// privileged environment.
var location = {
  protocol: "resource:"
};

function setupFreedom(manifest, options) {
  if (this.freedom) {
    return this.freedom;
  }

  options = options || {};
  var freedomcfg = options.freedomcfg;


  if (options.portType === "BackgroundFrame") {
    // If we are using iframes on the background page, we need to
    // generate blob URLs from the URL object on the page. We get a
    // privledge error if we try to load a blob given a url by the
    // Cu.importGlobalProperties(['URL']) version of URL.
    var URL = hiddenWindow.URL;
  } else {
    Components.utils.importGlobalProperties(['URL']);
  }

  var lastSlash = manifest.lastIndexOf("/");
  var manifestLocation = manifest.substring(0, lastSlash + 1);
  //var manifestFilename = manifest.substring(lastSlash + 1);
  firefox_config = {
    isApp: false,
    manifest: manifest,
    portType: options.portType || 'Worker',
    stayLocal: true,
    location: manifestLocation,
    debug: options.debug || false,
    isModule: false
  };

