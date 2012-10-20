Lablz.serverName = 'http://dev.hudsonfog.com/urbien';
Lablz.apiUrl = Lablz.serverName + '/api/v1/';
_.extend(packages, {hudsonfog: {voc: {commerce: {trees: {}}}}}); 
packages.hudsonfog.voc.commerce.trees.Tree = packages.Resource.extend({initialize: function() { 
_.bindAll(this, 'parse'); // fixes loss of context for 'this' within methods 
packages.hudsonfog.voc.commerce.trees.Tree.__super__.initialize.apply(this, arguments); 
} 

}, {properties: _.extend({
  "canceled": {"type": "boolean"},
  "location": {"type": "string"},
  "altitude": {"type": "double"},
  "geoLocation": {"type": "resource"},
  "communityDistrict": {"type": "resource"},
  "address2": {"type": "string"},
  "bigMediumImage": {"type": "resource"},
  "cityScape": {"type": "resource"},
  "dbh": {"type": "int"},
  "city": {"type": "string"},
  "mediumImage": {"type": "image"},
  "longitude": {"type": "double"},
  "contractNumber": {"type": "string"},
  "census": {"type": "boolean"},
  "trunkDiameter": {"type": "float"},
  "neighborhood": {"type": "resource"},
  "treeHeight": {"type": "float"},
  "hilbertValue": {"type": "string"},
  "country": {"type": "resource"},
  "youngTree": {"type": "boolean"},
  "county": {"type": "resource"},
  "latitude": {"type": "double"},
  "workOrder": {"type": "resource"},
  "region": {"type": "string"},
  "datePlanted": {"type": "inlineresource"},
  "seasonPlanted": {"type": "string"},
  "next": {"type": "resource"},
  "bigImage": {"type": "resource"},
  "joinField": {"type": "string"},
  "id": {"type": "int"},
  "distance": {"type": "float"},
  "originalImage": {"type": "resource"},
  "censusBlock": {"type": "resource"},
  "side": {"type": "string"},
  "canopyHeight": {"type": "float"},
  "name": {"type": "string"},
  "smallImage": {"type": "resource"},
  "censusTract": {"type": "resource"},
  "canopyWidth": {"type": "float"},
  "submittedBy": {"type": "resource"},
  "treeId": {"type": "string"},
  "commonName": {"type": "string"},
  "species": {"type": "resource"},
  "previous": {"type": "resource"},
  "park": {"type": "resource"},
  "borough": {"type": "resource"},
  "latinName": {"type": "string"},
  "join2": {"type": "string"},
  "treeAdopt": {"type": "boolean"},
  "ttContract": {"type": "string"},
  "address": {"type": "string"},
  "latLonArea": {"type": "string"}
}, packages.Resource.properties)
,displayName: "Tree"
,shortName: "Tree"
,type: "http://www.hudsonfog.com/voc/commerce/trees/Tree"
}); 
Lablz.models.push(packages.hudsonfog.voc.commerce.trees.Tree); 

