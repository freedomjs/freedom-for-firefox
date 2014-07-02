var FILES = require('freedom/Gruntfile.js').FILES;
var fs = require('fs'),
    path = require('path');
var prefix = 'node_modules/freedom/';

for (var key in FILES) {
  FILES[key] = FILES[key].map(function(str) {
    if (str[0] === '!') {
      return '!node_modules/freedom/' + str.substr(1);
    } else {
      return 'node_modules/freedom/' + str;
    }
  });
}

// Freedom npm dependency doesn't grab promise sub dependency.
var promise_lib =   [
  'node_modules/es6-promise/dist/promise-*.js',
  '!node_modules/es6-promise/dist/promise-*amd.js',
  '!node_modules/es6-promise/dist/promise-*min.js'
]

module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    jshint: {
      providers: ['providers/*.js'],
      options: {
        '-W069': true,
        '-W104': false
      }
    },
    uglify: {
      freedom: {
        options: {
          sourceMap: true,
          sourceMapName: 'build/freedom.map',
          sourceMapIncludeSources: true,
          mangle: false,
          beautify: true,
          compress: false,
          preserveComments: function(node, comment) {
            return comment.value.indexOf('jslint') !== 0;
          },
          banner: fs.readFileSync('src/firefox-preamble.js', 'utf8') + 
            fs.readFileSync(prefix + 'src/util/preamble.js', 'utf8'),
          footer: fs.readFileSync('src/firefox-postamble.js', 'utf8') 
          // footer: fs.readFileSync(prefix + 'src/util/postamble.js', 'utf8') +
          //   fs.readFileSync('src/firefox-postamble.js', 'utf8') 
            
        },
        files: {
          'build/freedom-for-firefox.jsm':
          FILES.lib
            .concat(promise_lib)
            .concat(FILES.srcCore)
            .concat("src/backgroundframe-link.js")
            .concat('providers/*.js')
        }
      }
    },
    copy: {
      test: {
        files: [
          {expand: true, src: ['test/**'], dest: 'build/'},
          {expand: true, cwd: 'build', src: ['freedom-for-firefox.jsm'], 
           dest: 'build/test/lib'},
          {expand: true, cwd: 'node_modules/freedom/',
           src: ['spec/**', 'src/**', 'providers/**'],
           dest: 'build/test/data'},
          {expand: true, cwd: 'providers',
           src: ['*.js'],
           dest: 'build/test/data/firefox_providers'},
          {expand: true, cwd: 'node_modules/es6-promise/dist',
           src: [ 'promise-0.*.*.js'],
           dest: 'build/test/data'}
        ]
      }
    },
    clean: ["build/"]
  });

  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-jshint');

  grunt.registerTask('freedom-firefox', [
    'jshint:providers',
    'uglify'
  ]);
  grunt.registerTask('writeJsonDir', 'Write', writeJsonDir);
  grunt.registerTask('build_test', [
    'freedom-firefox',
    'copy:test',
    'writeJsonDir'
  ]);
  grunt.registerTask('default', ['freedom-firefox']);

  // Write the contents of the data directory in the test extension
  // into a JSON file. We have to do this because files/directories
  // cannot be enumerated at runtime inside of the extension. The file
  // name must be known at runtime to be resolved. See
  // https://groups.google.com/d/msg/mozilla-labs-jetpack/FDS7AGxbB18/YeHHS7ovwNEJ
  // for an explanation as to why files don't have normal file system
  // paths.
  function writeJsonDir() {
    var done = this.async();
    var cwd = process.cwd();
    process.chdir('build/test/data');
    var tree = JSON.stringify(dirTree("."));
    try {
      fs.writeFileSync("directory.json", tree); 
      grunt.log.ok("directory.json written to test directory.");
    } catch (e) {
      grunt.log.error(e);
      return false;
    } finally {
      process.chdir(cwd);
    }
    return true;
  }
};

// Derived from http://stackoverflow.com/a/11194896
function dirTree(filename) {
    var stats = fs.lstatSync(filename),
        info = {
            path: filename,
            name: path.basename(filename)
        };

    if (stats.isDirectory()) {
        info.type = "directory";
        info.children = fs.readdirSync(filename).map(function(child) {
            return dirTree(filename + '/' + child);
        });
    } else {
        // Assuming it's a file. In real life it could be a symlink or
        // something else!
        info.type = "file";
    }

    return info;
}
