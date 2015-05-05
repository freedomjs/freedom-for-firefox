var ClientSocket = require('./client_socket');
var ServerSocket = require('./server_socket');

function Socket_firefox(cap, dispatchEvent, socketId) {
  var incomingConnections = Socket_firefox.incomingConnections;
  this.dispatchEvent = dispatchEvent;
  this.socketId = socketId;
  if (socketId in incomingConnections) {
    this.clientSocket = incomingConnections[socketId];
    delete incomingConnections[socketId];
    this.clientSocket.setOnDataListener(this._onData.bind(this));
  }
}

Socket_firefox.incomingConnections = {};
Socket_firefox.socketNumber = 1;

Socket_firefox.prototype.getInfo = function(continuation) {
  if(this.clientSocket) {
    continuation(this.clientSocket.getInfo());
  } else if (this.serverSocket) {
    continuation(this.serverSocket.getInfo());
  }
};

Socket_firefox.prototype.close = function(continuation) {
  if (!this.clientSocket && !this.serverSocket) {
    continuation(undefined, {
      "errcode": "SOCKET_CLOSED",
      "message": "Cannot close non-connected socket"
    });
  } else if(this.clientSocket) {
    this.clientSocket.close(continuation);
  } else if (this.serverSocket) {
    this.serverSocket.disconnect(continuation);
  } else {
    continuation(undefined, {
      'errcode': 'SOCKET_CLOSED',
      'message': 'Socket Already Closed, or was never opened'
    });
  }
};

// TODO: handle failures.
Socket_firefox.prototype.connect = function(hostname, port, continuation) {
  this.clientSocket = new ClientSocket();
  this.clientSocket.onDisconnect = this.dispatchDisconnect.bind(this); 
  this.clientSocket.setOnDataListener(this._onData.bind(this));
  this.clientSocket.connect(hostname, port, false, continuation);
  this.hostname = hostname;
  this.port = port;
};

Socket_firefox.prototype.dispatchDisconnect = function(continuation, err) {
  if (typeof err === 'undefined') {
    err = {
      'errcode': 'CONNECTION_CLOSED',
      'message': 'Connection closed gracefully'
    };
  }
  this.dispatchEvent('onDisconnect', err);
  if (typeof continuation === 'function') {
    continuation();
  }
};

Socket_firefox.prototype.prepareSecure = function(continuation) {
  continuation();
};

// TODO: handle failures.
Socket_firefox.prototype.secure = function(continuation) {
  if (!this.hostname || !this.port || !this.clientSocket) {
    continuation(undefined, {
      "errcode": "NOT_CONNECTED",
      "message": "Cannot secure non-connected Socket"
    });
    return;
  }
  // Create a new ClientSocket (nsISocketTransport) object for the existing
  // hostname and port, using type 'starttls'.  This will upgrade the existing
  // connection to TLS, rather than create a new connection.
  // TODO: check to make sure this doesn't result in weird race conditions if
  // we have 2 pieces of code both trying to connect to the same hostname/port
  // and do a starttls flow (e.g. if there are 2 instances of a GTalk social
  // provider that are both trying to connect to GTalk simultaneously with
  // different logins).
  this.clientSocket = new ClientSocket();
  // TODO: DRY this code up (see 'connect' above)
  this.clientSocket.onDisconnect = this.dispatchDisconnect.bind(this); 
  this.clientSocket.setOnDataListener(this._onData.bind(this));
  this.clientSocket.connect(this.hostname, this.port, true, continuation);
};

Socket_firefox.prototype.write = function(buffer, continuation) {
  if (!this.clientSocket) {
    continuation(undefined, {
      "errcode": "NOT_CONNECTED",
      "message": "Cannot write non-connected socket"
    });
  } else {
    this.clientSocket.write(buffer);
    continuation();
  }
};

Socket_firefox.prototype.pause = function(continuation) {
  if (!this.clientSocket) {
    continuation(undefined, {
      "errcode": "NOT_CONNECTED",
      "message": "Can only pause a connected client socket"
    });
  } else {
    this.clientSocket.pause();
    continuation();
  }
};

Socket_firefox.prototype.resume = function(continuation) {
  if (!this.clientSocket) {
    continuation(undefined, {
      "errcode": "NOT_CONNECTED",
      "message": "Can only resume a connected client socket"
    });
  } else {
    this.clientSocket.resume();
    continuation();
  }
};

Socket_firefox.prototype.listen = function(host, port, continuation) {
  if (typeof this.serverSocket !== 'undefined') {
    continuation(undefined, {
      "errcode": "ALREADY_CONNECTED",
      "message": "Cannot listen on existing socket."
    });
  } else {
    try {
      this.serverSocket = new ServerSocket(host, port);
      this.host = host;
      this.port = port;
      this.serverSocket.onConnect = this._onConnect.bind(this);
      this.serverSocket.onDisconnect = this.dispatchDisconnect.bind(this); 
      this.serverSocket.listen();
      continuation();
    } catch (e) {
      continuation(undefined, {
        "errcode": "UNKNOWN",
        "message": e.message
      });
    }
  }
};

Socket_firefox.prototype._onData = function(buffer) {
  this.dispatchEvent("onData",
                     {data: buffer.buffer});
};

Socket_firefox.prototype._onConnect = function(clientSocket) {
  var socketNumber = Socket_firefox.socketNumber++;
  Socket_firefox.incomingConnections[socketNumber] = clientSocket;
  this.dispatchEvent("onConnection", { socket: socketNumber,
                                       host: this.host,
                                       port: this.port
                                     });

};

/** REGISTER PROVIDER **/
exports.provider = Socket_firefox;
exports.name = "core.tcpsocket";
