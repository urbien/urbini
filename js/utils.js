var Utils = {};
Utils.getFirstUppercaseCharIdx = function(str) {
	for (var i = 0; i < str.length; i++) {
		var c = str.charAt(i);
		if (c.search(/^[a-z]+$/i) == 0 && c == c.toUpperCase())
			return i;
	}
	
	return -1;
}

Utils.getPrimaryKeys = function(model) {
  var keys = [];
  for (var p in model.myProperties) {
    if (_.has(model.myProperties[p], 'primary'))
      keys.push(p);
  }
  
  return keys;
//  return _.filter(model.properties, 
//      function(prop) {
//        prop.annotations && _.contains(prop.annotations, '@k');
//      });
}

Utils.getLongUri = function(uri, type, primaryKeys) {
  if (uri.indexOf('http') == 0) {
    // uri is either already of the right form: http://urbien.com/sql/www.hudsonfog.com/voc/commerce/trees/Tree?id=32000 or of form http://www.hudsonfog.com/voc/commerce/trees/Tree?id=32000
    if (uri.indexOf('?') == -1) // type uri
      return uri;
    
    if (uri.indexOf(Lablz.serverName + "/" + Lablz.sqlUri) == 0)
      return uri;
    
    type = typeof type == 'undefined' ? Utils.getTypeUri(uri) : type;
    return uri.indexOf("http://www.hudsonfog.com") == -1 ? uri : Lablz.serverName + "/" + Lablz.sqlUri + "/" + type.slice(7) + uri.slice(uri.indexOf("?"));
  }
  else if (uri.indexOf('/') == -1) {
    // uri is of form Tree?id=32000
    type = typeof type == 'undefined' ? Utils.getTypeUri(uri) : type;
    if (!type)
      return null;
    
    return Utils.getLongUri(type + uri.slice(uri.indexOf('?')), type);
  }
  else if (uri.indexOf('sql') == 0) {
    // uri is of form sql/www.hudsonfog.com/voc/commerce/trees/Tree?id=32000
    return Lablz.serverName + "/" + uri;
  }
  else if (uri.charAt(0).toUpperCase() == uri.charAt(0)) {
    // uri is of form Tree/32000
    var typeName = Utils.getType(uri);
    type = Utils.getTypeUri(typeName);
    if (!type)
      return null;
    
    var sIdx = uri.indexOf("/");
    var longUri = uri.slice(0, sIdx) + "?";
    var model = Lablz.shortNameToModel[typeName];
    if (!model)
      return uri;
    
    var primaryKeys = Utils.getPrimaryKeys(model);
    if (!primaryKeys  ||  primaryKeys.length == 0)
      longUri += "id=" + encodeURIComponent(uri.slice(sIdx + 1));
    else {
      var vals = uri.slice(sIdx + 1).split('/');
      if (vals.length != primaryKeys.length)
        throw new Error('bad uri "' + uri + '" for type "' + type + '"');
      
      for (var i = 0; i < primaryKeys.length; i++) {
        longUri += primaryKeys[i] + "=" + vals[i]; // shortUri primary keys are already encoded
      }      
    }
    
    return Utils.getLongUri(longUri, type);
  }
  else 
    return uri;
}

Utils.validateEmail = function(email) { 
  return /^([^\x00-\x20\x22\x28\x29\x2c\x2e\x3a-\x3c\x3e\x40\x5b-\x5d\x7f-\xff]+|\x22([^\x0d\x22\x5c\x80-\xff]|\x5c[\x00-\x7f])*\x22)(\x2e([^\x00-\x20\x22\x28\x29\x2c\x2e\x3a-\x3c\x3e\x40\x5b-\x5d\x7f-\xff]+|\x22([^\x0d\x22\x5c\x80-\xff]|\x5c[\x00-\x7f])*\x22))*\x40([^\x00-\x20\x22\x28\x29\x2c\x2e\x3a-\x3c\x3e\x40\x5b-\x5d\x7f-\xff]+|\x5b([^\x0d\x5b-\x5d\x80-\xff]|\x5c[\x00-\x7f])*\x5d)(\x2e([^\x00-\x20\x22\x28\x29\x2c\x2e\x3a-\x3c\x3e\x40\x5b-\x5d\x7f-\xff]+|\x5b([^\x0d\x5b-\x5d\x80-\xff]|\x5c[\x00-\x7f])*\x5d))*$/.test( email );
} 

Utils.getTypeUri = function(typeName) {
  return Lablz.shortNameToModel[typeName] && Lablz.shortNameToModel[typeName].type;
}

