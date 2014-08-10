//'use strict';
define('views/StaticPage', [
  'globals',
  'utils',
  'events',
  'views/BasicPageView',
  'views/Header'
], function(G, U, Events, BasicPageView, Header) {
  return BasicPageView.extend({
    style: {
      // background: 'rgba(255, 255, 255, 0.5)',
      height: '100%'
    },
    initialize: function(options) {
      options = options || {};
      BasicPageView.prototype.initialize.call(this, options);
      this.templateData = _.extend(this.getBaseTemplateData(), options.data);
      this.makeTemplate(options.template, 'template');
    },

    render: function() {
      if (this.template)
        this.el.$html(this.template(this.templateData));

      if (!this.rendered) {
        var headerUl = this.$('.headerUl')[0];
        if (headerUl)
          U.addBackAndMenu(headerUl);

        this.addToWorld(null, true);
      }
    }
  }, {
    displayName: 'StaticPage'
  });
});
