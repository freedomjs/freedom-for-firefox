var ClientSocket = require('./client_socket');
var ServerSocket = require('./server_socket');

function Socket_firefox(channel, dispatchEvent, socketId) {
  var incommingConnections = Socket_firefox.incommingConnections;
  this.dispatchEvent = dispatchEvent;
  this.socketId = socketId;
  if (socketId in incommingConnections) {
    this.clientSocket = incommingConnections[socketId];
    delete incommingConnections[socketId];
    this.clientSocket.setOnDataListener(this._onData.bind(this));
  }
}

Socket_firefox.incommingConnections = {};
Socket_firefox.socketNumber = 1;

Socket_firefox.prototype.getInfo = function(continuation) {
  if(this.clientSocket) {
    continuation(this.clientSocket.getInfo());
  }
};

Socket_firefox.prototype.close = function(continuation) {
  if(this.clientSocket) {
    this.clientSocket.close();
  }
  continuation();
};

// TODO: handle failures.
Socket_firefox.prototype.connect = function(hostname, port, continuation) {
  this.clientSocket = new ClientSocket();
  this.clientSocket.setOnDataListener(this._onData.bind(this));
  this.clientSocket.connect(hostname, port, false);
  this.hostname = hostname;
  this.port = port;
  continuation();
};

Socket_firefox.prototype.prepareSecure = function(continuation) {
  continuation();
};

// TODO: handle failures.
Socket_firefox.prototype.secure = function(continuation) {
  if (!this.hostname || !this.port || !this.clientSocket) {
    continuation(undefined, {
      "errcode": "SOCKET_NOT_CONNECTED",
      "message": "Cannot Secure Not Connected Socket"
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
  this.clientSocket.setOnDataListener(this._onData.bind(this));
  this.clientSocket.connect(this.hostname, this.port, true);
  continuation();
};

Socket_firefox.prototype.write = function(buffer, continuation) {
  if (this.clientSocket) {
    this.clientSocket.write(buffer);
    continuation();
  }
};

Socket_firefox.prototype.listen = function(host, port, continuation) {
  this.serverSocket = new ServerSocket(host, port);
  this.host = host;
  this.port = port;
  this.serverSocket.onConnect = this._onConnect.bind(this);
  this.serverSocket.listen();
  continuation();
};

Socket_firefox.prototype._onData = function(buffer) {
  this.dispatchEvent("onData",
                     {data: buffer.buffer});
};

Socket_firefox.prototype._onConnect = function(clientSocket) {
  var socketNumber = Socket_firefox.socketNumber++;
  Socket_firefox.incommingConnections[socketNumber] = clientSocket;
  this.dispatchEvent("onConnection", { socket: socketNumber,
                                       host: this.host,
                                       port: this.port
                                     });
  
};

/** REGISTER PROVIDER **/
exports.provider = Socket_firefox;
exports.api = "core.tcpsocket";
