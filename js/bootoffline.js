window.onload = function() {
  console.log('bootoffline init');
  function copout() {
    alert('You are currently offline');
  };
  
  var ls = localStorage;
  if (!ls || !ls.getItem)
    return copout();
  
  var g = ls.getItem('Globals');
  if (!g) {
    copout();
    return;
  }
  
  console.log('loading boot');
  g = JSON.parse(g);
  window.Lablz = g;

  var hash = window.location.hash;
  if (!hash || /\#home/.test(hash)) {
    var body = document.body;
    body.innerHTML = body.innerHTML + ls.getItem('homePage');
  }
  
  new Function("d", g.boot)(document);
}
