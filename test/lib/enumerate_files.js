const {list} = require("sdk/io/file");
const {Cc, Ci} = require("chrome");

function MozFile(path) {
  var file = Cc['@mozilla.org/file/local;1']
             .createInstance(Ci.nsILocalFile);
  file.initWithPath(path);
  return file;
}

function enumerateFiles(rootDir) {
  debugger;
  var files = [];
  function enumerate(dir) {
    list(dir).forEach(function(entry) {
      var file = MozFile(entry);
      if (file.isDirectory()) {
        enumerate(entry);
      } else {
        files.append(entry);
      }
    });
  }
  enumerate(rootDir);
  return files;
}

exports.enumerateFiles = enumerateFiles;
