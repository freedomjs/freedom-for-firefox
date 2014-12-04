/*globals console, Components, FileUtils, Services*/
/*jslint indent:2,white:true,sloppy:true */
var dbConn = null;
if (typeof Components !== 'undefined') {
  /* Per: https://developer.mozilla.org/en-US/docs/Storage */
  Components.utils['import']("resource://gre/modules/Services.jsm");
  Components.utils['import']("resource://gre/modules/FileUtils.jsm");

  var file = FileUtils.getFile("ProfD", ["freedom.sqlite"]);
  dbConn = Services.storage.openDatabase(file);
  dbConn.executeSimpleSQL("CREATE TABLE IF NOT EXISTS store (key text primay key, value blob)");
} else {
  console.warn('Storage running in unsuported context.');
}

/**
 * A storage provider using firefox's sqlite storage.
 * @constructor
 */
var Storage_ffox = function(cap, dispatch) {
  this.dispatchEvents = dispatch;
};

/**
 * Get the keys currently stored in storage.
 * @method keys
 * @param {Function} continuation Function to call with array of keys.
 */
Storage_ffox.prototype.keys = function(continuation) {
  var statement = dbConn.createStatement("SELECT key FROM store"),
      ret = false,
      keys = [];
  statement.executeAsync({
    handleResult: function(r) {
      var row;
      for (row = r.getNextRow(); row; row = r.getNextRow()) {
        keys.push(row.getResultByName("key"));
      }
    },
    handleError: function(err) {
      ret = true;
      continuation(undefined, {
        "errcode": "UNKNOWN",
        "message": err.message
      });
    },
    handleCompletion: function(reason) {
      if (ret) {return;}
      if (reason !== Components.interfaces.mozIStorageStatementCallback.REASON_FINISHED) {
        continuation(undefined, {
          "errcode": "UNKNOWN",
          "message": "Query completed with reason: " + reason
        });
      } else {
        continuation(keys);
      }
    }
  });
};

/**
 * Get an item from storage.
 * @method get
 * @param {String} key The key to get
 * @param {Function} continuation The function to call with the data of the key,
 *   or null if the key does not exist.
 */
Storage_ffox.prototype.get = function(key, continuation) {
  var statement = dbConn.createStatement("SELECT value FROM store where key=:k"),
      ret = false,
      params = statement.newBindingParamsArray(),
      param = params.newBindingParams();
  param.bindByName("k", key);
  params.addParams(param);
  statement.bindParameters(params);

  statement.executeAsync({
    handleResult: function(r) {
      var row;
      for (row = r.getNextRow(); row; row = r.getNextRow()) {
        if (!ret) {
          ret = row.getResultByName("value");
          continuation(ret);
        }
      }
    },
    handleError: function(err) {
      if (!ret) {
        ret = true;
        continuation(undefined, {
          "errcode": "UNKNOWN",
          "message": err.message
        });
      }
    },
    handleCompletion: function(reason) {
      if (!ret) {
        if (reason === Components.interfaces.mozIStorageStatementCallback.REASON_FINISHED) {
            continuation(null);
        } else {
          continuation(undefined, {
            "errcode": "UNKNOWN",
            "message": "Query finished with reason: " + reason
          });
        }
      }
    }
  });
};

/**
 * Set an item in the store.
 * @param {String} key The key to set.
 * @param {String} value The data to set for the key.
 * @param {Function} continuation Function to call when the data is stored.
 */
Storage_ffox.prototype.set = function(key, value, continuation) {
  this.get(key, function(val, err) {
    if (err) {
      return continuation(undefined, err);
    }

    var statement, params, param;

    if (val !== value && val === null) {
      statement = dbConn.createStatement("INSERT INTO store VALUES(:k,:v)");
      params = statement.newBindingParamsArray();
      param = params.newBindingParams();
      param.bindByName("k", key);
      param.bindByName("v", value);
      params.addParams(param);
      statement.bindParameters(params);

      statement.execute();
      statement.reset();
      continuation(val);
    } else if (val !== value) {
      statement = dbConn.createStatement("UPDATE store SET value=:v where key=:k");
      params = statement.newBindingParamsArray();
      param = params.newBindingParams();
      param.bindByName("k", key);
      param.bindByName("v", value);
      params.addParams(param);
      statement.bindParameters(params);

      statement.execute();
      statement.reset();
      continuation(val);
    } else {
      // No need to update.
      continuation(val);
    }
  });
};

/**
 * Remove a key from the store.
 * @method remove
 * @param {String} key The key to remove
 * @param {Function} continuation Function to call when key is removed.
 */
Storage_ffox.prototype.remove = function(key, continuation) {
  // console.log('storage_chrome: removing ' + key);
  this.get(key, function(val, err) {
    if (err) {
      return continuation(undefined, err);
    }

    var statement = dbConn.createStatement("DELETE FROM store WHERE key=:k"),
        params = statement.newBindingParamsArray(),
        param = params.newBindingParams();
    param.bindByName("k", key);
    params.addParams(param);
    statement.bindParameters(params);

    statement.execute();
    statement.reset();
    continuation(val);
  });
};

/**
 * Reset the store
 * @method clear
 * @param {Function} continuation Function to call when store is reset.
 */
Storage_ffox.prototype.clear = function(continuation) {
  // console.log('storage_chrome: clear all');
  dbConn.executeSimpleSQL("DELETE FROM store");
  continuation();
};

/** REGISTER PROVIDER **/
exports.provider = Storage_ffox;
exports.name = 'core.storage';
