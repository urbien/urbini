// Models
Lablz.Resource = Backbone.Model.extend({
//  database: LablzDB,
//  storeName: LablzDB.id,
	initialize: function() {
		_.bindAll(this, 'setProperties', 'getKey', 'parse'); //, 'fetch'); // fixes loss of context for 'this' within methods
		this.setProperties();
		var type = this.type || this.get('type');
		if (!type)
		  return this;
		
	  if (type.indexOf) {
      this.type = type;
	    this.className = type.substring(type.lastIndexOf("/") + 1);
	  }
	  else {
	    this.className = type.name;
	    this.type = type._uri;
	  }
	  
    this.urlRoot = Lablz.apiUrl + this.className;
	},
	getKey: function() {
	  return this.get('_uri');
	},
	properties: {
		davDisplayName: {type: "string"}
	},
	setProperties: function() {
		_.extend(this.properties, this.constructor.__super__.properties);
		return this;
	},
	parse: function (response) {
	  if (!response || response.error)
	    return {};
	  else if (response._uri)
	    return response;
		
	  // Lablz.setMetadata(response.metadata);
	  // this.model.get('type') = response.metadata.type;
	  return response.data[0];
	}
//	,
//  fetch: function(options) {
//    return Backbone.Collection.prototype.fetch.call(this, options);
//  }
});

Lablz.ResourceList = Backbone.Collection.extend({
	initialize: function(metadata) {
    _.bindAll(this, 'getKey', 'parse'); //, 'fetch'); // fixes loss of context for 'this' within methods
    if (!metadata || !metadata.model)
      throw new Error("resource list must be initialized with model");
    
    this.model = metadata.model;
    this.type = metadata.type || this.model.prototype.type;
	  this.className = this.type.substring(this.type.lastIndexOf("/") + 1);
	  this.url = Lablz.apiUrl + this.className;
    console.log("init resourceList");
	},
	getKey: function() {
	  return this.className;
	},
	parse: function(response) {
	  if (!response || response.error)
	    return [];
		
	  // Lablz.setMetadata(response.metadata);
	  // this.model.get('type') = response.metadata.type;
	  return response instanceof Array ? response : response.data;
	}
//	,
//	fetch: function(options) {
//	  return Backbone.Collection.prototype.fetch.call(this, options);
//	}
});

Lablz.Contact = Lablz.Resource.extend({
	type: "http://www.hudsonfog.com/voc/model/company/Contact",
	properties: {
		firstName: {"type": "string"},
		lastName: {"type": "string"},
		accessLevel: {"type": "string"},
		photo: {"type": "image"},
		featured: {"type": "image"},
		gender: {"type": "string"},
		dateRegistered: {"type": "date"}
	},
	initialize: function(arguments) {
    _.bindAll(this, 'parse'); // fixes loss of context for 'this' within methods
		Lablz.Contact.__super__.initialize.apply(this, arguments);
//		console.log("gave birth to a Contact");
	}
});

Lablz.Urbien = Lablz.Contact.extend({
	type: "http://www.hudsonfog.com/voc/commerce/urbien/Urbien",
	className: null,
	properties: {
		mojoPoints: {"type": "int"}
	},
	initialize: function() {
    _.bindAll(this, 'parse'); // fixes loss of context for 'this' within methods
		this.constructor.__super__.initialize.apply(this, arguments);
//		console.log("gave birth to an Urbien");
	}
});

Lablz.Urbien.prototype.parse = Lablz.Contact.prototype.parse = Lablz.Resource.prototype.parse;

Lablz.defaultSync = function(method, model, options) {
  Backbone.defaultSync(method, model, options);
};

Backbone.defaultSync = Backbone.sync;
Backbone.sync = function(method, model, options) {
  var key, now, timestamp, refresh;
  if(method === 'read') {
    var success = function(results) {
//      refresh = options.forceRefresh;
//      if (refresh || !timestamp || ((now - timestamp) > this.constants.maxRefresh)) {
//        // make a network request and store result in local storage
//        var success = options.success;
//        options.success = function(resp, status, xhr) {
//          // check if this is an add request in which case append to local storage data instead of replace
//          if(options.add && resp.values) {
//            // clone the response
//            var newData = JSON.parse(JSON.stringify(resp));
//            // append values
//            var prevData = $storage.get(key);
//            newData.values = prevData.values.concat(resp.values);
//            // store new data in local storage
//            $storage.set(key, newData);
//          } else {
//            // store resp in local storage
//            $storage.set(key, resp);
//          }
//  //        var now = new Date().getTime();
//          $storage.set(key + ":_uri", uri);
//          success(resp, status, xhr);
//        };
//        // call normal backbone sync
//        Backbone.defaultSync(method, model, options);
//      } else {
        // provide data from local storage instead of a network call
        if (!results || results.length == 0) {
          Lablz.defaultSync(method, model, options);
          return;
        }
          
        // simulate a normal async network call
        setTimeout(function(){
          options.success(results, 'success', null);
        }, 0);
//      }
    }
    var error = function(e) {
      Lablz.defaultSync(method, model, options);      
    }
    
    // only override sync if it is a fetch('read') request
    key = this.getKey();
    if (key) {
      now = new Date().getTime();
      if (!Lablz.indexedDB.getItem(key, success, error)) {
        Lablz.defaultSync(method, model, options);
        return;
      }      
    }
    else {
      Lablz.defaultSync(method, model, options);
    }
  } else {
    Lablz.defaultSync(method, model, options);
  }
}
