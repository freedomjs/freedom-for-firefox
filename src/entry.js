var providers = [
  require('freedom/providers/core/core.unprivileged'),
  require('freedom/providers/core/echo.unprivileged'),
  require('freedom/providers/core/console.unprivileged'),
  require('freedom/providers/core/peerconnection.unprivileged'),
  require('freedom/providers/core/core.rtcpeerconnection'),
  require('freedom/providers/core/core.rtcdatachannel'),
  require('../providers/core.tcpsocket'),
  require('../providers/core.udpsocket'),
  require('../providers/core.storage'),
  require('freedom/providers/core/core.view'),
  require('freedom/providers/core/core.oauth'),
  require('freedom/providers/core/websocket.unprivileged')
];

// When included as a jsm file.
if (typeof Components !== 'undefined') {
  Components.utils.import("resource://gre/modules/devtools/Console.jsm");
  Components.utils.import("resource://gre/modules/Timer.jsm");
  Components.utils.import('resource://gre/modules/Services.jsm');
  XMLHttpRequest = Components.Constructor("@mozilla.org/xmlextras/xmlhttprequest;1", "nsIXMLHttpRequest");

  var hiddenWindow = Services.appShell.hiddenDOMWindow;
  mozRTCPeerConnection = hiddenWindow.mozRTCPeerConnection;
  mozRTCSessionDescription = hiddenWindow.mozRTCSessionDescription;
  mozRTCIceCandidate = hiddenWindow.mozRTCIceCandidate;
  // Replace Blob with blob that has prototype defined.
  // See: https://bugzilla.mozilla.org/show_bug.cgi?id=1007318
  Blob = hiddenWindow.Blob;
  WebSocket = hiddenWindow.WebSocket;
  Components.utils.importGlobalProperties(['URL']);

freedom = function (manifest, options) {
    var port = require('freedom/src/link/worker'),
        alternatePort = require('./backgroundframe-link'),
        source = Components.stack.filename;
    if (options && options.portType === 'backgroundFrame') {
      port = alternatePort;
      source = options.source;
    }
    return require('freedom/src/entry')({
      location: "resource://",
      portType: port,
      source: source,
      providers: providers,
      isModule: false,
      oauth: [
        //require('../providers/oauth/oauth.httpobserver'),
        require('../providers/oauth/oauth.progresslistener')
      ]
    }, manifest, options);
  };
  EXPORTED_SYMBOLS = ["freedom"];
} else {
  // When loaded in a worker.
  require('freedom/src/entry')({
    isModule: true,
    portType: require('freedom/src/link/worker'),
    providers: providers,
    global: global
  });
}
