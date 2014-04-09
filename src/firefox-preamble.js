var freedom;

function setupFreedom(options, dataManifest) {
  if (freedom) {
    return;
  }
  Components.utils.import("resource://gre/modules/devtools/Console.jsm");
  console.log("setupFreedom");

  var hiddenWindow = Components.classes["@mozilla.org/appshell/appShellService;1"]
        .getService(Components.interfaces.nsIAppShellService)
        .hiddenDOMWindow;

  var frame;
  debugger;
  // Create document for freedom to attach to
  var XUL_NS = "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul";
  // frame = hiddenWindow.document.createElementNS(XUL_NS, "iframe");
  frame = hiddenWindow.document.createElement("iframe");
  frame.setAttribute("type", "content");
  var script = hiddenWindow.document.createElement("script");
  script.setAttribute("data-manifest", dataManifest);
  script.textContent = JSON.stringify(options);
  frame.appendChild(script);
  hiddenWindow.document.documentElement.appendChild(frame);
  var document = frame.contentWindow.document;
  frame.document = document;

  // Bind this frame as the FreeDOMs global
  function setupFreedomWithGlobal() {

