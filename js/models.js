Lablz.serverName = 'http://mark.obval.com/urbien';
Lablz.apiUrl = Lablz.serverName + '/api/v1/';
_.extend(packages, {"hudsonfog": {"voc": {
  "model": {"company": {}},
  "commerce": {
    "urbien": {},
    "trees": {},
    "coupon": {}
  }
}}});
Lablz.sqlUri = 'sql';
packages.hudsonfog.voc.commerce.urbien.Building = packages.Resource.extend({initialize: function() { 
_.bindAll(this, 'parse'); // fixes loss of context for 'this' within methods 
packages.hudsonfog.voc.commerce.urbien.Building.__super__.initialize.apply(this, arguments); 
} 

}, {timestamp: "lastModified"
,properties: _.extend({
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
  "lastModified": {"type": "date"},
  "park": {"type": "resource"},
  "neighborhood": {"type": "resource"},
  "_uri": {"type": "string"},
  "borough": {"type": "resource"},
  "currentPrice": {"type": "Money"},
  "boughtOut": {"type": "boolean"},
  "freeWifi": {"type": "boolean"},
  "wifi": {"type": "boolean"},
  "initialPrice": {"type": "Money"},
  "hasAudio": {"type": "boolean"},
  "address": {"type": "string"},
  "county": {"type": "resource"}
}, packages.Resource.properties)
,displayName: "City Spot"
,shortName: "Building"
,type: "http://www.hudsonfog.com/voc/commerce/urbien/Building"
}); 
Lablz.models.push(packages.hudsonfog.voc.commerce.urbien.Building); 

packages.hudsonfog.voc.commerce.urbien.BasketballCourt = packages.Resource.extend({initialize: function() { 
_.bindAll(this, 'parse'); // fixes loss of context for 'this' within methods 
packages.hudsonfog.voc.commerce.urbien.BasketballCourt.__super__.initialize.apply(this, arguments); 
} 

}, {timestamp: "lastModified"
,properties: _.extend({
  "parkId": {"type": "string"},
  "park": {"type": "resource"},
  "name": {"type": "string"},
  "_uri": {"type": "string"}
}, packages.hudsonfog.voc.commerce.urbien.Building.properties)
,displayName: "Basketball court"
,shortName: "BasketballCourt"
,type: "http://www.hudsonfog.com/voc/commerce/urbien/BasketballCourt"
}); 
Lablz.models.push(packages.hudsonfog.voc.commerce.urbien.BasketballCourt); 

packages.hudsonfog.voc.model.company.PartyRelationship = packages.Resource.extend({initialize: function() { 
_.bindAll(this, 'parse'); // fixes loss of context for 'this' within methods 
packages.hudsonfog.voc.model.company.PartyRelationship.__super__.initialize.apply(this, arguments); 
} 

}, {properties: _.extend({
  "to": {"type": "resource"},
  "fromDate": {"type": "date"},
  "status": {"type": "string"},
  "role": {"type": "string"},
  "_uri": {"type": "string"},
  "from": {"type": "resource"},
  "comment": {"type": "string"}
}, packages.Resource.properties)
,displayName: "Party relationship"
,shortName: "PartyRelationship"
,type: "http://www.hudsonfog.com/voc/model/company/PartyRelationship"
}); 
Lablz.models.push(packages.hudsonfog.voc.model.company.PartyRelationship); 

