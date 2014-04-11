
      // Create default context.
      if (typeof firefox_config !== 'undefined') {
        global['freedom'] = fdom.setup(global, freedom_src, firefox_config);
      } else {
        global['freedom'] = fdom.setup(global, freedom_src);
      }
    })();

  })(this);
  return this.freedom;
}

var EXPORTED_SYMBOLS = ["setupFreedom"];
