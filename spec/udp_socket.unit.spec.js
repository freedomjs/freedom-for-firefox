var provider = require('../providers/udp_socket');

describe("udp socket", function() {
  var socket, serverDispatchEvent;
  const listenPort = 8082,
        sendPort = 8083;
  beforeEach(function() {
    serverDispatchEvent = jasmine.createSpy("dispatchEvent");
    socket = new provider.provider(undefined, serverDispatchEvent);
  });

  it("binds", function(done) {
    function bindContinuation(success) {
      expect(success).toEqual(0);
      var destroyContinuation = jasmine.createSpy("continuation");
      socket.destroy(destroyContinuation);
      expect(destroyContinuation).toHaveBeenCalled();
      done();
    }
    socket.bind("localhost", listenPort, bindContinuation);
  });

  it("receives data", function(done) {
    const sendString = "Hello World",
          sendBuffer = str2ab(sendString),
          clientDispatchEvent = jasmine.createSpy("dispatchEvent"),
          sendingSocket = new provider.provider(undefined, clientDispatchEvent),
          sendContinuation = jasmine.createSpy("sendContinuation"),
          bindContinuation = jasmine.createSpy("bindContinuation");

    socket.bind("localhost", listenPort, bindContinuation);
    expect(bindContinuation).toHaveBeenCalledWith(0);
    sendingSocket.bind("localhost", sendPort, bindContinuation);
    expect(bindContinuation.calls.count()).toEqual(2);
    expect(bindContinuation.calls.mostRecent().args[0]).toEqual(0);

    serverDispatchEvent.and.callFake(function fakeDispatchEvent(event, data) {
      expect(event).toEqual("onData");
      expect(data.resultCode).toEqual(0);
      expect(data.port).toEqual(sendPort);
      expect(data.data).toEqual(sendBuffer);
      done();
    });
    sendingSocket.sendTo(sendBuffer, "localhost",
                         listenPort, sendContinuation);
    expect(sendContinuation).toHaveBeenCalled();
    
    sendingSocket.destroy(jasmine.createSpy("destroyContinuation"));
    socket.destroy(jasmine.createSpy("destroyContinuation"));

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
