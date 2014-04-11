
      // Create default context.
      if (firefox_config) {
        global['freedom'] = fdom.setup(global, freedom_src, firefox_config);
      } else {
        global['freedom'] = fdom.setup(global, freedom_src);
      }
    })();

  })(this);
  return this.freedom;
}

var EXPORTED_SYMBOLS = ["setupFreedom"];
