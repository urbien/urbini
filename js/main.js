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
      var model = Lablz.shortNameToModel[type];
      if (!model)
        return;
      
//      var typeCl = eval('Lablz.' + type) || Lablz.Resource;
      this.resList = new Lablz.ResourceList({model: model});
      var self = this;
      var success = function(collection, resp) {
        app.showView('#sidebar', new Lablz.ResourceListView({model: collection}));
        if (collection.lastFetchOrigin == 'server') {
          setTimeout(function() {
            Lablz.indexedDB.addCollection(collection);
          }, 0);
        }
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
      var typeCl = Lablz.shortNameToModel[type];
      if (!typeCl)
        return this;
      
  		this.res = this.resList ? this.resList.get(id) : new typeCl({id: id});
  		this.resView = new Lablz.ResourceView({model:this.res});
  		var self = this;
  		var success = function() {
  			app.showView('#content', new Lablz.ResourceView({model:self.res}));
        if (self.res.lastFetchOrigin == 'server') {
          setTimeout(function() {
            Lablz.indexedDB.addItem(self.res);
          }, 0);
        }
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
	
	showView: function(selector, view) {
        if (this.currentView)
            this.currentView.close();
			
        $(selector).empty().append(view.render().el);
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

Lablz.indexedDB.onerror = function(e) {
  console.log(e);
};

// creates an object store if it doesn't already exists, upgrades db to new version
//Lablz.createObjectStore = function(name, options) {
//  var db = Lablz.indexedDB.db;
//  if (!db || !db.objectStoreNames.contains(storeName)) {
//    Lablz.DB_VERSION++;
//    Lablz.indexedDB.open(name, options);
//  }
//}

Lablz.indexedDB.open = function(storeName, options, success, error) { // optional params: "storeName" to create, "options" to create it with
  var request = indexedDB.open("lablz");

  request.onblocked = function(event) {
    alert("Please close all other tabs with this site open!");
  };
  
  request.onsuccess = function(e) {
    Lablz.indexedDB.db = e.target.result;
    var db = Lablz.indexedDB.db;
    db.onversionchange = function(event) {
      db.close();
      alert("A new version of this page is ready. Please reload!");
    };
    
    Lablz.DB_VERSION = db.objectStoreNames.contains(storeName) ? db.version : db.version + 1;

    if (db.version == Lablz.DB_VERSION) {
      if (success)
        success();
      
      return;
    }
    
    if (db.setVersion) {
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
          if (success)
            success();
        };
      };      
    }
    else {
      db.close();
      var subReq = indexedDB.open("lablz", Lablz.DB_VERSION);
      subReq.onsuccess = request.onsuccess;
      subReq.onerror = request.onerror;
      subReq.onupgradeneeded = request.onupgradeneeded;
    }
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
      if (success)
        success();
    };
    
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
//  var type = Lablz.getType(model.get('_uri'));
  var type = model.className;
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
  
  var name = Utils.getClassName(type);
  var db = Lablz.indexedDB.db;
  if (!db || db.objectStoreNames.length == 0 || !db.objectStoreNames.contains(name))
    return false;
  
  var trans = db.transaction([name]);
  var store = trans.objectStore(name);
  var request = store.get(Utils.getShortUri(uri));
  request.onsuccess = function(e) {
    if (success)
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

  var name = Utils.getClassName(type);
  var db = Lablz.indexedDB.db;
  if (!db || db.objectStoreNames.length == 0 || !db.objectStoreNames.contains(name))
    return false;
  
  var trans = db.transaction([name]);
  var store = trans.objectStore(name);

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

function init(success, error) {
  var type = window.location.hash.substring(1);
  if (type.indexOf("view") == 0) {
    var firstSlash = type.indexOf("/");
    var secondSlash = type.indexOf("/", firstSlash + 1);
    type = type.slice(firstSlash + 1, secondSlash);
  }
  else {
    var nonLetterIdx = type.search(/[^a-zA-Z]/);
    type = nonLetterIdx == -1 ? type : type.slice(0, nonLetterIdx);
  }
  
  Lablz.indexedDB.open(type, {keyPath: "_uri"}, success, error);
}

//window.addEventListener("DOMContentLoaded", init, false);
//tpl.loadTemplates(['ListItem', 'View', 'Props', 'string', 'int', 'uri', 'image', 'date'], function() {
    init(function() {
//           init();
           app = new AppRouter();
           if (typeof jq != 'undefined')
             Backbone.setDomLibrary(jq);
           Backbone.history.start();
         },
         function() {
           console.log("failed to init app");
         }
    );
//    $.mobile.pushStateEnabled = false;
//});