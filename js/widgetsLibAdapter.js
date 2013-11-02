define('@widgets', ['globals', '../styles/styles.css', '../styles/common-template-m.css'].concat(Lablz._widgetsLib), function(G, css1, css2, $w) {
  var $doc = $(document);  
  $doc.on('click','.closeparent', function(e) {
    e.preventDefault();
    $(this).parent().fadeTo(300, 0, function() {
      $(this).remove();
    });
  });

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

  if (G.isJQM())
    return $.mobile;
  
  return {
    scrollTo: function() {
      debugger;
    },
    
    silentScroll: function() {
      debugger;
    },
    
    loading: function() {
      debugger;
    },
    
    showPageLoadingMsg: function() {
      debugger;
    },
    
    hidePageLoadingMsg: function() {
      debugger;
    }
  }
});