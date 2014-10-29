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
    },
    bump: {
      options: {
        files: ['package.json'],
        commit: true,
        commitMessage: 'Release v%VERSION%',
        commitFiles: ['package.json'],
        createTag: true,
        tagName: 'v%VERSION%',
        tagMessage: 'Version %VERSION%',
        push: true,
        pushTo: 'origin'
      }
    },
    clean: ['freedom-for-firefox.jsm', 'freedom.map', 'node_modules/', 'spec.jsm',
            '.build/', 'tmp/', 'tools/freedomjs/'],
    'npm-publish': {
      options: {
        // list of tasks that are required before publishing
        requires: [],
        // if the workspace is dirty, abort publishing (to avoid publishing local changes)
        abortIfDirty: true,
      }
    },
    prompt: {
      tagMessage: {
        options: {
          questions: [
            {
              config: 'bump.options.tagMessage',
              type: 'input',
              message: 'Enter a git tag message:',
              default: 'v%VERSION%',
            }
          ]
        }
      }
    },
    shell: {
      options: {},
      publishWebsite: {
        command: 'bash tools/publishWebsite.sh'
      }
    }

  });

  grunt.loadNpmTasks('grunt-browserify');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-prompt');
  grunt.loadNpmTasks('grunt-bump');
  grunt.loadNpmTasks('grunt-npm');
  grunt.loadNpmTasks('grunt-shell');

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

  grunt.registerTask('release', function(arg) {
    if (arguments.length === 0) {
      arg = 'patch';
    }
    grunt.task.run([
      'default',
      'prompt:tagMessage',
      'bump:'+arg,
      'npm-publish',
      'shell:publishWebsite'
    ]);
  });


  grunt.registerTask('default', ['build']);
};
