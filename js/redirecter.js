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
      CHOOSE_RULE_FOR = 'Choose a rule for ';
  
  function Redirecter() {
  }
  
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
      Events.trigger('back', function ifNoHistory() {
        Events.trigger('navigate', U.makeMobileUrl('view', res.getUri()));
      });
      
      Events.trigger('messageBar', 'info', {
        message: 'Edits applied'
      });
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
      
      Events.trigger('navigate', 'home/?' + $.param({
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
        Events.trigger('back',  function ifNoHistory() {
          Events.trigger('navigate', U.makeMobileUrl('view', res.getUri()));
        });
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

    if (info.to) {
      toProp = meta[info.to];
      if (toProp.backLink && toProp.lookupFrom) { // HACK (assume Templatable for now)
        var lookupFrom = toProp.lookupFrom.split('.'),
            base = meta[lookupFrom[0]],
            baseVal = res.get(base.shortName);
        
        return Voc.getModels([base.range, toProp.range]).then(function(baseModel, blModel) {          
          if (U.isA(blModel, 'Templatable')) {
            var bl = baseModel.properties[lookupFrom[1]];
            var params = U.filterObj(info.params, U.isModelParameter);
            info.params = U.filterObj(info.params, U.isMetaParameter);
            info.params[U.getCloneOf(blModel, 'Templatable.isTemplate')[0]] = true;
            info.params[bl.backLink] = baseVal;
            info.params.$template = $.param(params);
          }
          
          if (U.isA(model, 'Folder') && U.isA(blModel, 'FolderItem')) {
            var rootFolder = U.getCloneOf(blModel, 'FolderItem.rootFolder')[0],
                parentFolder = U.getCloneOf(model, 'Folder.parentFolder')[0];
            
            if (rootFolder && parentFolder) {
              rootFolder = blModel.properties[rootFolder];
              parentFolder = model.properties[parentFolder];
              if (rootFolder.range == parentFolder.range) {
                var val = res.get('Folder.parentFolder');
                info.params.$rootFolder = val;
                info.params.$rootFolderProp = rootFolder.shortName;
              }
            }
          }

          return info;
        });
      }
    }
    
    return U.resolvedPromise(info);
  }

  Redirecter.prototype._default = function(res, options, redirectInfo) {
    Events.trigger('back', function ifNoHistory() {
      Events.trigger('navigate', U.makeMobileUrl('view', res.getUri()));
    });
    
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
    
      if (eventClassUri) {
        Events.trigger('navigate', U.makeMobileUrl('make', 'commerce/trading/Rule', {
          eventClass: eventClassUri,
          eventClassRangeUri: eventClassRangeUri,
          feed: feedUri,
          tradle: tradleUri,
          tradleFeed: res.get('_uri')
        }), options);
      }
      else {
        U.getResourcePromise(feedUri, true).done(function() {
          Redirecter.prototype._forType['commerce/trading/TradleFeed'](res, options);
        });
      }
    });
    
    return true;
  };

  
  if (connectionType) {
    Redirecter.prototype._forType[connectionType] = function(res, options) {
      Events.trigger('navigate', U.makeMobileUrl('edit', res), _.defaults(options, {forceFetch: true}));
    }
  }

  Redirecter.prototype.redirectToChooser = function(res, prop, e, options) {
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
        else
          params[p] = valPrefix + val;
      }
      
      if (!isIntersection  &&  !prop.multiValue  &&  !U.isAssignableFrom(vocModel, G.commonTypes.WebProperty)) {
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
        isRule = U.isAssignableFrom(vocModel, 'commerce/trading/Rule'),
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
    
    if (isIntersection) {
      // HACK for @where on one of the intersection props (this logic should be moved to server or params for intersection type and the intersection prop chooser type mixed in one URL)
      if (params)
        _.extend(rParams, params);
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
    
    if (isRule && !isLinkRule) {
      var $in = 'name',
          feedUri = res.get('feed'),
          getFeed = U.getResourcePromise(feedUri),
          eventClassRangeUri = res.get('eventClassRangeUri');

      if (!eventClassRangeUri) {
        Events.trigger('back')
        return;
      }

      eventClassRangeUri = U.getTypeUri(eventClassRangeUri);
//      $.when(getFeed, Voc.getModels(eventClassRangeUri)).done(function(feed, eventModel) {
      Voc.getModels(U.getTypeUri(eventClassRangeUri)).done(function(eventModel) {
        var props = eventModel.properties,
            userRole = U.getUserRole(),
            isIndexEvent = U.isAssignableFrom(eventModel, 'commerce/trading/IndexEvent'),
            isSECEvent = U.isAssignableFrom(eventModel, 'commerce/trading/SECForm4'),
            secIgnore = ['title', 'xmlUrl'];
        
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

//        getLastEvent.done(function(lastEvent) {          
          rParams.$in = $in;
          rParams.domain = res.get('eventClass');
          rParams.$select = 'name,label,propertyType,range,rangeUri';
          rParams.$title = CHOOSE_RULE_FOR + res.get('feed.displayName');
//          if (lastEvent)
//            rParams.$lastEvent = lastEvent.getUri();
            
          Events.trigger('navigate', U.makeMobileUrl('chooser', U.getTypeUri(range), rParams), options);
//        });
      });
      
      return;
    }    

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
    return this.currentChooser && this.currentChooser['for'];
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
    
    if (res.vocModel.type == G.commonTypes.AppInstall)
      return false;
        
    var editableProps = res.getEditableProps(U.getCurrentUrlInfo()),
        merged = getEditableProps(editableProps);
    
    if (!merged) {
      // make the resource and let the redirect
      res.save();
      return true;
    }
    else if (merged.length == 1) {
      var prop = res.vocModel.properties[merged[0]];
      if (prop && U.isResourceProp(prop)) {
        Events.trigger('loadChooser', res, prop, null, {replace: true});        
        return true;
      }
    }
    
    return false;
  };

  Events.on('choseMulti', function(propName, list, checked) {
    var res = redirecter.getCurrentChooserBaseResource(),
        ffwd = redirecter.isChooserFastForwarded(),
        editableProps = res.getEditableProps(U.getCurrentUrlInfo()),
        merged = getEditableProps(editableProps),
        props = {};
    
    props[propName] = _.pluck(checked, 'value').join(',');
    props[propName + '.displayName'] = _.pluck(checked, 'name').join(',');
    if (merged && merged.length == 1) {
      res.save(props, {
        userEdit: true
      }); // let redirect after save handle it
    }
    else {
      if (ffwd) {
        res.set(props);
        Events.trigger('navigate', U.makeMobileUrl(res.get('_uri') ? 'edit' : 'make', res.vocModel.type, U.filterObj(res.attributes, U.isModelParameter)));
      }
      else {
        Events.trigger('choseMulti:' + propName, res, props); // let EditView handle it
      }
    }    
  });

  Events.on('chose', function(propName, valueRes) {
    var urlInfo = U.getCurrentUrlInfo();
    if (urlInfo.params.$createInstance == 'y') {
      var params = urlInfo.params.$props;
      params = params ? U.getQueryParams(params) : {};
      var prevTitle = urlInfo.params.$title;
      if (prevTitle.startsWith(CHOOSE_RULE_FOR))
        prevTitle = prevTitle.slice(CHOOSE_RULE_FOR.length);
      
      params.$title = prevTitle + ' ' + valueRes.get('label');
      
      Events.trigger('navigate', U.makeMobileUrl('make', valueRes.get('davClassUri'), params));
      return;
    }
    
    var res = redirecter.getCurrentChooserBaseResource(),
        ffwd = redirecter.isChooserFastForwarded(),
        editableProps = res.getEditableProps(urlInfo),
        merged = getEditableProps(editableProps),
        props = {};

    props[propName] = valueRes.getUri();
    if (propName == 'eventProperty' && res.vocModel.type.endsWith('commerce/trading/Rule')) {
      var subClassOf,
          wPropUri = valueRes.get('_uri'),
          propType = valueRes.get('propertyType'),
          isEnum = U.getTypeUri(wPropUri).endsWith('system/designer/EnumProperty');
      
      switch (propType) {
      case 'Text':
        subClassOf = isEnum ? 'commerce/trading/EnumRule' : 'commerce/trading/StringRule';
        break;
      case 'Date':
        subClassOf = 'commerce/trading/DateRule';
        break;
      case 'Link':
        subClassOf = 'commerce/trading/LinkRule';
        break;
      case 'YesNo':
        subClassOf = 'commerce/trading/BooleanRule';
        break;
      case 'Numeric':
      case 'Fraction':
      case 'Percent':
      case 'Money':
      default:
        subClassOf = 'commerce/trading/NumericRule';
        break;
      }
      
      this.currentChooser = null; 
      if (isEnum || propType == 'Link' || propType == 'YesNo') { // no subclasses
        var params = _.extend(U.filterObj(res.attributes, U.isNativeModelParameter), props);
        params.$title = res.get('feed.displayName') + ' ' + valueRes.get('davDisplayName') + ' IS...';
        if (isEnum) {
          params.enumeration = valueRes.get('range');
          params.enumerationRangeUri = valueRes.get('rangeUri');
        }
        else if (propType == 'Link') {
          params.resourceType = valueRes.get('range');
          params.resourceTypeRangeUri = valueRes.get('rangeUri');          
        }
          
        Events.trigger('navigate', U.makeMobileUrl('make', subClassOf, params), {
          replace: true
        });
        
        return;
      }

      var prevTitle = urlInfo.params.$title;
//      if (prevTitle && prevTitle.endsWith('property...'))
//        prevTitle = prevTitle.slice(0, prevTitle.length - 11) + ' - ';

      Events.trigger('navigate', U.makeMobileUrl('chooser', 'system/designer/WebClass', {
        subClassOfUri: G.defaultVocPath + subClassOf,
        $createInstance: 'y',
        $props: $.param(_.extend(U.filterObj(res.attributes, U.isNativeModelParameter), props)),
        $title: (prevTitle || res.get('feed.displayName')) + ' ' + valueRes.get('davDisplayName')
      }));
      
      return;
    }
    
    if (merged && merged.length == 1) {
      res.save(props, {
        userEdit: true
      }); // let redirect after save handle it
    }
    else {
      if (ffwd) {
        res.set(props);
        Events.trigger('navigate', U.makeMobileUrl(res.get('_uri') ? 'edit' : 'make', res.vocModel.type, U.filterObj(res.attributes, U.isModelParameter)), {
          replace: true
        });
      }
      else
        Events.trigger('chose:' + propName, valueRes, redirecter.currentChooserFor); // let EditView handle it
    }
  });
  
  Events.on('savedEdit', function(res, options) {
    if (!options || options.redirect !== false)
      redirecter.redirectAfterEdit(res, options);
  });
  
  Events.on('savedMake', function(res, options) {
    if (!options || options.redirect !== false)
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
