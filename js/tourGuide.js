define('tourGuide', ['globals', 'underscore', 'utils', 'events', 'vocManager', 'collections/ResourceList', 'cache'], function(G, _, U, Events, Voc, ResourceList, C) {
  ////// BACKBONE HACKERY to intercept all url loads so we can see the person's status regarding the tour (on tour, abandoned, lost, dead, undead) /////////
  var SEQ_PROP = 'number',
      TOUR_PARAM = '$tour',
      TOUR_STEP_PARAM = '$tourStep',
      TOUR_MODEL,
      STEP_MODEL,
      MY_TOUR_MODEL,
      backboneLoadUrl = Backbone.history.loadUrl,
      RESOLVED_PROMISE = G.getResolvedPromise(),
      REJECTED_PROMISE = G.getRejectedPromise(),
      tourManager;

  function log() {
    var args = [].slice.call(arguments);
    args.unshift("tourGuide", "tour");
    G.log.apply(G, args);
  };

  function adjustFragmentForTour(fragment) {
    var tour = tourManager.getCurrentTour(),
        step = tourManager.getCurrentStep(),
        steps = tourManager.getCurrentSteps(),
        next = getStepByNumber(steps, step.get(SEQ_PROP) + 1),
        hashInfo = U.parseHash(fragment);
    
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
        var params = U.getParamMap(step.get('urlQuery')) || {};
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
  };

  function hashInfoCompliesWithTourStep(hashInfo, step) {
    var isModelParam = U.negate(U.isMetaParameter),
        hashInfoModelParams = U.filterObj(hashInfo.params, isModelParam),
        stepParams = U.getParamMap(step.get('urlQuery')),
        stepModelParams = U.filterObj(stepParams, isModelParam),
        stepType = step.get('typeUri'),
        stepRoute = step.get('route'),
        ///////////////////////////
        routeMatches = hashInfo.route == stepRoute,
        isProfile = stepType == 'profile' && (hashInfo.uri == 'profile' || hashInfo.uri == G.currentUser._uri),
        typeMatches = isProfile || hashInfo.type == stepType,
        paramsMatch = _.isEqual(hashInfoModelParams, stepModelParams);
    
    return routeMatches && typeMatches && paramsMatch;
  };
  
  Backbone.history.loadUrl = function(fragmentOverride) {
    var fragment = this.fragment = this.getFragment(fragmentOverride);
    // validate against next tour step if on a tour
    if (tourManager.getCurrentStep()) {
      fragment = adjustFragmentForTour(fragment);
      if (fragment !== this.fragment) {
        this._updateHash(this.location, fragment, true);
      }
    }
      
    return backboneLoadUrl.call(this, this.fragment);
  };  

  
  ///////////// END BACKBONE HACKERY ///////////////
  
  
  function TourManager() {
        // CURRENT STATE
    var _tour, 
        _steps,
        _step,
        currentSearches = [],
        
        // INITIALIZATION
        _initPromise,
        _initialized;

    function init() {
      _initPromise = Voc.getModels(['commerce/urbien/Tour', 'commerce/urbien/TourStep', 'commerce/urbien/MyTour']).then(function(t, s, m) {
        _initialized = true;
        TOUR_MODEL = t;
        STEP_MODEL = s;
        MY_TOUR_MODEL = m;
      });
    };
    
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
      if (_step.get('number') == _steps.length) {
        new MY_TOUR_MODEL().save({
          status: 'completed',
          user: G.currentUser._uri,
          tour: _tour.getUri()
        });
      }
    });

    function reset() {
      _tour = _steps = _step = null;
    };
    
    init();
    return {
      getTour: function() {
        if (!_initialized) {
          var args = arguments;
          return _initPromise.then(function() {
            return tourManager.getTour.apply(tourManager, arguments);
          })
        }
      
        Events.once('pageChange', function() {
          _.each(currentSearches, function(op) {
            if (!op.done())
              op.cancel();
          });
          
          currentSearches = [];
        });
        
        var searchOp = SearchOperation();
        currentSearches.push(searchOp);
        searchOp.run();
      },
      getCurrentTour: function() {
        return _tour;
      },
      getCurrentSteps: function() {
        return _steps;
      },
      getCurrentStep: function() {
        return _step;
      }
    };
  };
  
  function SearchOperation(_tour, _steps, _step) {
    var _canceled, 
        _done,
        _app = G.currentApp._uri,
        _user = G.currentUser._uri,
        _hashInfo = G.currentHashInfo,
        _params = _hashInfo.params,
        _type = _hashInfo.type,
        _route = _hashInfo.route,
        _tourProps = ['app', 'route', 'modelType'],
        _query = {
          app: _app,
          route: _route,
          modelType: _type
        };


        
    function setTourStep(/* stepNum or step */) {
      var arg0 = arguments[0];
      var step = typeof arg0 === 'object' ? arg0 : getTourStep(_steps, arg0);
      if (step) {
        _done = true;
        Events.trigger('tourStep', step);
      }
    };

    function checkForTour() {
      var tourId = _params[TOUR_PARAM];
      if (!tourId)
        return guessTour();
       
      if (_tour && getTourId(_tour) == tourId) {
        setTourStep();
        return RESOLVED_PROMISE;
      }
      
      var tourUri = U.buildUri({
        id: tourId
      }, TOUR_MODEL);
    
      return $.whenAll(
        fetchTour(tourUri, TOUR_MODEL), 
        fetchSteps(tourUri, STEP_MODEL)
      ).then(validateAndRunTour, function() {
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
        debugger; // nothing found
      });
    };

    function wrap(fn, context) {
      return function() {
        if (_canceled || _done)
          return REJECTED_PROMISE;
        
        return fn.apply(context, arguments);
      };
    };
    
    function guessTour() {
      var tourParams = {
            app: _app
          };
      
      if (_type)
        tourParams.modelType = _type;
      
      var tours = new ResourceList(null, {
          model: TOUR_MODEL,
          params: {
            $or: U.getQueryString(tourParams, {delimiter: '||'}) + '||app=null',
            stepsCount: '>0', // db doesn't understand this (yet)
            route: _route
          }
        }),
        tour; 
      
      tours.fetch({
        success: function() {
          if (tour) // success may get called twice, once from search in DB, once from the server
            return;
          
          chooseTour(tours).done(function(tourRes) {
            if (tour) // success may get called twice, once from search in DB, once from the server
              return;
            
            tour = tourRes;
            fetchSteps(tour.getUri(), STEP_MODEL).then(function(steps) {
              return validateAndRunTour(tour, steps);
            }, function() {
              debugger;
            });
          });
        },
        error: function() {
          debugger;
        }
      });
    };

    function getMyTours(tourList) {
      if (G.currentUser.guest)
        return REJECTED_PROMISE;
      
      return $.Deferred(function(defer) {
        var myTours = new ResourceList(null, {
          model: MY_TOUR_MODEL,
          params: {
            user: _user,
            $in: 'tour,' + tourList.pluck('_uri').join(',')
          }
        });
        
        myTours.fetch({
          success: function() {
            defer.resolve(myTours)
          },
          error: defer.reject
        });
      });
    };
    

    function chooseTour(tourList) {
      if (!tourList.length)
        return REJECTED_PROMISE;

      var tours = _.filter(tourList.models, function(tour) {
        // ideally this should be part of the original query to the server, but it was too complex to make
        return _.all(_tourProps, function(p) {
          var val = tour.get(p);
          return !val || val == _query[p]; 
        });
      });

      if (!tours.length)
        return REJECTED_PROMISE;
      
      tourList = new ResourceList(tours, {'final': true}); // don't allow any fetching of this resource list or adding to it
      return getMyTours(tourList).then(function(myTours) {
        return _chooseTour(tourList, myTours);
      }); 
    };

    function _chooseTour(tourList, myTours) {
      var tours = tourList.models;
      if (myTours.length) {
        tours = _.filter(tours, function(tour) {
          return !myTours.where({
            tour: tour.getUri(),
            status: 'completed'
          }, true);
        });
      }
          
      if (!tours.length)
        return REJECTED_PROMISE;
      
      tours = tours.sort(function(a, b) {
        var result;
        _.find(_tourProps, function(p) {
          var aVal = a.get(p),
              bVal = b.get(p),
              desired = _query[p];
          
          if (aVal == desired) {
            if (bVal != desired)
              result = -1;
          }
          else if (bVal == desired)
            result = 1;
          
          return result || 0;
        });

        return result || 0;
      });
      
      return $.Deferred().resolve(tours[0]).promise();
    };
    
    function validateAndRunTour(tour, steps) {
      var stepNum = getStepNum(_hashInfo);
      if (_tour == tour) {
        setTourStep(stepNum);
        return RESOLVED_PROMISE;
      }
      
      var step = getTourStep(steps, stepNum);
      if (step) {
        if (hashInfoCompliesWithTourStep(_hashInfo, step)) {
          Events.trigger('tourStart', tour, steps);
          setTourStep(step);
          return RESOLVED_PROMISE;
        }
        else 
          debugger;
      }
      
      return REJECTED_PROMISE;
    };
    
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
  };

  function getTourStep(steps, stepNum) {
    return steps && steps.where({
      number: stepNum
    })[0];     
  };

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
        error: defer.reject
      })
    }).promise();
  };

  function fetchSteps(tourUri) {
    return $.Deferred(function(defer) {
      var stepParams = {
            tour: tourUri
          },
          steps = C.getResourceList(STEP_MODEL, $.param(stepParams));
      
      if (!steps)
        steps = new ResourceList(null, {model: STEP_MODEL, params: stepParams});
      
      if (steps.length)
        return defer.resolve(steps);
      else {
        steps.fetch({
          success: function() {
            defer.resolve(steps);
          },
          error: defer.reject
        });
        
        return;
      }
    }).promise();
//    .then(function(steps) {
//      steps.comparator = function(a, b) {
//        return a.get(SEQ_PROP) - b.get(SEQ_PROP);
//      };
//      
//      return steps.sort();
//    });
  };
  
  function getStepByNumber(steps, num) {
    var filter = {};
    filter[SEQ_PROP] = num;
    return steps.where(filter)[0];
  }
  
  function getTourId(tour) {
    return tour.get('id');
  };
  
  function getStepNum(hashInfo) {
    hashInfo = hashInfo || G.currentHashInfo;
    var params = hashInfo.params || {},
        stepNum = params[TOUR_STEP_PARAM];
    
    return parseInt(stepNum) || 1;
  };
  

  return (tourManager = TourManager());
});