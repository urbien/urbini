//'use strict';
define([
  'globals',
  'events', 
  'utils',
  'vocManager',
  'views/BasicView'
], function(G, Events, U, Voc, BasicView) {
  return BasicView.extend({
    template: 'headerTemplate',
    initialize: function(options) {
      _.bindAll(this, 'render', 'makeWidget', 'makeWidgets', 'fileUpload');
      this.constructor.__super__.initialize.apply(this, arguments);
//      if (this.resource)
//        this.resource.on('change', this.render, this);

      var res = this.resource || this.collection;
      _.extend(this, options);
      this.template = this.makeTemplate(this.template);
      this.fileUploadTemplate = this.makeTemplate('fileUpload');
      if (typeof this.pageTitle === 'undefined') {
        var hash = window.location.hash && window.location.hash.slice(1);
        if (hash && G.tabs) {
          decHash = decodeURIComponent(hash);
          var matches = _.filter(G.tabs, function(t) {return t.hash == hash || decodeURIComponent(t.hash) == decHash});
          if (matches.length)
            this.pageTitle = matches[0].title;
        }
        
        if (!this.pageTitle) {
          if (hash) {
            var params = U.getQueryParams(hash);
            this.title = params.$title;
            this.pageTitle = params.$title  &&  params.$title.replace(/<\/?[^>]+(>|$)/g, "").replace(/&nbsp;/, ":").replace(/&nbsp;/g, " ");
//            var v = hash.split('&');
//            for (var i=0; i<v.length; i++) {
//              var a = v[i].split('=');
//              if (a[0] == '$title')
//                this.pageTitle = a[1];
//            }
          }
          if (!this.pageTitle) {
            if (res instanceof Backbone.Collection) 
              this.pageTitle = U.getPlural(res);
            else {
              this.pageTitle = res.get('davDisplayName');
              if (!this.pageTitle) 
                this.pageTitle = U.getDisplayName(res);
              if (window.location.hash  &&  window.location.hash.indexOf('#make/') == 0)
                this.title = this.pageTitle;
              else {
                this.title = U.makeHeaderTitle(this.vocModel['displayName'], this.pageTitle);
                this.pageTitle = this.vocModel['displayName'] + ": " + this.pageTitle;
              }
            }
          }
        }
      }
      if (!this.title)
        this.title = this.pageTitle;
      this.$el.prevObject.attr('data-title', this.pageTitle);
      
      this.$el.prevObject.attr('data-theme', G.theme.list);
      var params = U.getHashParams();
      this.info = params['-info'];
      
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
    makeWidget: function(options) {
      var w = options.widget;
      if (typeof w != 'function') {
        w.render({append: true});
        return;
      }
      
      var res = this.resource || this.collection;
      w = new w({model: res, viewId: this.viewId, el: this.$(options.id)}).render({append: true});
      w.$(options.domEl).addClass(options.css);
      w.$el.trigger('create');
      return this;
    },
    makeWidgets: function(wdgts, options) {
      for (var i = 0; i < wdgts.length; i++) {
        options.widget = wdgts[i];
        this.makeWidget(options);
      }
      
      return this;
    },
    render: function() {
      if (window.location.hash.indexOf("#menu") != -1)
        return this;
      
      if (!this.doPublish  &&  this.doTry  &&  this.forkMe)
        this.$el.html(this.template({className: 'ui-grid-a'}));
      else
        this.$el.html(this.template());
      var l = this.buttons.left;
      l && this.makeWidgets(l, {domEl: 'li', id: '#headerUl'}); //, css: 'ui-btn-left'});
     
      var r = this.buttons.right;
      r && this.makeWidgets(r, {domEl: 'li', id: '#headerUl'}); //, css: 'ui-btn-right'});
      var self = this;
      if (this.doPublish) {
        U.require(['views/PublishButton'], function(PublishButton) {
          self.publish = new PublishButton({el: $('div#publishBtn', self.el), model: self.resource}).render();
        });
      }
      else {
        if (this.doTry) {
          U.require(['views/PublishButton'], function(PublishButton) {
            self.tryApp = new PublishButton({el: $('div#tryBtn', self.el), model: self.resource}).render({tryApp: true, forkMe: this.forkMe});
          });
        }
        if (this.forkMe) {
          U.require(['views/PublishButton'], function(PublishButton) {
            self.forkMeApp = new PublishButton({el: $('div#forkMeBtn', self.el), model: self.resource}).render({forkMe: true});
          });
        }
        if (this.testPlug) {
          U.require(['views/PublishButton'], function(PublishButton) {
            self.testPlug = new PublishButton({el: $('div#testPlugBtn', self.el), model: self.resource}).render({testPlug: true});
          });
        }
        if (this.enterTournament) {
          U.require(['views/PublishButton'], function(PublishButton) {
            self.enterTournament = new PublishButton({el: $('div#enterTournamentBtn', self.el), model: self.resource}).render({enterTournament: true});
          });
        }
      }

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
      if (G.currentUser.guest) {
        var log = this.buttons.log;
        log && this.makeWidgets(log, {domEl: 'li', id: '#headerUl'}); //, css: 'ui-btn-right'});
      }
      return this;
    }
  });
});
