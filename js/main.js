Backbone.Model.prototype._super = function(funcName){
    return this.constructor.__super__[funcName].apply(this, _.rest(arguments));
};

Lablz.getType = function(uri) {
	var qIdx = uri.indexOf("?");
	if (qIdx != -1)
		return uri.slice(0, qIdx);
	
	var idx = Utils.getFirstUppercaseCharIdx(uri);
	if (idx == -1)
		return null;
		
	var end = uri.slice(idx).search(/[^a-zA-Z]/);
	return end == -1 ? uri : uri.slice(0, idx + end);
}

Lablz.Type = (function () {
	var loc = window.location.href;
	return loc.substring(loc.lastIndexOf('/'));
})();

Lablz.templates = {
	"string": "#stringTemplate",
	"int": "#intTemplate",
	"email": "#emailTemplate",
	"date": "#dateTemplate",
	"uri": "#uriTemplate",
	"image": "#imageTemplate"
};

Backbone.View.prototype.close = function(){
  this.remove();
  this.unbind();
}

Backbone.View.prototype.close = function(){
  this.remove();
  this.unbind();
  if (this.onClose){
    this.onClose();
  }
}

// Router
var AppRouter = Backbone.Router.extend({

    routes:{
        ":type":"list",
        "view/:type/:id":"view"
    },

    list: function (type) {
      var typeCl = eval('Lablz.' + type) || Lablz.Resource;
      this.resList = new Lablz.ResourceList({model: typeCl});
      var self = this;
      var success = function() {
        app.showView('#sidebar', new Lablz.ResourceListView({model:self.resList}));
        setTimeout(function() {
          Lablz.indexedDB.addCollection(self.resList);
        }, 0);
      };
      var error = function() {
        var str = '';
        for (var name in arguments) {
          str += name + ' = ' + arguments[name] + "\n";
        }
        alert(str);
      };
      
      this.resList.fetch({success: success, error: error});
//        $('#sidebar').html(new Lablz.ResourceListView({model:this.resList}).render().el);
    },

    view: function (type, id) {
      var typeCl = eval('Lablz.' + type);
  		this.res = this.resList ? this.resList.get(id) : new typeCl({id: id});
  		this.resView = new Lablz.ResourceView({model:this.res});
  		var self = this;
  		var success = function() {
        Lablz.indexedDB.addItem(self.res);
  			app.showView('#content', new Lablz.ResourceView({model:self.res}));
  		};
  		
  		var error = function() {
  			var str = '';
  			for (var name in arguments) {
  				str += name + ' = ' + arguments[name] + "\n";
  			}
  			alert(str);
  		};
  		
  		if (!this.resList)
  			this.res.fetch({"success": success, "error": error});
  		else
  			success();
    },
	
	showView:function (selector, view) {
        if (this.currentView)
            this.currentView.close();
			
        $(selector).html(view.render().el);
        this.currentView = view;
        return view;
    },
});

window.indexedDB = window.indexedDB || window.webkitIndexedDB || window.mozIndexedDB;

if ('webkitIndexedDB' in window) {
  window.IDBTransaction = window.webkitIDBTransaction;
  window.IDBKeyRange = window.webkitIDBKeyRange;
}

//Lablz.resourceType = "Urbien";
Lablz.indexedDB = {};
Lablz.indexedDB.db = null;
Lablz.DB_VERSION = 1;

//var LablzDB = {
//  id: "lablz",
//  description: "Urbien with Backbone",
//  migrations: [
//    {
//      version: 1,
//      migrate: function(transaction, next) {
//        transaction.db.createObjectStore(Lablz.resourceType)
//        next()
//      }
//    },
//    
//    {
//      version: 2,
//      migrate: function(transaction, next) {
//        var store
//
//        if (!transaction.db.objectStoreNames.contains(Lablz.resourceType)) {
//          store = transaction.db.createObjectStore(Lablz.resourceType)
//        } else {
//          store = transaction.objectStore(Lablz.resourceType)
//        }
//
//        store.createIndex("uriIndex", "_uri", { unique: true })
//        next()
//      }
//    }  
//  ]
//}

Lablz.indexedDB.onerror = function(e) {
  console.log(e);
};

// creates an object store if it doesn't already exists, upgrades db to new version
Lablz.createObjectStore = function(name, options) {
  var db = Lablz.indexedDB.db;
  if (!db || !db.objectStoreNames.contains(storeName)) {
    Lablz.DB_VERSION++;
    Lablz.indexedDB.open(name, options);
  }
}

