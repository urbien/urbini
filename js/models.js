packages = {};

//var packages = {
//    hudsonfog: {
//      voc: {
//        model: {
//          company: {}
//        },
//        commerce: {
//          urbien: {}
//        }
//      }
//    }
//}

// Models
packages.Resource = Backbone.Model.extend({
  _setUri: function() {
    var uri = this.get('_uri');
    if (uri)
      return this;
    
    var id = this.get('id');
    if (id)
      this.set('_uri', this.type + "?id=" + id);

    return this;
  },
	initialize: function() {
		_.bindAll(this, '_setUri', 'getKey'); //, 'fetch'); // fixes loss of context for 'this' within methods
		var type = this.__proto__.constructor.type || this.get('type');
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
    if (!this.get('_uri'))
      this._setUri();
	},
	getKey: function() {
	  return this.get('_uri');
	},
  parse: function (response) {
    if (!response || response.error)
      return {};
      else if (response._uri)
        return response;
    
    return response.data[0];
  }
},
{
  type: "http://www.w3.org/TR/1999/PR-rdf-schema-19990303#Resource",
  shortName: "Resource",
  displayName: "Resource",
  properties: {
    davDisplayName: {type: "string"}
  }
});

Lablz.ResourceList = Backbone.Collection.extend({
	initialize: function(metadata) {
    _.bindAll(this, 'getKey'); //, 'fetch'); // fixes loss of context for 'this' within methods
    if (!metadata || !metadata.model)
      throw new Error("resource list must be initialized with model");
    
    this.model = metadata.model;
    this.type = this.model.type;
	  this.className = this.model.shortName; //.substring(this.type.lastIndexOf("/") + 1);
	  this.url = Lablz.apiUrl + this.className;
    console.log("init resourceList");
	},
	getKey: function() {
	  return this.type;
	},
  parse: function(response) {
    if (!response || response.error)
      return [];
    
    return response instanceof Array ? response : response.data;
  }
});

Lablz.models = [packages.Resource];

// START /////////////////////////////////////////////////////// PUT MODELS HERE ///////////////////////////////////////////////////// START

_.extend(packages, {hudsonfog: {voc: {commerce: {urbien: {}}}}}); 
packages.hudsonfog.voc.commerce.urbien.Building = packages.Resource.extend({initialize: function() { 
_.bindAll(this, 'parse'); // fixes loss of context for 'this' within methods 
packages.hudsonfog.voc.commerce.urbien.Building.__super__.initialize.apply(this, arguments); 
} 

}, {properties: _.extend({
  "region": {"type": "string"},
  "magellan": {"type": "resource"},
  "dateInitialized": {"type": "date"},
  "altitude": {"type": "double"},
  "yearBuilt": {"type": "date"},
  "geoLocation": {"type": "resource"},
  "address2": {"type": "string"},
  "communityDistrict": {"type": "resource"},
  "investmentInfo": {"type": "boolean"},
  "bigMediumImage": {"type": "resource"},
  "bigImage": {"type": "resource"},
  "cityScape": {"type": "resource"},
  "city": {"type": "string"},
  "stakesPercentOwned": {"type": "float"},
  "distance": {"type": "float"},
  "area": {"type": "float"},
  "postalCode": {"type": "string"},
  "originalImage": {"type": "resource"},
  "censusBlock": {"type": "resource"},
  "addressGroup": {"type": "boolean"},
  "description": {"type": "string"},
  "mediumImage": {"type": "resource"},
  "name": {"type": "string"},
  "smallImage": {"type": "resource"},
  "censusTract": {"type": "resource"},
  "park": {"type": "resource"},
  "neighborhood": {"type": "resource"},
  "borough": {"type": "resource"},
  "currentPrice": {"type": "inlineresource"},
  "boughtOut": {"type": "boolean"},
  "freeWifi": {"type": "boolean"},
  "wifi": {"type": "boolean"},
  "initialPrice": {"type": "inlineresource"},
  "hasAudio": {"type": "boolean"},
  "address": {"type": "string"},
  "county": {"type": "resource"}
}, packages.Resource.properties)
,displayName: "City Spot"
,shortName: "Building"
,type: "http://www.hudsonfog.com/voc/commerce/urbien/Building"
}); 
Lablz.models.push(packages.hudsonfog.voc.commerce.urbien.Building); 

packages.hudsonfog.voc.commerce.urbien.BasketballCourt = packages.hudsonfog.voc.commerce.urbien.Building.extend({initialize: function() { 
_.bindAll(this, 'parse'); // fixes loss of context for 'this' within methods 
packages.hudsonfog.voc.commerce.urbien.BasketballCourt.__super__.initialize.apply(this, arguments); 
} 

}, {properties: _.extend({
  "parkId": {"type": "string"},
  "park": {"type": "resource"},
  "name": {"type": "string"}
}, packages.hudsonfog.voc.commerce.urbien.Building.properties)
,displayName: "Basketball court"
,shortName: "BasketballCourt"
,type: "http://www.hudsonfog.com/voc/commerce/urbien/BasketballCourt"
}); 
Lablz.models.push(packages.hudsonfog.voc.commerce.urbien.BasketballCourt); 

// END /////////////////////////////////////////////////////// PUT MODELS HERE ///////////////////////////////////////////////////// END


Lablz.shortNameToModel = {};
Lablz.initModels = function() {
  for (var i = 0; i < Lablz.models.length; i++) {
    var m = Lablz.models[i];
    Lablz.shortNameToModel[m.shortName] = m;
    m.prototype.parse = m.prototype.constructor.__super__.parse;
  }
};

Lablz.initModels();

Lablz.defaultSync = function(method, model, options) {
  model.lastFetchOrigin = 'server';
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
          model.lastFetchOrigin = 'db';
          options.success(results, 'success', null);
          Lablz.defaultSync(method, model, options);
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
