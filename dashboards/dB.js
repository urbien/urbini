var pNold = -1;
var HminOld = -1;
var HmaxOld = -1;
var positionOld = -1;

var numberOfcolumns = 3;
if(document.getElementById('loggedContact').href == null) {
  alert('sorry, you can not edit dashboard. Please login.');
  window.location = (this.window.location+"").replace("Edit.html",".html");
}

// array of parameters for SET_DHTML
// {
var s = [CURSOR_MOVE];
for(j=1;j<=numberOfcolumns;j++) {
var ar = document.getElementById('panel'+j).getElementsByTagName('div');
  for(i=0;i<ar.length;i++)
    if(ar[i].id.indexOf("lyr") == 0 && ar[i].id.indexOf("hide") != ar[i].id.length-4)// && ar[i].id.indexOf("main") != ar[i].id.length-4)
      s[s.length] = ar[i].id;
}
// }

SET_DHTML(s);

// Array intended to reflect the order of the draggable items
// {
var aElts = new Array(numberOfcolumns);
for(j=1;j<=numberOfcolumns;j++) {
  var tmpArray = new Array();
  var ar = document.getElementById('panel'+j).getElementsByTagName('div');
  for(i=0;i<ar.length;i++){
    if(ar[i].id.indexOf("lyr") == 0 && ar[i].id.indexOf("hide") != ar[i].id.length-4)
      tmpArray[tmpArray.length] = dd.elements[(ar[i].id)];
  }
  aElts[j-1] = tmpArray;
}
// }

var availWindowWidth = document.body.offsetWidth;
availWindowWidth -= 50;
var dy      = 225;
var margTop = findPosY(document.getElementById('dashboardsTable'));//120;
if(margTop == 0)margTop = 200; // error when calculating findPosY - IE problem
//alert(findPosY(document.getElementById('imgT')));
var posOld;


function my_PickFunc() { // onPick event
  alert(allignBoardsInterval);
  clearInterval(parent.allignBoardsInterval);
  alert(allignBoardsInterval);
  // Store position of the item about to be dragged
  // so we can interchange positions of items when the drag operation ends
  posOld = dd.obj.y;
  pNold = Math.round(dd.obj.x / ((availWindowWidth + dd.obj.w/2)/ numberOfcolumns));
  HminOld = dd.obj.y;
  HmaxOld = dd.obj.y + document.getElementById('main' + dd.obj.name).offsetHeight;
  for(i=0;i<aElts[pNold].length;i++)
    if(dd.obj.name == aElts[pNold][i].name) {
      positionOld = i;
      break;
    }
}

