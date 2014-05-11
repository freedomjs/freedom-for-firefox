// https://developer.mozilla.org/en-US/docs/Storage


if (typeof Services === "undefined") {
  Components.utils.import("resource://gre/modules/Services.jsm");
}
Components.utils.import("resource://gre/modules/FileUtils.jsm");

function Storage_firefox(module, dispatchEvent) {
  var lineage = module.lineage[module.lineage.length - 1];
  this._dbFile = FileUtils.getFile("ProfD", [lineage + ".sqlite"]);
  this._dbConn = Services.storage.openDatabase(this._dbFile);
  this._dbConn.executeSimpleSQL("CREATE TABLE IF NOT EXISTS freedom (key TEXT, value TEXT);");
  this._dbConn.executeSimpleSQL("CREATE UNIQUE INDEX unique_key on freedom (key);");
}

Storage_firefox.prototype.keys = function(continuation) {
  var rows = [];
  var statement = this._dbConn.createStatement("SELECT key FROM freedom;");
  statement.executeAsync({
    handleResult: function handleResult(resultSet) {
      var row;
      while ((row = resultSet.getNextRow()) !== null) {
        rows.push(row.getResultByName("key"));
      }
    },
    handleError: function handleError(error) {
      throw new Error("Error in querying storage for keys. " + error.message);
    },
    handleCompletion: function handleCompletion(reason) {
      if(reason === Components.interfaces.mozIStorageStatementCallback.REASON_FINISHED) {
        continuation(rows);
      } else {
        throw new Error("Error in querying storage for keys");
      }
    }
  });
};

Storage_firefox.prototype.get = function(key, continuation) {
  var returnValue;
  var statement = this._dbConn.createStatement("SELECT value FROM freedom WHERE key = :key");
  statement.params.key = key;
  statement.executeAsync({
    handleResult: function handleGetResult(resultSet) {
      var row = resultSet.getNextRow();
      returnValue = row.getResultByName("value");
    },
    handleError: function handleGetError(error) {
      throw new Error("Error querying storage for entry with key " + key +
                      ". " + error.message);
    },
    handleCompletion: function handleGetCompletion(reason) {
      if(reason === Components.interfaces.mozIStorageStatementCallback.REASON_FINISHED) {
        if (typeof returnValue !== "string") {
          returnValue = null;
        }
        continuation(returnValue);
      } else {
        throw new Error("Error in querying storage for " + key);
      }
    }
  });
};

Storage_firefox.prototype.set = function(key, value, continuation) {
  var statement = this._dbConn.createStatement("INSERT OR REPLACE INTO freedom (key, value) values (:key, :value)");
  statement.params.key = key;
  statement.params.value = value;
  statement.executeAsync({
    handleResult: function handleSetResult(resultSet) {
    },
    handleError: function handleSetError(error) {
      throw new Error("Error setting " + key + " to value " + value +
                      ". " + error.message);
    },
    handleCompletion: function handleSetCompletion(reason) {
      if(reason === Components.interfaces.mozIStorageStatementCallback.REASON_FINISHED) {
        continuation();
      } else {
        throw new Error("Error setting " + key + " to value " + value + ". ");
      }
    }
  });
};

Storage_firefox.prototype.remove = Storage_firefox.prototype._remove;

Storage_firefox.prototype.clear = function(continuation) {
  this._remove(undefined, continuation);
};

Storage_firefox.prototype._remove = function(key, continuation) {
  var statement;
  if (key) {
    this._dbConn.createStatement("DELETE FROM freedom WHERE key = :key");
    statement.params.key = key;
  } else {
    this._dbConn.createStatement("DELETE FROM freedom");
    key = "all rows";
  }

  statement.executeAsync({
    handleResult: function handleSetResult(resultSet) {
    },
    handleError: function handleSetError(error) {
      throw new Error("Error deleting " + key + ". " + error.message);
    },
    handleCompletion: function handleSetCompletion(reason) {
      if(reason === Components.interfaces.mozIStorageStatementCallback.REASON_FINISHED) {
        continuation();
      } else {
        throw new Error("Error deleting " + key + ". ");
      }
    }
  });
};

/** REGISTER PROVIDER **/
if (typeof fdom !== 'undefined') {
  fdom.apis.register("core.storage", Storage_firefox);
}
