//'use strict';
define('views/EditPage', [
  'globals',
  'underscore',
  'utils',
  'events',
  'vocManager',
  'collections/ResourceList',
  'views/BasicPageView',
  'views/Header',
  'views/EditView',
  'views/ResourceImageView',
  'views/ResourceListView',
  'views/ControlPanel'
], function(G, _, U, Events, Voc, ResourceList, BasicPageView, Header, EditView, ResourceImageView, ResourceListView, ControlPanel) {
  var editParams = ['action', 'viewId'];
  return BasicPageView.extend({
    autoFinish: false,
    initialize: function(options) {
      _.bindAll(this, 'render', 'edit', 'home', 'set', 'resetForm');
      BasicPageView.prototype.initialize.apply(this, arguments);

  //    this.resource.on('change', this.render, this);
      this.makeTemplate('resourceEdit', 'template', this.vocModel.type);
      this.editOptions = _.extend({action: 'edit'}, _.pick(options, editParams));
      _.extend(this, this.editOptions);
      this.listenTo(Events, "mapReady", this.showMapButton);

      var self = this,
          res = this.resource,
          type = this.vocModel.type;

      this.hasHistoricalData = res.isAssignableFrom('commerce/trading/NumericRule') || res.isAssignableFrom('commerce/trading/Order');
      if (this.hasHistoricalData) {
        U.require('views/HistoricalDataView').done(function(HDV) {
          self.historicalDataView = new HDV({model: res, parentView: self});
          self.addChild(self.historicalDataView);
          if (self.rendered)
            self.renderHistoricalData();
        });
      }

  //    var json = res.toJSON();
  //    json.viewId = this.cid;
      this.settings = {viewId: this.cid};
      if (U.isAssignableFrom(res, "AppInstall")) {
        settings.submit = this.loc('allow');
        settings.cancel = this.loc('deny');
        this.editOptions.saveOnBack = false;
//        settings.noCancel = true;
      }

      var isGeo = this.isGeo();
      this.buttons = ['cancel', 'save'];
      this.header = new Header({
        model: res,
  //      pageTitle: this.pageTitle || res.get('davDisplayName'),
        buttons: this.buttons,
        viewId: this.cid,
        parentView: this,
        isEdit: true
      });

      this.addChild(this.header);

      var reqParams = _.getParamMap(window.location.href);
      var editCols =  reqParams['$editCols'];
      this.isVideo = res.isA('VideoResource');
      if (!editCols && !this.isVideo) {
        this.imageView = new ResourceImageView({model: res, parentView: this});
        this.addChild(this.imageView);
      }

      this.editView = new EditView(_.extend({model: res, parentView: this}, this.editOptions));
      this.addChild(this.editView);
      if (this.editParams)
        this.editView.set(this.editParams);
    },

//    shortcut: function() {
//      U.hasUnsetEditableProperties(this.resource);
//      var meta = this.resource.vocModel.properties,
//          atts = this.resource.attributes,
//          numUnset = 0;
//
//      for (var props in meta) {
//        if (meta[])
//      }
//    },

    set: function(params) {
      _.extend(this, params);
      if (this.editView)
        this.editView.set(params);
      else
        this.editParams = params;
    },
    events: {
      'click #edit'   : 'edit',
//      'click': 'click',
      'click #homeBtn': 'home',
      'click .historicalData [data-value]': 'onChoseHistoricalValue',
      // 'click .historicalData [data-diff]': 'onChoseHistoricalDiff',
      'click .saveBtn': 'submit',
      'click .cancelBtn': 'cancel'
    },

    myEvents: {
      'userSaved': 'submit',
      'userCanceled': 'cancel'
    },

    onChoseHistoricalValue: function(e) {
      var input = this.editView.$('input[type="text"]')[0];
      if (input)
        input.value = e.selectorTarget.$data('value');
    },

    // onChoseHistoricalDiff: function(e) {
    //   var input = this.editView.$('input[type="range"]')[0];
    //   if (input) {
    //     input.value = Math.min(Math.max(e.selectorTarget.$data('diff'), 0), 100);
    //     input.$trigger('input');
    //   }
    // },

    submit: function() {
      this.editView.submit.apply(this.editView, arguments);
    },

    cancel: function() {
      this.editView.cancel.apply(this.editView, arguments);
    },

    resetForm: function() {
      this.editView && this.editView.resetForm();
    },
    home: function() {
//      this.router.navigate('', {trigger: true, replace: false});
      var here = window.location.href;
      Events.trigger('navigate', here.slice(0, here.indexOf('#')));
      return this;
    },
    edit: function(e) {
      Events.stopEvent(e);
      Events.trigger('navigate', U.makeMobileUrl('edit', this.resource), {trigger: true, replace: true});
      return this;
    },

    render: function(options) {
      if (!this.rendered)
        this.addToWorld(null, true);

      var self = this;
      this.getFetchPromise().done(function() {
        self.renderHelper(options);
        self.finish();
      });
    },

    renderHelper: function(options) {
      this.el.$html(this.template(this.settings));
      var views = {
        '#resourceEditView': this.editView,
        '.headerDiv'       : this.header
      };

//      if (this.imageView)
//        views['div#resourceImage'] = this.imageView;

      this.assign(views);
      if (this.historicalDataView)
        this.renderHistoricalData();

//      if (G.theme.backgroundImage)
//        this.$('#resourceEditView').$css('background-image', 'url(' + G.theme.backgroundImage +')');

      // Comments inline
      var isComment = U.isAssignableFrom(this.vocModel, U.getLongUri1("model/portal/Comment"));
      if (!isComment)
        return this;

      var self = this;
      var ranges = [];
      ranges.push(this.vocModel.type);
      var inlineLists = {};
      Voc.getModels(ranges).done(function() {
        var params = _.getParamMap(window.location.href);
        var type = self.vocModel.type;
        var listModel = U.getModel(type);
        var inlineList = U.getResourceList(self.vocModel, U.getQueryString(params, true));
        if (!inlineList) {
          inlineList = new ResourceList(null, {model: self.vocModel, params: params});
          inlineList.fetch({
            success: function() {
//              var currentlyInlined =  res.inlineLists || {};
//              if (inlineList.size() && !res._settingInlineList) && !currentlyInlined[name]) {
//                res.setInlineList(name, inlineList);
//              }
            self.commentsView = new ResourceListView({model: inlineList, parentView: self, el: this.$('#comments')[0]});
            self.addChild(self.commentsView);
            self.assign('#comments', self.commentsView);

//              _.each(['updated', 'added', 'reset'], function(event) {
//                self.stopListening(inlineList, event);
//                self.listenTo(inlineList, event, function(resources) {
//                  resources = U.isCollection(resources) ? resources.models : U.isModel(resources) ? [resources] : resources;
//                  var options = {};
//                  options[event] = true;
//                  var commonParams = {
//                      model: rl,
//                      parentView: this
//                    };
//
//                  self.refresh(resources, options);
//                });
//              });
            }
          });
        }
      // end Comments
      });

      return this;
    },

    renderHistoricalData: function() {
      this.assign({
        '.historicalData': this.historicalDataView
      });
    },

    isSubmitted: function() {
      return this.editView.isSubmitted();
    }
  }, {
    displayName: 'EditPage'
  });
});
