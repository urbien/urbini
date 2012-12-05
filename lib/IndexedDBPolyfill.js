    var openReqShim = function(dbName, version){
        var me = this;
        var IDBRequest = function(){
          this.onsuccess = this.onerror = this.onblocked = this.onupgradeneeded = null;
        };

        function copyReq(req){
          req = req || dbOpenReq;
          for (var key in req) {
            if (typeof result[key] === "undefined") {
              result[key] = req[key];
            }
          }
        }

        function callback(fn, context, argArray, func){
          //window.setTimeout(function(){
          (typeof context[fn] === "function") && context[fn].apply(context, argArray);
          (typeof func === "function") && func();
          //}, 1);
        }

        var indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
        var dbOpenReq = version ? indexedDB.open(dbName, version) : indexedDB.open(dbName);
        var result = new IDBRequest();
        dbOpenReq.onsuccess = function(e){
          copyReq();
          var db = dbOpenReq.result;
          if (typeof db.setVersion === "function") {
            var oldVersion = parseInt(db.version || 1, 10);
            var newVersion = typeof version === "undefined" ? oldVersion : parseInt(version, 10);
            if (oldVersion < newVersion) {
              var versionReq = db.setVersion(version);
              versionReq.onsuccess = function(upgradeEvent){
                result.transaction = versionReq.result;
                var event = new Event("upgradeneeded");
                event.oldVersion = oldVersion;
                event.newVersion = newVersion;
                for (key in upgradeEvent) {
                  if (key !== "type") {
                    event[key] = upgradeEvent[key];
                  }
                }
                callback("onupgradeneeded", result, [event]);
                // Version transaction is now complete, to open ordinary transaction
                versionReq.result.db.close();
                //console.log("Database closed, and will try to open again, with same version");
                var newDbOpenReq = indexedDB.open(dbName);
                delete result.transaction;
                delete result.result;

                newDbOpenReq.onsuccess = function(e){
                  //console.log("DB Opened without version change", newDbOpenReq.result);
                  copyReq(newDbOpenReq);
                  callback("onsuccess", result, [e], function(){
                    newDbOpenReq.result.close();
                  });
                  newDbOpenReq.result.close();
                };
                newDbOpenReq.onerror = function(e){
                  copyReq(newDbOpenReq);
                  callback("onerror", result, [e], function(){
                    //console.log("Closed database in newRequest on error", newDbOpenReq);
                    newDbOpenReq.result.close();
                  });
                };
                newDbOpenReq.onblocked = function(e){
                  //console.log("DB Blocked without version change", newDbOpenReq.result);
                  copyReq(newDbOpenReq);
                  callback("onblocked", result, [e], function(){
                    //console.log("Closed database in newRequest on blocked", newDbOpenReq);
                    newDbOpenReq.result.close();
                  });
                };
              };
              versionReq.onerror = function(){
                callback("onerror", result, [e]);
                versionReq.result.close();
              };
              versionReq.onblocked = function(e){
                // This always gets called, resulting the blocking the DB upgrade
                //console.log("Version transaction blocked, so calling the on blocked method");
                callback("onblocked", result, [e]);
              };
            } else if (oldVersion === newVersion) {
              callback("onsuccess", result, [e]);
              db.close();
            } else {
              callback("onerror", result, [e]);
              db.close();
            }
          } else {
            callback("onsuccess", result, [e]);
          }
        };
        dbOpenReq.onerror = function(e){
          copyReq();
          //console.log("Error", dbOpenReq);
          callback("onerror", result, [e]);
        };
        dbOpenReq.onblocked = function(e){
          copyReq();
          callback("onblocked", result, [e]);
        };
        dbOpenReq.onupgradeneeded = function(e){
          copyReq();
          if (typeof result["onupgradeneeded"] === "function") {
            result["onupgradeneeded"](e);
          }
        };

        return result;
      }