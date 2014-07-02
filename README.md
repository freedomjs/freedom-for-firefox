freedom-for-firefox
===================

A freedom.js Distribution for inclusion in Firefox extensions.

Installation
------------

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


Testing
-------

Running the command `grunt build_test` will create a `build/test` directory from the `test` directory and files included via npm. Navigate to that directory with the cfx tool activated and run `cfx run` to run the tests.

The testing framework does not currently run the all the unit tests that run in the browser. The current tests are in the test/data directory. They run on Jasmine 2.0, and report directly into the terminal that the command `cfx run` was run from.
