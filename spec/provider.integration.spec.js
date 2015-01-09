var testUtil = require('freedom/spec/util');
var setup = function () {
  var self = Components.stack.filename;
  var base = self.substr(0, self.lastIndexOf('/'));
  testUtil.setSpecBase(base);
  testUtil.setCoreProviders([
    require('freedom/providers/core/core.unprivileged'),
    require('freedom/providers/core/core.console'),
    require('freedom/providers/core/core.peerconnection'),
    require('freedom/providers/core/core.websocket'),
    require('../providers/core.storage')
  ]);
  testUtil.setModuleStrategy(require('freedom/src/link/worker'), './freedom-for-firefox.jsm');
};

describe("integration-single: social.loopback.json",
    require('freedom/spec/providers/social/social.single.integration.src').bind(this,
    "providers/social/loopback/social.loopback.json", setup));
describe("integration-single: social.ws.json",
    require('freedom/spec/providers/social/social.single.integration.src').bind(this,
    "providers/social/websocket-server/social.ws.json", setup));
describe("integration-double: social.ws.json",
    require('freedom/spec/providers/social/social.double.integration.src').bind(this,
    "providers/social/websocket-server/social.ws.json", setup));

var isolated = "providers/storage/isolated/storage.isolated.json";
describe("integration: storage.isolated.json",
    require('freedom/spec/providers/storage/storage.integration.src').bind(this, isolated, setup));
var shared = "providers/storage/shared/storage.shared.json";
describe("integration: storage.shared.json",
    require('freedom/spec/providers/storage/storage.integration.src').bind(this, shared, setup, false));

describe("integration: transport.webrtc.json",
    require('freedom/spec/providers/transport/transport.integration.src').bind(this,
    "providers/transport/webrtc/transport.webrtc.json", setup));

describe("integration: core.rtcpeerconnection",
    require('freedom/spec/providers/coreIntegration/rtcpeerconnection.integration.src').bind(this,
    require("freedom/providers/core/core.rtcpeerconnection"),
    require("freedom/providers/core/core.rtcdatachannel"),
    setup));

describe("integration: core.tcpsocket",
    require('freedom/spec/providers/coreIntegration/tcpsocket.integration.src').bind(this,
    require('../providers/core.tcpsocket'), setup));

describe("integration: core.udpsocket",
    require('freedom/spec/providers/coreIntegration/udpsocket.integration.src').bind(this,
    require('../providers/core.udpsocket'), setup));

describe("integration: core.oauth - progresslistener",
    require("freedom/spec/providers/coreIntegration/oauth.integration.src").bind(this,
    require("freedom/providers/core/core.oauth"),
    [ require("../providers/oauth/oauth.progresslistener") ],
    [ "https://localhost:9876/" ],
    setup));
describe("integration: core.oauth - httpobserver",
    require("freedom/spec/providers/coreIntegration/oauth.integration.src").bind(this,
    require("freedom/providers/core/core.oauth"),
    [ require("../providers/oauth/oauth.httpobserver") ],
    [ "https://localhost:9876/" ],
    setup));
