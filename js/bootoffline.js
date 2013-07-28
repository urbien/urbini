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

  var div = document.createElement('div');
  div.innerHTML = ls.getItem('homePage');
  document.getElementById('page').appendChild(div);

  new Function("d", g.boot)(document);
}
