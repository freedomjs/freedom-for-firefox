var global = this;
describe("sockets", function() {
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
    clientSocket.connect("localhost", 8081);
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
    clientSocket.connect("localhost", 8081);
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
});
