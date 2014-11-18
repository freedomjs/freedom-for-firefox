/*jslint indent:2, node:true, sloppy:true, browser:true */
var Frame = require('freedom/src/link/frame');
var util = require('freedom/src/util');

/**
 * A port providing message transport between two freedom contexts via iFrames
 * on the global backgound page.
 * @class BackgroundFrame
 * @extends Link
 * @uses handleEvents
 * @constructor
 */
var BackgroundFrame = function (id, resource) {
  Frame.call(this, id, resource);
};
util.mixin(BackgroundFrame.prototype, Frame.prototype);

/**
 * Override getDocument to return the hiddenWindow document.
 */
BackgroundFrame.prototype.getDocument = function () {
  if (typeof Services !== 'undefined') {
    var hiddenWindow = Services.appShell.hiddenDOMWindow;
    this.document = hiddenWindow.document;
    this.root = this.document.documentElement;
  }
};

/**
 * Get the textual description of this port.
 * @method toString
 * @return {String} the description of this port.
 */
BackgroundFrame.prototype.toString = function () {
  return "[BackgroundFrame" + this.id + "]";
};

module.exports = BackgroundFrame;
