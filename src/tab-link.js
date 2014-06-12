/*globals fdom:true */
/*jslint indent:2, white:true, node:true, sloppy:true, browser:true */
if (typeof fdom === 'undefined') {
  fdom = {};
}
fdom.link = fdom.link || {};

/**
 * A port providing message transport between two freedom contexts via iTabs.
 * @class link.Tab
 * @extends Link
 * @uses handleEvents
 * @constructor
 */
fdom.link.Tab = function() {
  fdom.Link.call(this);
};

/**
 * Start this port by listening or creating a tab.
 * @method start
 * @private
 */
fdom.link.Tab.prototype.start = function() {
  if (this.config.moduleContext) {
    this.config.global.DEBUG = true;
    this.setupListener();
    this.src = 'in';
  } else {
    this.setupTab();
    this.src = 'out';
  }
};

/**
 * Stop this port by deleting the tab.
 * @method stop
 * @private
 */
fdom.link.Tab.prototype.stop = function() {
  // Function is determined by setupListener or setupTab as appropriate.
};

/**
 * Get the textual description of this port.
 * @method toString
 * @return {String} the description of this port.
 */
fdom.link.Tab.prototype.toString = function() {
  return "[Tab" + this.id + "]";
};

/**
 * Set up a global listener to handle incoming messages to this
 * freedom.js context.
 * @method setupListener
 */
fdom.link.Tab.prototype.setupListener = function() {
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
 * Set up an iTab with an isolated freedom.js context inside.
 * @method setupTab
 */
fdom.link.Tab.prototype.setupTab = function() {
  var worker, onMsg;
  worker = this.makeTab(this.config.src, this.config.inject);
  
  onMsg = function(tab, msg) {
    if (!this.obj) {
      this.obj = tab;
      this.emit('started');
    }
    if (msg.data.src !== 'out') {
      this.emitMessage(msg.data.flow, msg.data.message);
    }
  }.bind(this, worker);

  worker.port.on('message', onMsg);
  this.stop = function() {
    worker.destroy();
    if (this.obj) {
      delete this.obj;
    }
  };
};

// The toString version of this function will be used as a content script
fdom.link.contentScript = function contentScript() {
  var window = unsafeWindow;
  window.addEventListener("message", self.port.emit.bind(self.port, "message"));
  self.port.on("message", function(message) {
    window.postMessage(message, "*");
  });
};

/**
 * Make tabs to replicate freedom isolation without web-workers.
 * iTab isolation is non-standardized, and access to the DOM within tabs
 * means that they are insecure. However, debugging of webworkers is
 * painful enough that this mode of execution can be valuable for debugging.
 * @method makeTab
 */
fdom.link.Tab.prototype.makeTab = function(src) {
  debugger;
  var tab,
      extra = '',
      loader,
      worker,
      blob;
  // TODO(willscott): add sandboxing protection.

  // TODO(willscott): survive name mangling.
  src = src.replace('portType: "Worker"', 'portType: "Tab"');
  loader = '<html>' + extra + '<script src="' +
      fdom.util.forceModuleContext(src) + '"></script></html>';
  blob = fdom.util.getBlob(loader, 'text/html');
  tab = fftabs.open({url: fdom.util.getURL(blob),
                          onLoad: function onLoad(tab) {
                            worker = tab.attach({
                              contentScript: "(" +
                                fdom.link.contentScript.toString() +
                                ")()"
                            });
                          }});
  
  return worker;
};

/**
 * Receive messages from the hub to this port.
 * Received messages will be emitted from the other side of the port.
 * @method deliverMessage
 * @param {String} flow the channel/flow of the message.
 * @param {Object} message The Message.
 */
fdom.link.Tab.prototype.deliverMessage = function(flow, message) {
  if (this.obj.port) { // We are in the root context
    //fdom.debug.log('message sent to worker: ', flow, message);
    this.obj.port.emit("message", {
      src: this.src,
      flow: flow,
      message: message
    });
  } else if(this.obj.postMessage) { // We are in a module
    this.obj.postMessage({
      src: this.src,
      flow: flow,
      message: message
    }, '*');
  } else {
    this.once('started', this.onMessage.bind(this, flow, message));
  }
};