packages.hudsonfog.voc.model.company.Contact = packages.Resource.extend({initialize: function() { 
_.bindAll(this, 'parse'); // fixes loss of context for 'this' within methods 
packages.hudsonfog.voc.model.company.Contact.__super__.initialize.apply(this, arguments); 
} 

}, {timestamp: "lastModified"
,properties: _.extend({
  "region": {"type": "resource"},
  "location": {"type": "resource"},
  "generalOfficePhone": {"type": "tel"},
  "locale": {"type": "resource"},
  "geoLocation": {"type": "resource"},
  "address1": {"type": "string"},
  "timeZone": {"type": "resource"},
  "featured": {"type": "resource"},
  "address2": {"type": "string"},
  "city": {"type": "string"},
  "organization": {"type": "resource"},
  "postalCode": {"type": "string"},
  "nickName": {"type": "string"},
  "lastNoteTime": {"type": "ComplexDate"},
  "sendAlertsToSender": {"type": "boolean"},
  "gender": {"type": "string"},
  "directWorkPhone": {"type": "tel"},
  "firstName": {"type": "string"},
  "colorScheme": {"type": "resource"},
  "calendar": {"type": "resource"},
  "middleName": {"type": "string"},
  "lastName": {"type": "string"},
  "supportGroup": {"type": "boolean"},
  "fax": {"type": "string"},
  "lastModified": {"type": "date"},
  "image": {"type": "resource"},
  "_uri": {"type": "string"},
  "personalPhone": {"type": "tel"},
  "photo": {"type": "resource"},
  "country": {"type": "resource"},
  "mobilePhone": {"type": "tel"},
  "email": {"type": "email"},
  "numberFormat": {"type": "resource"},
  "prefix": {"type": "string"},
  "changePassword": {"type": "Url"},
  "thumb": {"type": "resource"},
  "user": {"type": "resource"}
}, packages.hudsonfog.voc.model.company.PartyRelationship.properties)
,displayName: "Contact"
,shortName: "Contact"
,type: "http://www.hudsonfog.com/voc/model/company/Contact"
}); 
Lablz.models.push(packages.hudsonfog.voc.model.company.Contact); 

packages.hudsonfog.voc.model.company.ContactBySocial = packages.Resource.extend({initialize: function() { 
_.bindAll(this, 'parse'); // fixes loss of context for 'this' within methods 
packages.hudsonfog.voc.model.company.ContactBySocial.__super__.initialize.apply(this, arguments); 
} 

}, {timestamp: "lastModified"
,properties: _.extend({
  "inviter": {"type": "resource"},
  "lastName": {"type": "string"},
  "currentMojoDuel": {"type": "resource"},
  "mojoPoints": {"type": "float"},
  "totalMojo": {"type": "float"},
  "transactionalNotifications": {"type": "string"},
  "website": {"type": "string"},
  "homeApp": {"type": "resource"},
  "mojoLevel": {"type": "int"},
  "_uri": {"type": "string"},
  "timeZone": {"type": "resource"},
  "cityScape": {"type": "resource"},
  "inviteLink": {"type": "string"},
  "recommendationNotifications": {"type": "string"},
  "organization": {"type": "resource"},
  "email": {"type": "email"},
  "personalNotifications": {"type": "string"},
  "subscriptionNotifications": {"type": "string"},
  "prefix": {"type": "string"},
  "firstName": {"type": "string"},
  "mojoRewardsPoints": {"type": "float"}
}, packages.hudsonfog.voc.model.company.Contact.properties)
,displayName: "Contact by social"
,shortName: "ContactBySocial"
,type: "http://www.hudsonfog.com/voc/model/company/ContactBySocial"
}); 
Lablz.models.push(packages.hudsonfog.voc.model.company.ContactBySocial); 

