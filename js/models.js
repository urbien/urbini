// START /////////////////////////////////////////////////////// PUT MODELS HERE ///////////////////////////////////////////////////// START

Lablz.serverName = 'http://mark.obval.com/urbien';
Lablz.apiUrl = Lablz.serverName + '/api/v1/';
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

packages.hudsonfog.voc.commerce.urbien.BaseballCourt = packages.hudsonfog.voc.commerce.urbien.Building.extend({initialize: function() { 
_.bindAll(this, 'parse'); // fixes loss of context for 'this' within methods 
packages.hudsonfog.voc.commerce.urbien.BaseballCourt.__super__.initialize.apply(this, arguments); 
} 

}, {properties: _.extend({
  "parkId": {"type": "string"},
  "surface": {"type": "string"},
  "park": {"type": "resource"},
  "name": {"type": "string"}
}, packages.hudsonfog.voc.commerce.urbien.Building.properties)
,displayName: "Baseball Field"
,shortName: "BaseballCourt"
,type: "http://www.hudsonfog.com/voc/commerce/urbien/BaseballCourt"
}); 
Lablz.models.push(packages.hudsonfog.voc.commerce.urbien.BaseballCourt); 

// END /////////////////////////////////////////////////////// PUT MODELS HERE ///////////////////////////////////////////////////// END