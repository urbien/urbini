define('idbQueryBuilder', ['globals', 'underscore', 'utils', 'indexedDB'], function(G, _, U, IndexedDBModule) {
  var operatorMap = {
      '=': 'eq',
      '==': 'eq',
      '!': 'neq',
      '!=': 'neq',
      '<': 'lt',
      '>': 'gt',
      '>=': 'gteq',
      '<=': 'lteq',
      'IN:': 'oneof'
    },
    IDB;
  
  function getIDB() {
    return IDB || (IDB = IndexedDBModule.getIDB(G.serverName));
  }
  
  function buildOrQuery(orClause, vocModel, indexNames) {
    orClause = orClause.split('||');
    indexNames = indexNames || U.getIndexNames(vocModel);
    
    var query;
    for (var i = 0; i < orClause.length; i++) {
      var part = orClause[i],
          pair = _.map(part.split('='), _.decode);
      
      if (pair.length != 2)
        return null;
      
      var name = pair[0], 
          val = pair[1], 
          subQuery;
      
      if (name === '$or') { // TODO: parse $and inside $or
        subQuery = buildOrQuery(val, vocModel, indexNames);
      }
      else if (name === '$and') {
        subQuery = buildSubQuery(name, val, vocModel, indexNames);
      }
      else if (name.startsWith('$')){
        debugger; // not supported yet...but what haven't we supported?
      }
      else {
        if (!_.contains(indexNames, name))
          return null;
          
        subQuery = buildSubQuery(name, val, vocModel, indexNames);
      }
      
      if (!subQuery)
        return null;
      
      query = query ? query.or(subQuery) : subQuery;
    }
    
    return query;
  }
    
  /**
   * @param val value or a combination of operator and value, e.g. ">=7"
   */
  function buildSubQuery(name, val, vocModel, indexNames) {
    if (!_.contains(indexNames, name))
      return null;
    
    var clause = parseAPIClause(name, val),
        Index = getIDB().queryByIndex;
    
    if (!clause)
      return null;
    
    switch (name) {
    case '$or':
    case '$and':
      var query, qOp = name.slice(1);
      var apiQuery = U.parseAPIQuery(val, U.whereParams[name]);
      if (!apiQuery)
        return null;
      
      _.each(apiQuery, function(param) {
        var subq = buildSubQuery(param.name, param.value, vocModel, indexNames);
        query = query ? query[qOp](subq) : subq;
      });
      
      return query;
    case '$in':
      var commaIdx = val.indexOf(',');
      name = val.slice(0, commaIdx);
      if (!_.contains(indexNames, name))
        return null;
        
      val = val.slice(commaIdx + 1).split(',');
      return Index(name).oneof.apply(null, val);
    case '$like':
      var commaIdx = val.indexOf(',');
      name = val.slice(0, commaIdx);
      if (!_.contains(indexNames, name))
        return null;
      
      val = val.slice(commaIdx + 1);
      return Index(name).betweeq(val, val + '\uffff');
    }
    
    
    var op = operatorMap[clause.op];      
    var props = vocModel.properties;
    val = clause.value;
    var prop = props[name];
    if (prop && U.isResourceProp(prop) && val === '_me') {
      if (G.currentUser.guest) {
        Events.trigger('req-login');
        return null;
      }
      else
        val = G.currentUser._uri;
    }

    val = U.getTypedValue(vocModel, name, val);
    return Index(name)[op](val); // Index(name)[op].apply(this, op === 'oneof' ? val.split(',') : [val]);
  }
  
  function buildQuery(data, filter) {
    if (U.isModel(data))
      return false;
    
    var Index = getIDB().queryByIndex,
        query, 
        orderBy, 
        asc, 
        defaultOp = 'eq',
        collection = data,
        vocModel = collection.vocModel,
        meta = vocModel.properties,
        params = collection.params,
        filter = filter || U.getQueryParams(collection),
        orClause = params && params.$or,
        indexNames = U.getIndexNames(vocModel);
    
    if (params) {
      orderBy = params.$orderBy;
      asc = !_.has(params, '$asc') || U.isTrue(params.$asc);
    }
    
    if (orderBy) {
      var prop = meta[orderBy];
      orderBy = prop && [prop];
    }
    else {
      var ordered = U.getPropertiesWith(meta, "sortAscending");
      if (_.size(ordered)) {
        orderBy = _.values(ordered);
//          for (var p in ordered) {
//            orderBy.push(ordered[p]);
//          }
      }
    }
    
    if (!orderBy && _.isEmpty(filter) && !orClause)
      return false;

    var neededIndices = _.filter(_.union(_.keys(filter), _.pluck(orderBy, 'shortName')), function(p) {return /^[a-zA-Z]+/.test(p)});
    if (!_.all(neededIndices, _.contains.bind(_, indexNames)))
      return false;

    if (orClause) {
      orClause = buildOrQuery(orClause, vocModel, indexNames);
      if (!orClause)
        return false; // couldn't parse it
      else {
        query = orClause;
        delete filter.$or;
      }
    }
    
    var positionProps = U.getPositionProps(vocModel);
    var latLonQuery, lat, lon, latProp, lonProp;
    if (_.size(positionProps) && _.size(_.pick(filter, _.values(positionProps)))) {
      var radius = positionProps.radius && filter[positionProps.radius];
      radius = isNaN(radius) ? G.defaults.radius : parseFloat(radius); // km
        
      latProp = positionProps.latitude, 
      lonProp = positionProps.longitude;
      lat = filter[latProp];
      lon = filter[lonProp];
      
      if (/^-?\d+/.test(lat)) {
        var latRadius = radius / 110; // 1 deg latitude is roughly 110 km 
        lat = parseFloat(lat);
        latLonQuery = Index(latProp).betweeq(lat - latRadius, lat + latRadius);
      }
      if (/^-?\d+/.test(lon)) {
        var lonRadius = radius / 85; // 1 deg longitude is roughly 85km at latitude 40 deg, otherwise this is very inaccurate  
        lon = parseFloat(lon);          
        latLonQuery = Index(lonProp).betweeq(lon - lonRadius, lon + lonRadius);
      }
      
      delete filter[latProp]; 
      delete filter[lonProp];
    }
    
    for (var name in filter) {
//        var name = modelParams[i];
      var subQuery = buildSubQuery(name, filter[name], vocModel, indexNames);
      if (!subQuery)
        return false;
//        subQuery.setPrimaryKey('_uri');
      query = query ? query.and(subQuery) : subQuery;
    }
    
    if (latLonQuery)
      query = query ? query.and(latLonQuery) : latLonQuery;
    
    if (orderBy && orderBy.length) {
      if (query) {  
        var distanceProp = positionProps.distance;
        for (var i = 0; i < orderBy.length; i++) {
          var oProp = orderBy[i].shortName;
          if (oProp === distanceProp) {
            query.sort(function(a, b) {
//                debugger;
              // hackity hack - setting distance in sort function
              var ad = a[distanceProp] = U.distance([a[latProp], a[lonProp]], [lat, lon]);
              var bd = b[distanceProp] = U.distance([b[latProp], b[lonProp]], [lat, lon]);
              return ad - bd;
            });
          }
          else {
            query = query.sort(oProp, !asc);
          }
        }
      }
      else
        query = Index(orderBy[0].shortName).all().setDirection(asc ? IDBCursor.NEXT : IDBCursor.PREV);
      
//        }
//        else
//          query = query ? query.sort(orderBy, !asc) : Index(orderBy, asc ? IDBCursor.NEXT : IDBCursor.PREV).all();
    }
    
    if (!query)
      return false;
    
    if (!_.isUndefined(params.$offset)) {
      query.setOffset(parseInt(params.$offset));
    }
    
    if (!_.isUndefined(params.$limit)) {
      query.setLimit(parseInt(params.$limit));
    }
    
    return query;
  }

  function parseAPIClause(clause, vocModel) {
    var name, opVal, op, val, numArgs = arguments.length;
    switch (numArgs) {
    case 1:
      clause = clause.split('=');
      name = decodeURIComponent(clause[0]);
      opVal = decodeURIComponent(clause[1]);
      break;
    case 2:
      name = clause;
      opVal = arguments[1];
      break;
    case 3:
      name = arguments[0];
      op = arguments[1];
      val = arguments[2];
      break;
    }
      
    if (numArgs != 3) {
      if (opVal) {
        opVal = opVal.match(/^([>=<!]{0,2})(.+)$/);
        if (!opVal || opVal.length != 3)
          return null;
        
        op = opVal[1] || U.DEFAULT_WHERE_OPERATOR;
        val = opVal[2];
      }
      else {
        op = U.DEFAULT_WHERE_OPERATOR;
        val = '';
      }
    }
    
    if (op === '!')
      op = '!=';
    else if (op === '=')
      op = '==';
      
    if (name.startsWith('$')) {
//      var whereParam = U.filterObj(U.whereParams, function(param, delimiter) {
//        return name.startsWith(param);
//      });
//      
//      if (_.size(whereParam)) {
//        whereParam = _.getFirstProperty(whereParam);
//        var subClause = val.split('=');
//        if (subClause.length == 2 && subClause[0] === whereParam) {
//          debugger;
//          subClause = U.parseAPIQuery(subClause[1], U.whereParams[whereParam]);
//          var sVal = {};
//          sVal[whereParam] = subClause;
//          val = sVal;
//        }
//      }
//      else 
      if (name.startsWith('$this.')) {
        debugger;
        name = name.slice(6);
      }
    }
      
    return {
      name: name, 
      op: op || U.DEFAULT_WHERE_OPERATOR, 
      value: val
    };
  }

  return {
    buildQuery: buildQuery    
  };
});
