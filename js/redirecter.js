/**
 * deciding what the next page should be turns out to be pretty complicated. The main issue is where to send the user after he created or edited a resource. Many times this can be specified in the model, using the
 *  
 *  onCreateRedirectTo
 *  onCreateRedirectToAction
 *  onCreateRedirectToMessage
 *  
 * directives. However, there are also a million special cases. Until they are standardized, there's the hackery below. 
 */
define('redirecter', ['globals', 'underscore', 'utils', 'cache', 'events', 'vocManager', 'collections/ResourceList', '@widgets'], function(G, _, U, C, Events, Voc, ResourceList, $m) {
  var redirecter,
      interfaceImplementorType = 'system/designer/InterfaceImplementor',
      connectionType = G.commonTypes.Connection,
      CHOOSE_INDICATOR = 'Choose an indicator';
      CHOOSE_INDICATOR_FOR = CHOOSE_INDICATOR + ' for',
      CHOOSE_VALUES_FOR = 'Choose value(s) for',
      CLICK_INDICATOR_TO_CREATE_RULE = 'Click an indicator to create a rule with it';
  
  function makeWriteUrl(res) {
    var uri = res.get('_uri'),
        route = uri ? 'edit' : 'make',
        params = uri ? { _uri: uri } : U.filterObj(res.attributes, U.isModelParameter);
    
    return U.makeMobileUrl(route, res.vocModel.type, params);
  };
  
  function getForResourceInfo() {
    var info = {
        ffwd: redirecter.isChooserFastForwarded()
      },
      forRes = redirecter.getCurrentChooserBaseResource();
    
    if (forRes)
      info.promise = U.resolvedPromise(forRes);
    else {
      var urlInfo = U.getCurrentUrlInfo(),
          forResUri = urlInfo.params.$forResource;
      
      if (forResUri)
        info.promise = U.getResourcePromise(forResUri);
      else
        info.promise = G.getRejectedPromise();
    }
    
    return info;
  };
  
  function Redirecter() {};
  
  _.extend(Redirecter.prototype, {    
    _forType: {}, // for redirecting after edit/mkresource
    _ffwdMakeForType: {},
    _chooserForType: {}, // for redirecting to chooser/
    _chooserForInterface: {}, // for redirecting to chooser/
    _forAction: {},
    log: function() {
      var args = _.toArray(arguments);
      args.unshift("Redirecter", "redirect");
      G.log.apply(G, args);
    }
  });
  
  Redirecter.prototype.redirectAfterEdit = function(res) {
    var hashInfo = U.getCurrentUrlInfo(),
        params = hashInfo.params;
    
    if (params && params.$returnUri)
      Events.trigger('navigate', params.$returnUri, {replace: true});
    else {
      Events.trigger('back', 'going back after successful edit'); 
//      function ifNoHistory() {
//        Events.trigger('navigate', U.makeMobileUrl('view', res.getUri()));
//      });
//      
//      Events.trigger('messageBar', 'info', {
//        message: 'Edits applied'
//      });
    }
  };

  Redirecter.prototype.redirectAfterCancelEdit = function(res, options) {
    if (res.vocModel.type == G.commonTypes.AppInstall) {
      if (G.currentApp.forceInstall) {
        Events.trigger('messageBar', 'error', {
          message: G.localize('thisAppMustBeInstalledBeforeUse')
        });
        
        return;
      }
      
      Events.trigger('navigate', 'home/?' + _.param({
        '-gluedInfo': G.localize('changedYourMindClickToInstall', {
            appName: G.currentApp.title,
            installUrl: U.makePageUrl('make', G.commonTypes.AppInstall, {
              allow: true,
              application: G.currentApp._uri,
              user: G.currentUser._uri
            })
          })
        })
      );
    }
    else {      
      var hashInfo = U.getCurrentUrlInfo(),
          params = hashInfo.params;
      
      if (params && params.$returnUri) {
        Events.trigger('navigate', params.$returnUri, {replace: true});
      }
      else {
        Events.trigger('back', 'going back after canceled edit'); 
//        Events.trigger('back',  function ifNoHistory() {
//          Events.trigger('navigate', U.makeMobileUrl('view', res.getUri()));
//        });
      }
    }
  };

  Redirecter.prototype.redirectAfterCancelMake = function(res, options) {
    this.redirectAfterCancelEdit(res, options);
  };
  
  Redirecter.prototype.redirectAfterMake = function(res, options) {
    options = _.defaults(options, {
      forceFetch: true,
      replace: true, 
      trigger: true
    });
    
    var self = this,
        args = arguments,
        params = G.currentHashInfo.params,
        uri = res.getUri(),
        vocModel = res.vocModel,
        redirecter;

    if (params.$returnUri) {
      Events.trigger('navigate', params.$returnUri, options);
      return;
    }
    
    redirected = _.any(_.keys(this._forType), function(type) {
      if (U.isAssignableFrom(vocModel, type))
        return self._forType[type](res, options) !== false;
    });
    
    if (redirected)
      return;
    
    if (res.isA('Redirectable')) {
      var redirect = U.getCloneOf(vocModel, 'Redirectable.redirectUrl');
      if (redirect) {
        redirect = res.get(redirect);
        if (redirect) {
          Events.trigger('navigate', redirect);
          return;
        }
      }
    }
    
//    if (U.isAssignableFrom(vocModel, 'commerce/trading/Rule')) {
//      var tradleFeed = C.getResource(res.get('tradleFeed'));
//      if (tradleFeed) {
//        var rules = tradleFeed.getInlineList('rules');
//        if (!rules) {
//          var tfModel = U.getModel('commerce/trading/TradleFeed');
//          var where = tfModel.properties.rules.where;
//          where = where ? U.getQueryParams(where) : {};
//          where.tradleFeed = tradleFeed.getUri();
//          rules = new ResourceList(null, {
//            model: tfModel,
//            params: where
//          });
//          
//          tradleFeed.setInlineList('rules', rules);
//        }
//        
//        rules.add(res);
//      }
//    }
    
    var self = this,
        redirectInfoPromise = getRedirectInfo(res);
        
    redirectInfoPromise.done(function(redirectInfo) {      
      var action = redirectInfo.action || 'default';
      redirecter = self['_' + action] || self._default;
      redirecter.call(self, res, options, redirectInfo);
    });
    
//      if (vocModel.onCreateRedirectToMessage) {
//        if (redirectTo.indexOf('?') == -1)
//          redirectTo += '?';
//        else
//          redirectTo += '&';
//        redirectTo += '-info=' + encodeURIComponent(vocModel.onCreateRedirectToMessage);
//      }
    

    // check if we came here by backlink
    
//    switch (redirectAction) {
//      case 'PROPFIND':
//      case 'PROPPATCH':
//        if (!redirectTo || redirectTo.indexOf('-$this') === 0) {
//          redirectPath = uri;
//        }
//        else {
//          var prop = vocModel.properties[redirectTo];
//          if (prop.backLink) {
//            redirectPath = uri;
////              redirectPath = 'make/'; //TODO: make this work for uploading images
//          }
//          else {
//            var target = res.get(redirectTo);
//            if (target) {
//              target = target.value || target;
//              redirectPath = target;
//            }
//            else
//              redirectPath = uri;
//          }
//        }
//        
//        action = redirectAction === 'PROPFIND' ? 'view' : 'edit';
//        break;
//      case 'SOURCE':
//        redirectPath = this.source;
//        if (_.isUndefined(redirectPath)) {
//          redirectPath = uri;
//          action = 'view';
//        }
//        
//        options.forceFetch = true;
//        break;
//      default:
//        this.log('error', 'unsupported onCreateRedirectToAction', redirectAction);
//        redirectPath = vocModel.type;
//        options.forceFetch = true;
//        break;
//    }
//    
//    var redirectMsg = vocModel.onCreateRedirectToMessage;
//    if (redirectMsg)
//      redirectParams['-info'] = redirectMsg;
//    
//    Events.trigger('navigate', U.makeMobileUrl(action, redirectPath, redirectParams), options);
  };
  
  var info = {}; // resuse it
  function getRedirectInfo(res) {
    _.wipe(info);
    
    var model = res.vocModel,
        meta = model.properties,
        hashInfo = G.currentHashInfo,
        params = hashInfo.params || {},
        toProp;
    
    _.extend(info, {
      action: model.onCreateRedirectToAction,
      to: model.onCreateRedirectTo,
      msg: model.onCreateRedirectToMessage,
      params: {}
    });
    
    if (!info.to && params.$backLink) 
      info.to = U.getContainerProperty(model);
    
    if (info.action)
      info.action = info.action.toLowerCase();
      
    var prop = info.to && model.properties[info.to];
    if (prop) {
      info.prop = prop;
      if (prop.backLink)
        info.params[prop.backLink] = res.getUri();
      if (info.msg)
        info.params['-info'] = info.msg;
    }

//    if (info.to) {
//      toProp = meta[info.to];
//      if (toProp.backLink && toProp.lookupFrom) { // HACK (assume Templatable for now)
//        var lookupFrom = toProp.lookupFrom.split('.'),
//            base = meta[lookupFrom[0]],
//            baseVal = res.get(base.shortName);
//        
//        return Voc.getModels([base.range, toProp.range]).then(function(baseModel, blModel) {          
//          if (U.isA(blModel, 'Templatable')) {
//            var bl = baseModel.properties[lookupFrom[1]];
//            var params = U.filterObj(info.params, U.isModelParameter);
//            info.params = U.filterObj(info.params, U.isMetaParameter);
//            info.params[U.getCloneOf(blModel, 'Templatable.isTemplate')[0]] = true;
//            info.params[bl.backLink] = baseVal;
//            info.params.$template = _.param(params);
//          }
//          
//          if (U.isA(model, 'Folder') && U.isA(blModel, 'FolderItem')) {
//            var rootFolder = U.getCloneOf(blModel, 'FolderItem.rootFolder')[0],
//                parentFolder = U.getCloneOf(model, 'Folder.parentFolder')[0];
//            
//            if (rootFolder && parentFolder) {
//              rootFolder = blModel.properties[rootFolder];
//              parentFolder = model.properties[parentFolder];
//              if (rootFolder.range == parentFolder.range) {
//                var val = res.get('Folder.parentFolder');
//                info.params.$rootFolder = val;
//                info.params.$rootFolderProp = rootFolder.shortName;
//              }
//            }
//          }
//
//          return info;
//        });
//      }
//    }
    
    return U.resolvedPromise(info);
  }

  Redirecter.prototype._default = function(res, options, redirectInfo) {
//    Events.trigger('back', function ifNoHistory() {
//      Events.trigger('navigate', U.makeMobileUrl('view', res.getUri()));
//    });
    
    Events.trigger('back', 'default redirect after successful mkresource'); 
    var msg = redirectInfo.msg || '{0} "{1}" was created successfully'.format(res.vocModel.displayName, U.getDisplayName(res));
    Events.trigger('messageBar', 'info', {
      message: msg
    });
//    Events.trigger('navigate', U.makeMobileUrl('view', res.getUri()), {replace: true});
  };

  Redirecter.prototype._mkresource = function(res, options, redirectInfo) {
    if (!redirectInfo.to)
      throw "as you specified MKRESOURCE for onCreateRedirectToAction, you must specify onCreateRedirectTo for this model: " + vocModel.type;
    
    Events.trigger('navigate', U.makeMobileUrl('make', redirectInfo.prop.range, redirectInfo.params), options);    
  };

  Redirecter.prototype._propfind = function(res, options, redirectInfo) {
    var to = redirectInfo.to,
        model = res.vocModel,
        uri;
    
    if (!to || to.indexOf('-$this') === 0) {
      uri = res.getUri();
    }
    else {
      var prop = model.properties[to];
      if (prop.backLink) {
        uri = res.getUri();
//          redirectPath = 'make/'; //TODO: make this work for uploading images
      }
      else {
        var target = res.get(to);
        if (target) {
          target = target.value || target;
          uri = target;
        }
        else
          uri = res.getUri();
      }
    }
    
    Events.trigger('navigate', U.makeMobileUrl(info.route || 'view', uri, info.params), options);
  };

  Redirecter.prototype._proppatch = function(res, options, redirectInfo) {
    redirectInfo.route = 'edit';
    this._propfind(res, options, redirectInfo);
  };

  Redirecter.prototype._list = function(res, options, redirectInfo) {
    var self = this,
        model = res.vocModel,
        meta = model.properties,
        to = redirectInfo.to,
        uri;
        
    if (!redirectInfo.to)
      uri = model.type;
    else {
      if (/\./.test(to)) { 
        // is composite, e.g. @onCreateRedirectTo("propName.backlink")
        var parts = to.split('.'),
            pName = parts[0],
            prop = meta[pName],
            range = U.getLongUri1(prop.range),
            rangeCl = C.getModel(range);
        
        if (rangeCl) {
          info.params[pName] = res.get(pName);
          var bl = to[1];
          var blProp = rangeCl.properties[bl];
          if (blProp)
            uri = blProp.range;
          else {
            this.log('error', 'couldn\'t create redirect', to);
            Events.trigger('navigate', U.makeMobileUrl('view', uri), options);
            return;
          }
        }
        else {
          var args = arguments;
          Voc.getModels(range).done(function() {
            self._list.apply(self, args);
          }).fail(function() {
            Events.trigger('navigate', U.makeMobileUrl('view', res.getUri()), options);
          });
          
          return;
        }
      }
      
      uri = uri || U.getTypeUri(meta[to]._uri);
    }
    
    Events.trigger('navigate', U.makeMobileUrl('list', uri, info.params), _.defaults(options, {forceFetch: true}));    
  };

  Redirecter.prototype._forType[interfaceImplementorType] = function(res, options) {
    var iClName = U.getValueDisplayName(res, 'interfaceClass'),
        title = iClName ? U.makeHeaderTitle(iClName, 'Properties') : 'Interface properties',
        fragment = U.makeMobileUrl('list', G.commonTypes.WebProperty, {
          domain: res.get('implementor'), 
          $title: title
        });
    
    Events.trigger('navigate', fragment, _.defaults(options, {forceFetch: true}));
  };

  Redirecter.prototype._forType[G.commonTypes.WebProperty] = function(res, options) {
    options = _.defaults(options, {forceFetch: true});
    var propType = res.get('propertyType');
    switch (propType) {
      case 'Link':
      case 'Collection':
        Events.trigger('navigate', U.makeMobileUrl('edit', res), options);
        break;
      default: 
        Events.trigger('navigate', U.makeMobileUrl('view', res.get('domain')), options);
    }
  };

  // START QUIZZES //
  
  Redirecter.prototype._forType['model/study/Quiz'] = function(res, options) {
    Events.trigger('navigate', U.makeMobileUrl('make', 'model/study/MultipleChoiceQuestion', {  // for now, until we get the other types working
      quiz: res.getUri(),
      submittedBy: U.getCurrentUserUri()
    }));
  };

  Redirecter.prototype._forType['model/study/MyQuiz'] = function(res, options) {
//    var first = res.get('firstQuestion');
//    if (first) {
//      Events.trigger('navigate', U.makeMobileUrl('make', 'model/study/MultipleChoiceAnswer', {  // for now, until we get the other types working
//        user: U.getCurrentUserUri(),
//        question: first
//      }));
//    }
//    else {
    var quiz = res.get('quiz');
    Voc.getModels('model/study/MultipleChoiceQuestion').done(function(qModel) {      
      var questions = new ResourceList(null, {        
        model: qModel,
        params: {
          quiz: quiz
        }
      });
      
      questions.fetch({
        success: function() {
          Events.trigger('navigate', U.makeMobileUrl('make', 'model/study/MultipleChoiceAnswer', {  // for now, until we get the other types working
            user: U.getCurrentUserUri(),
            question: questions.where({
              number: 1
            }, true)[0]
          }));
        },
        error: function() {
          debugger;
        }
      });
    }).fail(function() {
      debugger;
    });
    
    return true;
//    }
  };

  Redirecter.prototype._forType['model/study/MultipleChoiceAnswer'] = function(res, options) {
    var question = U.getResource(res.get('question')),
        number = question && question.get('number');
    
    if (question) {
//      var number = res.get('number'),
//          nextQuestion = U.getResource()
      var next = question.get('next'),
          prev = question.get('previous');
      
      if (prev && next) { // means setting prev/next is implemented 
        Events.trigger('navigate', U.makeMobileUrl('make', 'model/study/MultipleChoiceAnswer', {// for now, until we get the other types working
          question: next,
          user: U.getCurrentUserUri()
        }));
      }
    }
    
    Events.trigger('navigate', U.makeMobileUrl('list', 'model/study/MultipleChoiceQuestion', {  // for now, until we get the other types working
      quiz: res.get('quiz'),
      number: '>' + (number || 1)
    }));
  };

  // END QUIZZES //
  
  Redirecter.prototype._forType[G.commonTypes.App] = function(res, options) {
    if (!G.online)
      return false;
    
    var isFork = res.get('forkedFrom'),
        preMsg = isFork ? 'Forking in progress, hold on to your hair.' : 'Setting up your app, hold on to your knickers.',
        postMsg = isFork ? 'Forking complete, gently release your hair' : 'App setup complete';
    
    $m.showPageLoadingMsg($m.pageLoadErrorMessageTheme, preMsg, false);
    res.on('syncError', function(error) {
      $m.hidePageLoadingMsg();          
    });
    
    res.once('syncedWithServer', function() { // when app is created, the returned resource JSON is not up to date with models count, etc., so need to fetch again
      $m.hidePageLoadingMsg();
      $m.showPageLoadingMsg($m.pageLoadErrorMessageTheme, postMsg, false);
      setTimeout($m.hidePageLoadingMsg, 3000);
      res.fetch({forceFetch: true});
    });
    
    return false;
  };
  
  Redirecter.prototype._forType['commerce/trading/TradleFeed'] = function(res, options) {
    options = _.defaults(options, {forceFetch: true});
    var feedUri = res.get('feed');
    
    U.getResourcePromise(feedUri).done(function(feed) {
      var eventClassUri = feed.get('eventClass'),
          eventClassRangeUri = feed.get('eventClassRangeUri'),
          tradleUri = res.get('tradle');
    
      if (!eventClassUri) {
        U.getResourcePromise(feedUri, true).done(function() {
          Redirecter.prototype._forType['commerce/trading/TradleFeed'](res, options);
        });
        
        return;
      }
      
      Voc.getModels(U.getTypeUri(eventClassRangeUri)).done(function(eventModel) {
        var props = eventModel.properties,
            userRole = U.getUserRole(),
            isIndexEvent = U.isAssignableFrom(eventModel, 'commerce/trading/IndexEvent'),
            isSECEvent = U.isAssignableFrom(eventModel, 'commerce/trading/SECForm4'),
            secIgnore = ['title', 'xmlUrl'],
            $in = 'name';
        
        for (var shortName in props) {
          var prop = props[shortName];
          if (!prop.backLink && 
              (!prop.subPropertyOf || !prop.subPropertyOf.endsWith('/feed')) && 
              (!isIndexEvent || shortName != 'index') && 
              U.isNativeModelParameter(shortName) &&
              !U.isDateProp(prop) &&
              (!isSECEvent || !_.contains(secIgnore, shortName)) && 
              U.isNativeModelParameter(shortName) && 
              U.isPropVisible(null, prop, userRole)) {
            $in += ',' + shortName;
          }
        }
      
        var title,
            feedDisplayName = res.get('feed.displayName');
        
        title = feedDisplayName ? CHOOSE_INDICATOR_FOR + ' ' + feedDisplayName : CHOOSE_INDICATOR;
        Events.trigger('navigate', U.makeMobileUrl('chooser', 'system/designer/WebProperty', {
          domain: eventClassUri,
          $in: $in,
          $select: 'name,label,propertyType,range,rangeUri,davPropertyUri',
          $title: title,
          $tradleFeedParams: _.param(
            {
              tradle: res.get('tradle'),
              tradleFeed: res.getUri(),
              feed: res.get('feed'),
              eventClass: eventClassUri,
              eventClassRangeUri: eventClassRangeUri
            }
          )
        }), options);
      });
    });
    
    return true;
  };

  if (connectionType) {
    Redirecter.prototype._forType[connectionType] = function(res, options) {
      Events.trigger('navigate', U.makeMobileUrl('edit', res), _.defaults(options, {forceFetch: true}));
    }
  }

  Redirecter.prototype.redirectToChooser = function redirectToChooser(res, prop, e, options) {
    options = options || {};
    var rParams,
        uri = res.get('_uri'),
        vocModel = res.vocModel,
        isIntersection = res.isA('Intersection'),
        redirected;

    this.currentChooser = {
      'for': res,
      fast: options.replace
    };      
    
    var params;
    if (prop.where) {
      params = U.getQueryParams(prop.where);
//      params = U.getListParams(res, prop);
      for (var p in params) {
        var val = params[p];
        var valPrefix = '';
        if (p.endsWith('!')) {
          delete params[p];
          p = p.substring(0, p.length - 1);
          valPrefix = '!';
        }
          
        if (val.startsWith("$this")) { // TODO: fix String.prototyep.startsWith in utils.js to be able to handle special (regex) characters in regular strings
          if (val === '$this')
            params[p] = valPrefix + res.getUri();
          else {
            val = res.get(val.slice(6));
            if (val)
              params[p] = valPrefix + val;
            else
              delete params[p];
          }
        }
        else {
//          if (val.indexOf('.') == -1)
            params[p] = valPrefix + val;
//          else {
//            var promise = U.evalResourcePath(res, val);
//            if (promise.state() == 'pending') {
//              promise.done(this.redirectToChooser.bind(this, arguments));
//              return;
//            }
//            
//            promise.done(function() {
//              params[p] = valPrefix
//            });
//          }
        }
      }
      
      if (!isIntersection  &&  !prop.multiValue  &&  !U.isAssignableFrom(vocModel, G.commonTypes.WebProperty) && !U.isAssignableFrom(vocModel, 'commerce/trading/Rule')) {
        params.$prop = p;
        if (uri)
          params.$forResource = uri;
        
        Events.trigger('navigate', U.makeMobileUrl('chooser', U.getTypeUri(prop.range), params), options);
        return;
      }
    }
    
    if (prop.multiValue) {
      this._multivalueChooser(res, prop, e, options);
      return;
    }
    
    var self = this;  
    redirected = _.any(_.keys(this._chooserForType), function(type) {
      if (U.isAssignableFrom(vocModel, type))
        return self._chooserForType[type](res, prop, e, options) !== false;
    });

    if (redirected)
      return;

//    redirected = _.any(_.keys(this._chooserForInterface), function(iFace) {
//      if (U.is(vocModel, iFace))
//        return self._chooserForType[iFace](res, options) !== false;
//    });
//
//    if (redirected)
//      return;
    
    var range = prop.range,
        isIndicator = U.isAssignableFrom(vocModel, 'commerce/trading/TradleIndicator'),
        isRule = U.isAssignableFrom(vocModel, 'commerce/trading/Rule'),
        isCompareWithIndicatorRule = isRule && vocModel.properties.compareWith,
        isLinkRule = isRule && U.isAssignableFrom(vocModel, 'commerce/trading/LinkRule');
    
    if (range == 'Resource' && isLinkRule) {
      range = res.get('resourceTypeRangeUri') || range;
    }

    if (range != 'Class') {
      range = U.getLongUri1(range);
      var prModel = C.getModel(range);
      var isImage = prModel  &&  U.isAssignableFrom(prModel, "Image");
      if (!isImage  &&  !prModel) {
        var idx = range.indexOf('model/portal/Image');
        isImage = idx != -1  &&  idx == range.length - 'model/portal/Image'.length;
      }
      
      if (isImage) {
        var prName = prop.displayName;
        if (!prName)
          prName = prop.shortName;
        
        rParams = { 
          forResource: res.getUri(), 
          $prop: prop.shortName, 
          $location: res.get('attachmentsUrl'), 
          $title: U.makeHeaderTitle(vocModel.displayName, prName) 
        };
        
        Events.trigger('navigate', U.makeMobileUrl('chooser', range, rParams), options);
        return;
      }
    }
    
    rParams = {
//      $prop: prop.shortName,
      $type: vocModel.type
    };
    
    // HACK for @where on one of the intersection props (this logic should be moved to server or params for intersection type and the intersection prop chooser type mixed in one URL)
    if (params)
      _.extend(rParams, params);
    
    if (isIntersection) {
      rParams.$propA = U.getCloneOf(vocModel, 'Intersection.a')[0];
      rParams.$propB = U.getCloneOf(vocModel, 'Intersection.b')[0];
      rParams.$forResource = prop.shortName == rParams.$propA ? res.get('Intersection.b') : res.get('Intersection.a');
    }
    else {
      rParams.$prop = prop.shortName;
    }
    
    var reqParams = U.getCurrentUrlInfo().params;
    if (reqParams) {
      for (var p in res.attributes) {
        var pr = vocModel.properties[p];
        if (pr  &&  pr.containerMember  &&  reqParams[p]) {
          rParams['$forResource'] = reqParams[p];
          break;
        }
      }
    }

    if (reqParams['-info'])
      rParams['-info'] = reqParams['-info'];
//    else if (vocModel.type.endsWith('commerce/trading/Rule'))
//      rParams.$title = 'Make a rule for ' + res.get('feed.displayName') + ' property...';
//      rParams['-info'] = 'Make a rule for ' + res.get('feed.displayName') + ' property...';

//    if (U.isAssignableFrom(vocModel, 'commerce/trading/TradleFeed') && prop.range.endsWith('commerce/trading/Feed'))
//      rParams['-info'] = 'Choose a feed for your Tradle';
    
    Events.trigger('navigate', U.makeMobileUrl('chooser', U.getTypeUri(range), rParams), options);
  };

  Redirecter.prototype._multivalueChooser = function(res, prop, e, options) {
    var params = {},
        vocModel = res.vocModel,
        type = vocModel.type,
        prName = prop.displayName,
        lookupFrom = prop.lookupFrom,
        uri = res.get('_uri'),
        p = prop.shortName;
    
    if (!prName)
      prName = p;

    params.$type = type;
    params.$multiValue = p;
    if (uri) { // is a 'make' operation
      if (lookupFrom) {
        var bl = vocModel.properties[lookupFrom];
        if (bl)
          params[bl.backLink] = uri;
      }
      
      params.$forResource = uri;
    }
  
    params.$title = U.makeHeaderTitle(vocModel.displayName, prName);
    var mvList = (e.currentTarget.text || e.target.textContent).trim(); //e.target.innerText;
    mvList = mvList.slice(U.getPropDisplayName(prop).length + 1);
    params['$' + p] = mvList;
    var typeUri = U.getTypeUri(prop.lookupFromType);
    typeUri = G.classMap[typeUri] ? G.classMap[typeUri] : typeUri;
    
    Events.trigger('navigate', U.makeMobileUrl('chooser', typeUri, params), options);
  };

  Redirecter.prototype._chooserForInterface['Intersection'] = function(res, prop, e, options) {
    // TODO: fill this out
  };

//  Redirecter.prototype._chooserForType['commerce/trading/Rule'] = function(res, prop, e, options) {
//    var eventClassUri = res.get('eventClass'),
//        vocModel = res.vocModel,
//        userRole = U.getUserRole(),
//        $in = 'name';
//    
//    Voc.getModels(U.getTypeUri(eventClassUri)).done(function(eventCl) {
//      var props = eventCl.properties;
//      for (var shortName in props) {
//        if (U.isPropVisible(null, props[shortName], userRole)) {
//          $in += ',' + shortName;
//        }
//      }
//      
//      // params for choosing WebProperty
//      var params = {
////          $in: 'name,' + res.vocModel.properties.data.propertyGroupList
//        $prop: prop.shortName,
//        $type:  vocModel.type,
//        $title: 'Add a rule for...',
//        $forResource: domain,
//        $in: $in
//      }
//      
//      Events.trigger('navigate', U.makeMobileUrl('chooser', prop.range, params), options);
//    });
//  };
  
  Redirecter.prototype._chooserForType[G.commonTypes.WebProperty] = function(res, prop, e, options) {
    var domain = U.getLongUri1(res.get('domain')),
        title = U.getQueryParams(window.location.hash)['$title'],
        vocModel = res.vocModel;
    
    if (!title)
      title = vocModel.displayName;
    else {
      var idx = title.indexOf('</span>');
      title =  title.substring(0, idx + 7) + "&nbsp;&nbsp;" + vocModel.displayName;
    }
    
    var rParams = {
      $prop: prop.shortName,
      $type:  vocModel.type,
      $title: title,
      $forResource: domain
    };

    if (vocModel.type.endsWith('BacklinkProperty')) {
      var parentFolder = G.currentApp._uri; //U.getLongUri1(res.get('parentFolder'));
      if (G.currentUser.guest) 
        _.extend(rParams, {parentFolder: parentFolder});
      else {
        var params = {
          parentFolder: parentFolder, 
          creator: '_me'
        };
        
        _.extend(rParams, {
          $or: U.getQueryString(params, {
            delimiter: '||'
          })
        });
      }
    }
    
//      var params = '&$prop=' + prop.shortName + '&$type=' + encodeURIComponent(this.vocModel.type) + '&$title=' + encodeURIComponent(t);
//      params += '&$forResource=' + encodeURIComponent(this.model.get('domain'));

//      this.router.navigate('chooser/' + encodeURIComponent(U.getTypeUri(prop.range)) + "?" + params, {trigger: true});
    Events.trigger('navigate', U.makeMobileUrl('chooser', U.getTypeUri(prop.range), rParams), options);
  };
  
  Redirecter.prototype._chooserForType[interfaceImplementorType] = function(res, prop, e, options) {
    var vocModel = res.vocModel,
        rParams = {
          $prop: prop.shortName,
          $type:  vocModel.type,
          $title: 'Add-ons',
          $forResource: res.get('implementor')
        };
      
    Events.trigger('navigate', U.makeMobileUrl('chooser', prop.range, rParams), options);
  };
  
  Redirecter.prototype.getCurrentChooserBaseResource = function() {
    if (this.currentChooser)
      return this.currentChooser['for'];
    else {
      var forRes = U.getCurrentUrlInfo().params.$forResource;
      if (forRes)
        return C.getResource(forRes);
    }
  };

  Redirecter.prototype.isChooserFastForwarded = function() {
    return this.currentChooser && this.currentChooser.fast;
  };

  function getEditableProps(editableProps) {
    var props = editableProps.props,
                grouped = props.grouped,
                ungrouped = props.ungrouped,
                totalEditable = grouped.length + ungrouped.length;
    
    return totalEditable ? Array.prototype.concat.apply([], _.pluck(grouped, 'props')).concat(ungrouped) : null;
  }
    
  // FAST FORWARD 'MAKE' FOR TYPES
//  Redirecter.prototype._ffwdMakeForType[G.commonTypes.AppInstall] = function(res) {
//    if (res.get('appPlugs'))
//      return false;
//
//    res.save({
//      allow: true
//    });
//  };
  
  Redirecter.prototype.fastForwardMake = function(res) {
    // do it per type
//    var self = this,
//        vocModel = res.vocModel,
//        fastForwarded = _.any(_.keys(this._ffwdMakeForType), function(type) {
//          if (U.isAssignableFrom(vocModel, type))
//            return self._ffwdMakeForType[type](res) !== false;
//        });
//
//    if (fastForwarded)
//      return true;
    
    var type = res.vocModel.type,
        urlInfo = U.getCurrentUrlInfo();
    
    if (type == G.commonTypes.AppInstall)
      return false;
    else if (type.endsWith('commerce/trading/TradleFeed')) {
      if (!res.get('tradle') && urlInfo.params.$newTradle == 'y') {
        U.alert("We're making a Tradle based on the feed you chose...");
        Voc.getModels(['commerce/trading/Tradle', 'commerce/trading/TradleFeed']).done(function(tradleModel) {
          var tradle = new tradleModel();
          tradle.save(null, {
            success: function() {
              var params = _.clone(urlInfo.params);
              delete params.$newTradle;
              params.tradle = tradle.getUri();
              
              Events.trigger('navigate', U.makeMobileUrl('make', 'commerce/trading/TradleFeed', params), { replace: true });
              setTimeout(function() {                
                U.hideModalDialog();              
              }, 1000);
            },
            error: function() {
              debugger;
            }
          });
        });
        
        return true;
      }
    }
        
    var editableProps = res.getEditableProps(urlInfo),
        merged = getEditableProps(editableProps);
    
    if (!merged) {
      // make the resource and let the redirect
      res.save(null, { redirect: true });
      return true;
    }
    
    var resourceProp = null;
    if (merged.length == 1) {
      var prop = res.vocModel.properties[merged[0]];
      if (prop && U.isResourceProp(prop))
        resourceProp = prop;
    }
    else {
      for (var i = 0; i < merged.length; i++) {
        var prop = res.vocModel.properties[merged[i]];
        if (prop.required && U.isResourceProp(prop)) {
          resourceProp = prop;
          break;
        }
      }
    }

    if (resourceProp) {
      Events.trigger('loadChooser', res, resourceProp, null, {replace: true});        
      return true;
    }
    
    return false;
  };

  Events.on('choseMulti', _.debounce(function(propName, list, checked) {
    var urlInfo = U.getCurrentUrlInfo(),
        params = urlInfo.params;
    
    if (params.$indicator) {
      Voc.getModels('commerce/trading/TradleIndicator').done(function(iModel) {
        var i = checked.length,
            common = _.toQueryParams(params.$indicator);
            
        while (i--) {
          var indicator = new iModel(_.extend({
            variant: checked[i].value
          }, common));
          indicator.save();
        }

        Events.trigger('navigate', U.makeMobileUrl('view', common.tradle, {
          '-gluedInfo': CLICK_INDICATOR_TO_CREATE_RULE
        }));
        

//        U.getResourcePromise(common.tradleFeed).done(function(tf) {
//          Events.trigger('loadChooser', tf, tfModel.properties.feed);
//        });
//        
//        Events.trigger('navigate', U.makeMobileUrl('chooser', 'commerce/trading/Feed', _.extend({
//          
//        },
//          tradle: common.tradle,
//          $propA: 'tradle',
//          $propB: 'feed',
//          $type: U.getTypeUri('commerce/trading/TradleFeed'),
//          activated: true,
//          eventClass: '!$this.null'
//        }));
      });
      
      return;
    }
    
    var info = getForResourceInfo();
    info.promise.done(function(forRes) {
      var editableProps = forRes.getEditableProps(urlInfo),
          merged = getEditableProps(editableProps) || [],
          props = {};
      
      Array.remove(merged, propName);
      props[propName] = _.pluck(checked, 'value').join(',');
      props[propName + '.displayName'] = _.pluck(checked, 'name').join(',');
      if (!merged.length) {
        res.save(props, {
          userEdit: true,
          redirect: true
        }); // let redirect after save handle it
      }
      else {
        if (info.ffwd) {
          res.set(props);
          Events.trigger('navigate', makeWriteUrl(res));
        }
        else {
          Events.trigger('choseMulti:' + propName, res, props); // let EditView handle it
        }
      }    
    });
  }, 200, true));

  Events.on('chose', _.debounce(function(propName, valueRes) {
    var urlInfo = U.getCurrentUrlInfo(),
        params = urlInfo.params;
    
    if (params.$createInstance == 'y') {
      var params = urlInfo.params.$props;
      params = params ? U.getQueryParams(params) : {};
      if (urlInfo.params.$title)
        params.$title = urlInfo.params.$title + ' ' + valueRes.get('label');
      
      Events.trigger('navigate', U.makeMobileUrl('make', valueRes.get('davClassUri'), params));
      return;
    }
    else if (params.$tradleFeedParams) {
      var eventProperty = valueRes.getUri(),
          propertyType = valueRes.get('propertyType'),
          isNumeric = U.isNumericType(propertyType),
          tfParams = _.toQueryParams(params.$tradleFeedParams);
      
      tfParams.eventProperty = valueRes.getUri();
      if (isNumeric) {
        var eventPropertyUri = valueRes.get('davPropertyUri'),
            and1 = _.param({
              applicableToProperty: eventPropertyUri,
              applicableToModel: tfParams.eventClass,
              applicableToClass: tfParams.eventClassRangeUri
  //            applicableToResource: tfParams.feed
            }),
            and2 = _.param({
//              parentFolder: G.currentApp._uri,
              $in: 'name,RawValue,PreviousValue'
            }),
            title = CHOOSE_VALUES_FOR;
      
        var tradleFeed = C.getResource(tfParams.tradleFeed);
        if (tradleFeed)
          title += ' ' + U.getDisplayName(tradleFeed);
        
        title += ' ' + U.getDisplayName(valueRes);        
        Events.trigger('navigate', U.makeMobileUrl('chooser', G.commonTypes.WebClass, {
          $or: U.makeOrGroup(_.param({$and: and1}), _.param({$and: and2})),
          $indicator: _.param(tfParams),
          $title: title
        }));
        
        return;
      }
      
      Voc.getModels('commerce/trading/TradleIndicator').done(function(iModel) {
        var indicator = new iModel({
          tradleFeed: tfParams.tradleFeed,
          tradle: tfParams.tradle,
          eventProperty: eventProperty
        });
        
        indicator.save();
      });
  
      Events.trigger('navigate', U.makeMobileUrl('view', tfParams.tradle, {
        '-gluedInfo': CLICK_INDICATOR_TO_CREATE_RULE
      }));

//      Events.trigger('back', 'chose property for indicator, heading back');
      return;
    }
    
    var info = getForResourceInfo();
    info.promise.done(function(forRes) {
      var forModel = forRes.vocModel,
          forType = forModel.type,
          editableProps = forRes.getEditableProps(urlInfo),
          merged = getEditableProps(editableProps) || [],
          props = {};
      
      Array.remove(merged, propName);
      props[propName] = valueRes.getUri();
      if (forRes.vocModel.type.endsWith('commerce/trading/TradleIndicator')) {
        if (forRes.get('eventProperty')) {
          forRes.save(props, { userEdit: true });
          Events.trigger('back', 'back from choosing TradleIndicator variant');
          return;
        }
        else {
          forRes.set(props, { userEdit: true });
          Events.trigger('loadChooser', forRes, forModel.properties.variant, { replace: true });          
          return;
        }
      }
      
      if (!merged.length) {
        forRes.save(props, {
          userEdit: true,
          redirect: true
        }); // let redirect after save handle it
      }
      else {
        if (info.ffwd) {
          forRes.set(props);
          Events.trigger('navigate', makeWriteUrl(forRes), {
            replace: true
          });
        }
        else {
          var handled = false,
              onHandled = function() {
                handled = true;
              };
              
          Events.on('handlingChoice', onHandled);
          Events.trigger('chose:' + propName, valueRes, redirecter.currentChooserFor); // let EditView handle it
          Events.off('handlingChoice', onHandled);
          if (!handled)
            Events.trigger('back', 'chooser without context, unable to handle choice so going back...')
        }
      }
    });
  }, 200, true));
  
  Events.on('savedEdit', function(res, options) {
//    if (!options || options.redirect !== false)
//    if (!options || !options.userEdit)
    if (options && options.redirect)
      redirecter.redirectAfterEdit(res, options);
  });
  
  Events.on('savedMake', function(res, options) {
//    if (!options || options.redirect !== false)
//    if (!options || !options.userEdit)
    if (options && options.redirect)
      redirecter.redirectAfterMake(res, options);
  });

  Events.on('cancelEdit', function(res, options) {
    if (!options || options.redirect !== false)
      redirecter.redirectAfterCancelEdit(res, options);
  });

  Events.on('cancelMake', function(res, options) {
    if (!options || options.redirect !== false)
      redirecter.redirectAfterCancelMake(res, options);
  });

  Events.on('loadChooser', function(res, prop, e, options) {
    redirecter.redirectToChooser(res, prop, e, options);
  });

  return (redirecter = new Redirecter());
});
