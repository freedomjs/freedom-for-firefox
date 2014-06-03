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


This will define the function `setupFreedom` in the current scope. `setupFreedom` takes a single argument: the path to the freedom manifest file. `setupFreedom` returns a freedom object.

NOTE: The behavior of calling `setupFreedom` more than once is undefined.
