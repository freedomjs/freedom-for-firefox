// Jasmine needs to replace these when a clock is installed, but jasmine is replacing the "setTimeout" definition available in its own module.
var {setTimeout, setInterval,
     clearTimeout, clearInterval} = require("sdk/timers");


const {Cu} = require("chrome");
const self = require("sdk/self");


const jasmine = require("jasmine.js");

var providers = ["firefox_providers/client_socket.js",
                 "firefox_providers/server_socket.js",
                 "firefox_providers/tcp_socket.js",
                 "firefox_providers/udp_socket.js"];

var tests = [
  "firefox_tests/client_socket.spec.js",
  "firefox_tests/udp_socket.spec.js",
  "firefox_tests/tcp_socket.spec.js"
];


providers.concat(tests).forEach(function addSrcFiles(file) {
  try {
    jasmine.addSpec(self.data.url(file));
  } catch (e) { // Temp files sometimes cause issues.
    console.warn(e.message);
  }
});

jasmine.executeSpecs();



// TODO Run all freedom unit tests in freedom-for-firefox. The stuff
// below may come in handy.

// const directory = JSON.parse(self.data.load("directory.json"));
// var sourceFiles = filesIn(directory, "src");
// var sourceSpec = filesIn(directory, "spec/src");

// Return the files in targetDirectory by searching through the JSON
// representation of the directory structure given by
// jsonDirectory. We cannot traverse paths in the extension directory
// at runtime. See the comment in the gruntfile where the JSON is
// generated for more information.
function filesIn(jsonDirectory, targetDirectory) {
  var subdirs = [],
      files = [],
      subDirectories = targetDirectory.split("/"),
      target = jsonDirectory;

  subDirectories.forEach(function(currentSubDirectory) {
    var directoryIndex = -1;
    target.children.forEach(function(node, index) {
      if (node.name === currentSubDirectory) {
        directoryIndex = index;
      }
    });
    if (directoryIndex === -1) {
      throw new Error("No such directory: " + targetDirectory);
    }

    target = target.children[directoryIndex];
    if (target.type !== "directory") {
      console.log(target);
      throw new Error(targetDirectory + " is not a directory");
    }
  });


  target.children.forEach(includeDir);
  function includeDir(node) {
    if (node.type === "file") {
      files.push(node.path);
    } else {
      node.children.forEach(includeDir);
    }
  }

  return files;
}
