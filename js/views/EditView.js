//'use strict';
define('views/EditView', [
  'globals',
  'events', 
  'error', 
  'utils',
  'cache',
  'vocManager',
  'views/BasicView',
  '@widgets',
  'lib/fastdom'
], function(G, Events, Errors, U, C, Voc, BasicView, $m, Q) {
  var spinner = {
        name: 'loading edit view'
      },
      scrollerClass = 'i-txt',
      switchClass = 'boolean',
      secs = [/* week seconds */604800, /* day seconds */ 86400, /* hour seconds */ 3600, /* minute seconds */ 60, /* second seconds */ 1];
      
  function isHidden(prop, currentAtts, reqParams, isEdit) {
    var p = prop.shortName; 
    return prop.required  &&  currentAtts[p]  &&  prop.containerMember && (isEdit || (reqParams  &&  reqParams[p]));
  };
  
  function getRemoveErrorLabelsFunction(el) {
    var parent = el.parentNode;
    return function() {
      parent.$('label.error').$remove();
    };
  };

  var scrollerTypes = ['date', 'duration'];
//  var scrollerModules = ['mobiscroll', 'mobiscroll-datetime', 'mobiscroll-duration'];
  return BasicView.extend({
    autoFinish: false,
    initialize: function(options) {
      var self = this;
      _.each(scrollerTypes, function(s) {
        self['scroll' + s.camelize(true)] = function(e) {
          self.mobiscroll.apply(self, [e, s].concat(_.tail(arguments)));
        }
      });
    
      _.bindAll(this, 'render', 'refresh', 'submit', 'cancel', 'fieldError', 'set', 'resetForm', 
                      'onSelected', 'setValues', 'getInputs', 'getScrollers', 'getValue', 'addProp', 
                      'scrollDate', 'scrollDuration', 'capturedImage', 'onerror', 'onsuccess', 'onSaveError',
                      'checkAll', 'uncheckAll'); // fixes loss of context for 'this' within methods
      BasicView.prototype.initialize.apply(this, arguments);
      var type = this.vocModel.type;
      this.makeTemplate('propGroupsDividerTemplate', 'propGroupsDividerTemplate', type);
      this.makeTemplate('editRowTemplate', 'editRowTemplate', type);
      this.makeTemplate('hiddenPET', 'hiddenPropTemplate', type);
      this.makeTemplate('buyPopupTemplate', 'popupTemplate', type);
      this.makeTemplate('interfacePropTemplate', 'interfacePropTemplate', type);
      this.reqParams = _.getParamMap(window.location.href);
      
      this.resource.on('change', this.refresh, this);
      this.action = options && options.action || 'edit';
      this.isEdit = this.action === 'edit';
      this.saveOnEdit = options.saveOnEdit;
      
      this.isForInterfaceImplementor = U.isAssignableFrom(this.vocModel, "system/designer/InterfaceImplementor");
      /*
      var modelsDfd = $.Deferred(function(defer) {
        if (self.isForInterfaceImplementor) {
          self._interfaceUri = self.resource.get('interfaceClass.davClassUri') || self.hashParams['interfaceClass.davClassUri'];
          if (!self._interfaceUri)
            defer.resolve();   
          Voc.getModels(self._interfaceUri).done(defer.resolve);
        }
        else
          defer.resolve();        
      });
      */
      // maybe move this to router
      var codemirrorModes = U.getRequiredCodemirrorModes(this.resource, 'edit');
      this.isCode = !!codemirrorModes.length;

      var self = this;
      var codemirrorPromise;
      if (self.isCode)
        codemirrorPromise = U.require(['codemirror', 'codemirrorCss'].concat(codemirrorModes));
      else
        codemirrorPromise = G.getResolvedPromise();
      
      this.ready = $.when(codemirrorPromise, this.getFetchPromise());
      if (this.saveOnEdit) {
        this.listenToOnce(Events, 'pageChange', function(from, to) {
          // don't autosave new resources, they have to hit submit on those...or is that weird?
          if (!this.isChildOf(from) || this.resource.isNew() || U.getHash().startsWith('chooser')) 
            return;
          
          if (!this._submitted)
            this.submit(null, {fromPageChange: true});
        }.bind(this));
      }

      this.on('active', function() {
        self._canceled = false;
        self._submitted = false;
      });

      this.on('inactive', this.reset, this);
      return this;
    },
    events: {
//      'click #cancel'                     :'cancel',
//      'submit form'                       :'submit',
      'click .resourceProp'               :'chooser',
      'click input[data-duration]'        :'scrollDuration',
      'click input[data-date]'            :'scrollDate',
//      'click select[data-enum]': 'scrollEnum',
      'click .cameraCapture'              :'cameraCapture',
      'change .cameraCapture'             :'cameraCapture',
      'click #check-all'                  :'checkAll',
      'click #uncheck-all'                :'uncheckAll',
      'keydown input'                     :'onKeyDownInInput',
      'change select'                     :'onSelected',
      'change input[type="checkbox"]'     :'onSelected'
    },
    
    globalEvents: {
      'userSaved': 'submit',
      'userCanceled': 'cancel'
    },

    /** 
     * find all non-checked non-disabled checkboxes, check them, trigger jqm to repaint them and trigger a 'change' event so whatever we have tied to it is triggered (for some reason changing the prop isn't enough to trigger it)
     */
    checkAll: function() {
      $(this.form).find("input:checkbox:not(:checked):not(:disabled)").prop('checked', true).checkboxradio('refresh').change();
    },

    /**
     * find all checked non-disabled checkboxes, uncheck them, trigger jqm to repaint them and trigger a 'change' event so whatever we have tied to it is triggered (for some reason changing the prop isn't enough to trigger it)
     */
    uncheckAll: function() {
      $(this.form).find("input:checkbox:checked:not(:disabled)").prop('checked', false).checkboxradio('refresh').change();
    },

    capturedImage: function(options) {
      var prop = options.prop, 
          data = options.data;
      
      var props = {};
      props[prop] = data;
      props[prop + '.displayName'] = 'camera shot';
      this.setValues(props, {skipValidation: true, skipRefresh: false});
    },

    capturedVideo: function(options) {
      var attachmentsUrlProp = U.getCloneOf(this.vocModel, 'FileSystem.attachmentsUrl');
      if (!attachmentsUrlProp) {
        debugger;
        return;
      }
      
      var prop = options.prop, 
          data = options.data,
          name = options.name,
          res = this.resource,
          unsetOptions = {
            validate: false,
            skipRefresh: true, 
            userEdit: true,
            remove: true
          };

      var props = {};
      props[prop] = data;
      if (data instanceof Blob) {
        _.each(['audio', 'video'], function(sub) {          
          res.unset(prop + '.' + sub, unsetOptions);
        });
      }
      else {
        res.unset(prop, unsetOptions);
        for (var p in data) {
          props[prop + '.' + p] = data[p]; 
        }
        
        delete props[prop];
      }
      
      if (name)
        props[prop + '.displayName'] = name;
      
      this.setValues(props, {skipValidation: true, skipRefresh: false});
    },

    cameraCapture: function(e) {
      var self = this,
          target = e.currentTarget,
          propName = target.dataset.prop,
          prop = self.vocModel.properties[propName],
          isImage = prop.range.endsWith('model/portal/Image');
            
      function makeCameraPopup() {
        Events.stopEvent(e);
        var link = $(target);
        U.require('views/CameraPopup').done(function(CameraPopup) {
          if (self.CameraPopup) {
            self.CameraPopup.destroy();
            self.stopListening(self.CameraPopup);
          }
          
          self.cameraPopup = new CameraPopup({model: self.model, parentView: self, prop: link.data('prop')});
          self.cameraPopup.render();
          self.listenTo(self.cameraPopup, 'image', self.capturedImage);
          self.listenTo(self.cameraPopup, 'video', self.capturedVideo);
          self.cameraPopup.onload(function() {            
            self.addChild(self.cameraPopup);
          });
        });        
      }
      
      function getBlob(file) {
        return $.Deferred(function(defer) {
          if (file instanceof Blob)
            defer.resolve(file);
          else {
            return U.require('fileSystem').then(function(FS) {
              return FS.readAsBlob(file);
            });
          }
        }).promise();
      };
      
      function loadFile() {
        var file = target.files[0];
        if (isImage) {
          var reader = new FileReader();
          reader.onload = function(e) {
            self.capturedImage({
              prop: propName,
              data: e.target.result
            });
          };

          // Read in the image file as a data URL.
          reader.readAsDataURL(file);            
        }
        else {
          getBlob(file).then(function(blob) {
            self.capturedVideo({
              prop: propName,
              data: blob,
              name: file.name
            });
          })
        }
      };
      
      if (G.canWebcam) {
//        if (!isImage && !G.browser.chrome) {
//          U.alert({
//            msg: "Your browser doesn't support recording video"
//          });
//          
//          return;
//        }

        if (isImage || G.browser.chrome) {
          makeCameraPopup();
          return false;
        }
      }
      
      // not using camera popup, using <input type="file" /> possibly with accept="image/*|audio/*|video/*;capture=camera;"
      if (e.type === 'click' && e.currentTarget.tagName == 'A') {
        // trigger native file dialog or camera capture 
        Events.stopEvent(e);
        var input = $(target).parent().children().find('input[type="file"]');
        input.triggerHandler('click');
      }
      else if (e.type === 'change') {
        loadFile();
      }
      
      return false;
    },
    
    disable: function(msg) {
      Events.trigger('info', {info: msg, page: this.getPageView(), persist: true});
    },
    
    getScroller: function(prop, input) {
      var settings = {
        theme: 'ios',
        display: 'modal',
        mode:'scroller',
        durationWheels: ['years', 'days', 'hours', 'minutes', 'seconds'],
        label: U.getPropDisplayName(prop),
        shortName: prop.shortName,
        onSelect: this.onSelected,
        input: input
      };
      
      scrollerType = settings.__type = _.find(['date', 'duration'], function(type) {
        return _.has(input.dataset, type);
      });

      var scroller;
      switch (scrollerType) {
        case 'date':
        case 'duration':
          var isDate = scrollerType === 'date';
          scroller = $(input).mobiscroll()[scrollerType](settings);
          var val = input.value && parseInt(input.value);
          if (typeof val === 'number')
            scroller.mobiscroll(isDate ? 'setDate' : 'setSeconds', isDate ? new Date(val) : val, true);
          
          break;
      }
      
      return scroller;
    },

    mobiscroll: function(e, scrollerType, dontClick) {
      if (this.fetchingScrollers)
        return;
      
      this.fetchingScrollers = true;
      $(e.target).blur(); // hack to suppress keyboard that would open on this input field
      Events.stopEvent(e);
      
//      // mobiscrollers don't disappear on their own when you hit the back button
//      Events.once('pageChange', function() {
//        $('.jqm, .dw-modal').remove();
//      });
      
      var self = this;
      var thisName = e.target.name;
      var meta = this.vocModel.properties;
//      var scrollerModules = ['mobiscroll', 'mobiscroll-datetime', 'mobiscroll-duration'];
      var scrollers = self.getScrollers();
//      if (_.any(scrollers, function(s) { return s.dataset.duration }))
//        modules.push('mobiscroll-duration');
      
      U.require('mobiscroll', function() {
        self.loadedScrollers = true;
        self.refreshScrollers();
        if (!dontClick) {
          var scroller = _.find(scrollers, function(s) {return s.name === thisName; });
          if (scroller)
            $(scroller).click().focus();
        }
      });
    },

    onChoose: function(e, prop) {
      var hash = window.location.href;
      hash = hash.slice(hash.indexOf('#') + 1);
      var self = this, 
          commonTypes = G.commonTypes,
          vocModel = this.vocModel; 
      
      return function(options) {
        var chosenRes;
        var checked;
        var isBuy = options.buy;
        if (isBuy)
          chosenRes =  options.resource;
        else
          chosenRes = options;
        
        G.log(this.TAG, 'testing', chosenRes.attributes);
        var props = {};
        var link = e.target;
        if (!isBuy  &&  chosenRes.isA('Buyable')  &&  this.$el.find('.buyButton')) {
  //        Events.trigger('buy', this.model);
          var price = chosenRes.get('price');
          if (price  &&  price.value) { 
            Events.stopEvent(e);
            var $popup = $('#buy_popup');
            var dn = U.getDisplayName(chosenRes);
            var msg = 'Try ' + chosenRes.vocModel.displayName + ': ' + dn + 'for free for 3 days'; // + ' for ' + price.currency + price.value;
            var href = chosenRes.getUri();          
            var html = this.popupTemplate({href: href, msg: msg, displayName: dn, title: 'New ' + chosenRes.vocModel.displayName});
            if ($popup.length == 0) {
              $($(document).find($('.ui-page-active'))[0]).append(html);
              
    //          $('body').append(html);
              $popup = $('#buy_popup');
            }
            else {
              $('#buyMsg').html(msg);
              $('#buyLink').attr('href', href);
              $('#tryLink').attr('href', href);
              $('#buyName').html(dn);
            }
            $popup.trigger('create');
            $popup.popup().popup("open");
            return;
          }
        }
        
        var uri = chosenRes.getUri();
        props[prop] = uri;
        var resName = U.getDisplayName(chosenRes);
        if (resName)
          props[prop + '.displayName'] = resName;
        if (U.isAssignableFrom(chosenRes.vocModel, 'WebClass'))
          props[prop + '.davClassUri'] = chosenRes.get('davClassUri');
        this.setValues(props, {skipValidation: true, skipRefresh: false});
        var pr = vocModel.properties[prop];
        var dn = pr.displayName;
        if (!dn)
          dn = prop.charAt(0).toUpperCase() + prop.slice(1);
        var name = chosenRes.get('davDisplayName');
        link.innerHTML ='<span style="font-weight:bold">' + dn + '</span> <span style="float:right">' + chosenRes.get('davDisplayName') + "</span>";
        this.setResourceInputValue(link, uri);
        if (U.isAssignableFrom(vocModel, commonTypes.App)  &&  U.isAssignableFrom(chosenRes.vocModel, commonTypes.Theme)) {
          if (G.currentApp) {
            var cUri = G.currentApp._uri;
            if (cUri.indexOf('http') == -1) {
              cUri = U.getLongUri1(cUri);
              G.currentApp._uri = cUri;
            }
            if (this.resource.getUri() == cUri) {
              var themeSwatch = chosenRes.get('swatch');
              if (themeSwatch  &&  !G.theme.swatch != themeSwatch) 
                G.theme.swatch = themeSwatch;
            }
          }
        }
        
        Events.trigger('back');
//        this.router.navigate(hash, {trigger: true, replace: true});
      }.bind(this);
//      G.Router.changePage(self.parentView);
      // set text
    },
    
    onChooseMulti: function (e, prop)  {
      var link = e.target,
          self = this;
      
      return function(res, atts) {
        self.setValues(atts, {skipValidation: true, skipRefresh: false});
        self.setResourceInputValue(link, atts[prop + '.displayName']);
        Events.trigger('back');
      };
    },

    chooser: function(e) {
      Events.stopEvent(e);
      var el = e.currentTarget;
      var prop = el.name;
      // could be <span> or <label>
      if (!prop) {
        prop = e.currentTarget.parentElement.name;
      }

//      Events.off('chose:' + prop); // maybe Events.once would work better, so we don't have to wear out the on/off switch 
//      this.listenTo(Events, 'chose:' + prop, this.onChoose(e, prop));
      this.stopListening(Events, 'chose:' + prop); // maybe Events.once would work better, so we don't have to wear out the on/off switch 
      this.stopListening(Events, 'choseMulti:' + prop); // maybe Events.once would work better, so we don't have to wear out the on/off switch 
      this.listenTo(Events, 'chose:' + prop, this.onChoose(e, prop));
      this.listenTo(Events, 'choseMulti:' + prop, this.onChooseMulti(e, prop));
      Events.trigger('loadChooser', this.resource, this.vocModel.properties[prop], e);
      
//      var self = this;
//      var vocModel = this.vocModel, type = vocModel.type, res = this.resource, uri = res.getUri();
//      var pr = vocModel.properties[prop];
//      Events.off('chooser:' + prop); // maybe Events.once would work better, so we don't have to wear out the on/off switch 
//      this.listenTo(Events, 'chooser:' + prop, this.onChoose(e, prop));
//      var params = {};
//      if (pr.where) {
//        params = U.getQueryParams(pr.where);
//        for (var p in params) {
//          var val = params[p];
//          if (val.startsWith("$this")) { // TODO: fix String.prototyep.startsWith in utils.js to be able to handle special (regex) characters in regular strings
//            if (val === '$this')
//              params[p] = res.getUri();
//            else {
//              val = res.get(val.slice(6));
//              if (val)
//                params[p] = val;
//              else
//                delete params[p];
//            }
//          }
//        }
//        
//        if (!pr.multiValue  &&  !U.isAssignableFrom(vocModel, G.commonTypes.WebProperty)) {
//          params.$prop = prop;
//          return this.router.navigate(U.makeMobileUrl('chooser', U.getTypeUri(pr.range), params), {trigger: true});
//        }
//      }
//      
//      if (pr.multiValue) {
//        var prName = pr.displayName;
//        if (!prName)
//          prName = pr.shortName;
////        var url = U.makeMobileUrl('chooser', U.getTypeUri(pr.lookupFrom), {$multiValue: prop, $type: type, $forResource: uri});
//        params.$type = type;
//        params.$multiValue = prop;
//        if (this.action == 'make') {
////          if (U.isAssignableFrom(vocModel, 'AppInstall')) {
////            params.$checked = 'y'; // check all by default
////          }
//        }
//        else
//          params.$forResource = uri;
//        
//        params.$title = U.makeHeaderTitle(vocModel.displayName, prName);
//        var mvList = (e.currentTarget.text || e.target.textContent).trim(); //e.target.innerText;
//        mvList = mvList.slice(U.getPropDisplayName(pr).length + 1);
//        params['$' + prop] = mvList;
//        var typeUri = U.getTypeUri(pr.lookupFromType);
//        typeUri = G.classMap[typeUri] ? G.classMap[typeUri] : typeUri;
//        
//        this.router.navigate(U.makeMobileUrl('chooser', typeUri, params), {trigger: true});
//        return;
//      }
//      if (U.isAssignableFrom(vocModel, G.commonTypes.WebProperty)) { 
//        var title = U.getQueryParams(window.location.hash)['$title'];
//        var t;
//        if (!title)
//          t = vocModel.displayName;
//        else {
//          var idx = title.indexOf('</span>');
//          t =  title.substring(0, idx + 7) + "&nbsp;&nbsp;" + vocModel.displayName;
//        }
//        var domain = U.getLongUri1(res.get('domain'));
//        var rParams = {
//            $prop: pr.shortName,
//            $type:  vocModel.type,
//            $title: t,
//            $forResource: domain
//          };
//
//        if (vocModel.type.endsWith('BacklinkProperty')) {
//          var pf = G.currentApp._uri; //U.getLongUri1(res.get('parentFolder'));
//          if (G.currentUser.guest) 
//            _.extend(rParams, {parentFolder: pf});
//          else {
//            var params = {parentFolder: pf, creator: '_me'};
//            _.extend(rParams, {$or: U.getQueryString(params, {delimiter: '||'})});
//          }
//        }
////          var params = '&$prop=' + pr.shortName + '&$type=' + encodeURIComponent(this.vocModel.type) + '&$title=' + encodeURIComponent(t);
////          params += '&$forResource=' + encodeURIComponent(this.model.get('domain'));
//
////          this.router.navigate('chooser/' + encodeURIComponent(U.getTypeUri(pr.range)) + "?" + params, {trigger: true});
//        this.router.navigate(U.makeMobileUrl('chooser', U.getTypeUri(pr.range), rParams), {trigger: true});
//        return;
//      }
//      if (this.isForInterfaceImplementor) { 
//        var rParams = {
//            $prop: pr.shortName,
//            $type:  this.vocModel.type,
//            $title: 'Add-ons',
//            $forResource: this.resource.get('implementor')
//          };
//        this.router.navigate('chooser/' + encodeURIComponent(U.getTypeUri(pr.range)) + "?" + $.param(rParams), {trigger: true});
//        return;
//      }
//
//      if (pr.range != 'Class') {
//        var range = U.getLongUri1(pr.range);
//        var prModel = U.getModel(range);
//        var isImage = prModel  &&  U.isAssignableFrom(prModel, "Image");
//        if (!isImage  &&  !prModel) {
//          var idx = range.indexOf('model/portal/Image');
//          isImage = idx != -1  &&  idx == range.length - 'model/portal/Image'.length;
//        }
//        if (isImage) {
//          var prName = pr.displayName;
//          if (!prName)
//            prName = pr.shortName;
//          var rParams = { forResource: res.getUri(), $prop: pr.shortName, $location: res.get('attachmentsUrl'), $title: U.makeHeaderTitle(vocModel.displayName, prName) };
//          this.router.navigate(U.makeMobileUrl('chooser', U.getTypeUri(pr.range), rParams), {trigger: true});
//          return;
//        }
//      }
//      var rParams = {
//          $prop: pr.shortName,
//          $type: vocModel.type
//        };
//      if (this.reqParams) {
//        for (var p in this.reqParams) {
//          var prop = vocModel.properties[p];
//          if (prop  &&  prop.containerMember) {
//            rParams['$forResource'] = this.reqParams[p];
//            break;
//          }
//        }
//      }
//      
//      
//      this.router.navigate(U.makeMobileUrl('chooser', U.getTypeUri(pr.range), rParams), {trigger: true});
//        var w = pr.where;
//        var wOr =  pr.whereOr;
//        if (!w  &&  !wOr)
//          this.router.navigate('chooser/' + encodeURIComponent(U.getTypeUri(pr.range)), {trigger: true});
//        else {
//          var s = w || wOr;
//            
//          s = w.replace(' ', '').replace('==', '=').replace('!=', '=!');
//          s = w ? w.replace('&&', '&') : wOr; 
//          this.router.navigate('chooser/' + encodeURIComponent(U.getTypeUri(pr.range)) + '?' + (w ? '$and=' : '$or=') + encodeURIComponent(s), {trigger: true});
//        }
    },
    set: function(params) {
      _.extend(this, params);
    },
    resetForm: function() {
      $(this.$('form')).clearForm();      
    },
    getInputs: function() {
      return this.form.$('[data-formEl]');
    },
    getScrollers: function() {
      return this.form.$('.' + scrollerClass);
    },
    
    refreshScrollers: function() {
      if (this.loadedScrollers) {
        var meta = this.vocModel.properties;
        var self = this;
        this.getScrollers().$forEach(function(scroller) {
          $(scroller).mobiscroll('destroy');
          var prop = meta[scroller.name];
          self.getScroller(prop, scroller);
        });
      }
    },
    fieldError: function(resource, errors) {
      if (arguments.length === 1)
        errors = resource;
      
      var badInputs = [];
      var errDiv = this.form.querySelectorAll('div[name="errors"]');
      errDiv.$empty();
      errDiv = errDiv[0];
//      errDiv.empty();
      var inputs = this.getInputs(),
          msg,
          madeError = false,
          input,
          i;
      
      for (name in errors) {
        input = null;
        msg = errors[name];
        madeError = false;
        i = inputs.length;
        while (i--) {
          if (inputs[i].name == name) {
            input = inputs[i];
            break;
          }
        }
        
        var id;
        if (input) {
          badInputs.push(input);
          var id = input.id;
          var err = this.form.querySelector('label.error[for="{0}"]'.format(id));
          if (err) {
            err.innerText = msg;
            madeError = true;
          }
        }
        
        if (!madeError) {
          var label = document.createElement('label');
          label.innerHTML = msg;
          if (id)
            label.setAttribute('for', id);
          label.setAttribute('class', 'error');
          if (input.length)
            input.parentNode.insertBefore(label, input.nextSibling);
          else
            errDiv.appendChild(label);
        }
      }
      
      if (badInputs.length) {
        $('html, body').animate({
          scrollTop: $(badInputs[0]).offset().top - 10
        }, 1000);
      }
    },
    
//    redirect: function(options) {
//      if (!this.isActive()) // already redirected
//        return;
//      
//      Events.trigger('redirectAfterWriteOp', this.resource, options);
////      redirectAfterWriteOp(this.resource, options);
//    },
    
    getAtt: function(att) {
//      var edits = res.getUnsavedChanges();
      var result = {}, displayName;
//      if (_.has(edits, att)) {
//        result.value = edits[att];        
//        displayName = edits[att + '.displayName'];
//      }
//      else {
        result.value = this.resource.get(att);
        displayName = U.getValueDisplayName(this.resource, att);
//      }
      
      if (_.isUndefined(result.value))
        return undefined;
      
      if (displayName)
        result.displayName = displayName;
      
      return result;
    },
    
    getValue: function(input) {
//      var jInput = $(input);
      var val;
      
      var p = this.vocModel.properties[input.name];
      if (_.contains(input.classList, switchClass)) {
        if (input.type == 'checkbox')
          val = !!input.checked;
        else
          val = input.value === 'Yes' ? true : false;
      }
      else if (p && p.multiValue)
        val = this.getResourceInputValue(input); //input.innerHTML;
      else
        val = input.tagName === 'A' ? this.getResourceInputValue(input) : input.value;

      return val;
    },
    
    submitInputs: function() {
      var allGood = true;
      var changed = _.filter(this.inputs, function(input) {return input.dataset.modified === true});
      for (var i = 0; i < changed.length; i++) {
        var input = changed[i];
        allGood = this.setValues(input.name, this.getValue(input), {onValidationError: this.fieldError});
        if (!allGood)
          return false;
      }
      
      return true;
    },

    reset: function() {
      if (this.rendered)
        this.getInputs().$attr('disabled', null);
    },
    
    isSubmitted: function() {
      return this._submitted;
    },
    
    submit: function(e, options) {
      if (!this.isActive() || this.isSubmitted())
        return;

      if (G.currentUser.guest) {
        // TODO; save to db before making them login? To prevent losing data entry
        Events.trigger('req-login', {
          returnUri: U.getPageUrl(this.action, this.vocModel.type, res.attributes),
          dismissible: false
        });
        
        return;
      }
      
      var res = this.resource, 
          uri = res.getUri();
      
      if (!this.isEdit && uri) {
//        this.incrementBLCount();
//        this.redirect({forceFetch: true});
        return;
      }
      
      var allGood = this.submitInputs();
      if (!allGood)
        return;
      
      this._submitted = true;
//      var inputs = U.isAssignableFrom(this.vocModel, "Intersection") ? this.getInputs() : this.inputs;
      var inputs = this.getInputs();
      inputs.$attr('disabled', true);
      inputs = _.filter(inputs, function(input) { 
        return !input.classList.contains(scrollerClass) && 
               !input.classList.contains(switchClass) && 
               input.dataset.name != 'interfaceProperties'; 
      });
      
//      inputs = inputs.not('.' + scrollerClass).not('.' + switchClass).not('[name="interfaceProperties"]'); // HACK, nuke it when we generalize the interfaceClass.properties case 
//      inputs = inputs.not('.' + scrollerClass).not('.' + switchClass).not('[name="interfaceClass.properties"]'); // HACK, nuke it when we generalize the interfaceClass.properties case 
      var self = this,
          action = this.action, 
          url = G.apiUrl, 
          form = this.form, 
          vocModel = this.vocModel,
          meta = vocModel.properties;
      
      var unsaved = res.getUnsavedChanges();
      var atts = {};
      // TODO: get rid of this whole thing, resource.getUnsavedChanges() should have all the changes (except for those with default values, like select lists)
      for (var i = 0; i < inputs.length; i++) {
        var input = inputs[i];
        var name = input.name;
        if (_.isUndefined(name))
          continue;
        
        val = this.getValue(input);
//        if (name.indexOf('_select') == -1  ||  !meta[name.substring(0, name.length - 7)].multiValue) {
//          atts[name] = val;
//          _.extend(atts, U.filterObj(res.attributes, function(att) {return att.startsWith(name + '.')}));
//        }
//        else {
        if (val && name.indexOf('_select') == -1  &&  meta[name]  &&  meta[name].multiValue) { //((meta[name]  &&  meta[name].multiValue)  ||  (input.type == 'checkbox'  &&  input.checked))) {
          atts[name] = res.get(name);
          var v = val.split(',');
          atts[name + '_select'] = v;
//          var v = atts[name];
//          if (!v) {
//            v = [];
//            atts[name] = v;
//          }
//          v.push(val);
        }
        else if (input.dataset.code) {
          atts[name] = $(input).data('codemirror').getValue();
        }
        else if (input.type.startsWith('select'))
          atts[name] = val;
//        else if (!_.has(unsaved, name) && val)
//          atts[name] = val;
      }
      
      switch (action) {
        case 'make':
          url += 'm/' + encodeURIComponent(vocModel.type);
          break;
        case 'edit':
          url += 'e/' + encodeURIComponent(res.getUri());
          break;
      }
      
      atts = U.mapObj(atts, function(att, val) {
        return att.endsWith("_select") ? [att.match(/(.*)_select$/)[1], val.join(',')] : [att, val];
      });
      
      atts = _.extend({}, res.getUnsavedChanges(), atts);
      if (!res.isNew() && _.isEmpty(atts)) {
        if (options && options.fromPageChange)
          return;
        
        var prevHash = this.getPreviousHash();
        if (prevHash && !prevHash.startsWith('chooser/'))
          Events.trigger('back');
        else
          Events.trigger('navigate', U.makeMobileUrl('view', this.resource));
        
        return;
      }
      
      var errors = res.validate(atts, {validateAll: true, skipRefresh: true});
      if (typeof errors === 'undefined') {
        this.setValues(atts, {skipValidation: true});
        this.onsuccess();
        self.getInputs().$attr('disabled', false);
      }
      else
        this.onerror(res, errors);
    },
    cancel: function(e) {
      if (!this.isActive())
        return;
      
      if (this.action === 'edit') {
        this.resource.resetUnsavedChanges();
        this.resource.set(this.originalResource);
      }
       
      Events.trigger('cancel' + this.action.capitalizeFirst(), this.resource);
      this._canceled = this._submitted = true;
//      Events.trigger('back');
    },
    
    onSaveError: function(resource, xhr, options) {
      this._submitted = false;
      var err;
      if (resource.status) {
        err = xhr;
        xhr = resource;
        resource = null;
      }
      
      this.getInputs().$attr('disabled', false);
      var code = xhr ? xhr.code || xhr.status : 0;
      if (!code || xhr.statusText === 'error') {
        Errors.errDialog({msg: 'There was en error with your request, please try again', delay: 100});
        return;
      }
      
      var error = U.getJSON(xhr.responseText);
      var msg = error && error.details;
      // TODO: undo this hack
      if (msg && msg.startsWith("You don't have enough funds")) {
        Errors.errDialog({msg: "You don't have enough funds on your account, please make a deposit", delay: 100});
        var successUrl = window.location.href; 
        setTimeout(function() {
          var params = {
            toAccount: G.currentUser._uri,
            transactionType: 'Deposit',
            successUrl: successUrl
//            successUrl: G.serverName + '/' + G.pageRoot + '#aspects%2fcommerce%2fTransaction?transactionType=Deposit&$orderBy=dateSubmitted&$asc=0'
          };
          
          Events.trigger('navigate', 'make/aspects%2fcommerce%2fTransaction?' + $.param(params));
        }, 2000);
        return;
      }
      
      switch (code) {
        case 401:
          Events.trigger('req-login', {
            msg: 'You are not unauthorized to make these changes',
            dismissible: false
          });
//          Errors.errDialog({msg: msg || 'You are not authorized to make these changes', delay: 100});
//          this.listenTo(Events, 401, msg || 'You are not unauthorized to make these changes');
          break;
        case 404:
          debugger;
          Errors.errDialog({msg: msg || 'Item not found', delay: 100});
          break;
        case 409:
          debugger;
          Errors.errDialog({msg: msg || 'The resource you\re attempting to create already exists', delay: 100});
          break;
        default:
          debugger;
          Errors.errDialog({msg: msg || xhr.error && xhr.error.details, delay: 100});
//          debugger;
          break;
      }
    },
    
    onsuccess: function() {
      var self = this, res = this.resource;
      var props = _.extend({}, this.originalResource, U.filterObj(res.getUnsavedChanges(), function(name, val) {return /^[a-zA-Z]+/.test(name)})); // starts with a letter
//      var props = atts;
      if (this.isEdit && _.isEmpty(props)) {
//        debugger; // user didn't modify anything?
//        this.redirect();
        Events.trigger('back');
        return;
      }
            
      var sync = !U.canAsync(this.vocModel),
          spinner = {
            content: 'Saving...',
            name: 'saving-resource'
          };
    
      if (sync) {
        G.showSpinner(spinner);
      }
        
      res.save(props, {
        sync: sync,
        userEdit: true,
        success: function(resource, response, options) {
          self.getInputs().$attr('disabled', false);
          res._setLastFetchOrigin(null);
          self.disable('Changes submitted');
//          self.redirect();
          if (sync)
            G.hideSpinner(spinner);
        }, 
//        skipRefresh: true,
        error: self.onSaveError
      });
    },
    
    onerror: function(res, errors) {
      this._submitted = false;
      this.fieldError.apply(this, arguments);
      this.getInputs().$attr('disabled', null);
//      alert('There are errors in the form, please review');
    },

    refresh: function(data, options) {
      if (options && options.skipRefresh)
        return;
      
      var collection, modified;
      if (U.isCollection(data)) {
        collection = data;
        modified = arguments[1];
        if (collection != this.resource.collection || !_.contains(modified, this.resource.getUri()))
          return this;
      }

      if (this.loadedScrollers) {
        this.getScrollers().$forEach(function(scroller) {
          $(scroller).mobiscroll('destroy');        
        });
      }
      
      this.render();
      this.refreshScrollers();
    },
    
    onSelected: function(e) {
      var atts = {}, 
          res = this.resource, 
          input;
      
//      if (arguments.length > 1)
//        e = arguments[1];
      
      if (this.isForInterfaceImplementor && input.type === 'checkbox') {
        var checked = input.checked;
//        var val = res.get('interfaceClass.properties');
        var val = res.get(input.name);
        var props = val.split(',');
        var idx = props.indexOf(input.value);
        if (idx == -1 && checked)
//          this.setValues('interfaceClass.properties', val += ',' + input.value);
          this.setValues(input.name, val += ',' + input.value);

        else if (idx != -1 && !checked) {
          props.splice(idx, 1);
          this.setValues(input.name, props.join(','));
//          this.setValues('interfaceClass.properties', props.join(','));
        }
          
        return;
      }
      
      if (arguments.length > 1) {
        var val = arguments[0],
            scroller = arguments[1],
            settings = scroller.settings,
            name = settings.shortName;
        
        input = settings.input;
        
        switch (settings.__type) {
          case 'date': {
            atts[name] = new Date(val).getTime();
//            $(input).data('data-date', millis);
            break;
          }
          case 'duration': {
            atts[name] = scroller.getSeconds();
//            $(input).data('data-duration', secs);
            break;
          }
          case 'enum': {
//            $(input).data('data-enum', atts[name] = scroller.getEnumValue());
            break;
          }
          default:
            debugger;
        }
      }
      else {
        input = e.target;
        atts[input.name] = this.getValue(input);
      }

      this.setValues(atts, {onValidationError: this.fieldError, onValidated: getRemoveErrorLabelsFunction(input)});
    },
    
    setValues: function(key, val, options) {
      var atts;
      if (_.isObject(key)) {
        atts = key;
        options = val;
      } else {
        (atts = {})[key] = val;
      }
      
      if (this._canceled)
        return false;
      
      options = options || {};
      var res = this.resource;
      var onValidated = options.onValidated;      
      var onInvalid = options.onValidationError;
      if (onInvalid)
        res.once('invalid', onInvalid);
      
      var set = res.set(atts, _.extend({
        validate: true,
        skipRefresh: true, 
        userEdit: true
      }, options));
      
      if (set)
        onValidated && onValidated();
      
      return set;
    },

    addProp: function(info) {
      var prop = info.prop,
          p = prop.shortName;
      
      if (isHidden(prop, info.params, info.reqParams, info.isEdit)) {
        var rules = ' data-formEl="true"',
            longUri = U.getLongUri1(info.params[p]);
        
        U.addToFrag(info.frag, this.hiddenPropTemplate({
          value: longUri, 
          shortName: p, 
          id: info.formId, 
          rules: rules 
        }));        
      }
      else {
        var pInfo = U.makeEditProp(this.resource, prop, this.getAtt(p), info.formId);
        U.addToFrag(info.frag, this.editRowTemplate(pInfo));
      }
      
      info.displayedProps.push(p);
    },
    
//    addProp: function(info) {
//      var p = info.name;
//      if (!/^[a-zA-Z]/.test(p) || info.displayedProps[p])
//        return;
//      
//      var prop = info.prop;
//      if (!prop) {
////        delete json[p];
//        return;
//      }
//      if (info.params[p]  &&  prop.containerMember && (this.action == 'edit' || this.reqParams[p])) {
//        if (prop.required) {
//          var rules = ' data-formEl="true"';
//          var longUri = U.getLongUri1(info.params[p]);
//          U.addToFrag(info.frag, this.hiddenPropTemplate({value: longUri, shortName: p, id: info.formId, rules: rules }));
//        }
//        
//        return;
//      }
//      
//      if (_.has(info.backlinks, p))
//        return;
//      if (U.isCloneOf(prop, "Cancellable.cancelled", this.vocModel)) {
//        if (window.location.hash.startsWith('#make/')  || prop.avoidDisplayingInEdit)
//          return;
//      }
//      _.extend(prop, {shortName: p});
//      var res = this.resource;
//      if (!willShow(res, prop, info.userRole))
//        return;
//      
//      info.displayedProps[p] = true;
//      var pInfo = U.makeEditProp(this.resource, prop, this.getAtt(p), info.formId);
//      if (!info.groupNameDisplayed  &&  info.propertyGroupName) {
//        U.addToFrag(info.frag, this.propGroupsDividerTemplate({value: info.propertyGroupName}));
//        info.groupNameDisplayed = true;
//      }
//
//      U.addToFrag(info.frag, this.editRowTemplate(pInfo));
//    },
    getResourceInputValue: function(input) {
//      input = input instanceof $ ? input : $(input);
      return input.dataset.uri;
    },
    setResourceInputValue: function(input, value) {
//      input = input instanceof $ ? input : $(input);
      input.dataset.uri = value;
    },
    isCameraRequired: function() {
      var res = this.resource, 
          vocModel = this.vocModel,
          meta = vocModel.properties;
      
      if (res.isA("VideoResource")) {
        var videoProp = U.getCloneOf(vocModel, "VideoResource.video")[0];
        if (videoProp && !res.get(videoProp))
          return true;
      }

      if (res.isA("AudioResource")) {
        var audioProp = U.getCloneOf(vocModel, "AudioResource.audio")[0];
        if (audioProp && !res.get(audioProp))
          return true;
      }

      var cameraProps = U.getPropertiesWith(meta, [{name: 'cameraOnly', value: true}], true);
      if (cameraProps.length && _.any(cameraProps, function(p) {
        return !res.get(p.shortName);
      })) {
        return true;
      }
      
      return false;
    },
    /**
     * @return select list, checkbox, radio button, all other non-text and non-resource-ranged property inputs
     */
    render: function() {
      var self = this,
          args = arguments;
      
      this.ready.done(function() {
        G.showSpinner(spinner);
        self.renderHelper.apply(self, args);
        G.hideSpinner(spinner);
        self.finish();
      });
    },
    
    renderHelper: function(options) {
      var self = this;
      var args = arguments;
      var vocModel = this.vocModel;
      var meta = vocModel.properties;
      if (!meta)
        return this;
      
      var res = this.resource;
      if (!this.originalResource)
        this.originalResource = U.filterObj(res.attributes, U.isModelParameter);
      
      var type = res.type,
          reqParams = this.hashParams,
          editCols = reqParams['$editCols'],
          frag = document.createDocumentFragment(),
          displayedProps = [],//    
          params = U.filterObj(this.action === 'make' ? res.attributes : res.changed, U.isModelParameter),
          formId = G.nextId(),
          userRole = U.getUserRole(),
          editableProps = res.getEditableProps(this._hashInfo),
          props = editableProps.props,
          grouped = props.grouped,
          ungrouped = props.ungrouped,
          state = {
            values: res.attributes, 
            userRole: userRole, 
            frag: frag, 
            displayedProps: displayedProps, 
            params: params, 
            backlinks: editableProps.backlinks, 
            formId: formId
          };
      
      if (grouped.length) {
        var reqd = U.getPropertiesWith(meta, [{
            name: "required", 
            value: true
          }, {
            name: "readOnly", 
            values: [undefined, false]
          }]),
          
          init = this.originalResource;      

        for (var i = 0; i < grouped.length; i++) {
          var groupInfo = grouped[i],
              p = groupInfo.shortName,
              prop = groupInfo.prop,
              props = groupInfo.props;

          if (props.length > 1) {
            var pInfo = U.makeEditProp(res, prop, undefined, formId);
            U.addToFrag(frag, this.propGroupsDividerTemplate({
              value: U.getPropDisplayName(prop)
            }));
          }

          for (var j = 0; j < props.length; j++) {
            var p = props[j]; 
            this.addProp(_.extend(state, {
              name: p, 
              prop: meta[p] 
            }));
          }
        }
        
        for (var p in reqd) {
          if (_.isUndefined(init[p]) && !_.contains(displayedProps, p)) {
            this.addProp(_.extend(state, {
              name: p, 
              prop: reqd[p]
            }));
          }
        }        
      }
      
      for (var p in reqParams) {
        var prop = meta[p];
        if (prop  &&  !_.contains(displayedProps, p)) {//  &&  (!editCols && !editCols[p])) {
//          _.extend(state, {
//            name: p, 
//            prop: meta[p], 
//            val: reqParams[p]
//          });
          var h =  '<input data-formEl="true" type="hidden" name="' + p + '" value="' + reqParams[p] + '"/>';
          U.addToFrag(state.frag, h);
          displayedProps.push(p);
        }        
//        this.addProp(state);
      }
        
        
      var returnUri = reqParams['$returnUri']; 
      if (returnUri) {
        var h =  '<input data-formEl="true" type="hidden" name="$returnUri" value="' + returnUri + '"/>';
        U.addToFrag(state.frag, h);
      }
      
      if (!grouped.length || editCols) {
        _.each(ungrouped, function(p) {          
          _.extend(state, {name: p, prop: meta[p], isEdit: self.isEdit});
          self.addProp(state);
        });
      }        
      
      this.ul = this.$('#fieldsList').$html(frag)[0];
      if (G.isJQM()) {
        if (this.ul.$hasClass('ui-listview')) {
          $(this.ul).trigger('create').listview('refresh');
        }
        else {
          $(this.ul).trigger('create');
          this.$el.trigger('create');
        }
      }

      var doc = document;
      var form = this.form = this.$('form')[0];
      
      if (this.isForInterfaceImplementor) {
//        var start = +new Date();
        var iCl = res.get('interfaceClass.davClassUri');
        if (!iCl)
          iCl = reqParams['interfaceClass.davClassUri'];
        if (iCl) {
          Voc.getModels(iCl).done(function() {
            var frag = document.createDocumentFragment();
            var m = U.getModel(iCl);
            var imeta = _.toArray(m.properties).sort(function(a, b) {
              return a.mustImplement ? -1 : 1;
            });
            
            var interfaceProperties = self.resource.get('interfaceProperties');
            var ip = interfaceProperties ? interfaceProperties.split(',') : [];
            var props = '';
            _.each(imeta, function(p) {
              var prop = p.shortName;
              if (!prop  ||  !/^[a-zA-Z]/.test(prop)  ||  prop == 'davDisplayName' ||  prop == 'davGetLastModified')
                return;
              
              if (p.mustImplement || ip.indexOf(prop) != -1)
                props += prop + ',';
              
              U.addToFrag(frag, self.interfacePropTemplate({
                davDisplayName: U.getPropDisplayName(p), 
                _checked: p.mustImplement || _.contains(ip, prop) ? 'y' : undefined,
                disabled: p.mustImplement,
                required: p.mustImplement,
                interfaceProps: prop, 
                comment: p.comment
              }));
            });
            
            props = props.slice(0, props.length - 1);
            self.setValues('interfaceProperties', props);
            
            self.ul1 = self.$('#interfaceProps').$html(frag)[0];
            if (G.isJQM()) {
              if (self.ul1.$hasClass('ui-listview'))
                $(self.ul1).trigger('create').listview('refresh');
              else
                $(self.ul1).trigger('create');
            }
          
            self.redelegateEvents();
//            var checkboxes = self.form.querySelectorAll('input[type="checkbox"]'),
//                checkbox,
//                i = checkboxes.length;
//            
//            while (i--) {
//              checkbox = checkboxes[i];
//              checkbox.addEventListener('change', self.onSelected);
//            }
//            console.debug("building interfaceImplementor rows took: " + (+new Date() - start));
          });
        }
      }
      
//        this.$ul.listview('refresh');
      var inputs = this.inputs = this.getInputs(); //form.find('input');
      var initInputs = function(inputs) {
        _.each(inputs, function(input) {
          if (input.$hasClass(scrollerClass))
            return;
          
          var validated = getRemoveErrorLabelsFunction(input);
          var setValues = _.debounce(function() {
            self.setValues(this.name, this.value, {onValidated: validated, onValidationError: self.fieldError});
          }, 500);

          input.addEventListener('input', function() {
            var $input = $(input);
            if ($input.data('codemirror'))
              return;
            
            input.dataset.modified = true;
            setValues.apply(this, arguments);
          });
          
          input.addEventListener('blur', setValues);
        });
//        $in.keyup(onFocusout);
      };

      initInputs(inputs);        
      var reqd = form.$('[required]'),
          numReqd = reqd.length;
      
      while (numReqd--) {
        form.$('label[for="{0}"]'.format(reqd[numReqd].id)).$addClass('req');
      }
      
      var selects = form.getElementsByTagName('select'),
          select,
          numSelects = selects.length;

      while (numSelects--) {
        select = selects[numSelects];
        select.addEventListener('change', this.onSelected);
        
        // set initial values on resource
        var name = select.name,
            value;
        
        if (_.isUndefined(res.get(name)) || this.isForInterfaceImplementor)
          continue;
        
        if ((value = select.value) != null)
          this.setValues(name, value);
      }
      
      form.getElementsByTagName('input').$on('keydown', this._onKeyDownInInput); // end of function
      var edits = res.getUnsavedChanges();
      form.querySelectorAll('.resourceProp').$forEach(function(resProp) {
        // TODO: disable resource chooser buttons for image range properties that have cameraOnly annotation      
        var name = resProp.name;
        var prop = meta[name];
//        var $this = $(this);
        if (prop && prop.cameraOnly) {
          var span = document.createElement('span');
          span.innerHTML = '<i> (only live photo allowed)</i>';
          span.$after(resProp.querySelector('label'));
          
          resProp.addEventListener('click', function(e) {
            Events.stopEvent(e);
            var matched = self.$('[data-prop="{0}"]'.format(name)),
                match,
                i = matched.length;
            
            while (i--) {
              match = matched[i];
              match.dispatchEvent(new Event('click', {
                view: match,
                bubbles: true,
                cancelable: true
              }));
            }
          });
        }

        var value = res.get(name);
        if (_.isUndefined(value))
          value = resProp.value;
        
        self.setResourceInputValue(resProp, value);
      });
      
//      if (_.size(displayedProps) === 1) {
//        var prop = meta[_.getFirstProperty(displayedProps)];
//        if (Templates.getPropTemplate(prop, true) === 'resourcePET') {
//          this.$('a[name="' + prop.shortName + '"]').trigger('click');
//        }
//      }
      
      if (this.isCode && CodeMirror) {
        this.attachCodeMirror();
      }
      
      if (!this.rendered) {
        if (this.action === 'make' && this.isCameraRequired()) {
          this.listenTo(Events, 'pageChange', function() {
            if (this.isCameraRequired() && this.isActive()) { // have to check again, because it's only required when the props are not set yet
              $m.silentScroll(0);
              setTimeout(function() {
                self.$('a.cameraCapture').$trigger('click');
              }, 100);
            }
          }.bind(this));
        }
      }
        
      // only trigger the first you find
      _.any(['[data-date]', '[data-duration]','[data-enum]'], function(scrollerType) { 
        var scrollers = self.$(scrollerType);
        if (scrollers.length) {
          var scrollerWithValue = _.find(scrollers, function(s) { return !!s.value });
          if (scrollerWithValue) {
            $(scrollerWithValue).triggerHandler('click', [true]);
            return true;
          }
        }
      });
      
//      form.find('fieldset input[type="checkbox"]').$forEach(function() {
//        form.find('label[for="{0}"]'.format(this.id)).addClass('req');
//      });

      return this;
    },
    
    attachCodeMirror: function() {
      this.makeTemplate('resetTemplateBtnTemplate', 'resetTemplate', this.vocModel.type);
      var form = this.form;
      var view = this;
      var res = this.resource;
      var meta = this.vocModel.properties;
      var isTemplate = this.vocModel.type === G.commonTypes.Jst;
      var textareas = this.$('textarea[data-code]');
      
      _.each(textareas, function(textarea) {
        var code = textarea.dataset.code;
        var propName = textarea.name;
        var mode;
        switch (code) {
          case 'html':
            mode = 'text/html';
            break;
          case 'css':
            mode = 'css';
            break;
          default: {
            mode = 'javascript';
            break;
          }
        }
        
        editor = CodeMirror.fromTextArea(textarea, {
          dragDrop: false, // doesn't play nice with hammer
          mode: mode,
          tabMode: 'indent',
          lineNumbers: true,
          viewportMargin: Infinity,
          tabSize: 2
        });
        
        // TODO: fix this so it can save changes as you type, but not lose focus
        editor.on('change', Q.debounce(function() {
          var newVal = editor.getValue();
          view.setValues(propName, newVal);
        }, 500));
        
        var prop = meta[propName];
        var defaultText;
        if (isTemplate)
          defaultText = view.getOriginalTemplate(res.get('templateName')) || U.DEFAULT_HTML_PROP_VALUE;
        else
          defaultText = U['DEFAULT_{0}_PROP_VALUE'.format(code.toUpperCase())];
        
        var changeHandler;
        if (defaultText) {
          var reset = $.parseHTML(view.resetTemplate())[0];
          var resetText = reset.innerText;
          var didReset = false;
          var prevValue = defaultText;
          var resetHandler = function() {
            didReset = !didReset;
            prevValue = defaultText;
            reset.querySelector('.ui-btn-text').innerText = resetText;
            editor.off('change', resetHandler);
          };
          
          reset.addEventListener('click', function(e) {
            editor.off('change', resetHandler);
            Events.stopEvent(e);
            var newValue = prevValue;
            prevValue = editor.getValue();
            editor.setValue(newValue);
            didReset = !didReset;
            reset.querySelector('.ui-btn-text').innerText = didReset ? 'Undo reset' : resetText;
            if (didReset)    
              editor.on('change', resetHandler);
          });
          
          reset.$after(textarea.nextSibling);
          if (reset.button)
            reset.button();
          
          if (defaultText === textarea.value) {
            reset.classList.add('ui-disabled');
            changeHandler = function(from, to, text, removed, next) {
              if (!text && to.text && to.text.length) {
                reset.classList.remove('ui-disabled')
                editor.off('change', changeHandler);
              }
            };                
          }
        }
        
        changeHandler && editor.on('change', changeHandler);
        setTimeout(function() {
          // sometimes the textarea will have invisible letters, or be of a tiny size until you type in it. This is a preventative measure that seems to work
          editor.refresh();
          editor.scrollIntoView({line: 0, ch: 0});
          textarea.focus();
        }, 50);
        
        $.data(textarea, 'codemirror', editor);
      });
    },
    
    onKeyDownInInput: function() {
      // track enter key
      var keycode = (event.keyCode ? event.keyCode : (event.which ? event.which : event.charCode));
      if (keycode == 13) { // keycode for enter key
        // force the 'Enter Key' to implicitly click the Submit button
        Events.stopEvent(event);
        var input = event.target,
            name = input.name,
            value = input.value,
            parent = input.parentNode;
        
        var didSet = this.setValues(name, value, {onValidated: getRemoveErrorLabelsFunction(input), onValidationError: this.fieldError});
        if (didSet)
          this.submit();
        
        return false;
      } else  {
        return true;
      }
    }
  }, {
    displayName: 'EditView'
  });  
});
