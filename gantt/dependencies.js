var clicker = false;
var counter = 0;
var k       = 1;
var last    = null;

function showDeps(source, dep, numprojects) {
  if (clicker) {
    if (last != source) 
      counter = 0;
    counter++;
    if (last == source)
      last = null;
    for (var i = 1; i <= ((numprojects - 1)*3); i++) {
      document.getElementById('line' + i).from = "0,0";
      document.getElementById('line' + i).to   = "0,0";
    }
    k = 1;
  }

  if (!clicker && last == source) {
    if (counter%2 != 0) 
      draw(source, dep, numprojects);
  }

  if (last != source) {
    if (counter%2 != 0) 
      draw(source, dep, numprojects);
  }
  last = source;
  clicker = false;
  
}

function draw(source, dep, numprojects) {
      var td = document.getElementById("thisOne");
      var tdL = td.offsetLeft;
      while (td.offsetParent != null) {
	tdL += td.offsetParent.offsetLeft;
	td = td.offsetParent;      
      }

      var bar1 = document.getElementById(source);
      var i = bar1.offsetLeft;
      while (bar1.offsetParent != null) {
	i += bar1.offsetParent.offsetLeft;
	bar1 = bar1.offsetParent;      
      }

      bar1 = document.getElementById(source);
      var j = bar1.offsetTop + 10;
      while (bar1.offsetParent != null) {
	j += bar1.offsetParent.offsetTop;
	bar1 = bar1.offsetParent;      
      }

      var bar2 = document.getElementById(dep);
      var i1 = bar2.offsetLeft;
      while (bar2.offsetParent != null) {
	i1 += bar2.offsetParent.offsetLeft;
	bar2 = bar2.offsetParent;      
      }

      bar2 = document.getElementById(dep);
      var j1 = bar2.offsetTop;
      while (bar2.offsetParent != null) {
	j1 += bar2.offsetParent.offsetTop;
	bar2 = bar2.offsetParent;      
      }
      j1 += 10;
      document.getElementById('line' + k).from     = "" + i  + "," + (j)
      document.getElementById('line' + k).to       = "" + tdL + "," + (j);
      document.getElementById('line' + (k+1)).from = "" + tdL + "," + (j);
      document.getElementById('line' + (k+1)).to   = "" + tdL + "," + (j1);
      document.getElementById('line' + (k+2)).from = "" + tdL + "," + (j1);
      document.getElementById('line' + (k+2)).to   = "" + i1 + "," + (j1);
      k += 3;

}