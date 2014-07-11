//'use strict';
define('views/SocialNetworkPage', [
  'globals',
  'utils',
  'events',
  'views/BasicPageView',
  'views/Header',
  'vocManager',
  'collections/ResourceList'
], function(G, U, Events, BasicPageView, Header, Voc, ResourceList) {
  var accessType = 'model/social/AccessForApplication';
  
  return BasicPageView.extend({
    _netUrls: {},
    initialize: function(options) {
      _.bindAll(this, 'click');
      BasicPageView.prototype.initialize.apply(this, arguments);
      
      var self = this;
      Voc.getModels(accessType).done(function() {
        self._getAccessResources().always(self.refresh);
      });

      this.headerButtons = {
        back: true,
        menu: true,
        rightMenu: !G.currentUser.guest
      };
      
      this.header = new Header({
        viewId: this.cid,
        parentView: this,
        model: this.model
      });
      
      this.addChild(this.header);

      this.makeTemplate('socialNetButtonTemplate', 'buttonTemplate');
      this.makeTemplate('socialNetworkPageTemplate', 'template');
    },
    
    _getAccessResources: function() {
      var self = this;
      return $.Deferred(function(defer) {        
        var accesses = self.socialAccesses = new ResourceList(null, {
          model: U.getModel(accessType),
          params: {
            contact: G.currentUser._uri
          }
        });
        
        if (G.currentUser.guest)
          return defer.reject();
        
        accesses.fetch({
          success: function() {
            defer.resolve();
          },
          error: function() {
            defer.reject(); 
          }
        });

        defer.promise().always(function() {
          _.each(['updated', 'added', 'reset'], function(event) {
            self.stopListening(accesses, event);
            self.listenTo(accesses, event, function() {
              self.refresh();
            });
          });
        });
      }).promise();      
    },
    
    events: {
      'click [data-role="button"]': 'click'
    },
    
    click: function(e) {
      Events.stopEvent(e);
      var btn = e.selectorTarget,
          net = btn.$data('net'),
          access = this.socialAccesses.where({
            socialNet: net
          }, true);
      
      if (access) {
        Events.trigger('navigate', U.makeMobileUrl('edit', access.getUri()));      
      }
      else {
        Events.trigger('navigate', U.buildSocialNetOAuthUrl({
          net: net,
          action: 'Connect'
        }));
      }
    },
    
    render: function() {
      var self = this;
      
      this.el.$html(this.template());
      this.assign('#headerDiv', this.header, {
        buttons: this.headerButtons
      });
      
      this.renderButtons();
      $('body').append(this.$el);
    },
    
    renderButtons: function() {
      var accesses = this.socialAccesses,
          self = this,
          counter = 0,
          btns = [],
          frag = document.createDocumentFragment();

      function getGridDiv() {
        return $('<div class="ui-grid-c"></div>');
      };
      
      _.each(G.socialNets, function(net, idx) {
        var btnInfo = {
          net: net.socialNet,
          icon: U.getSocialNetFontIcon(net.socialNet)
        };
        
        if (accesses) {
          var action,
              access = accesses.where({
                socialNet: net.socialNet,
                connected: true
              }, true),
              connected = access && access.get('connected');
           
          btnInfo.exists = !!access;
          btnInfo.connected = connected;
          btnInfo.linkText = connected ? 'Disconnect' : 'Connect';
        }
        
        btns.push(btnInfo);
      });
      
      var style = {
        0: 'a',
        1: 'b',
        2: 'c'
      }
      
      while (btns.length) {
        var block = '';
        _.each(btns.slice(0, 3), function(btn, idx) {          
          btn['class'] = 'ui-block-' + style[idx];
          block += self.buttonTemplate(btn);
        });
        
        block = '<div class="ui-grid-b">{0}</div>'.format(block);
        U.addToFrag(frag, block);
        btns = btns.slice(3);
      }
      
      this.$('#socialButtons').html(frag).trigger('create');
    },

    refresh: function() {
      this.renderButtons();
    }    
  }, {
    displayName: 'SocialNetworkPage'
  });
});