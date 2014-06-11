define('@widgets', ['globals'].concat(Lablz._widgetsLib), function(G) {
  var $w;
  if (G.isJQM()) {
    $w = $.mobile;
  }
  else {
    $w = {
      scrollTo: function() {
//        debugger;
      },
      
      silentScroll: function() {
//        debugger;
      },
      
      loading: function() {
//        debugger;
      },
      
      showPageLoadingMsg: function() {
//        debugger;
      },
      
      hidePageLoadingMsg: function() {
//        debugger;
      }
    }
  }
  
//  $w._urbienTemplates = ;
  return $w;
});