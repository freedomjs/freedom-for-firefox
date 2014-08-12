  describe("tcp sockets", function() {
  var clientSocket, serverSocket;
  beforeEach(function() {
    serverSocket = new ServerSocket("localhost", 8081);
    serverSocket.listen();
    clientSocket = new ClientSocket();
  });
  
  it("connects", function(done) {
    serverSocket.onConnect = function(sock) {
      serverSocket.disconnect();
      done();
    };
    clientSocket.connect("localhost", 8081, false);
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
    clientSocket.connect("localhost", 8081, false);
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
    var socket = new Socket_firefox(undefined, dispatchEvent, undefined);
    socket.connect('chat.facebook.com', 5222, continuation);
    socket.write(str2ab(INIT_XMPP), continuation);
  });
});
