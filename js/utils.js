var Lablz = {};
Lablz.serverName = "http://mark.obval.com/urbien";
Lablz.apiUrl = Lablz.serverName + "/api/v1/";

var Utils = {};
Utils.getFirstUppercaseCharIdx = function(str) {
	for (var i = 0; i < str.length; i++) {
		var c = str.charAt(i);
		if (c.search(/^[a-z]+$/i) == 0 && c == c.toUpperCase())
			return i;
	}
	
	return -1;
}

Utils.getClassName = function(type) {
  var sIdx = type.lastIndexOf("/");
  return sIdx == -1 ? type : type.slice(sIdx + 1);
}

Utils.getShortUri = function(uri) {
  var regex = /http\:\/\/www\.hudsonfog\.com\/[a-zA-Z\/]*\/([a-zA-Z]*)\?id=([0-9]*)/;
  var nameAndId = uri.match(regex);
  return nameAndId && nameAndId.length == 3 ? nameAndId[1] + '/' + nameAndId[2] : uri;
}

Utils.getPackagePath = function(type) {
  var start = "http://www.";
  var path = type.substring(start.length, type.lastIndexOf("/"));
  path = path.replace(".com", "");
  path = path.replace(/\//g, '.');
  return path;
}


//tpl = { 
//    // Hash of preloaded templates for the app
//    templates: {},
// 
//    // Recursively pre-load all the templates for the app.
//    // This implementation should be changed in a production environment:
//    // All the template files should be concatenated in a single file.
//    loadTemplates: function(names, callback) {
// 
//        var that = this;
// 
//        var loadTemplate = function(index) {
//            var name = names[index];
//            console.log('Loading template: ' + name);
//            $.get(Lablz.serverName + '/tpls/' + name + '.html', function(data) {
//                that.templates[name] = data;
//                index++;
//                if (index < names.length) {
//                    loadTemplate(index);
//                } else {
//                    callback();
//                }
//            });
//        }
// 
//        loadTemplate(0);
//    },
// 
//    // Get template by name from hash of preloaded templates
//    get: function(name) {
//        return this.templates[name];
//    }
// 
//};