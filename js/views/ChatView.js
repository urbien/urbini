////'use strict';
//define('views/ChatView', [
//  'globals',
//  'underscore', 
//  'utils',
//  'events',
//  'views/BasicView',
//  'vocManager',
//  'collections/ResourceList'
//], function(G, _, U, Events, BasicView, Voc, ResourceList) {
//  // fluid width video http://css-tricks.com/NetMag/FluidWidthVideo/demo.php  
//  return BasicView.extend({
//    initialize: function(options) {
//      _.bindAll(this, 'render', 'restyleVideoDiv', 'onMediaAdded', 'onMediaRemoved', 'onDataChannelOpened', 
//                      'onDataChannelClosed', 'onDataChannelMessage', 'onDataChannelError', 'shareLocation', 
//                      'setUserId', 'requestLocation'); // fixes loss of context for 'this' within methods
//      this.constructor.__super__.initialize.apply(this, arguments);
//      options = options || {};
//    },
//    
//    
//    render: function() {
//      var vConfig = this.config.video;
//      this.$el.html(this.template({
//        video: this.hasVideo,
//        audio: this.hasAudio
//      }));
//      
//      if (this.isWaitingRoom && this.isClient) {
//        Events.trigger('headerMessage', {
//          info: 'Calling...'
//        });
//      }
//
//      this.$el.trigger('create');
////      this.$('#toggleVideoBtn').checkboxradio().checkboxradio('disable');
//
//      if (!this.rendered)
//        this.pageView.trigger('chat:on');
//        
//      this.ready.done(function() {
//        this.startChat();
//        this.finish();
//      }.bind(this));
//    }
//    
//    
//    
//    
//    
//  },
//  {
//    displayName: 'Chat'
//  });
//});
//  