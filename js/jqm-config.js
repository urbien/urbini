// see: http://jquerymobile.com/test/docs/pages/backbone-require.html
//'use strict';
define('jqmConfig', function() {
  var block = ['swipe', 'tap'];
  
  $(document).bind("mobileinit", function () {
      var $m = $.mobile;
//      console.log('mobileinit');
      $m.document.off("scroll");
      $m.window.off("scroll");
      $m.ajaxEnabled = false;
      for (var i = 0; i < block.length; i++) {
        delete $.event.special[block[i]];
      }
      
      $.event.special.swipe = null;
      $m.linkBindingEnabled = false;
      $m.hashListeningEnabled = false;
      $m.pushStateEnabled = false;
      $.support.touchOverflow = true;
      $m.touchOverflowEnabled = true;
//      $m.autoInitializePage = false;
//      $m.loadingMessageTextVisible = true;
//      $m.hidePageLoadingMsg();
//      $m.buttonMarkup.hoverDelay = 25;
//      $.event.special.swipe.scrollSupressionThreshold (default: 10px) – More than this horizontal displacement, and we will suppress scrolling.
//      $.event.special.swipe.durationThreshold = 1000;// (default: 1000ms) – More time than this, and it isn't a swipe.
//      $.event.special.swipe.horizontalDistanceThreshold (default: 30px) – Swipe horizontal displacement must be more than this.
//      $.event.special.swipe.verticalDistanceThreshold (default: 75px) – Swipe vertical displacement must be less than this.
// Remove page from DOM when it's being replaced
//      $('div[data-role="page"]').live('pagehide', function (event, ui) {
//          $(event.currentTarget).remove();
//      });      
//      $doc.bind("DOMNodeInserted", function(e) {
//        $(e.target).trigger('appendedToDOM');
//      });
//
//      $doc.bind("DOMNodeRemoved", function(e) {
//        console.debug("Removed: " + e.target.nodeName);
//      });
      
      // https://github.com/jogjayr/jQM-Button-Count-Badge
//      $.fn.mobileBadge = function(options) {
//        if (typeof options.count !== "number") {
//          throw "Specified count isn't a number";
//        }
//        if (options.position !== "topleft" && options.position !== "topright") {
//            throw options.position + " is not a valid position for the count badge. Specify 'topleft' or 'topright'";
//        }
//          
//        var settings = {
//          position: "topright",
//          classnames : "badge_variable"
//        },
//        badgeMarkup = "",
//        attachToElement = this, 
//        i = 0;
//        
//        if(options) {
//          $.extend(settings, options);
//        }
//  
//        //Allow setting custom classes for styling the badge
//        if (typeof settings.classnames === "string") {
//          badgeMarkup = "<span class='badge_fixed " + settings.classnames;
//        }
//        //If an array of class names is passed in
//        else if (typeof settings.classnames === "object") {
//          badgeMarkup = "<span class='badge_fixed ";
//          for(i = 0; i < settings.classnames.length; i++) {
//            if(typeof settings.classnames[i] === "string") {
//              badgeMarkup += " " + settings.classnames[i] + " ";
//            }
//          }
//        }
//    
//        if (settings.position === "topright" ) {
//          badgeMarkup += " badge_position_right'><span class='badge_count'>" + settings.count + "</span></span>";
//        }
//        
//        else {
//          badgeMarkup += " badge_position_left'><span class='badge_count'>" + settings.count + "</span></span>";
//        }
//        
//        if (this.is("input[type='radio']")) {
//          attachToElement = this.next();
//        }
//    
//        else if (this.is("button")) {
//          attachToElement = this.parent();
//        }
//        
//        attachToElement.children(".count_badge").remove();
//        attachToElement.append(badgeMarkup); 
//        return this;
//      };
  });
});