function my_DragFunc() { // onDrag event
  availWindowWidth = document.body.offsetWidth;
  
  // calculate panel position 
  pN = Math.round(dd.obj.x / ((availWindowWidth + dd.obj.w/2)/ numberOfcolumns));
  
  if(pN >= 0) {
    
    /*
    //alert(pNold + "  " + HminOld + "  " + HmaxOld + "  " + positionOld);
    document.getElementById('currentPanel').value = pN;
    document.getElementById('boardTopOffset').value = dd.obj.y;
    document.getElementById('numberOfBoardsInTheColumn').value = aElts[pN].length;
    document.getElementById('boardsColumnTopHeight').value = "";
    for(z=0;z<aElts[pN].length;z++)
      document.getElementById('boardsColumnTopHeight').value += aElts[pN][z].y + "__" + document.getElementById('main' + aElts[pN][z].name).offsetHeight + ";  ";
    for(z=0;z<aElts[pN].length;z++)
      if(dd.obj.name!=aElts[pN][z].name && ((dd.obj.y + document.getElementById('main' + dd.obj.name).offsetHeight/2) > aElts[pN][z].y) && ((dd.obj.y+document.getElementById('main' + dd.obj.name).offsetHeight/2) < (aElts[pN][z].y + document.getElementById('main' + aElts[pN][z].name).offsetHeight))  )
        document.getElementById('newBoardPosition').value = z;
    */
    //pNold, HminOld, HmaxOld, positionOld.
    
    for(z=0;z<aElts[pN].length;z++)
      if(dd.obj.name!=aElts[pN][z].name && 
         ((dd.obj.y+document.getElementById('main' + dd.obj.name).offsetHeight/2) > aElts[pN][z].y) && 
         ((dd.obj.y+document.getElementById('main' + dd.obj.name).offsetHeight/2) < (aElts[pN][z].y + document.getElementById('main' + aElts[pN][z].name).offsetHeight))  
        ) {
        i = z;
      }

    if(pNold == pN)
      if((dd.obj.y+document.getElementById('main' + dd.obj.name).offsetHeight/2) > HminOld &&
         (dd.obj.y+document.getElementById('main' + dd.obj.name).offsetHeight/2) < HmaxOld)
        i = positionOld;

    // Calculate the snap position which is closest to the drop coordinates
    var y = dd.obj.y+dy/2;
    y = Math.max(margTop, Math.min(y - (y-margTop)%dy, margTop + (aElts[pN].length-1)*dy));
  
    // Index of the new position within the spatial order of all items
    // var i = (y-margTop)/dy;
  
    for(z=0;z<aElts.length;z++)
      for(k=0;k<aElts[z].length;k++)
        document.getElementById(aElts[z][k].name).style.backgroundColor = '#ffffff';

    try{
      if(aElts[pN][i] != dd.obj)
        document.getElementById(aElts[pN][i].name).style.backgroundColor = '#A8D3FF';
    } catch (ex) {}
    
    //makeBoardsAttached();
    // make boards be attached to the draggable title
    document.getElementById('main' + dd.obj.name).style.top  = dd.obj.y+dd.obj.h;
    document.getElementById('main' + dd.obj.name).style.left  = dd.obj.x;
  }
  
  //fadeBoards(); // d&d bug: if draggable layer contains link directly under mouse cursor - link is clicked on drop
}

function my_DropFunc() {  // onDrop event

  var panelN = Math.round(dd.obj.x / ((availWindowWidth + dd.obj.w/2)/ numberOfcolumns));
  for(z=0;z<aElts[panelN].length;z++)
    if(dd.obj.name!=aElts[panelN][z].name && 
       ((dd.obj.y+document.getElementById('main' + dd.obj.name).offsetHeight/2) > aElts[panelN][z].y) && 
       ((dd.obj.y+document.getElementById('main' + dd.obj.name).offsetHeight/2) < (aElts[panelN][z].y + document.getElementById('main' + aElts[panelN][z].name).offsetHeight))  
      ) {
      i = z;
    }
  if(pNold == panelN)
    if((dd.obj.y+document.getElementById('main' + dd.obj.name).offsetHeight/2) > HminOld &&
       (dd.obj.y+document.getElementById('main' + dd.obj.name).offsetHeight/2) < HmaxOld)
      i = positionOld;

  // set white background color to all boards
  // {
  for(z=0;z<aElts.length;z++)
    for(k=0;k<aElts[z].length;k++)
      document.getElementById(aElts[z][k].name).style.backgroundColor = '#ffffff';
  // }
  
  my_DropFuncD(panelN, i);
 
  setPanelsURIsLists();
}

function my_DropFuncD(pN, numb) { 
  // remove the object from the old place if the object is present in other columns 
  // (in the columns except pN)
  remove(aElts,dd.obj,pN);
 
  // Calculate the snap position which is closest to the drop coordinates
  var y = dd.obj.y+dy/2;
  y = Math.max(margTop, Math.min(y - (y-margTop)%dy, margTop + (aElts[pN].length-1)*dy));
  
  i = numb;
  // Index of the new position within the spatial order of all items
  //var i = (y-margTop)/dy;

  // find the "old" position of the board in the column. If there is no such object in the column, 
  // then this object must be added to the end of the array
  // {
  for(j=0;j<aElts[pN].length;j++){
    if(aElts[pN][j].name == dd.obj.name)
      break;
  }
  if(j == aElts[pN].length)
    aElts[pN][aElts[pN].length] = dd.obj;
  // }
  
  // replace elements in the array (in the column) after the moving from one column to another.
  // {
  if(i<j) {
    for(z = j; z>=i+1; z--)
      aElts[pN][z] = aElts[pN][z-1];
    aElts[pN][i] = dd.obj;
  } else {
      for(z=j;z<=i-1;z++)
        aElts[pN][z] = aElts[pN][z+1];
      aElts[pN][i] = dd.obj;
    }
  // }
   
  makeBoardsAlligned();
  
  // ----Start ---- New boards position must be saved----
  document.getElementById("dashBoard").target='dashboardIframe';
  setPanelsClearURIsLists();
  document.getElementById('location').value = window.location; 
  document.getElementById('isClosePanel').value = 'true';
  
  document.getElementById('dashBoardPanel1URIs').value = document.getElementById('panel1URIs').value;
  document.getElementById('dashBoardPanel2URIs').value = document.getElementById('panel2URIs').value;
  document.getElementById('dashBoardPanel3URIs').value = document.getElementById('panel3URIs').value;
  document.getElementById('dashBoardLocation').value = document.getElementById('location').value;
  document.getElementById('dashBoardIsClosePanel').value = document.getElementById('isClosePanel').value;
 
  //dashBoardForm.submit();
  document.getElementById('dashBoard').submit();
  
  document.getElementById('isClosePanel').value = 'false';
  document.getElementById("dashBoard").target=window;
  // ----Finish ---- New boards position must be saved----
  
}

