/*globals console*/
/*jslint indent:2,browser:true, node:true */
var gBrowser;
if (typeof Components !== 'undefined') {
  var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]
              .getService(Components.interfaces.nsIWindowMediator);
  gBrowser = wm.getMostRecentWindow("navigator:browser").gBrowser;
  Components.utils.import("resource://gre/modules/XPCOMUtils.jsm");
} else {
  console.warn('core.oauth cannot access window.');
}

var oAuthRedirectId = "freedom.oauth.redirect.handler";

var FirefoxTabsAuth = function() {
  "use strict";
};

FirefoxTabsAuth.prototype.initiateOAuth = function(redirectURIs, continuation) {
  "use strict";
  var i;
  if (typeof gBrowser !== 'undefined') {
    for (i = 0; i < redirectURIs.length; i += 1) {
      if (redirectURIs[i].indexOf('https://') === 0 ||
          redirectURIs[i].indexOf('http://') === 0) {
        continuation({
          redirect: redirectURIs[i],
          state: oAuthRedirectId + Math.random()
        });
        return true;
      }
    }
  }

  return false;
};

FirefoxTabsAuth.prototype.launchAuthFlow = function(authUrl, stateObj, continuation) {
  "use strict";
  var myExtension = {
    stateObj: stateObj,
    continuation: continuation,
    oldURL: null,
    tab: gBrowser.addTab(authUrl),
    init: function() {
      gBrowser.addProgressListener(this);
      gBrowser.selectedTab = this.tab;
    },
    uninit: function() {
      gBrowser.removeProgressListener(this);
    },
    processNewURL: function(aURI) {
      if (aURI.spec == this.oldURL) return;
      this.oldURL = aURI.spec;
      if (aURI.spec.startsWith(this.stateObj.redirect)) {
        this.continuation(aURI.spec);
        gBrowser.removeCurrentTab(this.tab);
        this.uninit();
      }
    },
    QueryInterface: XPCOMUtils.generateQI(["nsIWebProgressListener", "nsISupportsWeakReference"]),
    onLocationChange: function(aProgress, aRequest, aURI) {
      this.processNewURL(aURI);
    },
    onStateChange: function() {},
    onProgressChange: function() {},
    onStatusChange: function() {},
    onSecurityChange: function() {}
  };
  myExtension.init();
};

/**
 * Leverage Firefox support to manipulate tabs and intercept page loads
 */
module.exports = FirefoxTabsAuth;
