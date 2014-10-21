freedom-for-firefox
===================
A freedom.js distribution for inclusion in Firefox extensions.

# Installation
Generate a [javascript code module](https://developer.mozilla.org/en-US/docs/Mozilla/JavaScript_code_modules) by running the default grunt task with `grunt`.

Place the generated `freedom-for-firefox.jsm` somewhere in your extension file structure. In the case of jetpack addons, you will likely want to place `freedom-for-firefox.jsm` somehwere in the data dir. To include it in jetpack addon, use:

    const {Cu} = require("chrome");
    Cu.import(self.data.url(PATH TO .jsm RELATIVE TO DATA DIRECTORY))

Or in classic firefox extensions use:

    Components.utils.import(PATH TO .jsm);


This will define the function `setupFreedom` in the current scope. `setupFreedom` takes two arguments:
  - manifest: the path to the freedom manifest file.
  - options: an dictionary mapping various options
    - debug: true for debugging output.
    - freedomcfg: the freedomcfg function for defining new freedom apis.
    - portType: Type of port. Default is Worker. BackgroundFrame is available for debugging purposes.

`setupFreedom` returns a freedom object.

NOTE: The behavior of calling `setupFreedom` more than once is undefined.

# Testing
`grunt test` will build an extension with the jasmine specs and run the tests in Firefox.

# FAQ
- Mac OS X firewalls have been known to block WebRTC when set to its strictest setting.
  Be sure to allow an exception for Firefox for integration tests to pass
- Tests will fail if you leave windows open in Firefox when tests complete (e.g. the browser console)
  Be sure to either close windows quickly or leave the browser window alone during test

