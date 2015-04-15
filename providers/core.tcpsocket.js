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
  } else {
    continuation({ "connected": false });
  }
};

Socket_firefox.prototype.close = function(continuation) {
  if (!this.clientSocket && !this.serverSocket) {
    continuation(undefined, {
      "errcode": "SOCKET_CLOSED",
      "message": "Cannot close non-connected socket"
    });
    return;
  }
  if (this.clientSocket) {
    this.clientSocket.close();
  } else if (this.serverSocket) {
    this.serverSocket.disconnect();
  }
  continuation();
};

// TODO: handle failures.
Socket_firefox.prototype.connect = function(hostname, port, continuation) {
  this.clientSocket = new ClientSocket();
  var onConnection = function(arg, err) {
    console.log("CLIENT FIRING ONCONNECTION");
    this.dispatchEvent("onConnection", err);
    continuation(arg, err);
  }.bind(this);
  this.clientSocket.onDisconnect = function(arg, err) {
    console.log("CLIENT FIRING ONDISCONNECT");
    this.dispatchEvent("onDisconnect", err);
  }.bind(this);
  this.clientSocket.setOnDataListener(this._onData.bind(this));
  console.log("ABOUT TO CONNECT");
  this.clientSocket.connect(hostname, port, false, onConnection);
  this.hostname = hostname;
  this.port = port;
};

Socket_firefox.prototype.prepareSecure = function(continuation) {
  continuation();
};

// TODO: handle failures.
Socket_firefox.prototype.secure = function(continuation) {
  if (!this.hostname || !this.port || !this.clientSocket) {
    continuation(undefined, {
      "errcode": "NOT_CONNECTED",
      "message": "Cannot secure non-connected socket"
    });
  } else {
    // Create a new ClientSocket (nsISocketTransport) object for the existing
    // hostname and port, using type 'starttls'.  This will upgrade the existing
    // connection to TLS, rather than create a new connection.
    // TODO: check to make sure this doesn't result in weird race conditions if
    // we have 2 pieces of code both trying to connect to the same hostname/port
    // and do a starttls flow (e.g. if there are 2 instances of a GTalk social
    // provider that are both trying to connect to GTalk simultaneously with
    // different logins).
    this.clientSocket = new ClientSocket();
    // TODO: DRY this code (similar to 'connect' above)
    this.clientSocket.onDisconnect = function(err) {
      this.dispatchEvent("onDisconnect", err);
    }.bind(this);
    this.clientSocket.setOnDataListener(this._onData.bind(this));
    this.clientSocket.connect(this.hostname, this.port, true);
    console.log("CLIENT FIRING ONCONNECTION");
    this.dispatchEvent("onConnection", {
      "errcode": "SUCCESS",
      "message": "Upgraded to TLS connection"
    });
    continuation();
  }
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
  if (!this.serverSocket) {
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
  console.log("SERVER FIRING ONCONNECTION");
  this.dispatchEvent("onConnection", {
    socket: socketNumber,
    host: this.host,
    port: this.port
  });
};

/** REGISTER PROVIDER **/
exports.provider = Socket_firefox;
exports.name = "core.tcpsocket";
