/**
 * deciding what the next page should be turns out to be pretty complicated. The main issue is where to send the user after he created or edited a resource. Many times this can be specified in the model, using the
 *  
 *  onCreateRedirectTo
 *  onCreateRedirectToAction
 *  onCreateRedirectToMessage
 *  
 * directives. However, there are also a million special cases. Until they are standardized, there's the hackery below. 
 */
define('redirecter', ['globals', 'underscore', 'utils', 'cache', 'events', 'vocManager', 'collections/ResourceList'], function(G, _, U, C, Events, Voc, ResourceList) {
  var redirecter,
      interfaceImplementorType = 'system/designer/InterfaceImplementor',
      connectionType = G.commonTypes.Connection;
  
  function Redirecter() {
  };
  
  _.extend(Redirecter.prototype, {    
    _forType: {}, // for redirecting after edit/mkresource
    _chooserForType: {}, // for redirecting to chooser/
    _forAction: {},
    log: function() {
      var args = U.slice.call(arguments);
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
      Events.trigger('back');
      Events.trigger('messageBar', 'info', {
        message: 'Edits applied'
      });
    }
  };
  
  Redirecter.prototype.redirectAfterMake = function(res) {
    var self = this,
        args = arguments,
        options = {
          replace: true, 
          trigger: true
        },
        params = G.currentHashInfo.params,
        uri = res.getUri(),
        vocModel = res.vocModel,
        redirecter;

    if (params.$returnUri) { 
      Events.trigger('navigate', U.getUrlInfo().setUri(params.$returnUri), _.extend(options, {
        forceFetch: true
      }));
      
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
          window.location.href = redirect;
          return;
        }
      }
    }
    
    var redirectInfo = getRedirectInfo(res),
        action = redirectInfo.action || 'default';
        redirecter = this['_' + action] || this._default;
        
    redirecter.call(this, res, options, redirectInfo);
    
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
    U.wipe(info);
    
    var model = res.vocModel,
        hashInfo = G.currentHashInfo,
        params = hashInfo.params || {};
    
    _.extend(info, {
      action: model.onCreateRedirectToAction,
      to: model.onCreateRedirectTo,
      msg: model.onCreateRedirectToMessage,
      params: {}
    });
    
    if (!info.to && params.$backLink) 
      info.to = U.getContainerProperty(model);
    
    if (info.action) {
      info.action = info.action.toLowerCase();
//      switch (info.action) {
//      case 'mkresource'
//        info.route = 'make';
//        break;
//      case 'propfind'
//        info.route = 'view';
//        break;
//      case 'proppatch'
//        info.route = 'edit';
//        break;
//      case 'list'
//        info.route = 'list';
//        break;
//      default:
//        info.route = 'view';
//        break;
//      }
    }
    
    var prop = info.to && model.properties[info.to];
    if (prop) {
      info.prop = prop;
      if (prop.backLink)
        info.params[prop.backLink] = res.getUri();
      if (info.msg)
        info.params['-info'] = info.msg;
    }
    
    return info;
  };

  Redirecter.prototype._default = function(res, options) {
    Events.trigger('back');
    Events.trigger('messageBar', 'info', {
      message: '{0} "{1}" was created successfully'.format(res.vocModel.displayName, U.getDisplayName(res))
    });
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
    
    Events.trigger('navigate', U.makeMobileUrl(info.route || 'view', uri, info.params), options)
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
        fragment = U.makeMobileUrl('list', webPropType, {
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
    debugger;
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
  
  if (connectionType) {
    Redirecter.prototype._forType[connectionType] = function(res, options) {
      Events.trigger('navigate', U.makeMobileUrl('edit', res), _.defaults(options, {forceFetch: true}));
    }
  }

  Redirecter.prototype.redirectToChooser = function(res, prop, e, options) {
    options = options || {};
    var rParams,
        isMake = !res.get('_uri'),
        vocModel = res.vocModel,
        redirected;

    this.currentChooser = {
      'for': res,
      fast: options.replace
    };      

    if (prop.where) {
      var params = U.getQueryParams(prop.where);
      for (var p in params) {
        var val = params[p];
        if (val.startsWith("$this")) { // TODO: fix String.prototyep.startsWith in utils.js to be able to handle special (regex) characters in regular strings
          if (val === '$this')
            params[p] = res.getUri();
          else {
            val = res.get(val.slice(6));
            if (val)
              params[p] = val;
            else
              delete params[p];
          }
        }
      }
      
      if (!prop.multiValue  &&  !U.isAssignableFrom(vocModel, G.commonTypes.WebProperty)) {
        params.$prop = p;
        Events.trigger('navigate', U.makeMobileUrl('chooser', U.getTypeUri(prop.range), params), options);
        return;
      }
    }
    
    if (prop.multiValue) {
      this._multivalueChooser(res, prop, e, options);
      return;
    }
    
    redirected = _.any(_.keys(this._chooserForType), function(type) {
      if (U.isAssignableFrom(vocModel, type))
        return self._forType[type](res, options) !== false;
    });

    if (redirected)
      return;
    
    if (prop.range != 'Class') {
      var range = U.getLongUri1(prop.range);
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
        
        Events.trigger('navigate', U.makeMobileUrl('chooser', U.getTypeUri(prop.range), rParams), options);
        return;
      }
    }
    
    rParams = {
      $prop: prop.shortName,
      $type: vocModel.type
    };
    
    var reqParams = U.getCurrentUrlInfo().params;
    if (reqParams) {
      for (var p in res.attributes) {
        var prop = vocModel.properties[p];
        if (prop  &&  prop.containerMember  &&  reqParams[p]) {
          rParams['$forResource'] = reqParams[p];
          break;
        }
      }
    }
    
    Events.trigger('navigate', U.makeMobileUrl('chooser', U.getTypeUri(prop.range), rParams), options);
  };

  Redirecter.prototype._multivalueChooser = function(res, prop, e, options) {
    var params = {},
        vocModel = res.vocModel,
        type = vocModel.type,
        prName = prop.displayName,
        p = prop.shortName;
    
    if (!prName)
      prName = p;

    params.$type = type;
    params.$multiValue = p;
    if (!res.get('_uri')) // is an edit operation
      params.$forResource = uri;
    
    params.$title = U.makeHeaderTitle(vocModel.displayName, prName);
    var mvList = (e.currentTarget.text || e.target.textContent).trim(); //e.target.innerText;
    mvList = mvList.slice(U.getPropDisplayName(prop).length + 1);
    params['$' + p] = mvList;
    var typeUri = U.getTypeUri(prop.lookupFromType);
    typeUri = G.classMap[typeUri] ? G.classMap[typeUri] : typeUri;
    
    Events.trigger('navigate', U.makeMobileUrl('chooser', typeUri, params), options);
  };
  
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
  };
  
  Redirecter.prototype.fastForwardMkResource = function(res) {
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
//        Voc.getModels(prop.range).done(function(propModel) {
//          Events.trigger('navigate', U.makeMobileUrl('chooser', prop.range, {
//            
//          }), {replace: true});
//        });

        Events.trigger('loadChooser', res, prop, null, {replace: true});
        return true;
      }
    }
    
    return false;
  };

  Events.on('choseMulti', function(propName, list, checked) {
    debugger;
    var res = redirecter.getCurrentChooserBaseResource(),
        ffwd = redirecter.isChooserFastForwarded(),
        editableProps = res.getEditableProps(U.getCurrentUrlInfo()),
        merged = getEditableProps(editableProps),
        props = {};
    
    props[propName] = _.pluck(checked, 'value').join(',');
    props[propName + '.displayName'] = _.pluck(checked, 'name').join(',');
    if (merged && merged.length == 1) {
      res.save(props); // let redirect after save handle it
    }
    else {
      if (ffwd) {
        res.set(props);
        Events.trigger('navigate', U.makeMobileUrl(res.get('_uri') ? 'edit' : 'make', res.vocModel.type, U.filterObj(res.attributes, U.isModelParameter)));
      }
      else {
        Events.trigger('chose:' + propName, {
          list: list,
          resource: res,
          values: props
        }); // let EditView handle it
      }
    }    
  });

  Events.on('chose', function(propName, valueRes) {
    debugger;
    var res = redirecter.getCurrentChooserBaseResource(),
        ffwd = redirecter.isChooserFastForwarded(),
        editableProps = res.getEditableProps(U.getCurrentUrlInfo()),
        merged = getEditableProps(editableProps),
        props = {};
    
    props[propName] = valueRes.getUri();
    if (merged && merged.length == 1) {
      res.save(props); // let redirect after save handle it
    }
    else {
      if (ffwd) {
        res.set(props);
        Events.trigger('navigate', U.makeMobileUrl(res.get('_uri') ? 'edit' : 'make', res.vocModel.type, U.filterObj(res.attributes, U.isModelParameter)));
      }
      else
        Events.trigger('chose:' + propName, valueRes, redirecter.currentChooserFor); // let EditView handle it
    }
  });
  
  Events.on('savedEdit', function(res, options) {
    if (!options || options.redirect !== false)
      redirecter.redirectAfterEdit(res);
  });
  
  Events.on('savedMake', function(res, options) {
    if (!options || options.redirect !== false)
      redirecter.redirectAfterMake(res);
  });

  Events.on('loadChooser', function(res, prop, e, options) {
    redirecter.redirectToChooser(res, prop, e, options);
  });

  return (redirecter = new Redirecter());
});
