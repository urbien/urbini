//'use strict';
define([
  'globals',
  'events', 
  'utils',
  'vocManager',
  'views/BasicView'
//  ,
//  'views/BackButton',
//  'views/LoginButton',
//  'views/AddButton',
//  'views/MapItButton',
//  'views/AroundMeButton',
//  'views/MenuButton',
//  'views/PublishButton'
], function(G, Events, U, Voc, BasicView/*, BackButton, LoginButton, AddButton, MapItButton, AroundMeButton, MenuButton, PublishButton*/) {
  return BasicView.extend({
    template: 'headerTemplate',
    initialize: function(options) {
      _.bindAll(this, 'render', /*'makeWidget', 'makeWidgets',*/ 'fileUpload');
      this.constructor.__super__.initialize.apply(this, arguments);
      options = options || {};
      _.extend(this, options);
      this.viewId = options.viewId;
      if (this.resource) {
        this.resource.on('change', function(res, options) {
          if (options && options.skipRefresh)
            return;
          
          this.refresh();          
        }, this);
      }

      var res = this.model;
//      _.extend(this, options);
      this.template = this.makeTemplate(this.template);
      this.fileUploadTemplate = this.makeTemplate('fileUpload');
      var params = U.getHashParams();
      this.info = params['-info'];
      
      var commonTypes = G.commonTypes;
      var buttons = this.buttons;
      if (U.isAssignableFrom(res.vocModel, commonTypes.App)) {
        buttons.publish = true;
      }
      
      var btnOptions = {
        model: res, 
        parentView: this,
        viewId: this.viewId
      };
      
      var reqdButtons = [];
      buttons = U.filterObj(buttons, function(key, val) {
        return val;
      });
      
      for (var btn in buttons) {
        btn = btn.camelize(true); // capitalize first letter
        reqdButtons.push('views/{0}Button'.format(btn));
      }
      
      this.buttonViews = {};
      this.readyDfd = $.Deferred();
      this.ready = this.readyDfd.promise();
      U.require(reqdButtons, function() {
        var btns = arguments;
        var i = 0;
        for (var btn in buttons) {
          var model = arguments[i++];
          this.buttonViews[btn] = new model(btnOptions);
        }
        
        this.readyDfd.resolve();
      }, this);
      
      this.calcTitle();
      return this;
    },
    
    calcTitle: function() {
      if (typeof this.pageTitle !== 'undefined') {
        this.title = this.pageTitle;
        return this;
      }
      
      var hash = window.location.hash;
      hash = hash && hash.slice(1);
      var res = this.model;
      var title;
      if (hash && G.tabs) {
        decHash = decodeURIComponent(hash);
        var matches = _.filter(G.tabs, function(t) {return t.hash == hash || decodeURIComponent(t.hash) == decHash});
        if (matches.length)
          title = matches[0].title;
      }
      
      if (!title) {
        if (hash) {
          var params = U.getHashParams();
          title = params.$title;
          title = params.$title  &&  title.replace(/<\/?[^>]+(>|$)/g, "").replace(/&nbsp;/, ":").replace(/&nbsp;/g, " ");
        }

        if (!title) {
          if (res instanceof Backbone.Collection) 
            title = U.getPlural(res);
          else {
            title = U.getDisplayName(res);
            if (hash  &&  hash.indexOf('make/') == 0) {
//              title = this.pageTitle;
            }
            else {
              title = U.makeHeaderTitle(this.vocModel['displayName'], title);
//              this.pageTitle = this.vocModel['displayName'] + ": " + this.pageTitle;
            }
          }
        }
      }
      
      this.title = title;
      return this;
    },
    events: {
      'change #fileUpload': 'fileUpload'
    },
    fileUpload: function(e) {
      Events.stopEvent(e);      
      var params = U.getParamMap(window.location.hash);
      $('#fileUpload').attr('action', G.serverName + '/mkresource');
//      var returnUri = $('$returnUri');
//      if (returnUri) {
//        var fn = $(':file').value;
//        var idx = fn.lastIndexOf('/');
//        $('$returnUri').attr('value', returnUri + '&originalImage=' + encodeURIComponent(G.pageRoot + '/wf/' + params['$location']) + fn.slice(idx));
//      }
      document.forms["fileUpload"].submit();
      /*
      $.ajax({
        url     : G.serverName + '/mkresource',
        type    : 'POST',
        enctype: 'multipart/form-data',
        data    : $('#fileUpload').serialize(),
        success : function( data ) {
           alert('Submitted');
        },
        error   : function( xhr, err ) {
           alert('Error');     
        }
      });
      */    

    },
    
    refresh: function(options) {
      this.refreshTitle();
      if (!this.rendered)
        return this;
      
      this.renderSpecialButtons();
      return this;
    },
    
    render: function() {
      var args = arguments;
      this.ready.done(function() {
        this.renderHelper.apply(this, args);
      }.bind(this)); 
    },
    
    refreshTitle: function() {
      this.calcTitle();
      this.$('#pageTitle').html(this.title); 
    },
    
    renderSpecialButtons: function() {
      _.each(['enterTournament', 'forkMe', 'publish', 'doTry', 'testPlug'], function(btn) {
        this.$('#{0}Btn'.format(btn)).html("");
      }.bind(this));
      
      var commonTypes = G.commonTypes;
      var res = this.resource;
      if (res && G.currentUser.guest  &&  !this.isAbout) {
        var user = G.currentUser._uri;
        if (U.isAssignableFrom(this.vocModel, commonTypes.App)) {
          var appOwner = U.getLongUri1(res.get('creator') || user);
          var lastPublished = res.get('lastPublished');
          if ((user == appOwner || U.isUserInRole(U.getUserRole(), 'admin', res))  &&  (!lastPublished || lastPublished  &&  res.get('lastModifiedWebClass') > res.get('lastPublished')))
            this.doPublish = true;
          
          var noWebClasses = !res.get('lastModifiedWeblass')  &&  res.get('dashboard') != null  &&  res.get('dashboard').indexOf('http') == 0;
          var wasPublished = !this.hasPublish && (res.get('lastModifiedWeblass') < res.get('lastPublished'));
          if (/*res.getUri()  != G.currentApp._uri  &&  */ (noWebClasses ||  wasPublished)) {
            this.doTry = true;
            this.forkMe = true;
          }
        }

        else if (U.isAssignableFrom(this.vocModel, commonTypes.Handler)) {
//          var plugOwner = U.getLongUri1(res.get('submittedBy') || user);
//          if (user == plugOwner)
            this.testPlug = true;            
        }
        else {
          if (U.isAssignableFrom(this.vocModel, U.getLongUri1("media/publishing/Video"))  &&  params['-tournament'])
            this.enterTournament = true;
        }
      }

      var pBtn = this.buttonViews.publish;
      if (this.doPublish) {
        this.assign('div#publishBtn', pBtn);
      }      
      else {
        var options = ['doTry', 'forkMe', 'testPlug', 'enterTournament'];
        var settings = _.pick(this, options);
        _.each(options, function(option) {
          if (this[option]) {
            this.assign('div#{0}Btn'.format(option), pBtn, _.pick(this, option));
          }
          else {
//            $('#{0}Btn'.format(option)).css('display', 'none');
          }
        }.bind(this));
      }
      
      var hash = window.location.hash;
      var isChooser =  hash  &&  hash.indexOf('#chooser/') == 0;
      if (isChooser  &&  U.isAssignableFrom(this.vocModel, "Image")) {
        var params = U.getParamMap(hash);
        var forResource = params['forResource'];
        var location = params['$location'];
        var returnUri = params['$returnUri'];
        var pr = params['$prop'];
        if (forResource  &&  location  &&  pr) {
          var type = U.getTypeUri(forResource);      
          var cModel = U.getModel(type);
          var self = this;
          if (!cModel) {
            Voc.getModels(type).done(function() {
              cModel = U.getModel(type);
              if (cModel  &&  !cModel.properties[pr].readOnly) {
                var frag = document.createDocumentFragment();
                var rules = ' data-formEl="true"';
                U.addToFrag(frag, self.fileUploadTemplate({name: pr, forResource: forResource, rules: rules, type: type, location: location, returnUri: returnUri }));
                self.$el.append(frag);
              }
            });
          }
          else {
            var frag = document.createDocumentFragment();
            var rules = ' data-formEl="true"';
            U.addToFrag(frag, self.fileUploadTemplate({name: pr, forResource: forResource, rules: rules, type: type, location: location }));
            self.$el.append(frag);
          }
          
        }
      }
      
      if (!this.doPublish  &&  !this.doTry  &&  !this.forkMe  &&  !this.testPlug  &&  !this.enterTournament) 
        this.noButtons = true;      
    },
    
    renderHelper: function() {
      if (window.location.hash.indexOf("#menu") != -1)
        return this;
      
      var res = this.resource; // undefined, if this is a header for a collection view
      this.$el.html("");
      if (!this.doPublish  &&  this.doTry  &&  this.forkMe)
        this.$el.html(this.template({className: 'ui-grid-a'}));
      else
        this.$el.html(this.template());

      this.$el.prevObject.attr('data-title', this.pageTitle);
      this.$el.prevObject.attr('data-theme', G.theme.list);
      var frag = document.createDocumentFragment();
      var btns = this.buttonViews;
      if (btns.back)
        frag.appendChild(btns.back.render().el);
      if (btns.mapIt)
        frag.appendChild(btns.mapIt.render().el);
      if (btns.add)
        frag.appendChild(btns.add.render().el);
      if (btns.aroundMe)
        frag.appendChild(btns.aroundMe.render().el);
      if (btns.menu)
        frag.appendChild(btns.menu.render().el);
      if (btns.login)
        frag.appendChild(btns.login.render().el);
      
      var $ul = this.$('#headerUl');
      $ul.html(frag);
      
      this.$el.trigger('create');

      this.renderSpecialButtons();
      this.rendered = true;
      return this;
    }
  });
});