packages.hudsonfog.voc.commerce.coupon.Person = packages.Resource.extend({initialize: function() { 
_.bindAll(this, 'parse'); // fixes loss of context for 'this' within methods 
packages.hudsonfog.voc.commerce.coupon.Person.__super__.initialize.apply(this, arguments); 
} 

}, {timestamp: "lastModified"
,properties: _.extend({
  "jobRoles": {"type": "string"},
  "lastName": {"type": "string"},
  "vendor": {"type": "resource"},
  "giftsIGaveAmount": {"type": "Money"},
  "notRedeemed": {"type": "Money"},
  "_uri": {"type": "string"},
  "giftsIGotAmount": {"type": "Money"},
  "successfulDepositsAmount": {"type": "Money"},
  "debitedTotal": {"type": "Money"},
  "cityScape": {"type": "resource"},
  "redeemedItemsAmount": {"type": "Money"},
  "messages": {"type": "resource"},
  "balance": {"type": "Money"},
  "successfulPurchasesDealPrice": {"type": "Money"},
  "creditedTotal": {"type": "Money"},
  "email": {"type": "email"},
  "successfulPurchasesAmountSaved": {"type": "Money"},
  "redeemed": {"type": "Money"},
  "firstName": {"type": "string"},
  "rewardsAmount": {"type": "Money"}
}, packages.hudsonfog.voc.model.company.ContactBySocial.properties)
,displayName: "Person"
,shortName: "Person"
,type: "http://www.hudsonfog.com/voc/commerce/coupon/Person"
}); 
Lablz.models.push(packages.hudsonfog.voc.commerce.coupon.Person); 

packages.hudsonfog.voc.commerce.urbien.Urbien = packages.Resource.extend({initialize: function() { 
_.bindAll(this, 'parse'); // fixes loss of context for 'this' within methods 
packages.hudsonfog.voc.commerce.urbien.Urbien.__super__.initialize.apply(this, arguments); 
} 

}, {timestamp: "lastModified"
,properties: _.extend({
  "lastName": {"type": "string"},
  "propertySalesTotal": {"type": "Money"},
  "post": {"type": "string"},
  "importItemsFromEtsy": {"type": "Url"},
  "mojoLevel": {"type": "int"},
  "_uri": {"type": "string"},
  "donationsAmount": {"type": "Money"},
  "auctionBidsMaximumBid": {"type": "Money"},
  "balance": {"type": "Money"},
  "residence": {"type": "resource"},
  "creditedTotal": {"type": "Money"},
  "hasAudio": {"type": "boolean"},
  "etsyShopIds": {"type": "string"},
  "firstName": {"type": "string"},
  "myOffersToBuyOfferAmount": {"type": "Money"}
}, packages.hudsonfog.voc.commerce.coupon.Person.properties)
,displayName: "Urbien"
,shortName: "Urbien"
,type: "http://www.hudsonfog.com/voc/commerce/urbien/Urbien"
}); 
Lablz.models.push(packages.hudsonfog.voc.commerce.urbien.Urbien); 

packages.hudsonfog.voc.commerce.trees.Tree = packages.Resource.extend({initialize: function() { 
_.bindAll(this, 'parse'); // fixes loss of context for 'this' within methods 
packages.hudsonfog.voc.commerce.trees.Tree.__super__.initialize.apply(this, arguments); 
} 

}, {timestamp: "lastModified"
,properties: _.extend({
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
  "mediumImage": {"type": "resource"},
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
  "datePlanted": {"type": "ComplexDate"},
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
  "park": {"type": "resource"},
  "species": {"type": "resource"},
  "previous": {"type": "resource"},
  "lastModified": {"type": "date"},
  "borough": {"type": "resource"},
  "_uri": {"type": "string"},
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

packages.hudsonfog.voc.commerce.urbien.BaseballCourt = packages.Resource.extend({initialize: function() { 
_.bindAll(this, 'parse'); // fixes loss of context for 'this' within methods 
packages.hudsonfog.voc.commerce.urbien.BaseballCourt.__super__.initialize.apply(this, arguments); 
} 

}, {timestamp: "lastModified"
,properties: _.extend({
  "parkId": {"type": "string"},
  "surface": {"type": "string"},
  "park": {"type": "resource"},
  "name": {"type": "string"},
  "_uri": {"type": "string"}
}, packages.hudsonfog.voc.commerce.urbien.Building.properties)
,displayName: "Baseball Field"
,shortName: "BaseballCourt"
,type: "http://www.hudsonfog.com/voc/commerce/urbien/BaseballCourt"
}); 
Lablz.models.push(packages.hudsonfog.voc.commerce.urbien.BaseballCourt); 
