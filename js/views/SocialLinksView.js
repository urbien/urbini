//'use strict';
define('views/SocialLinksView', [
  'globals',
  'underscore',
  'events',
  'utils',
  'views/BasicView'
], function(G, _, Events, U, BasicView) {

  return BasicView.extend({
    events: {
      'click .ui-icon-twitter': 'share'
    },

    modelEvents: {
      'change': 'render'
    },

    initialize: function() {
      _.bindAll(this, 'render');
      BasicView.prototype.initialize.apply(this, arguments);
      this.makeTemplate('socialLinksTemplate', 'socialTemplate', this.vocModel.type);
    },

    render: function() {
      this.html(this.socialTemplate.call(this, {uri: this.resource.getUri()}));
    },

    share: function(e) {
//      var twitterLink = this.resource && this.resource.get('twitterLink');
//      if (twitterLink) {
//        Events.trigger('navigate', twitterLink);
//        return;
//      }

      if (!this.resource.get('isPublic')) {
        Events.stopEvent(e);
        Events.trigger('navigate', U.makeMobileUrl('edit', this.resource.getUri(), {
          '-info': 'Before you can share this tradle, edit it to make it public',
          $editCols: 'isPublic'
        }));
      }
//      this.getPageView().addTooltip({
//        el: this.$('.socialLinks .ui-icon-edit')[0],
//        tooltip: 'Before you can share this tradle, edit it to make it public'
//      });
    }
  });
});
