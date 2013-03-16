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
      this.viewId = options.viewId;
      if (this.resource)
        this.resource.on('change', this.renderTitle, this);

      var res = this.model;
//      _.extend(this, options);
      this.template = this.makeTemplate(this.template);
      this.fileUploadTemplate = this.makeTemplate('fileUpload');
      var params = U.getHashParams();
      this.info = params['-info'];
      
      var buttons = options.buttons;
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
      
      this.buttons = {};
      this.readyDfd = $.Deferred();
      this.ready = this.readyDfd.promise();
      U.require(reqdButtons, function() {
        var btns = arguments;
        var i = 0;
        for (var btn in buttons) {
          var model = arguments[i++];
          this.buttons[btn] = new model(btnOptions);
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
      
      var res = this.model;
      var title;
      var hash = window.location.hash && window.location.hash.slice(1);
      if (hash && G.tabs) {
        decHash = decodeURIComponent(hash);
        var matches = _.filter(G.tabs, function(t) {return t.hash == hash || decodeURIComponent(t.hash) == decHash});
        if (matches.length)
          title = matches[0].title;
      }
      
      if (!title) {
        if (hash) {
          var params = U.getQueryParams(hash);
          title = params.$title;
          title = params.$title  &&  title.replace(/<\/?[^>]+(>|$)/g, "").replace(/&nbsp;/, ":").replace(/&nbsp;/g, " ");
        }

        if (!title) {
          if (res instanceof Backbone.Collection) 
            title = U.getPlural(res);
          else {
            title = U.getDisplayName(res);
            if (window.location.hash  &&  window.location.hash.indexOf('#make/') == 0) {
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
    
    render: function() {
      var args = arguments;
      this.ready.done(function() {
        this.renderHelper.apply(this, args);
      }.bind(this));
    },
    
    renderTitle: function() {
      this.calcTitle();
      this.$('#pageTitle').html(this.title); 
    },
    
    renderHelper: function() {
      if (window.location.hash.indexOf("#menu") != -1)
        return this;
      
      this.$el.html("");
//      this.calcTitle();
      if (!this.doPublish  &&  this.doTry  &&  this.forkMe)
        this.$el.html(this.template({className: 'ui-grid-a'}));
      else
        this.$el.html(this.template());

      this.$el.prevObject.attr('data-title', this.pageTitle);
      this.$el.prevObject.attr('data-theme', G.theme.list);
//      this.renderTitle();
      var frag = document.createDocumentFragment();
      var btns = this.buttons;
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
      var pBtn = this.publishButton;
      if (this.doPublish) {
        this.assign('div#publishBtn', pBtn);
      }
      else {
        if (this.doTry) {
          this.assign('div#tryBtn', pBtn);
        }
        if (this.forkMe) {
          this.assign('div#forkMeBtn', pBtn);
        }
        if (this.testPlug) {
          this.assign('div#testPlugBtn', pBtn);
        }
        if (this.enterTournament) {
          this.assign('div#enterTournamentBtn', pBtn);
        }
      }
      
//      var self = this;
//      if (this.doPublish) {
//        U.require(['views/PublishButton'], function(PublishButton) {
//          self.publish = new PublishButton({el: $('div#publishBtn', self.el), model: self.resource}).render();
//        });
//      }
//      else {
//        if (this.doTry) {
//          U.require(['views/PublishButton'], function(PublishButton) {
//            self.tryApp = new PublishButton({el: $('div#tryBtn', self.el), model: self.resource}).render({tryApp: true, forkMe: this.forkMe});
//          });
//        }
//        if (this.forkMe) {
//          U.require(['views/PublishButton'], function(PublishButton) {
//            self.forkMeApp = new PublishButton({el: $('div#forkMeBtn', self.el), model: self.resource}).render({forkMe: true});
//          });
//        }
//        if (this.testPlug) {
//          U.require(['views/PublishButton'], function(PublishButton) {
//            self.testPlug = new PublishButton({el: $('div#testPlugBtn', self.el), model: self.resource}).render({testPlug: true});
//          });
//        }
//        if (this.enterTournament) {
//          U.require(['views/PublishButton'], function(PublishButton) {
//            self.enterTournament = new PublishButton({el: $('div#enterTournamentBtn', self.el), model: self.resource}).render({enterTournament: true});
//          });
//        }
//      }

      var isChooser = window.location.hash  &&  window.location.hash.indexOf('#chooser/') == 0;
      if (isChooser  &&  U.isAssignableFrom(this.vocModel, "Image")) {
        var params = U.getParamMap(window.location.hash);
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
      
//      if (G.currentUser.guest) {
//        var log = this.buttons.log;
//        log && this.makeWidgets(log, {domEl: 'li', id: '#headerUl'}); //, css: 'ui-btn-right'});
//      }
//
//      this.restyle();
      return this;
    }
  });
});
