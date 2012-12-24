// see: http://jquerymobile.com/test/docs/pages/backbone-require.html
define(['cache!jquery'], function($) {
  $(document).bind("mobileinit", function () {
      console.log('mobileinit');
      $.mobile.ajaxEnabled = false;
      $.mobile.linkBindingEnabled = false;
      $.mobile.hashListeningEnabled = false;
      $.mobile.pushStateEnabled = false;
      $.support.touchOverflow = true;
      $.mobile.touchOverflowEnabled = true;
      $.mobile.loadingMessageTextVisible = true;
      $.mobile.buttonMarkup.hoverDelay = 25;
      // Remove page from DOM when it's being replaced
//      $('div[data-role="page"]').live('pagehide', function (event, ui) {
//          $(event.currentTarget).remove();
//      });
  });
});
