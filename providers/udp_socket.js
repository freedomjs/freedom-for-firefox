function Udp_firefox(channel, dispatchEvent) {
  this.dispatchEvent = dispatchEvent;
  // http://dxr.mozilla.org/mozilla-central/source/netwerk/base/public/nsIUDPSocket.idl
  this._nsIUDPSocket = Components.classes["@mozilla.org/network/udp-socket;1"]
    .createInstance(Components.interfaces.nsIUDPSocket);
}

Udp_firefox.prototype.bind = function(address, port, continuation) {
  if (port < 1) {
    port = -1;
  }
  try {
    this._nsIUDPSocket.init(port, false);
    this._nsIUDPSocket.asyncListen(new nsIUDPSocketListener(this));
    continuation(0);
  } catch (e) {
    continuation(-1);
  }
};

Udp_firefox.prototype.getInfo = function(continuation) {
  var returnValue = {
    localAddress: "127.0.0.1",
    localPort: this._nsIUDPSocket
  };
  continuation(returnValue);
};

Udp_firefox.prototype.sendTo = function(buffer, address, port, continuation) {
  // http://lxr.mozilla.org/mozilla-central/source/netwerk/base/public/nsINetAddr.idl
  var nsINetAddr = {
    family: Components.interfaces.nsINetAddr.FAMILY_INET,
    port: port,
    address: address
  };
  var bytesWritten = this._nsIUDPSocket.sendWithAddr(nsINetAddr,
                                                     buffer,
                                                     buffer.length);
  continuation(bytesWritten);
};

Udp_firefox.prototype.destroy = function(continuation) {
  this._nsIUDPSocket.close();
  continuation();
};

function nsIUDPSocketListener(udpSocket) {
  this._udpSocket = udpSocket;
}

nsIUDPSocketListener.prototype.onPacketReceived = function(nsIUDPSocket,
                                                           message) {
  var eventData = {
    resultCode: 0,
    address: message.fromAddr.address,
    port: message.fromAddr.address,
    data: this.str2ab(message.data)
  };
  this._udpSocket.dispatchEvent("onData",
                                eventData);
};

nsIUDPSocketListener.prototype.onStopListening = function(nsIUDPSocket,
                                                          status) {
};

nsIUDPSocketListener.prototype.str2ab = function(str) {
  var buf = new ArrayBuffer(str.length); 
  var bufView = new Uint8Array(buf);
  for (var i=0, strLen=str.length; i<strLen; i++) {
    bufView[i] = str.charCodeAt(i);
  }
  return buf;
};

/** REGISTER PROVIDER **/
if (typeof fdom !== 'undefined') {
  fdom.apis.register("core.udpsocket", Udp_firefox);
}
