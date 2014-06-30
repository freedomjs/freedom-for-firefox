// Jasmine needs to replace these when a clock is installed, but jasmine is replacing the "setTimeout" definition available in its own module.
var {setTimeout, setInterval,
     clearTimeout, clearInterval} = require("sdk/timers");


const {Cu} = require("chrome");
const self = require("sdk/self");


const jasmine = require("jasmine.js");
const directory = JSON.parse(self.data.load("directory.json"));
var sourceFiles = filesIn(directory, "src");
var sourceSpec = filesIn(directory, "spec/src");

//setTimeout(function() {
sourceFiles.concat(sourceSpec).forEach(function addSrcFiles(file) {
  try {
    jasmine.addSpec(self.data.url(file));
  } catch (e) { // Temp files sometimes cause issues.
    console.warn(e.message);
  }
});

jasmine.executeSpecs();
//}, 15000);


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
