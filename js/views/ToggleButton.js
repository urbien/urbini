//'use strict';
define('views/ToggleButton', [
  'underscore', 
  'events',
  'views/BasicView'
], function(_, Events, BasicView) {
  return BasicView.extend({
    initialize: function(options) {
      _.bindAll(this, 'setStyle', 'toggleStyle', 'setStyle', 'isOn', 'reset', 'resetStyle');
      BasicView.prototype.initialize.apply(this, arguments);
      this._isOn = this._onByDefault = !!(options || {}).isOn || this.isOn();
    },
    globalEvents: {
      'pageChange': 'reset'
    },
    isOn: function() {
//      return this.$('a').hasClass('ui-btn-active');
      return this._isOn;
    },
    reset: function() {
      this._isOn = this._onByDefault;
      this.resetStyle();
    },
    resetStyle: function() {
      this.setStyle(this._onByDefault);
    },
    toggle: function() {
      this._isOn = !this._isOn;
      this.setStyle();
    },
    toggleStyle: function() {
      this.setStyle(!this._isOn);
      return this;
    },
    setStyle: function(on) {
      on = _.isUndefined(on) ? this.isOn() : on;
      var link = this.$('a');
//      var persistCl = 'ui-state-persist';
//      if (!link.hasClass(persistCl))
//        link.addClass(persistCl);
      
      var activeCl = 'ui-btn-active';
      if (on && !link.hasClass(activeCl))
        link.addClass(activeCl);
      else
        link.removeClass(activeCl);
    },
    render: function(options) {
      this.$el.html(this.template());
      this.setStyle();
      return this;
    }
  });
});