Utils.getType = function(uri) {
  var qIdx = uri.indexOf("?");
  if (qIdx != -1) {
    if (uri.indexOf('http://') == 0)
      return uri.slice(uri.lastIndexOf("/", qIdx) + 1, qIdx);
    else
      return uri.slice(0, qIdx);
  }
  
  var idx = Utils.getFirstUppercaseCharIdx(uri);
  if (idx == -1)
    return null;
    
  var end = uri.slice(idx).search(/[^a-zA-Z]/);
  return end == -1 ? uri.slice(idx) : uri.slice(idx, idx + end);
}

Utils.getClassName = function(type) {
  var sIdx = type.lastIndexOf("/");
  return sIdx == -1 ? type : type.slice(sIdx + 1);
}

Utils.getShortUri = function(uri, model) {
  if (model.properties._shortUri == 'unsupported')
    return uri;
    
  var regex = /www\.hudsonfog\.com\/[a-zA-Z\/]*\/([a-zA-Z]*)\?id=([0-9]*)/;
  var nameAndId = uri.match(regex);
  return nameAndId && nameAndId.length == 3 ? nameAndId[1] + '/' + nameAndId[2] : uri;
}

Utils.isA = function(model, interfaceName) {
  return _.contains(model.interfaces, interfaceName);
}