Lablz.indexedDB.open = function(storeName, options, success, error) { // optional params: "storeName" to create, "options" to create it with
  var request = indexedDB.open("lablz", Lablz.DB_VERSION);

  request.onsuccess = function(e) {
    Lablz.indexedDB.db = e.target.result;
    var db = Lablz.indexedDB.db;
    if (db.setVersion) {
      if (db.version != Lablz.DB_VERSION) {
        console.log("in old setVersion: "+ db.setVersion); // deprecated but needed for Chrome
        
        // We can only create Object stores in a setVersion transaction or an onupgradeneeded callback;
        var req = db.setVersion(Lablz.DB_VERSION);
        // onsuccess is the only place we can create Object Stores
        req.onerror = Lablz.indexedDB.onerror;
        req.onsuccess = function(e) {
          if (db.objectStoreNames.contains(storeName))
            db.deleteObjectStore(storeName);

          var store = db.createObjectStore(storeName, options || {keyPath: "_uri"});
          e.target.transaction.oncomplete = function() {
//              Lablz.indexedDB.getItems(storeName);
          };
        };
      }
      else {}
//        Lablz.indexedDB.getItems();        
    }
    else {}
//      Lablz.indexedDB.getItems();
    
    if (success)
      success();
  };
  
  request.onupgradeneeded = function(e) {
    console.log ("going to upgrade our DB!");
    Lablz.indexedDB.db = e.target.result;
    var db = Lablz.indexedDB.db;
    if (db.objectStoreNames.contains(storeName))
      db.deleteObjectStore(storeName);

    var store = db.createObjectStore(storeName, options || {keyPath: "_uri"});
    e.target.transaction.oncomplete = function() {
//      Lablz.indexedDB.getItems(storeName);
    };
    
    if (success)
      success();
  }
  
  request.onerror = function(e) {
    if (error)
      error(e);
    
    Lablz.indexedDB.onerror(e);
  };
};

Lablz.indexedDB.addCollection = function(collection) {
  if (!collection || !collection.length)
    return;
  
  var type = collection.className;
  var db = Lablz.indexedDB.db;
  if (!db)
    return;
  
  var trans = db.transaction([type], "readwrite");
  var store = trans.objectStore(type);
  collection.each(function(item) {
    var request = store.put(item.toJSON());
  
    request.onsuccess = function(e) {
  //    Lablz.indexedDB.getItems(type);
    };
  
    request.onerror = function(e) {
      console.log("Error Adding: ", e);
    };
  });
};

Lablz.indexedDB.addItem = function(model) {
  var type = Lablz.getType(model.get('_uri'));
  var db = Lablz.indexedDB.db;
  var trans = db.transaction([type], "readwrite");
  var store = trans.objectStore(type);
  var request = store.put(model.toJSON());

  request.onsuccess = function(e) {
//    Lablz.indexedDB.getItems(type);
  };

  request.onerror = function(e) {
    console.log("Error Adding: ", e);
  };
};

Lablz.indexedDB.deleteItem = function(uri) {
  var type = Lablz.getType(item._uri);
  var db = Lablz.indexedDB.db;
  var trans = db.transaction([type], "readwrite");
  var store = trans.objectStore(type);

  var request = store.delete(id);

  request.onsuccess = function(e) {
//    Lablz.indexedDB.getItems(type);
  };

  request.onerror = function(e) {
    console.log("Error Adding: ", e);
  };
};

Lablz.indexedDB.getItem = function(uri, success, error) {
  var type = Lablz.getType(uri);
  if (type == uri)
    return Lablz.indexedDB.getItems(type, success, error);
  
  var db = Lablz.indexedDB.db;
  if (!db || db.objectStoreNames.length == 0)
    return false;
  
  var trans = db.transaction(type);
  var store = trans.objectStore(type);
  var request = objectStore.get(uri);
  request.onsuccess = function(e) {
    if (success && !!e.target.result)
      success(e.target.result)
  };
  
  request.onerror = function(e) {
    if (error)
      error(e);
    
    Lablz.indexedDB.onerror(e);
  }
  
  return true;
}

Lablz.indexedDB.getItems = function(type, success, error) {
  // var todos = document.getElementById("todoItems");
  // todos.innerHTML = "";

  var db = Lablz.indexedDB.db;
  if (!db || db.objectStoreNames.length == 0)
    return false;
  
  var trans = db.transaction([type], "readwrite");
  var store = trans.objectStore(type);

  // Get everything in the store;
  var results = [];
  var cursorRequest = store.openCursor();
  cursorRequest.onsuccess = function(e) {
    var result = e.target.result;
    if (result) {
      results.push(result.value);
      result.continue();
    }
    else {
      if (success)
        success(results);
    }
  };

  cursorRequest.onerror = function (e) {
    if (error)
      error(e);
    
    Lablz.indexedDB.onerror(e);
  }
  
  return true;
};

// function renderTodo(row) {
  // var todos = document.getElementById("todoItems");
  // var li = document.createElement("li");
  // var a = document.createElement("a");
  // var t = document.createTextNode(row.text);

  // a.addEventListener("click", function() {
    // Lablz.indexedDB.deleteItem(row.timeStamp);
  // }, false);

  // a.textContent = " [Delete]";
  // li.appendChild(t);
  // li.appendChild(a);
  // todos.appendChild(li);
// }

function addItem(item) {
  Lablz.indexedDB.addTodo(item);
}

function init(success, error) {
  Lablz.indexedDB.open("Urbien", {keyPath: "_uri"}, success, error);
}

//window.addEventListener("DOMContentLoaded", init, false);
//tpl.loadTemplates(['ListItem', 'View', 'Props', 'string', 'int', 'uri', 'image', 'date'], function() {
    init(function() {
      app = new AppRouter();
      Backbone.history.start();
    });
//    $.mobile.pushStateEnabled = false;
//});