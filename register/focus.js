  function focusOnUserName() {
    var f = document.loginform;
    if (f != null) {
      if (f.j_username.type != null && f.j_username.type != "hidden")
         f.j_username.focus();
    } 
    return true;
  }
  addEvent(window, 'load', function() {setTimeout(focusOnUserName, 0);}, false);
