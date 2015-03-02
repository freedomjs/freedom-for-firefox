try {
  var socketTransportService = Components.classes["@mozilla.org/network/socket-transport-service;1"]
        .getService(Components.interfaces.nsISocketTransportService);
  var mainThread = Components.classes["@mozilla.org/thread-manager;1"]
        .getService(Components.interfaces.nsIThreadManager).mainThread;
} catch (e) {
  // Components is not defined in web workers,
  // but we don't need this ClientSocket in a worker.
}

/*
 * Waits for data/disconnect on a nsIAsyncInputStream
 * stream. ClientSocket isn't used as the callback to exporting
 * onInputStreamReady into the public API of ClientSocket.
 */
function nsIInputStreamCallback(clientSocket) {
  if (!(this instanceof nsIInputStreamCallback)) {
    return new nsIInputStreamCallback(clientSocket);
  }
  this.socket = clientSocket;
  clientSocket.rawInputStream.asyncWait(this, 0, 0, mainThread);
}

nsIInputStreamCallback.prototype.onInputStreamReady = function(stream) {
  if (this.socket.paused) {
    return;
  }

  var bytesAvailable;
  var binaryReader = this.socket.binaryReader;
  try {
    bytesAvailable = binaryReader.available();
  } catch (e) {
    if (this.socket.onConnect) {
      this.socket.onConnect(undefined, {
        errcode: 'CONNECTION_FAILED',
        message: 'Firefox Connection Failed: ' + e.name
      });
      delete this.socket.onConnect;
    }
    // The error name is NS_BASE_STREAM_CLOSED if the connection
    // closed normally.
    if (e.name !== 'NS_BASE_STREAM_CLOSED') {
      console.warn(e);
    }
    this.socket.close();
    return;
  }
  if (this.socket.onConnect) {
    this.socket.onConnect();
    delete this.socket.onConnect;
  }

  var lineData = binaryReader.readByteArray(bytesAvailable);
  var buffer = ArrayBuffer(lineData.length);
  var typedBuffer = new Uint8Array(buffer);
  typedBuffer.set(lineData);
  if (typeof this.socket.onData === 'function') {
    this.socket.onData(typedBuffer);
  } else {
    // Save data until we have a handler.
    this.socket._waitingData.push(typedBuffer);
  }
  this.socket.rawInputStream.asyncWait(this, 0, 0, mainThread);
};

function ClientSocket(incomingTransport) {
  if (!(this instanceof ClientSocket)) {
    return new ClientSocket(incomingTransport);
  }
  if (typeof incomingTransport !== 'undefined') {
    this._setupTransport(incomingTransport);
  }
  this._waitingData = [];
  this.paused = false;
}

ClientSocket.prototype._setupTransport = function(transport) {
  this.transport = transport;

  // Set up readers
  this.binaryReader = Components.classes["@mozilla.org/binaryinputstream;1"].createInstance(Components.interfaces.nsIBinaryInputStream);
  this.rawInputStream = this.transport.openInputStream(0,0,0);
  this.binaryReader.setInputStream(this.rawInputStream);

  this.inputStreamCallback = new nsIInputStreamCallback(this);

  // set up writers
  this.outputStream = transport.openOutputStream(0, 0, 0);

  // set up on connect handler
  this.transport.setEventSink(this, mainThread);
};

ClientSocket.prototype.connect = function(hostname, port, startTls, continuation) {
  if (typeof this.transport !== 'undefined') {
    return continuation(undefined, {
      errcode: 'ALREADY_CONNECTED ',
      message: 'Socket already connected'
    });
  }
  this.onConnect = continuation;

  var socketTypes = startTls ? ['starttls'] : [null];
  var numSocketTypes = startTls ? 1 : 0;
  var transport = socketTransportService.createTransport(socketTypes,
                                                         numSocketTypes,
                                                         hostname,
                                                         port,
                                                         null);
  this._setupTransport(transport);
  this.socketType = 'tcp';
};

// Called due to the setEventSync call.
ClientSocket.prototype.onTransportStatus = function (transport, status) {
  if (status == Components.interfaces.nsISocketTransport.STATUS_CONNECTED_TO &&
     this.onConnect) {
    this.onConnect();
    delete this.onConnect;
  }
};

// TODO: This writ is happening async, so result should be returned async
ClientSocket.prototype.write = function(data) {
  var stringData = this.arrayBufferToString(data);
  this.outputStream.write(stringData, stringData.length);
};

ClientSocket.prototype.pause = function() {
  this.paused = true;
};

ClientSocket.prototype.resume = function() {
  this.paused = false;
  this.rawInputStream.asyncWait(this.inputStreamCallback, 0, 0, mainThread);
};

ClientSocket.prototype.close = function() {
  this.binaryReader.close(0);
  this.rawInputStream.close(0);
  if (this.transport) {
    this.transport.close(0);
  }
  // Delete transport so getInfo doesn't think we are connected
  delete this.transport; 
  if (typeof this.onDisconnect === 'function') {
    this.onDisconnect();
  }
};

ClientSocket.prototype.getInfo = function() {
  var transport = this.transport;

  if (typeof transport === 'undefined') {
    return {socketType: this.socketType,
            connected: false};
  }
  var nsINetAddrPeer = transport.getScriptablePeerAddr();
  var nsINetAddrLocal = transport.getScriptableSelfAddr();
  var info = {connected: true,
              peerAddress: nsINetAddrPeer.address,
              peerPort: nsINetAddrPeer.port,
              localAddress: nsINetAddrLocal.address,
              localPort: nsINetAddrLocal.port};
  return info;
  
};

ClientSocket.prototype.setOnDataListener = function(listener) {
  while (this._waitingData.length > 0) {
    listener(this._waitingData.shift());
  }
  this.onData = listener;
};

ClientSocket.prototype.arrayBufferToString = function(buf) {
  return String.fromCharCode.apply(null, new Uint8Array(buf));
};

module.exports = ClientSocket;
