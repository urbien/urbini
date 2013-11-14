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
    var body = document.body,
        head = document.head,
        hp = ls.getItem('homePage'),
        css = ls.getItem('homePageCss');
    
    body.innerHTML = body.innerHTML + hp;
    var style = d.createElement('style');
    style.type = 'text/css';
    style.textContent = css; 
    head.appendChild(style);
  }
  
  new Function("d", g.boot)(document);
}
