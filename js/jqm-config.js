// see: http://jquerymobile.com/test/docs/pages/backbone-require.html
'use strict';
define(['jquery'], function($) {
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
      $.mobile.buttonMarkup.hoverDelay = 25;
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
  });
});
