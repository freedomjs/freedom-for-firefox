Socket_firefox.incommingConnections = {};
Socket_firefox.socketNumber = 1;

function Socket_firefox(channel, dispatchEvent, socketId) {
  this.dispatchEvent = dispatchEvent;
  this.socketId = socketId;
  if (socketId) {
    this.clientSocket = new ClientSocket(incommingConnections[socketId]);
    this.clientSocket.onData = this.onData.bind(this);
  }
}

Socket_firefox.prototype.getInfo = function(continuation) {
  if(this.clientSocket) {
    continuation(this.clientSocket.getInfo());
  }
};

Socket_firefox.prototype.close = function(continuation) {
  if(this.clientSocket) {
    this.clientSocket.close();
  }
};

Socket_firefox.prototype.connect = function(hostname, port, continuation) {
  this.clientSocket = new ClientSocket();
  this.clientSocket.onData = this.onData.bind(this);
  this.clientSocket.connect(hostname, port);
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
};

Socket_firefox.prototype._onData = function(buffer) {
  this.dispatchEvent(onData,
                     {data: buffer});
};

Socket_firefox.prototype._onConnect = function(clientSocket) {
  var socketNumber = Socket_firefox++;
  Socket_firefox.incommingConnections[socketNumber] = clientSocket;
  this.dispatchEvent({
    socket: socketNumber,
    host: this.host,
    port: this.port
  });
  
};

/** REGISTER PROVIDER **/
if (typeof fdom !== 'undefined') {
  fdom.apis.register("core.tcpsocket", Socket_firefox);
}
