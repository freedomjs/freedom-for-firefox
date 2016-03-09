
var ClientSocket = require('../providers/client_socket');
var ServerSocket = require('../providers/server_socket');
var provider = require('../providers/core.tcpsocket');

describe("unit: core.tcpsocket", function() {
  var clientSocket, serverSocket;
  var portNumber = Math.floor((Math.random() * 999) + 8001);
  beforeEach(function() {
    serverSocket = new ServerSocket("localhost", portNumber);
    serverSocket.listen();
    clientSocket = new ClientSocket();
  });

  afterEach(function() {
    serverSocket.disconnect();
  });

  it("connects", function(done) {
    serverSocket.onConnect = function(sock) {
      serverSocket.disconnect();
      done();
    };
    clientSocket.connect("localhost", portNumber, false);
  });

  it("rejects listens on open ports", function() {
    try {
      var ss2 = new ServerSocket("localhost", portNumber);
      ss2.listen();
    } catch (e) {
      expect(e.message).toContain("ERROR_SOCKET_ADDRESS_IN_USE");
    }
  });

  it("receives data", function(done) {
    var stringMessage = "Hello World";
    serverSocket.onConnect = function(sock) {
      sock.setOnDataListener(function (data) {
        const message = clientSocket.arrayBufferToString(data);
        expect(message).toEqual(stringMessage);
        serverSocket.disconnect();
        done();
      });
    };
    clientSocket.connect("localhost", portNumber, false);
    clientSocket.write(str2ab(stringMessage));
  });

  function str2ab(str) {
    var buf = new ArrayBuffer(str.length);
    var bufView = new Uint8Array(buf);
    for (var i=0, strLen=str.length; i<strLen; i++) {
      bufView[i] = str.charCodeAt(i);
    }
    return buf;
  }
  function ab2str(buf) {
    return String.fromCharCode.apply(null, new Uint8Array(buf));
  };

  it("secures socket with starttls", function(done) {
    var INIT_XMPP = '<stream:stream ' +
        'xmlns:stream="http://etherx.jabber.org/streams" ' +
        'version="1.0" xmlns="jabber:client" to="chat.facebook.com" ' +
        'xml:lang="en" xmlns:xml="http://www.w3.org/XML/1998/namespace">';
    var START_TLS = '<starttls xmlns="urn:ietf:params:xml:ns:xmpp-tls"/>';
    var X_FACEBOOK_PLATFORM_AUTH =
        '<auth xmlns="urn:ietf:params:xml:ns:xmpp-sasl" ' +
        'mechanism="X-FACEBOOK-PLATFORM"></auth>';

    // Test that we can connect to chat.facebook.com, then upgrade to a tls
    // socket and get the challenge.  If we fail to upgrade the socket to tls
    // facebook will not return a challenge.
    var onDataCount = 0;
    var dispatchEvent = function (eventType, data) {
      if (eventType == 'onData') {
        var xmlString = ab2str(data.data);
        if (xmlString.indexOf('<challenge') >= 0) {
          done();
        }
        ++onDataCount;
        if (onDataCount == 1) {
          socket.write(str2ab(START_TLS), continuation);
        } else if (onDataCount == 2) {
          socket.secure(continuation);
          socket.write(str2ab(INIT_XMPP), continuation);
        } else if (onDataCount == 3) {
          socket.write(str2ab(X_FACEBOOK_PLATFORM_AUTH), continuation);
        }
      }
    };
    var continuation = function() {};
    var socket = new provider.provider(undefined, dispatchEvent, undefined);
    socket.connect('chat.facebook.com', 5222, continuation);
    socket.write(str2ab(INIT_XMPP), continuation);
  });

  it("secures socket with tls", function(done) {
    var HTTP_GET = [
        'GET / HTTP/1.1',
        'Host: en.wikipedia.org',
        'Connection: close',
        '\r\n'].join('\r\n');
    // Test that we can connect to en.wikipedia.org:443 with TLS.
    var onDataCount = 0;
    var dispatchEvent = function (eventType, data) {
      if (eventType == 'onData') {
        var response = ab2str(data.data);
        if (response.indexOf('HTTP') >= 0) {
          done();
        }
      }
    };
    var continuation = function() {};
    var socket = new provider.provider(undefined, dispatchEvent, undefined);
    socket.prepareSecure(continuation);
    socket.connect('en.wikipedia.org', 443, function() {
      socket.secure(continuation);
      socket.write(str2ab(HTTP_GET), continuation);
    });
  });
});

