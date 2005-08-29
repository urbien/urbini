// array of parameters for SET_DHTML
// {
var s = [CURSOR_MOVE];
for(j=1;j<=3;j++) {
var ar = document.getElementById('panel'+j).getElementsByTagName('div');
  for(i=0;i<ar.length;i++)
    if(ar[i].id.indexOf("lyr") == 0)
      s[s.length] = ar[i].id;
}
// }

SET_DHTML(s);

// Array intended to reflect the order of the draggable items
// {
var aElts = new Array([],[],[]);
for(j=1;j<=3;j++) {
var ar = document.getElementById('panel'+j).getElementsByTagName('div');
  for(i=0;i<ar.length;i++){
    if(ar[i].id.indexOf("lyr") == 0)
      aElts[j-1][aElts[j-1].length] = dd.elements[(ar[i].id)];
  }
}
// }

var availWindowWidth = document.body.offsetWidth;
availWindowWidth -= 100;
var dy      = 225;
var margTop = 50;
var posOld;

function my_PickFunc() { // onPick event
  // Store position of the item about to be dragged
  // so we can interchange positions of items when the drag operation ends
  posOld = dd.obj.y;
}

function my_DragFunc() { // onDrag event
  availWindowWidth = document.body.offsetWidth;
  //if(dd.obj.x < 450)
  if(dd.obj.x < availWindowWidth/3)
    pN = 0; // 0 - first panel
  //if(dd.obj.x >= 450 && dd.obj.x < 650)
  if(dd.obj.x >= availWindowWidth/3 && dd.obj.x < availWindowWidth*2/3)
    pN = 1; // 1 - second panel
  //if(dd.obj.x >= 650)
  if(dd.obj.x >= availWindowWidth*2/3)
    pN = 2; // 2 - third panel
  
  if(pN >= 0) {
    // Calculate the snap position which is closest to the drop coordinates
    var y = dd.obj.y+dy/2;
    y = Math.max(margTop, Math.min(y - (y-margTop)%dy, margTop + (aElts[pN].length-1)*dy));
  
    // Index of the new position within the spatial order of all items
    var i = (y-margTop)/dy;
  
    for(z=0;z<aElts.length;z++)
      for(k=0;k<aElts[z].length;k++)
        document.getElementById(aElts[z][k].name).style.backgroundColor = '#ffffff';

    try{
      if(aElts[pN][i] != dd.obj)
        document.getElementById(aElts[pN][i].name).style.backgroundColor = '#A8D3FF';
    } catch (ex) {}
  }
}

function my_DropFunc() {  // onDrop event

  // set white background color to all boards
  // {
  for(z=0;z<aElts.length;z++)
    for(k=0;k<aElts[z].length;k++)
      document.getElementById(aElts[z][k].name).style.backgroundColor = '#ffffff';
  // }

  //if(dd.obj.x < 450)
  if(dd.obj.x < availWindowWidth/3)
    my_DropFuncD(0); // 0 - first panel
  //if(dd.obj.x >= 450 && dd.obj.x < 650)
  if(dd.obj.x >= availWindowWidth/3 && dd.obj.x < availWindowWidth*2/3)
    my_DropFuncD(1); // 1 - second panel
  //if(dd.obj.x >= 650)
  if(dd.obj.x >= availWindowWidth*2/3)
    my_DropFuncD(2); // 2 - third panel
    
  setPanelsURIsLists();
}

function my_DropFuncD(pN) { 
  // remove the object from the old place if the object is present in other columns 
  // (in the columns except pN)
  remove(aElts,dd.obj,pN);
 
  // Calculate the snap position which is closest to the drop coordinates
  var y = dd.obj.y+dy/2;
  y = Math.max(margTop, Math.min(y - (y-margTop)%dy, margTop + (aElts[pN].length-1)*dy));
  
  // Index of the new position within the spatial order of all items
  var i = (y-margTop)/dy;

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
  dashBoardForm.submit();
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
  availWindowWidth = document.body.offsetWidth - 100;
  
  if(aElts[0].length > 0) {
    aElts[0][0].moveTo(20, 50); 
    document.getElementById(aElts[0][0].name).style.width = availWindowWidth/3;
    for(j=1;j<aElts[0].length;j++) {
      aElts[0][j].moveTo(20, aElts[0][j-1].y+dy);
      document.getElementById(aElts[0][j].name).style.width = availWindowWidth/3;
    }
  }

  if(aElts[1].length > 0) {
    aElts[1][0].moveTo(20 + availWindowWidth/3 + 20, 50);
    document.getElementById(aElts[1][0].name).style.width = availWindowWidth/3;
    for(j=1;j<aElts[1].length;j++) {
      aElts[1][j].moveTo(20 + availWindowWidth/3 + 20, aElts[1][j-1].y+dy);
      document.getElementById(aElts[1][j].name).style.width = availWindowWidth/3;
    }
  }
 
  if(aElts[2].length > 0) {
    aElts[2][0].moveTo(2*20 + availWindowWidth*2/3 + 20, 50);
    document.getElementById(aElts[2][0].name).style.width = availWindowWidth/3;
    for(j=1;j<aElts[2].length;j++) {
      aElts[2][j].moveTo(2*20 + availWindowWidth*2/3 + 20, aElts[2][j-1].y+dy);
      document.getElementById(aElts[2][j].name).style.width = availWindowWidth/3;
    }
  }

  makeAddRemovePanelAlligned();
}