window.onload = function() {
  console.log('bootoffline init');
  var copout = function() {
    alert('You are currently offline');
  };
  
  if (!localStorage || !localStorage.getItem)
    return this.copout();
  
  var g = localStorage.getItem('Globals');
  if (!g) {
    this.copout();
    return;
  }
  
  console.log('loading boot');
  g = JSON.parse(g);
  window.Lablz = g;

  var div = document.createElement('div');
  div.innerHTML = localStorage.getItem('homePage');
  document.getElementById('page').appendChild(div);

  new Function("d", g.boot)(document);
}
