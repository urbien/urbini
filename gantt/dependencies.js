var clicker = false;
var counter = 0;
var k       = 1;
var last    = "";

function showDeps(source, dep, numprojects) {
//  alert("showDeps ");
  // clean all lines
  if (clicker) {
    if (last != source) 
      counter = 0;
    counter++;
    for (var i = 1; i <= ((numprojects - 1)*3); i++) {
//      alert("clean " + i);
      document.getElementById('line' + i).from = "0,0";
      document.getElementById('line' + i).to   = "0,0";
    }
    k = 1;
  }
  if (!clicker && last == source) {
//    alert("draw ");

    if (counter%2 != 0) {
//      alert("draw 1");
      var i = document.getElementById(source).offsetLeft;
      var j = document.getElementById(source).offsetTop;
      j += 10;
      var td = document.getElementById("thisOne").offsetLeft;
      var i1 = document.getElementById(dep).offsetLeft;
      var j1 = document.getElementById(dep).offsetTop;
      j1 += 10;
      document.getElementById('line' + k).from     = "" + i  + "," + (j-4)
      document.getElementById('line' + k).to       = "" + td + "," + (j-4);
      document.getElementById('line' + (k+1)).from = "" + td + "," + (j-4);
      document.getElementById('line' + (k+1)).to   = "" + td + "," + (j1-4);
      document.getElementById('line' + (k+2)).from = "" + td + "," + (j1-4);
      document.getElementById('line' + (k+2)).to   = "" + i1 + "," + (j1-4);
      k += 3;
    }
  }
  if (last != source) {
//      alert("draw 2");

      var i  = document.getElementById(source).offsetLeft;
      var j  = document.getElementById(source).offsetTop;
      j += 10;
      var td = document.getElementById("thisOne").offsetLeft;
      var i1 = document.getElementById(dep).offsetLeft;
      var j1 = document.getElementById(dep).offsetTop;
      j1 += 10;
      document.getElementById('line' + k).from     = "" + i  + "," + (j-4)
      document.getElementById('line' + k).to       = "" + td + "," + (j-4);
      document.getElementById('line' + (k+1)).from = "" + td + "," + (j-4);
      document.getElementById('line' + (k+1)).to   = "" + td + "," + (j1-4);
      document.getElementById('line' + (k+2)).from = "" + td + "," + (j1-4);
      document.getElementById('line' + (k+2)).to   = "" + i1 + "," + (j1-4);
      k += 3;
  }
  last = source;
  clicker = false;
}
