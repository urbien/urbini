// add onload functions only if inside iframe
if (window.parent != window) {

   /* load bottomFrame iframe into a pane2 */
   function onLoadPane2() {
     loadDiv('bottomFrame', 'pane2');
   }

   function loadDiv(frameId, divId) {    
     var bottomFrame = window.parent.frames[frameId];
     var pane2       = window.parent.document.getElementById(divId);
     if (pane2) {

       var body = bottomFrame.document.body;
       if (body) {
         pane2.innerHTML = body.innerHTML;
       }
     }
     return false;
   }

   function onLoadPopup() {
     parent.popupFrameLoaded = true;
   }

   if (window.name == "bottomFrame") {
     addEvent(window, 'load', function() {setTimeout(onLoadPane2, 0);}, false);
   }

   else if (window.name == "popupFrame")  
     addEvent(window, 'load', function() {setTimeout(onLoadPopup, 0);}, false);
}
