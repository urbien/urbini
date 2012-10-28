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
    if (model.myProperties[p].annotations && _.contains(model.myProperties[p].annotations, '@k'))
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
    if (uri.indexOf(Lablz.serverName + "/" + Lablz.sqlUri) == 0)
      return uri;
    
    type = typeof type == 'undefined' ? Utils.getTypeUri(uri) : type;
    return uri.indexOf("http://www.hudsonfog.com") == -1 ? uri : Lablz.serverName + "/" + Lablz.sqlUri + "/" + type.slice(7) + uri.slice(uri.indexOf("?"));
  }
  else if (uri.indexOf('/') == -1) {
    // uri is of form Tree?id=32000
    type = typeof type == 'undefined' ? Utils.getTypeUri(uri) : type;
    return Utils.getLongUri(type + uri.slice(uri.indexOf('?')), type);
  }
  else if (uri.indexOf('sql') == 0) {
    // uri is of form sql/www.hudsonfog.com/voc/commerce/trees/Tree?id=32000
    return Lablz.serverName + "/" + uri;
  }
  else if (uri.charAt(0).toUpperCase() == uri.charAt(0)) {
    // uri is of form Tree/32000
    var typeName = Utils.getType(uri);
    type = typeof type == 'undefined' ? Utils.getTypeUri(typeName) : type;
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
  return Lablz.shortNameToModel[typeName].type;
}

Utils.getType = function(uri) {
  var qIdx = uri.indexOf("?");
  if (qIdx != -1) {
    if (uri.indexOf('http://') == 0)
      return uri.slice(uri.lastIndexOf("/") + 1, qIdx);
    else
      return uri.slice(0, qIdx);
  }
  
  var idx = Utils.getFirstUppercaseCharIdx(uri);
  if (idx == -1)
    return null;
    
  var end = uri.slice(idx).search(/[^a-zA-Z]/);
  return end == -1 ? uri : uri.slice(0, idx + end);
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
  var start = "http://www.";
  var path = type.substring(start.length, type.lastIndexOf("/"));
  path = path.replace(".com", "");
  path = path.replace(/\//g, '.');
  return path;
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

Utils.getDepth = function(arr) {
  for (var i = 0; i < arr.length; i++) {
    var type = Object.prototype.toString.call(arr[i]);
    if (type === '[object Array]')
      depth = Math.max(depth, Utils.getDepth(arr[i]) + 1);
    else
      return depth;
  }
  
  return depth;
}

Utils.getMapItemHTML = function(m) {
  if (m.isA("ImageResource")) {
    var medImg = m.get('mediumImage') || m.get('featured');
    if (medImg) {
      var width = m.get('originalWidth');
      var height = m.get('originalHeight');
      if (width && height) {
        var imgOffset = Math.max(width, height) / 205;
        width = (int)(width / imgOffset);
        height = (int)(height / imgOffset);
      }
      
      medImg = {value: medImg};
      width && medImg.width = width;
      height && medImg.height = height;
      medImg = _.template(tpl.get("imageTemplate"))(medImg);
      return _.template(tpl.get("mapItemTemplate"))({displayName: m.get('davDisplayName'), value: m.get('_uri'), image: medImg})
    }
  }
  else
    return _.template(tpl.get("resourceTemplate"))({displayName: m.get('davDisplayName'), value: m.get('_uri')});
}

Utils.collectionToGeoJSON = function(model) {
  var gj = [];
  _.each(model.models, function(m){
    gj.put(Utils.modelToGeoJSON(m));
  })
  
  return gj;
}

Utils.modelToGeoJSON = function(model) {
  if (model instanceof Backbone.Collection)
    return Utils.collectionToGeoJSON(model);
  
  var isShape = model.isA("Shape");
  var coords, area;
  if (isShape) {
    coords = model.get('shapeJson');
    area = model.get('area');
  }
  else {
    var lon = model.get('longitude');
    if (!lon)
      return null;
    
    coords = [lon, model.get('latitude')];  
  }
  
  var type = getShapeType(coords); 
  var name = model.className + " " + model.davDisplayName;
  var json = {
    "type": "Feature",
    "properties": {
      "name": "name"
    },
    "geometry": {
      "type": type,
      "coordinates": coords
    }
  }
  
  area && json.properties.area = area;
  properties.html = Utils.getMapItemHTML(model);
}