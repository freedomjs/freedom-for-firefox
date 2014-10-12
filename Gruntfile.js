/**
 * Gruntfile for freedom-for-firefox.jsm
 *
 * This repository provides firefox (extension and os app)
 * specific packaging of the freedom.js library.
 *
 * Here are the common tasks defined:
 * build
 * - Lint source and compile
 * - (Default task)
 * - Unit tests for sanity checking possible without actually launching firefox
 * test
 * - Build and run firefox extension for integration tests
 * debug
 * - Same as test, but browser remains open & watching for changes.
 * ci
 * - Continuous Integration target
 * - Code coverage reports
 **/

var freedomPrefix = require('path').dirname(require.resolve('freedom'));

module.exports = function (grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    jshint: {
      providers: ['providers/*.js'],
      options: {
        '-W069': true,
        '-W104': false
      }
    },
    browserify: {
      freedom: {
        files: {
          'freedom-for-firefox.jsm': ['src/entry.js']
        },
        options: {
          postBundleCB: function (err, src, next) {
            next(err, require('fs').readFileSync(
              require.resolve('freedom/src/util/header.txt')
            ) + src);
          }
        }
      },
      jasmine: {
        files: {
          'spec.jsm': ['src/spec.js']
        }
      },
      options: {
        transform: [['folderify', {global: true}]],
        alias: ['./src/promise.js:es6-promise']
      }
    },
    "build-test-addon": {
      freedom: {
        files: {
          '.build': ['spec.jsm']
        },
        options: {
          helper: [
            {path: 'freedom-for-firefox.jsm', include: false},
            {path: freedomPrefix + '/providers', name: 'providers', include: false},
            {path: freedomPrefix + '/spec', name: 'spec', include: false}
          ]
        }
      }
    }
  });

  grunt.loadNpmTasks('grunt-browserify');
  grunt.loadNpmTasks('grunt-contrib-jshint');

  grunt.loadTasks('tasks');

  grunt.registerTask('build', [
    'jshint:providers',
    'browserify:freedom'
  ]);
  grunt.registerTask('test', [
    'build',
    'browserify:jasmine',
    'integration'
  ]);
  grunt.registerTask('default', ['build']);
};
