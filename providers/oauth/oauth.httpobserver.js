/*globals console*/
/*jslint indent:2,browser:true, node:true */
var wm;
if (typeof Components !== 'undefined') {
  wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]
              .getService(Components.interfaces.nsIWindowMediator);
  Components.utils.import("resource://gre/modules/XPCOMUtils.jsm");
} else {
  console.warn('core.oauth cannot access window.');
}

var oAuthRedirectId = "freedom.oauth.redirect.handler";

var FirefoxTabsAuth = function () {
  "use strict";
};

FirefoxTabsAuth.prototype.initiateOAuth = function (redirectURIs, continuation) {
  "use strict";
  var i,
    gBrowser = wm.getMostRecentWindow("navigator:browser").gBrowser;
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

FirefoxTabsAuth.prototype.launchAuthFlow = function (authUrl, stateObj, interactive, continuation) {
  "use strict";
  var gBrowser = wm.getMostRecentWindow("navigator:browser").gBrowser,
    listener,
    complete,
    fail,
    tab,
    previousTab = gBrowser.selectedTab;

  if (interactive === undefined) {
    interactive = true;
  }

  var httpRequestObserver = {
    observe: function(subject, topic, data) {
      if (topic == "http-on-modify-request") {
        var httpChannel = subject.QueryInterface(Components.interfaces.nsIHttpChannel);
        var url = subject.URI.spec;
        if (url.startsWith(stateObj.redirect)) {
          subject.cancel(Components.results.NS_BINDING_ABORTED);
          complete(url);
        }
      }
    },
    get observerService() {
      return Components.classes["@mozilla.org/observer-service;1"].getService(Components.interfaces.nsIObserverService);
    },
    register: function() {
      this.observerService.addObserver(this, "http-on-modify-request", false);
    },
    unregister: function() {
      this.observerService.removeObserver(this, "http-on-modify-request");
    }
  };

  var hasCredentials = false;
  complete = function (location) {
    hasCredentials = true;
    httpRequestObserver.unregister();
    if (interactive) {
      gBrowser.selectedTab = previousTab;
    }
    // Need to wait until the tab has switched before removing it
    setTimeout(function () {
      gBrowser.removeTab(tab);
      continuation(location);
    }, 100);
  };

  fail = function () {
    gBrowser.removeProgressListener(listener);
    gBrowser.removeTab(tab);
    continuation(undefined, 'Error in launchAuthFlow');
  };

  httpRequestObserver.register();

  //Timeout before switching makes sure the http observer is installed.
  setTimeout(function () {
    tab = gBrowser.addTab(authUrl);
    if (interactive) {
      gBrowser.selectedTab = tab;
    } else {
      setTimeout(function () {
        if (!hasCredentials) {
          fail();
        }
      }, 5000);
    }
  }, 100);
};

/**
 * Leverage Firefox support to manipulate tabs and intercept page loads
 */
module.exports = FirefoxTabsAuth;
