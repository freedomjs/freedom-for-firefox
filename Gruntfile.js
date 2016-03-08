/*jslint node:true*/
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
  'use strict';
  require('time-grunt')(grunt);
  require('jit-grunt')(grunt, {
    'npm-publish': 'grunt-npm'
  });

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
      frame: {
        files: {
          'build/frame.js': require.resolve('freedom/src/util/frameEntry.js')
        }
      },
      options: {
        transform: [['folderify', {global: true}]],
        alias: [
          './src/promise.js:es6-promise'
        ]
      }
    },
    jasmine_firefoxaddon: {
      tests: ['spec/*.spec.js'],
      resources: [],
      helpers: ['freedom-for-firefox.jsm']
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
    clean: ['freedom-for-firefox.jsm', 'freedom.map', 'spec.jsm', '.build/'],
    'npm-publish': {
      options: {
        // list of tasks that are required before publishing
        requires: [],
        // if the workspace is dirty, abort publishing (to avoid publishing local changes)
        abortIfDirty: true
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
              default: 'v%VERSION%'
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
    },
    copy: {
      demo: {
        src: 'build/frame.js',
        dest: 'demo/tictak/data/freedom-frame.js'
      }
    }

  });

  grunt.registerTask('build', [
    'jshint:providers',
    'browserify:freedom'
  ]);
  grunt.registerTask('test', [
    'build',
    'jasmine_firefoxaddon'
  ]);

  grunt.registerTask('release', function (arg) {
    if (arguments.length === 0) {
      arg = 'patch';
    }
    grunt.task.run([
      'default',
      'prompt:tagMessage',
      'bump:' + arg,
      'npm-publish',
      'shell:publishWebsite'
    ]);
  });


  grunt.registerTask('default', ['build']);
};
