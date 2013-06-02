//'use strict';
define('views/ChatPage', [
  'globals',
  'underscore', 
  'utils',
  'events',
  'views/BasicView',
  'views/ChatView',
  'views/Header'
], function(G, _, U, Events, BasicView, ChatView, Header) {
  // To avoid shortest-path interpolation.
  var D3Widgets;
  var BTN_ACTIVE_CLASS = 'ui-btn-active';
  return BasicView.extend({
    initialize: function(options) {
      _.bindAll(this, 'render', 'toggleChat', 'videoFadeIn', 'videoFadeOut', 'chatFadeIn', 'chatFadeOut', 'resize'); // fixes loss of context for 'this' within methods
      this.constructor.__super__.initialize.apply(this, arguments);
      options = options || {};
      
      this.autoVideo = options.autoVideo || this.hashParams['-autoVideo'] === 'y';
      this.isWaitingRoom = U.isWaitingRoom();
      this.isPrivate = U.isPrivateChat();
      this.headerButtons = {
        back: true,
        menu: true,
        login: G.currentUser.guest,
        rightMenu: true,
        video: this.isPrivate
      };

      var res = this.model;
      var headerOptions = {
        viewId: this.cid,
        parentView: this,
        buttons: this.headerButtons,
        model: res
      };
      
      var pageTitle = options.title;
      if (pageTitle)
        headerOptions.pageTitle = pageTitle;
      
      this.addChild('header', new Header(headerOptions));
  
//      this.video = params['-video'] !== 'n';
      this.video = this.isPrivate;
      
      var type = this.vocModel ? this.vocModel.type : null;
      this.makeTemplate('chatPageTemplate', 'template', type);
      this.addChild('chatView', new ChatView(_.extend({parentView: this}, _.pick(this, 'autoVideo', 'model'))));
      
      var readyDfd = $.Deferred();
      this.ready = readyDfd.promise();
//      var self = this;
//      if (this.resource) {
//        require(['views/ControlPanel']).done(function(ControlPanel) {
//          self.addChild('backlinks', new ControlPanel({
//            isMainGroup: true,
//            dontStyle: true,
//            model: self.resource
//          }));
//          
//          readyDfd.resolve();
//        });
//      }
//      else
        readyDfd.resolve();

      this.on('chat:on', this.chatFadeIn, this);
      this.on('chat:off', this.chatFadeOut, this);
      this.on('video:on', this.videoFadeIn, this);
      this.on('newRTCCall', this.videoFadeIn, this);
      this.on('video:fadeIn', this.videoFadeIn, this);
      this.on('video:fadeOut', this.videoFadeOut, this);

      var chatPage = this, chatView = this.chatView;
      // forward these methods to ChatView
      _.each(['getParticipants', 'getNumParticipants', 'getNumUnread', 'getRoomName', 'sendMessage', 'getUserId'], function(method) {
        chatPage[method] = function() {
          return chatView[method].apply(chatView, arguments);
        }
      });      
    },
    
    events: {
      'click #videoChat': 'toggleChat',
      'click #textChat': 'toggleChat',
      'click input': 'chatFadeIn',
      'resize': 'resize',
      'orientationchange' : 'resize'
    },

    toggleChat: function(e) {
      if (_.isUndefined(this._videoSolid))
        this._videoSolid = $('#videoChat').css('opacity') == 1;
      
      if (this._videoSolid)
        this.chatFadeIn();
      else if (this.chatView._videoOn)
        this.videoFadeIn();        
    },
    
    videoFadeIn: function(e) {
//      if (!this.chatView._videoOn)
//        this.trigger('video:on');
        
      this._videoSolid = true;
      if (this._chatSolid)
        this.trigger('chat:off');
      
      this.$('#videoChat').fadeTo(600, 1).css('z-index', 1001);
    },

    videoFadeOut: function(e) {
      this._videoSolid = false;
      if (!this._chatSolid)
        this.trigger('chat:on');
      
      this.$('#videoChat').fadeTo(600, 0.2).css('z-index', 0);
    },

    chatFadeIn: function(e) {
      this._chatSolid = true;
      if (this._videoSolid)
        this.trigger('video:fadeOut');
      
      this.$('#textChat').fadeTo(600, 1).css('z-index', 1001);
    },

    chatFadeOut: function(e) {
      this._chatSolid = false;
      if (!this._videoSolid && this.chatView._videoOn)
        this.trigger('video:fadeIn');
      
      this.$('#textChat').fadeTo(600, 0.2).css('z-index', 0);
    },
    
    render: function() {
      var args = arguments, self = this;
      this.ready.done(function() {
        self.renderHelper.apply(self, args);
      });
    },
    
    renderHelper: function() {
      this.$el.html(this.template({
        viewId: this.cid
      }));

      this.assign({
        'div#headerDiv' : this.header,
        'div#chatDiv'   : this.chatView
//        ,
//        'div#inChatBacklinks': this.backlinks 
      });

      if (this.resource && this.isPrivate) {
        this.paintInChatBacklinks();
        this.paintConcentricStats('inChatStats', _.extend({animate: true}, this.getStats()));
      }
//      else

//      if (this.resource)
//        this.loadResourceUI();      

      if (!this.$el.parentNode) 
        $('body').append(this.$el);
    },
    
    getStats: function() {
      var max = 300;
      var w = document.width || max;
      var h = document.height || max;
      return {
        width: Math.min(w, max),
        height: Math.min(w, max),
        circles: [{
          degrees: 200,
          text: 'Activity',
          fill: '#f00',
          opacity: 0.2
        },
        {
          percent: 85,
          text: 'Sleep',
          fill: '#0f0',
          opacity: 0.2
        },
        {
          percent: 140,
          text: 'Pain',
          fill: '#00f',
          opacity: 0.2
        }
//        ,
//        {
//          degrees: 250,
//          text: 'Blah1',
//          fill: '#ff0',
//          opacity: 0.5
//        },
//        {
//          degrees: 100,
//          text: 'Blah2',
//          fill: '#f0f',
//          opacity: 0.5
//        }
        ]
      };
    },
    
    paintInChatBacklinks: function() {
      var self = this;
      require(['views/ControlPanel']).done(function(ControlPanel) {
        var $bl = self.$("div#inChatBacklinks");
        $bl.drags();
        self.addChild('backlinks', new ControlPanel({
          isMainGroup: true,
          dontStyle: true,
          model: self.resource,
          parentView: self
//          ,
//          el: $bl[0]
        }));
        
        self.assign('div#inChatBacklinks', self.backlinks);
//        $bl.width(Math.min(150, self.innerWidth() / 5 || 150));
        $bl.find('[data-role="button"]').button();
//        self.backlinks.render();
//        readyDfd.resolve();
//        .find('a').click(function() {
//          debugger;
//          return false; // Disable links inside the backlinks box
//        });;
      });
    },
   
    resize: function(e) {
      if (this.resource && this.isPrivate) {
        this.paintInChatBacklinks();
        this.paintConcentricStats('inChatStats', this.getStats());
        this.restyleGoodies();
      }
    },
    
    restyleGoodies: function() {
      var $goodies = this.$('div#inChatGoodies'),
          $video = this.$('div#remoteVideos video');
      
      if (!$video.length)
        $video = this.$('div#localVideo video');
      
      if ($video.length) {
        var offset = $video.offset();
        $goodies.css({top: offset.top, left: offset.left + $video.width() - $goodies.find('div#inChatBacklinks').width()});
      }
      else
        $goodies.css({top: 'auto', left: 'auto'});
    },

    paintConcentricStats: function(divId, options) {
      var self = this, args = arguments;
      require(['lib/d3', 'd3widgets'], function(_d3_, widgets) {
        D3Widgets = widgets;
        self._paintConcentricStats(divId, options);
      });      
    },
    
    /**
     * @param circles - array of circle objects, from innermost to outermost, a single circle object having the properties:
     * {
     *   degrees: 50, // value: 0 to 360, effect: a circle painted "degrees" degrees of the way around, starting from 12 o'clock, clockwise
     *   percent: 50, // value: 0 to 100, effect: a circle painted "percent" of the way around, starting from 12 o'clock, clockwise
     *   fill: #555, // circle color
     *   fill: #555, // circle color
     * }
     */
    _paintConcentricStats: function(divId, options) {
      var self = this;
      D3Widgets.concentricCircles(this.$('#' + divId), options).done(function() {
        self.$('#inChatStats svg').drags();
      });
    }
  }, {
    displayName: 'ChatPage'
  });
});