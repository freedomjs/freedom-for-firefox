var FILES = require('freedom/Gruntfile.js').FILES;
var fs = require('fs');
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
          sourceMapName: 'freedom.map',
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
          'freedom-for-firefox.jsm':
          FILES.lib
            .concat(promise_lib)
            .concat(FILES.srcCore)
            .concat("src/tab-link.js")
            .concat('providers/*.js')
        }
      }
    },
    clean: ["freedom-for-firefox.jsm", "freedom.map"]
  });

  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-jshint');

  grunt.registerTask('freedom-firefox', [
    'jshint:providers',
    'uglify'
  ]);
  grunt.registerTask('default', ['freedom-firefox']);
};

