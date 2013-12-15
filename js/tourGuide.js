define('tourGuide', ['globals', 'underscore', 'utils', 'events', 'vocManager', 'collections/ResourceList', 'cache'], function(G, _, U, Events, Voc, ResourceList, C) {
  ////// BACKBONE HACKERY to intercept all url loads so we can see the person's status regarding the tour (on tour, abandoned, lost, dead, undead) /////////
  var SEQ_PROP = 'number',
      TOUR_PARAM = '$tour',
      TOUR_STEP_PARAM = '$tourStep',
      TOUR_MODEL,
      STEP_MODEL,
      MY_TOUR_MODEL,
//      backboneLoadUrl = Backbone.history.loadUrl,
      RESOLVED_PROMISE = G.getResolvedPromise(),
      REJECTED_PROMISE = G.getRejectedPromise(),
      currentView,
      tourManager;

  Events.on('pageChange', function(from, to) {
    currentView = to;
    tourManager.getTour();
  });
  
  function log() {
    var args = _.toArray(arguments);
    args.unshift("tourGuide", "tour");
    G.log.apply(G, args);
  }

  function adjustFragmentForTour(fragment) {
    var tour = tourManager.getCurrentTour(),
        step = tourManager.getCurrentStep(),
        steps = tourManager.getCurrentSteps(),
        next = getStepByNumber(steps, step.get(SEQ_PROP) + 1),
        hashInfo = U.getUrlInfo(fragment);
    
    if (next) {
      if (hashInfoCompliesWithTourStep(hashInfo, next)) {
        var params = _.clone(hashInfo.params);
        params[TOUR_PARAM] = getTourId(tour);
        params[TOUR_STEP_PARAM] = next.get('number');
        fragment = U.makeMobileUrl(hashInfo.action, hashInfo.uri, params);
      }
      else if (hashInfoCompliesWithTourStep(hashInfo, step)) {
        // going back a step, that's fine, not everyone's a genius
      }
      else {
        var params = _.getParamMap(step.get('urlQuery')) || {};
        params[TOUR_PARAM] = getTourId(tour);
        params[TOUR_STEP_PARAM] = step.get('number');
        var prev = U.makePageUrl(step.get('route'), step.get('typeUri') || '', params);
        Events.once('pageChange', function() {
          Events.trigger('messageBar', 'info', {
            messages: [{
              message: "You've abandoned your tour! Click here if you wish to get back on it.", 
              link: prev,
              icon: 'warning-sign'
            }], 
            persist: true
          });
        });
//        U.alert({
//          msg: "Nuh uh! Please either follow the tour or cancel it."
//        });
        log('info', 'abandoned tour?');
//        return fragment;
      }
    }
    else
      Events.trigger('tourEnd');
    
    return fragment;
  }

  function getAllTypes(vocModel) {
    vocModel = typeof vocModel == 'string' ? U.getModel(vocModel) : vocModel;
    if (!vocModel)
      return false;
    
    return U.getTypes(vocModel).concat(vocModel.interfaces || [])
  }
  
  function isSubType(type1, type2) {
    return _.contains(getAllTypes(type1), type2);
  }
  
  function hashInfoCompliesWithTourStep(hashInfo, step) {
    var isModelParam = _.negate(U.isMetaParameter),
        hashInfoModelParams = U.filterObj(hashInfo.params, isModelParam),
        stepParams = _.getParamMap(step.get('urlQuery')),
        stepModelParams = U.filterObj(stepParams, isModelParam),
        stepType = step.get('typeUri'),
        stepRoute = step.get('route'),
        ///////////////////////////
        routeMatches = hashInfo.route == stepRoute,
        isProfile = stepType == 'profile' && (hashInfo.uri == 'profile' || hashInfo.uri == G.currentUser._uri),
        typeMatches = isProfile || hashInfo.type == stepType || isSubType(hashInfo.type, stepType),
        paramsMatch = true;
        
    for (var param in hashInfoModelParams) {
      if (_.has(stepModelParams, param) && stepModelParams[param] !== hashInfoModelParams[param]) {
        paramsMatch = false;
        break;
      }
    }
    
    return routeMatches && typeMatches && paramsMatch;
  }
  

  
  ///////////// END BACKBONE HACKERY ///////////////
  
  
  function TourManager() {
        // CURRENT STATE
    var _tour, 
        _steps,
        _step,
        _myTours,
        currentSearches = [],
        
        // INITIALIZATION
        _initPromise,
        _initialized;

    function init() {
      _initPromise = window._tourPromise = Voc.getModels(['commerce/urbien/Tour', 'commerce/urbien/TourStep', 'commerce/urbien/MyTour']).then(function(t, s, m) {
        TOUR_MODEL = t;
        STEP_MODEL = s;
        MY_TOUR_MODEL = m;
        var dfd = $.Deferred();
        getMyTours().always(function showMustGoOn(myTours) {
          _myTours = myTours;
          _initialized = true;
          dfd.resolve();
        });
        
        return dfd.promise();
      });
    }
    
    Events.on('tourStart', function(tourStarted, tourSteps) {
      if (_tour)
        Events.trigger('tourEnd', _tour);
      
      _tour = tourStarted;
      _steps = tourSteps;
    });

    Events.on('tourCanceled', function(tour) {
      if (tour === _tour)
        reset();      
    });

    Events.on('tourEnd', function(tour) {
      if (tour === _tour)
        reset();      
    });

    Events.on('tourStep', function(step) {
      _step = step;
      if (!G.currentUser.guest && _step.get('number') >= _steps.length) {
        new MY_TOUR_MODEL().save({
          status: 'completed',
          user: G.currentUser._uri,
          tour: _tour.getUri()
        }, {redirect: false});
        
        Events.trigger('tourEnd', _tour);
      }
      
    });

    function reset() {
      _tour = _steps = _step = null;
    }
    
    function getTour() {
      if (!_initialized) {
        var args = arguments;
        return _initPromise.then(getTour);
      }
    
      Events.once('pageChange', function() {
        _.each(currentSearches, function(op) {
          if (!op.done())
            op.cancel();
        });
        
        currentSearches = [];
      });
      
      var searchOp = SearchOperation({
        tour: _tour, 
        steps: _steps, 
        step: _step
      });
      
      currentSearches.push(searchOp);
      searchOp.run();
    }
    
    init();
    return {
      init: function(view) {
        currentView = view;
        getTour();
      },
      getTour: getTour,
      getCurrentTour: function() {
        return _tour;
      },
      getCurrentSteps: function() {
        return _steps;
      },
      getCurrentStep: function() {
        return _step;
      },
      getMyTours: function() {
        return _myTours;
      }
    };
  }

  function getMyTours(tours) {
    if (G.currentUser.guest)
      return REJECTED_PROMISE;
    
    var params = {
      user: G.currentUser._uri,
      $select: 'tour,status'
    };
    
    if (tours)
      params.$in = 'tour,' + _.map(tours, function(t) { return t.getUri(); }).join(',');
    
    return $.Deferred(function(defer) {
      var myTours = C.getResourceList(MY_TOUR_MODEL, $.param(params));
      
      if (!myTours) {
        myTours = new ResourceList(null, {
          model: MY_TOUR_MODEL,
          params: params
        });
        
        Events.trigger('cacheList', myTours);
      }
      
      myTours.fetch({
        success: function() {
          if (!myTours.isFetching())
            defer.resolve(myTours)
        },
        error: defer.reject,
        ajaxQueue: 'tours'
      });
    }).promise();
  }
  
  function SearchOperation(current) {
    current = current || {};
    var _canceled, 
        _done,
        _tour = current.tour,
        _steps = current.steps,
        _step = current.step,
        _app = G.currentApp._uri,
        _user = G.currentUser._uri,
        _hashInfo = G.currentHashInfo,
        _params = _hashInfo.params,
        _type = _hashInfo.type,
        _model = _type && U.getModel(_type),
        _route = _hashInfo.route,
        _tourProps = ['app', 'route', 'modelType'],
        _query = {
          app: _app,
          route: _route,
          modelType: _type ? getAllTypes(_type) : null
        };


        
    function setTourStep(/* stepNum or step */) {
      var arg0 = arguments[0];
      var step = typeof arg0 === 'object' ? arg0 : getTourStep(_steps, arg0);
      if (step) {
        _done = true;
        Events.trigger('tourStep', step);
      }
    }

    function checkForTour() {
      var currentTourId = _tour && getTourId(_tour),
          tourId = _params[TOUR_PARAM] || currentTourId;
      
      if (!tourId)
        return guessTour();
      
      if (tourId == currentTourId) {
        var stepNum = getStepNum(_hashInfo) || _step.get('number') + 1;
        if (stepNum && _steps.length >= stepNum) {
          var next = getTourStep(_steps, stepNum);
          if (hashInfoCompliesWithTourStep(_hashInfo, next)) {
            setTourStep(next);
            return RESOLVED_PROMISE;
          }
          
          // maybe check all previous steps
          while (stepNum--) {
            var prev = getTourStep(_steps, stepNum);
            if (prev && hashInfoCompliesWithTourStep(_hashInfo, prev)) {
              setTourStep(prev);
              return RESOLVED_PROMISE;            
            }
          }
        }
        
        return guessTour();
      }
      
      var tourUri = U.buildUri({
        id: tourId
      }, TOUR_MODEL);
    
      return fetchTour(tourUri).then(validateAndRunTour, function() {
        debugger;
        delete _params[TOUR_PARAM];
        delete _params[TOUR_STEP_PARAM];
        self.navigate(U.makeMobileUrl(_hashInfo.action, _type, _params), {replace: true});
      }).then(function() {
        if (_canceled)
          return REJECTED_PROMISE;
        else
          return $.Deferred().resolve(_tour, _steps, _step).promise();
      }, function() {
//        debugger; // nothing found
      });
    }

    function wrap(fn, context) {
      return function() {
        var args = arguments,
            dfd = $.Deferred(),
            promise = dfd.promise();
        
        G.whenNotRendering(function() {
          if (_canceled || _done)
            return REJECTED_PROMISE;
          
          fn.apply(context, args).then(dfd.resolve, dfd.reject);
        });
        
        return promise;
      };
    }
    
    function guessTour() {
      var ands = [{
//        stepsCount: '>0',
        $in: 'app,null,' + _app,
        route: _route
      }];
//              , {
//            $in: 'route,null,' + _route
//          }];
           
      if (_type) {
        ands.push({
          $in: 'modelType,' + _query.modelType.join(',')
        });
      }
      else {
        ands.push({
          modelType: null
        })
      }
      
      var params = {
          $and: U.$and.apply(null, ands),
          $select: 'app,route,modelType'
        },
        tours = C.getResourceList(TOUR_MODEL, $.param(params)),
        tour;
      
      if (!tours) {
        tours = new ResourceList(null, {
          model: TOUR_MODEL,
          params: params 
        });
        
        Events.trigger('cacheList', tours);
        currentView.once('destroyed', function() {
          Events.trigger('uncacheList', tours);
        });
      }
      
      return $.Deferred(function(defer){        
        tours.fetch({
          success: function(resp) {
            if (!tours.isFetching())
              chooseTour(tours.models).then(defer.resolve, defer.reject);
          },
          error: defer.reject,
          ajaxQueue: 'tours'
        });
      }).promise();
    }

    function matches(val, desiredVal) {
      return _.isArray(desiredVal) ? _.contains(desiredVal, val) : val == desiredVal;
    }

    function chooseTour(tours) {
      if (!tours.length)
        return REJECTED_PROMISE;

      tours = _.filter(tours, function(tour) {
        // ideally this should be part of the original query to the server, but it was too complex to make
        var app = tour.get('app');
        if (app && app !== _app)
          return false;

        var route = tour.get('route');
        if (!route || route !== _route)
          return false;

        var modelType = tour.get('modelType');
        if (!modelType && _type || modelType && !_type)
          return false;
        
        if (modelType && !_.contains(_query.modelType, modelType))
          return false;
        
        return true;
      });

      if (!tours.length)
        return REJECTED_PROMISE;
      
      var myTours = tourManager.getMyTours();
      if (myTours && myTours.length) {
        tours = _.filter(tours, function(tour) {
          return !myTours.where({
            tour: tour.getUri(),
            status: 'completed'
          }, true);
        });
      }
          
      if (!tours.length)
        return REJECTED_PROMISE;
      
      tours.sort(function(a, b) {
        var result;
        _.find(_tourProps, function(p) {
          var aVal = a.get(p),
              bVal = b.get(p),
              desired = _query[p];
          
          if (matches(aVal, desired)) {
            if (!matches(bVal, desired))
              result = -1;
          }
          else if (matches(bVal, desired))
            result = 1;
          
          return result || 0;
        });

        return result || 0;
      });
      
      return _chooseTour(tours);
    }
    
    function _chooseTour(tours) {
      if (!tours.length)
        return REJECTED_PROMISE;
      
      var theChosenOne = tours[0],
          steps = theChosenOne.getInlineList('steps'),
          getSteps = steps ? U.resolvedPromise(steps) : fetchSteps(theChosenOne.getUri());
      
      return getSteps.then(function(steps) {
        return validateAndRunTour(theChosenOne, steps);
      }, function() {
        debugger;
      }).then(undefined, function() {
        // tour fizzled out
        tours.shift();
        return _chooseTour(tours);
      });

//      return fetchSteps(theChosenOne.getUri()).then(function(steps) {
//        return validateAndRunTour(theChosenOne, steps);
//      }, function() {
//        debugger;
//      }).then(function() {
//        // we're good
//      }, function() {
//        // tour fizzled out
//        return _chooseTour(tours.slice(1));
//      });
    }
    
    function validateAndRunTour(tour, steps) {
      var stepNum = getStepNum(_hashInfo) || 1;
      if (_tour == tour) {
        setTourStep(stepNum);
        return RESOLVED_PROMISE;
      }
      
      var step = getTourStep(steps, stepNum);
      if (step && hashInfoCompliesWithTourStep(_hashInfo, step)) {
        Events.trigger('tourStart', tour, steps);
        setTourStep(step);
        return RESOLVED_PROMISE;
      }
      
      return REJECTED_PROMISE;
    }
    
    chooseTour = wrap(chooseTour);
    _chooseTour = wrap(_chooseTour);
    guessTour = wrap(guessTour);
    validateAndRunTour = wrap(validateAndRunTour);
    
    return {
      run: checkForTour,
      cancel: function() {
        _canceled = true;
      },
      done: function() {
        return _done;
      }
    }
  }

  function getTourStep(steps, stepNum) {
    return steps && steps.where({
      number: stepNum
    })[0];     
  }

  function fetchTour(tourUri) {
    return $.Deferred(function(defer) {
      var tourRes = C.getResource(tourUri);
      if (tourRes)
        return defer.resolve(tourRes);
      
      tourRes = new TOUR_MODEL({
        _uri: tourUri
      });
      
      tourRes.fetch({
        success: function() {
          defer.resolve(tourRes);
        },
        error: defer.reject,
        ajaxQueue: 'tours'
      });      
    }).promise();
  }

  function fetchSteps(tourUri) {
    return $.Deferred(function(defer) {
      var stepParams = {
            tour: tourUri
          },
          steps = C.getResourceList(STEP_MODEL, $.param(stepParams));
      
      if (!steps) {
        steps = new ResourceList(null, {model: STEP_MODEL, params: stepParams});
        Events.trigger('cacheList', steps);
        currentView.once('destroyed', function() {
          Events.trigger('uncacheList', steps);
        });
      }
      
      if (steps.length)
        return defer.resolve(steps);
      else {
        steps.fetch({
          params: {
            $select: '$all'
          },
          success: function() {
            defer.resolve(steps);
          },
          error: defer.reject,
          ajaxQueue: 'tours'
        });
        
        return;
      }
    }).promise();
  }
  
  function getStepByNumber(steps, num) {
    var filter = {};
    filter[SEQ_PROP] = num;
    return steps.where(filter)[0];
  }
  
  function getTourId(tour) {
    return tour.get('id');
  }
  
  function getStepNum(hashInfo) {
    hashInfo = hashInfo || G.currentHashInfo;
    var params = hashInfo.params || {},
        stepNum = params[TOUR_STEP_PARAM];
    
    return parseInt(stepNum);
  }
  

  return (tourManager = TourManager());
});