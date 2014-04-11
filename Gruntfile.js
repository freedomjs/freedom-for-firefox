var FILES = require('freedom/Gruntfile.js').FILES;

for (var key in FILES) {
  FILES[key] = FILES[key].map(function(str) {
    if (str[0] === '!') {
      return '!node_modules/freedom/' + str.substr(1);
    } else {
      return 'node_modules/freedom/' + str;
    }
  });
}

var FIREFOX_FILES = ['src/firefox-preamble.js'];

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
    concat: {
      dist: {
        options: {
          process: function(src) {
            return src.replace(/\/\*jslint/g,'/*');
          }
        },
        src: FIREFOX_FILES
            .concat(FILES.preamble)
            .concat(FILES.src)
            //.concat('providers/*.js')
            .concat('src/firefox-postamble.js'),
        dest: 'freedom-for-firefox.jsm'
      }
    },
    clean: ["freedom-for-firefox.jsm"]
  });

  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-jshint');

  grunt.registerTask('freedom-firefox', [
    'jshint:providers',
    'concat'
  ]);
  grunt.registerTask('default', ['freedom-firefox']);
};

