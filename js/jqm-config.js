// see: http://jquerymobile.com/test/docs/pages/backbone-require.html
//'use strict';
define('jqmConfig', function() {
  $(document).bind("mobileinit", function () {
      var $m = $.mobile;
//      console.log('mobileinit');
      $m.ajaxEnabled = false;
      $m.linkBindingEnabled = false;
      $m.hashListeningEnabled = false;
      $m.pushStateEnabled = false;
      $.support.touchOverflow = true;
      $m.touchOverflowEnabled = true;
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
      
      $.fn.clearForm = function() {
        return this.each(function() {
          var type = this.type, tag = this.tagName.toLowerCase();
          if (tag == 'form')
            return $(':input',this).clearForm();
          if (type == 'text' || type == 'password' || tag == 'textarea')
            this.value = '';
          else if (type == 'checkbox' || type == 'radio')
            this.checked = false;
          else if (tag == 'select') {
            var me = $(this);
            if (me.hasClass('ui-slider-switch')) {
              me.val(me.find('option')[0].value).slider('refresh');
            }
            else
              this.selectedIndex = -1;
          }
        });
      };

      var $doc = $(document);
      $doc.on('click','.closeparent', function(e) {
        e.preventDefault();
        $(this).parent().fadeTo(300, 0, function() {
          $(this).remove();
        });
      });
  
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
