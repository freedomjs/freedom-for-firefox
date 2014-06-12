/*globals fdom:true */
/*jslint indent:2, white:true, node:true, sloppy:true, browser:true */
if (typeof fdom === 'undefined') {
  fdom = {};
}
fdom.link = fdom.link || {};

/**
 * A port providing message transport between two freedom contexts via iBackgroundFrames.
 * @class link.BackgroundFrame
 * @extends Link
 * @uses handleEvents
 * @constructor
 */
fdom.link.BackgroundFrame = function() {
  fdom.Link.call(this);
  if (typeof hiddenWindow !== 'undefined') {
    this.document = hiddenWindow.document;
  }
};

/**
 * Start this port by listening or creating a frame.
 * @method start
 * @private
 */
fdom.link.BackgroundFrame.prototype.start = function() {
  if (this.config.moduleContext) {
    this.config.global.DEBUG = true;
    this.setupListener();
    this.src = 'in';
  } else {
    this.setupBackgroundFrame();
    this.src = 'out';
  }
};

/**
 * Stop this port by deleting the frame.
 * @method stop
 * @private
 */
fdom.link.BackgroundFrame.prototype.stop = function() {
  // Function is determined by setupListener or setupBackgroundFrame as appropriate.
};

/**
 * Get the textual description of this port.
 * @method toString
 * @return {String} the description of this port.
 */
fdom.link.BackgroundFrame.prototype.toString = function() {
  return "[BackgroundFrame" + this.id + "]";
};

/**
 * Set up a global listener to handle incoming messages to this
 * freedom.js context.
 * @method setupListener
 */
fdom.link.BackgroundFrame.prototype.setupListener = function() {
  var onMsg = function(msg) {
    if (msg.data.src !== 'in') {
      this.emitMessage(msg.data.flow, msg.data.message);
    }
  }.bind(this);
  this.obj = this.config.global;
  this.obj.addEventListener('message', onMsg, true);
  this.stop = function() {
    this.obj.removeEventListener('message', onMsg, true);
    delete this.obj;
  };
  this.emit('started');
};

/**
 * Set up an iBackgroundFrame with an isolated freedom.js context inside.
 * @method setupBackgroundFrame
 */
fdom.link.BackgroundFrame.prototype.setupBackgroundFrame = function() {
  var frame, onMsg;
  frame = this.makeBackgroundFrame(this.config.src, this.config.inject);
  
  if (!this.document.body) {
    this.document.appendChild(this.document.createElement("body"));
  }
  this.document.body.appendChild(frame);

  onMsg = function(frame, msg) {
    if (!this.obj) {
      this.obj = frame;
      this.emit('started');
    }
    if (msg.data.src !== 'out') {
      this.emitMessage(msg.data.flow, msg.data.message);
    }
  }.bind(this, frame.contentWindow);

  frame.contentWindow.addEventListener('message', onMsg, true);
  this.stop = function() {
    frame.contentWindow.removeEventListener('message', onMsg, true);
    if (this.obj) {
      delete this.obj;
    }
    frame.src = "about:blank";
    this.document.body.removeChild(frame);
  };
};

/**
 * Make frames to replicate freedom isolation without web-workers.
 * iBackgroundFrame isolation is non-standardized, and access to the DOM within frames
 * means that they are insecure. However, debugging of webworkers is
 * painful enough that this mode of execution can be valuable for debugging.
 * @method makeBackgroundFrame
 */
fdom.link.BackgroundFrame.prototype.makeBackgroundFrame = function(src, inject) {
  var frame = this.document.createElement('iframe'),
      extra = '',
      loader,
      blob;
  // TODO(willscott): add sandboxing protection.

  // TODO(willscott): survive name mangling.
  src = src.replace('portType: "Worker"', 'portType: "BackgroundFrame"');
  if (inject) {
    extra = '<script src="' + inject + '" onerror="' +
      'throw new Error(\'Injection of ' + inject +' Failed!\');' +
      '"></script>';
  }
  loader = '<html>' + extra + '<script src="' +
      fdom.util.forceModuleContext(src) + '"></script></html>';
  blob = fdom.util.getBlob(loader, 'text/html');
  frame.src = fdom.util.getURL(blob);

  return frame;
};

/**
 * Receive messages from the hub to this port.
 * Received messages will be emitted from the other side of the port.
 * @method deliverMessage
 * @param {String} flow the channel/flow of the message.
 * @param {Object} message The Message.
 */
fdom.link.BackgroundFrame.prototype.deliverMessage = function(flow, message) {
  if (this.obj) {
    //fdom.debug.log('message sent to worker: ', flow, message);
    this.obj.postMessage({
      src: this.src,
      flow: flow,
      message: message
    }, '*');
  } else {
    this.once('started', this.onMessage.bind(this, flow, message));
  }
};

