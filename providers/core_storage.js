// https://developer.mozilla.org/en-US/docs/Storage


if(typeof Services === "Undefined") {
  Components.utils.import("resource://gre/modules/Services.jsm");
}
Components.utils.import("resource://gre/modules/FileUtils.jsm");

function Storage_firefox(channel, dispatchEvent) {
}

/** REGISTER PROVIDER **/
if (typeof fdom !== 'undefined') {
  fdom.apis.register("core.storage", Storage_firefox);
}
