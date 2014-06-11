define('views/CallInProgressHeader', [
  'globals',
  'events', 
  'utils',
  'vocManager',
  'views/BasicView'
], function(G, Events, U, Voc, BasicView) {
  return BasicView.extend({
    initialize: function(options) {
      _.bindAll(this, 'render', 'backToCall', 'hangUp', 'sendToCall');
      BasicView.prototype.initialize.apply(this, arguments);
      options = options || {};
    
      var self = this;
      this.listenTo(Events, 'endRTCCall', function() {
        self.destroy();
      });
      
      this.makeTemplate('callInProgressHeaderTemplate', 'template', this.modelType);
    },
    
    events: {
      'click #backToCall'         : 'backToCall',
      'click #hangUp'             : 'hangUp',
      'click #sendToCall'         : 'sendToCall'
    },
    
    render: function() {
      this.el.$html(this.template());
      this.el.$trigger('create');
    },
    
    backToCall: function(e) {
      Events.stopEvent(e);
      var cip = G.callInProgress,
          url = cip.url,
          hashIdx = url.indexOf('#'),
          path = url.slice(0, hashIdx),
          hash = url.slice(hashIdx + 1);
          
      if (window.location.href.startsWith(path))
        Events.trigger('navigate', hash);
      else
        window.location.href = url;
    },

    hangUp: function(e) {
      Events.trigger('hangUp');
      this.destroy();
    },
    
    sendToCall: function(e) {
      Events.stopEvent(e);
      if (this.resource) {
        Events.trigger('messageForCall:resource', {
          _uri: this.resource.getUri(),
          displayName: U.getDisplayName(this.resource)
        });
      }
      else {
        Events.trigger('messageForCall:list', {
          title: this.getPageTitle(),
          hash: this.hash
        }); 
      }
    }
  }, {
    displayName: 'CallInProgressHeader'
  });
});