// see: http://jquerymobile.com/test/docs/pages/backbone-require.html
//'use strict';
define('jqmConfig', function() {
  $(document).bind("mobileinit", function () {
//      console.log('mobileinit');
      $.mobile.ajaxEnabled = false;
      $.mobile.linkBindingEnabled = false;
      $.mobile.hashListeningEnabled = false;
      $.mobile.pushStateEnabled = false;
      $.support.touchOverflow = true;
      $.mobile.touchOverflowEnabled = true;
//      $.mobile.loadingMessageTextVisible = true;
//      $.mobile.hidePageLoadingMsg();
//      $.mobile.buttonMarkup.hoverDelay = 25;
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

      
      // Simple JQuery Draggable Plugin
      // https://plus.google.com/108949996304093815163/about
      // Usage: $(selector).drags();
      // Options:
      // handle            => your dragging handle.
   //                         If not defined, then the whole body of the
   //                         selected element will be draggable
      // cursor            => define your draggable element cursor type
      // draggableClass    => define the draggable class
      // activeHandleClass => define the active handle class
      //
      // Update: 26 February 2013
      // 1. Move the `z-index` manipulation from the plugin to CSS declaration
      // 2. Fix the laggy effect, because at the first time I made this plugin,
   //       I just use the `draggable` class that's added to the element
   //       when the element is clicked to select the current draggable element. (Sorry about my bad English!)
      // 3. Move the `draggable` and `active-handle` class as a part of the plugin option
      // Next update?? NEVER!!! Should create a similar plugin that is not called `simple`!
   
      (function($) {
          $.fn.drags = function(opt) {
   
              opt = $.extend({
                  handle: "",
                  cursor: "move",
                  draggableClass: "draggable",
                  activeHandleClass: "active-handle",
                  draggedClass: "__dragged__"
              }, opt);
   
              var $selected = null;
              var $elements = (opt.handle === "") ? this : this.find(opt.handle);
   
              return $elements.css('cursor', opt.cursor).on("mousedown", function(e) {

                  if(opt.handle === "") {
                      $selected = $(this);
                      $selected.addClass(opt.draggableClass);
                  } else {
                      $selected = $(this).parent();
                      $selected.addClass(opt.draggableClass).find(opt.handle).addClass(opt.activeHandleClass);
                  }
                  var drg_h = $selected.outerHeight(),
                      drg_w = $selected.outerWidth(),
                      pos_y = $selected.offset().top + drg_h - e.pageY,
                      pos_x = $selected.offset().left + drg_w - e.pageX;
                  $selected.on("mousemove", function(e) {
                      $selected.offset({
                          top: e.pageY + pos_y - drg_h,
                          left: e.pageX + pos_x - drg_w
                      });
                      
                      $selected.addClass(opt.draggedClass);
                  }).on("mouseup", function(e) {                    
                      $selected.off("mouseup");
                      $selected.off("mousemove");
                      $selected.removeClass(opt.draggableClass);
                  }).on("click", function(e) {
                    if ($selected && $selected.hasClass(opt.draggedClass)) {
                      $selected.removeClass(opt.draggedClass);
                      e.preventDefault();
                      e.stopImmediatePropagation();
                    }
                    
                    $selected = null;
                  });
                  
                  e.preventDefault(); // disable selection
              }).on("mouseup", function(e) {
                $selected.off("mousemove");
                if(opt.handle === "") {
                    $selected.removeClass(opt.draggableClass);
                } else {
                    $selected.removeClass(opt.draggableClass)
                        .find(opt.handle).removeClass(opt.activeHandleClass);
                }                
              });   
          }
          
      })(jQuery);
  
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
