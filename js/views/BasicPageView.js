//'use strict';
define('views/BasicPageView', [
  'globals',
  'utils',
  'events',
  'views/BasicView'
], function(G, U, Events, BasicView) {
  var PageView = BasicView.extend({
    initialize: function(options) {
      var self = this;
      BasicView.prototype.initialize.apply(this, arguments);
      
      this._loadingDfd.promise().done(function() {
        self.$el.one('pageshow', self.scrollToTop);
      });
      
      $(window).on('scroll', this.onScroll.bind(this));
      
//    if (navigator.mozApps) {
//      var getSelf = navigator.mozApps.getSelf();
//      getSelf.onsuccess = function(e) {
//        var isInstalled = getSelf.result != null;
//        if (!isInstalled) {
//          debugger;
//          var req = navigator.mozApps.install(G.firefoxManifestPath);
//          req.onsuccess = function(e) {
//            debugger;
//          };
//         
//          req.onerror = function(e) {
//            debugger;
//          };
//        }
//      };
//    }
    
      Events.on('tourStep', function(step) {
        if (self.isActive())
          self.runTourStep(step);
      });
      
      Events.on('headerMessage', function(data) {
        var error = data.error,
            errMsg = error ? error.msg || error : null,
            info = data.info,
            infoMsg = info ? info.msg || info : null,
            errorBar = self.$('div#headerMessageBar');
        
        if (!errorBar.length)
          return;
        
        errorBar.html("");
        errorBar.html(U.template('headerErrorBar')({error: errMsg, info: infoMsg, style: "background-color:#FFFC40;"}));
  
        var hash = U.getHash(), orgHash = hash;
        if (error && !error.glued)
          hash = U.replaceParam(hash, {'-error': null});
        if (info && !info.glued)
          hash = U.replaceParam(hash, {'-info': null});
        
        if (hash != orgHash)
          Events.trigger('navigate', hash, {trigger: false, replace: true});
      });
      
      this.onload(function() {
        var gluedError = self.hashParams['-gluedError'],
            error = gluedError || self.hashParams['-error'],
            gluedInfo = self.hashParams['-gluedInfo'],
            info = gluedInfo || self.hashParams['-info'];
        
        var data = {};
        if (info) {
          data.info = {
            msg: info,
            glued: !!gluedInfo
          };
        }
        if (error) {
          data.error = {
            msg: error,
            glued: !!gluedError
          };
        }
        
        if (_.size(data))
          Events.trigger('headerMessage', data);
      });        
    }
  });
  
  _.extend(PageView.prototype, {
    getPageView: function() {
      return this;
    },
    
    isPageView: function() {
      return true;
    },
    
    runTourStep: function(step) {
      var selector = step.get('selector'),
          tooltip = step.get('tooltip');
          
      if (selector && tooltip) {
        try {
          this.$(selector).data('hint', tooltip);
        } catch (err) {
          this.log('error', 'bad selector for tour step: {0}, err: '.format(selector), err);
        }
      }
      
      U.alert({msg: tooltip});
    },

    getPageTitle: function() {
      var title = this.$('#pageTitle');
      return title.length ? title.text() : null;
    },
    
    isActive: function() {
      return this.active;
    },
    
    isChildOf: function(view) {
      return false;
    }
  });
  
  return PageView;
});