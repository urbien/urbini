(function() {
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
  new Function("d", g.boot)(document);
})();