// remove the board from the array (from the old position)
function remove(a,element,ex) {
 var found = false;
 try {
 for(i=0;i<a.length;i++) {
   if(i==ex)
     continue;
   for(j=0;j<a[i].length;j++){
     if(a[i][j].id==element.id){
       found = true;
       break;
     }
   }
   if(found) {
     for(;j<a[i].length;j++)
       a[i][j]=a[i][j+1];
     a[i].length = a[i].length-1; 
     break;
   }
 }
 } catch(er){}
}

function makeBoardsAlligned() {
  availWindowWidth = document.body.offsetWidth - 50;
  
  for(i=0;i<numberOfcolumns;i++) 
    if(aElts[i].length > 0) {
      aElts[i][0].moveTo(i*10 + i*availWindowWidth/numberOfcolumns + 10, margTop);
      document.getElementById(aElts[i][0].name).style.width = availWindowWidth/numberOfcolumns -10;
      
      for(j=1;j<aElts[i].length;j++) {
        //aElts[i][j].moveTo(i*10 + i*availWindowWidth/numberOfcolumns + 10, aElts[i][j-1].y+dy);
        //dd.obj.y+document.getElementById('main' + dd.obj.name).offsetHeight
        aElts[i][j].moveTo(i*10 + i*availWindowWidth/numberOfcolumns + 10, aElts[i][j-1].y + document.getElementById('main' + aElts[i][j-1].name).offsetHeight + 20);
        document.getElementById(aElts[i][j].name).style.width = availWindowWidth/numberOfcolumns - 10;
      }
    }
  
  makeAddRemovePanelAlligned();
  makeBoardsAttached();
}

function makeBoardsAttached() {
  availWindowWidth = document.body.offsetWidth - 50;
  
  for(i=0;i<numberOfcolumns;i++) 
    if(aElts[i].length > 0) {
      document.getElementById('main' + aElts[i][0].name).style.width = parseInt(document.getElementById(aElts[i][0].name).style.width);
      if(!document.all)
        document.getElementById('main' + aElts[i][0].name).style.width = parseInt(document.getElementById('main' + aElts[i][0].name).style.width) - 10;
      document.getElementById('main' + aElts[i][0].name).style.left  = document.getElementById(aElts[i][0].name).style.left;
      document.getElementById('main' + aElts[i][0].name).style.top   = parseInt(document.getElementById(aElts[i][0].name).style.top) + parseInt(document.getElementById(aElts[i][0].name).style.height);
      for(j=1;j<aElts[i].length;j++) {
        document.getElementById('main' + aElts[i][j].name).style.width = document.getElementById(aElts[i][j].name).style.width;
        if(!document.all)
          document.getElementById('main' + aElts[i][j].name).style.width = parseInt(document.getElementById('main' + aElts[i][j].name).style.width) - 10;
        document.getElementById('main' + aElts[i][j].name).style.left  = document.getElementById(aElts[i][j].name).style.left;
        document.getElementById('main' + aElts[i][j].name).style.top   = parseInt(document.getElementById(aElts[i][j].name).style.top) + parseInt(document.getElementById(aElts[i][j].name).style.height);
      }
    }
}
