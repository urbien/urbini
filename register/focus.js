  function focusOnUserName() {
    var f = document.forms['loginform'];
    if (f) {
      var jstest = f.elements['.jstest'];
      jstest.value = "ok"; // server will know that JavaScript worked
      var u = f.elements['j_username'];
      if (u && u.type && u.type != 'hidden')
         try {u.focus();} catch (e) {}
    }
    return true;
  }
  //addEvent(window, 'load', function() {setTimeout(focusOnUserName, 0);}, false);
  window.onload = focusOnUserName;