Utils.getPackagePath = function(type) {
  if (type == 'Resource' || type.endsWith('#Resource'))
    return 'packages';
  
  var start = "http://www.";
  var path = type.substring(start.length, type.lastIndexOf("/"));
  path = path.replace(".com", "");
  path = path.replace(/\//g, '.');
  return 'packages.' + path;
}

Utils.addPackage = function(path) {
  path = path.split(/\./);
  var current = packages;
  path = path[0] == 'packages' ? path.slice(1) : path;
  for (var i = 0; i < path.length; i++) {
    if (!_.has(current, path[i])) {
      var pkg = {};
      current[path[i]] = pkg;
      current = pkg;
    }
    else
      current = current[path[i]];
  }
  
  return current;
}

Utils.getShapeType = function(rings) {
  var depth = Utils.getDepth(rings);
  switch (depth) {
  case 1:
    return "Point";
  case 2:
    return null;
  case 3:
    return "Polygon";
  case 4:
    return "MultiPolygon";
  default:
    return null;
  }
}

Utils.getObjectType = function(o) {
  return Object.prototype.toString.call(o);
}

Utils.getDepth = function(arr) {
  var depth = 1;
  for (var i = 0; i < arr.length; i++) {
    var type = Utils.getObjectType(arr[i]);
    if (type === '[object Array]')
      depth = Math.max(depth, Utils.getDepth(arr[i]) + 1);
    else
      return depth;
  }
  
  return depth;
}

/**
 * @return {name: propName, value: propValue}
 */
Utils.makeProp = function(prop, val) {
  var cc = prop.colorCoding;
  if (cc) {
    cc = Utils.getColorCoding(cc, val);
    if (cc) {
      if (cc.startsWith("icons"))
        val = "<img src=\"" + cc + "\" border=0>&#160;" + val;
      else
        val = "<span style='color:" + cc + "'>" + val + "</span>";
    }
  }
  
  var propTemplate = Lablz.Templates.getPropTemplate(prop);
  val = val.displayName ? val : {value: val};
  return {name: prop.label || prop.displayName, value: _.template(Lablz.Templates.get(propTemplate))(val)};
}

Utils.getColorCoding = function(cc, val) {
//  getting the color for value. Sample colorCoding annotation: @colorCoding("0-2000 #FF0054; 2000-6000 #c8fd6a; 6001-1000000 #00cc64")
  var v = parseFloat(val);
  cc = cc.split(';');
  for (var i = 0; i < cc.length; i++) {
    var r2c = cc[i].trim();
    r2c = r2c.split(/[ ]/);
    var r = r2c[0].split(/[-]/);
    r[1] = parseFloat(r[1]);
    if (v > r[1])
      continue;
    
    if (v > parseFloat(r[0]))
      return r2c[1];
  }
  
  return null;
}

Utils.getGridCols = function(model) {
  var m = model;
  var mConstructor = m.constructor;
  var cols = mConstructor.gridCols;
  cols = cols && cols.split(',');
  var resourceLink;
  var rows = {};
  if (cols) {
    _.each(cols, function (col) {
      col = col.trim();
      var prop = mConstructor.properties[col];
      var val = m.get(col);
      if (!val)
        return;
      
      var nameVal = Utils.makeProp(prop, val);
      rows[nameVal.name] = nameVal.value;
      if (prop.resourceLink)
        rows[nameVal.name].resourceLink = true;
//        resourceLink = nameVal.value;
//      else
    });
  }  
  
  return rows;
}

Utils.getMapItemHTML = function(model) {
  var tpl = Lablz.Templates;
  var m = model;
  var grid = Utils.getGridCols(m);

  var resourceLink = _.filter(grid, function(item) {item.resourceLink}) || m.get('davDisplayName');
  var data = {resourceLink: resourceLink, uri: m.get('_uri'), rows: grid};
  
  if (m.isA("ImageResource")) {
    var medImg = m.get('mediumImage') || m.get('featured');
    if (medImg) {
      var width = m.get('originalWidth');
      var height = m.get('originalHeight');
      if (width && height) {
        var imgOffset = Math.max(width, height) / 205;
        width = Math.round(width / imgOffset);
        height = Math.round(height / imgOffset);
      }
      
      medImg = {value: decodeURIComponent(medImg)};
      width && (medImg.width = width);
      height && (medImg.height = height);
      data.image = _.template(tpl.get("imagePT"))(medImg);
      return _.template(tpl.get("mapItemTemplate"))(data);
    }
  }
  
  return _.template(tpl.get("mapItemTemplate"))(data);
}

Utils.collectionToGeoJSON = function(model, metadata) {
  var gj = [];
  _.each(model.models, function(m){
    var mGJ = Utils.modelToGeoJSON(m, metadata);
    if (mGJ)
      gj.push(mGJ);
  })
  
  return gj;
}

Utils.modelToGeoJSON = function(model, metadata) {
  if (model instanceof Backbone.Collection)
    return Utils.collectionToGeoJSON(model);
  
  var isShape = model.isA("Shape");
  var coords, area;
  if (isShape) {
    coords = model.get('shapeJson');
    if (!coords)
      return null;
    
    area = model.get('area');
  }
  else {
    var lon = model.get('longitude');
    if (!lon)
      return null;
    
    coords = [lon, model.get('latitude')];  
  }
  
    
  var type = Utils.getShapeType(coords);
  if (metadata) {
    var bbox;
    if (isShape)
      bbox = [[model.get('lowestLatitude'), model.get('lowestLongitude')], [model.get('highestLatitude'), model.get('highestLongitude')]];
    else
      bbox = [[coords[1], coords[0]], [coords[1], coords[0]]];
    
    if (metadata.bbox) {
      var b = metadata.bbox;
      b[0][0] = Math.min(b[0][0], bbox[0][0]);
      b[0][1] = Math.min(b[0][1], bbox[0][1]);
      b[1][0] = Math.max(b[1][0], bbox[1][0]);
      b[1][1] = Math.max(b[1][1], bbox[1][1]);
    }
    else
      metadata.bbox = bbox; 
  }
  
  var json = Utils.getBasicGeoJSON(type, coords);
  json.properties.name = model.constructor.displayName + " " + model.get('davDisplayName');
  if (area)
    json.properties.area = area;
  
  json.properties.html = Utils.getMapItemHTML(model);
  return json;
}

Utils.getCenterLatLon = function(bbox) {
  return [(bbox[1][0] + bbox[0][0]) / 2, (bbox[1][1] + bbox[0][1]) / 2];
}

/**
 * to be used for model constructors, not instances
 */

Utils.defaultModelProps = ['__super__', 'prototype', 'extend'];
Utils.toJSON = function(obj) {
  var staticProps = {};
  for (var prop in obj) {
    if (typeof obj[prop] != 'function' && _.has(obj, prop) && !_.contains(Utils.defaultModelProps, prop)) {
      var o = obj[prop];
      staticProps[prop] = typeof o == 'object' ? Utils.toJSON(o) : o;
    }
  }
  
  return staticProps;
};

Utils.wrap = function(object, method, wrapper) {
  var fn = object[method];
    return object[method] = function() {
    return wrapper.apply(this, [ fn.bind(this) ].concat(
    Array.prototype.slice.call(arguments)));
  };
};

/**
 * Array that stores only unique elements
 */
Utils.UArray = function() {};
Utils.UArray.prototype.length = 0;
(function() {
  var methods = ['push', 'pop', 'shift', 'unshift', 'slice', 'splice', 'join', 'concat', 'clone'];
  for (var i = 0; i < methods.length; i++) { 
    (function(name) {
      Utils.UArray.prototype[name] = function() {
        return Array.prototype[name].apply(this, arguments);
      };
    })(methods[i]);
  }
})();

Utils.wrap(Utils.UArray, 'concat',
  function(original, item) {
    var type = Object.prototype.toString.call(item);
    if (type.indexOf('Array') == -1)
      this.push(item);
    else {
      var self = this;
      _.each(item, function(i) {self.push(i);});
    }
  }
);

Utils.union = function(o1, o2) {
  var type1 = Utils.getObjectType(o1);
  var type2 = Utils.getObjectType(o2);
    
  var c = type1.indexOf('Array') == -1 && !(o1 instanceof Utils.UArray) ? [c] : o1.slice();    
  if (type2.indexOf('Array') == -1 && !(o2 instanceof Utils.UArray))
    return c.push(o2);
  
  var self = this;
  _.each(o2, function(i) {c.push(i);});
  return c;
}

Utils.wrap(Utils.UArray, 'push',
  function(original, item) {
    if (_.contains(this, item))
      return this;
    else
      return original(item);
  }
);

Array.prototype.remove = function(from, to) {
  var rest = this.slice((to || from) + 1 || this.length);
  this.length = from < 0 ? this.length + from : from;
  return this.push.apply(this, rest);
};

Utils.endsWith = function(string, pattern) {
  var d = string.length - pattern.length;
  return d >= 0 && string.indexOf(pattern, d) === d;
};

Utils.toQueryString = function(queryMap) {
  var qStr = '';
  _.forEach(queryMap, function(val, key) { // yes, it's backwards, not function(key, val), underscore does it like this for some reason
    qStr += key + '=' + encodeURIComponent(val) + '&';
  });
  
  return qStr.slice(0, qStr.length - 1);
};

Utils.getQueryParams = function() {
  return Utils.getParamMap(window.location.href);
};

Utils.getHashParams = function() {
  var h = window.location.hash;
  if (!h) 
    return {};
  
  var chopIdx = h.indexOf('?');
  chopIdx = chopIdx == -1 ? 1 : chopIdx + 1;
    
  return h ? Utils.getParamMap(h.slice(chopIdx)) : {};
};

Utils.getParamMap = function(str, delimiter) {
  var map = {};
  _.each(str.split(delimiter || "&"), function(nv) {
    nv = nv.split("=");
    map[nv[0]] = decodeURIComponent(nv[1]);
  });
  
  return map;
};

Utils.getBasicGeoJSON = function(shapeType, coords) {
  return {
    "type": "Feature",
    "properties": {
    },
    "geometry": {
      "type": shapeType,
      "coordinates": coords
    }
  };
};
Utils.getPropertiesWith = function(list, annotation) {
  return _.filter(list, function(item) {
      return item[annotation] ? item : null;
    });
},

/// String prototype extensions

String.prototype.trim = function(){
  return (this.replace(/^[\s\xA0]+/, "").replace(/[\s\xA0]+$/, ""))
}

String.prototype.startsWith = function(str) {
  return (this.match("^"+str)==str)
}

String.prototype.endsWith = function(str) {
  return (this.match(str+"$")==str)
}

Utils.getFormattedDate = function(time) {
  var date = new Date(parseFloat(time));
  //(time || "").replace(/-/g,"/").replace(/[TZ]/g," "));
  var diff = (((new Date()).getTime() - date.getTime()) / 1000);
  var day_diff = Math.floor(diff / 86400);
      
  if (isNaN(day_diff) || day_diff < 0 || day_diff >= 31)
    return;
      
  return day_diff == 0 && (
    diff < 60 && "just now" ||
    diff < 120 && "a minute ago" ||
    diff < 3600 && Math.floor( diff / 60 ) + " minutes ago" ||
    diff < 7200 && "an hour ago" ||
    diff < 86400 && Math.floor( diff / 3600 ) + " hours ago") ||
    day_diff == 1 && "Yesterday" ||
    day_diff < 7 && day_diff + " days ago" ||
    day_diff < 31 && Math.ceil( day_diff / 7 ) + " weeks ago";
}

Utils.isPropVisible = function(res, prop) {
  if (prop.avoidDisplaying)
    return false;
  
  var userRole = Lablz.currentUser ? Lablz.currentUser.role || 'contact' : 'guest';
  if (userRole == 'admin')
    return true;
  
  var ar = prop.allowRoles;
  if (ar) {
    if (userRole == 'guest')
      return false;
    
    var roles = ar.split(",");
    for (var i = 0; i < roles.length; i++) {
      var r = roles[i].trim();
      if (r == 'admin')
        return false;
      else if (r == 'siteOwner')
        return userRole == 'siteOwner';
      else {
        // TODO: implement this
        
        return false;
      }
    }
  }
  
  return true;
}