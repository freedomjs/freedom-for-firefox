/*globals console*/
/*jslint indent:2,browser:true, node:true */
var Tabs = require("sdk/tabs");

var oAuthRedirectId = "freedom.oauth.redirect.handler";

var FirefoxTabsAuth = function() {
  "use strict";
};

FirefoxTabsAuth.prototype.initiateOAuth = function(redirectURIs, continuation) {
  "use strict";
  var i;
  if (typeof Tabs !== 'undefined') {
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
  Tabs.open({
    url: authUrl,
    isPrivate: true,
    onLoad: function onLoad(stateObj, continuation, tab) {
      if (tab.url.startsWith(stateObj.redirect)) {
        continuation(tab.url);
        tab.close();
      }
    }.bind(this, stateObj, continuation)
  });
};

/**
 * If we have access to chrome.identity, use the built-in support for oAuth flows
 * chrome.identity exposes a very similar interface to core.oauth.
 */
module.exports = FirefoxTabsAuth;
