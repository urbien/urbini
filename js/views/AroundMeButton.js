define([
  'globals',
  'cache!underscore', 
  'cache!backbone', 
  'cache!templates',
  'cache!views/ToggleButton' 
], function(G, _, Backbone, Templates, ToggleButton) {
  return ToggleButton.extend({
    btnId: 'aroundMe',
    template: 'aroundMeButtonTemplate',
    events: {
      'click #aroundMe': 'toggleAroundMe'
    },
    initialize: function(options) {
      this.constructor.__super__.initialize.apply(this, arguments);
      
      _.bindAll(this, 'render', 'toggleAroundMe');
      this.template = _.template(Templates.get(this.template));        
      return this;
    },
    isActive: function() {
      return window.location.hash.indexOf('-item=me') != -1;
    },
    toggleAroundMe : function() {
      this.active = !this.active;
      var model = this.model instanceof Backbone.Collection ? this.model.model : this.model.constructor;
      if (!this.active) {
        Backbone.history.navigate(model.shortName, {trigger: true});
        return this;
      }
      
      if (!navigator.geolocation) {
        alert("Sorry, your browser does not support geolocation services.");
        return this;
      }
        
      var iFaces = model.interfaces;
      if (!_.contains(iFaces, 'Locatable'))
        return this;
      
  //    if (!props.distance || !props.latitude || !props.longitude)
  //      return;
      
      var self = this;
      navigator.geolocation.getCurrentPosition(
        function(position) {
          return self.fetchAroundPosition(position.coords);
        },
        function(error) {
          var lastLocTime = G.userLocation.timestamp;
          if (lastLocTime && new Date().getTime() - lastLocTime < 1000)
            self.fetchAroundPosition(G.userLocation.location);
          else
            this.constructor.locationError(error);
        }
      );
      
      return this;
    },
    fetchAroundPosition : function(coords, item) {
      var model = this.model instanceof Backbone.Collection ? this.model.model : this.model.constructor;
      G.userLocation = {
        location: coords,
        timestamp: new Date().getTime()
      };
      
      Backbone.history.navigate(encodeURIComponent(model.type) + "?$orderBy=distance&$asc=1&latitude=" + coords.latitude + "&longitude=" + coords.longitude + '&-item=' + (item || 'me'), {trigger: true});
      return this;
    }
  },
  {
    locationError: function(error) {
      switch (error.code) { 
       case error.PERMISSION_DENIED:
         alert("Could not get position as permission was denied.");
         break;
       case error.POSITION_UNAVAILABLE:
         alert("Could not get position as this information is not available at this time.");
         break;
        case error.TIMEOUT:
          alert("Attempt to get position timed out.");
         break;
        default:
         alert("Sorry, an error occurred. Code: " + error.code + " Message: " + error.message);
         break;  
      }
    }
  });
});