/*
Copyright (c) 2006 Dusty Davidson - http://www.dustyd.net
(portions Copyright (c) 2005 Angus Turnbull http://www.twinhelix.come)

Permission is hereby granted, free of charge, to any person obtaining 
a copy of this software and associated documentation files (the "Software"), 
to deal in the Software without restriction, including without limitation 
the rights to use, copy, modify, merge, publish, distribute, sublicense, 
and/or sell copies of the Software, and to permit persons to whom the Software 
is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in 
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR 
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, 
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE 
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, 
WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR 
IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/



/*********************************************************/
/*** Photo Notes Container *******************************/
/*********************************************************/
function PhotoNoteContainer(element, config)
{
    var props = {
        element: element,
        dragresize: null,
        notes: new Array(),
        editing: false
    };

    for (var p in props)
    {
        this[p] = (!config || typeof config[p] == 'undefined') ? props[p] : config[p];
    }
        
};

// A. L.
PhotoNoteContainer.prototype.switchToViewMode = function() {
  for(var i = 0; i < this.notes.length; i++)
    this.notes[i].Cancel();
}



PhotoNoteContainer.prototype.DeleteNote = function(note)
{
    
    note.UnSelect();

    /* remove from the DOM */
    this.element.removeChild(note.gui.ElementRect);
    this.element.removeChild(note.gui.ElementNote);
    
    /* remove from the array... */
    this.notes.remove(note);
}

PhotoNoteContainer.prototype.AddNote = function(note)
{
    if(!this.editing)
    {
        /* add the note to the array of notes, and set its container */
        this.notes[this.notes.length] = note;
        note.container = this;

        /* add the note to the DOM */
        this.element.appendChild(note.gui.ElementRect);
        this.element.appendChild(note.gui.ElementNote);    
    }
};

/* hide all of the "text" parts of the notes. Primarily called when hovering a note, at which
    point we want to hide all of the other note texts */
PhotoNoteContainer.prototype.HideAllNoteTexts = function()
{
    for (var i = 0;i<this.notes.length;i++)
        this.notes[i].HideNoteText();
};


PhotoNoteContainer.prototype.DisableAllNotes = function()
{
    for (var i = 0;i<this.notes.length;i++)
        this.notes[i].DisableNote();
};

PhotoNoteContainer.prototype.HideAllNotes = function()
{
    for (var i = 0;i<this.notes.length;i++)
        this.notes[i].HideNote();
};

PhotoNoteContainer.prototype.ShowAllNotes = function()
{
    for (var i = 0;i<this.notes.length;i++)
        this.notes[i].ShowNote();
};

PhotoNoteContainer.prototype.EnableAllNotes = function()
{
    for (var i = 0;i<this.notes.length;i++)
        this.notes[i].EnableNote();
};













/*********************************************************/
/*** Photo Note ******************************************/
/*********************************************************/
function PhotoNote(text,id,rect)
{
    var props = {
        text: text,                   
        id: id,
        rect: rect,                    
        selected: false,
        container: null,
        dragresize: null,
        oldRect: null,
        YOffset: 10,
        XOffset: 0,
        onsave: null,
        ondelete: null,
        gui: null                  
        
    };

    for (var p in props)
    {
        this[p] = props[p];
    }
    
    this.CreateElements();
}


PhotoNote.prototype.Select = function()
{
    // A. L.
    if(ImageAnnotations.isEditMode() == false)
      return;
      
    //window.status = 'container: ' + this.container;
    if(!this.container.editing)
    {
        this.ShowNoteText();
        this.dragresize.select(this.gui.ElementRect);
        this.selected = true;
        this.SetEditable(true);
    }    
}


PhotoNote.prototype.UnSelect = function()
{
    this.dragresize.deselect(false);
    this.selected = false;
    this.SetEditable(false);
    this.HideNoteText();
}

PhotoNote.prototype.Save = function()
{
    this.oldRect = null;
    this.gui.TextTitle.innerHTML = this.gui.TextBox.value;
    this.text = this.gui.TextBox.value
    this.UnSelect();
}

PhotoNote.prototype.Cancel = function()
{

    //if the note is still new, then we actually want to delete it, not cancel it..
    if(this.id < 0)
    {
        this.container.DeleteNote(this)
    }
    else
    {
       //reset the node to it's old position 
        if(this.oldRect != null)
        {
            this.rect = this.oldRect;                
        }
        this.oldRect = null;               
        this.gui.TextBox.value = this.text;                
        this.PositionNote();
        this.UnSelect();
    }
    
}


PhotoNote.prototype.ShowNoteText = function()
{
    if(!this.container.editing)
    {
        this.container.HideAllNoteTexts();
        this.container.DisableAllNotes();
        this.EnableNote();

        this.gui.ElementRect.style.border='1px solid #D4D82D';
        this.gui.ElementRect.style.margin='0';
        this.gui.ElementNote.style.display='block';
    }
}

PhotoNote.prototype.DisableNote = function ()
{
    this.dragresize.enabled=false;
}

PhotoNote.prototype.EnableNote = function ()
{
    this.dragresize.enabled=true;
}

PhotoNote.prototype.HideNoteText = function ()
{
    this.gui.ElementRect.style.border='0px solid #D4D82D';
    this.gui.ElementRect.style.margin='1px';
    this.gui.ElementNote.style.display='none';
}


PhotoNote.prototype.HideNote = function ()
{
    this.gui.ElementRect.style.display='none';
    this.gui.ElementNote.style.display='none';
}


PhotoNote.prototype.ShowNote = function ()
{
    this.gui.ElementRect.style.display='block';
    this.gui.ElementNote.style.display='none';
}



PhotoNote.prototype.SetEditable = function(editable)
{
    this.container.editing = editable;
    
    if(editable)
    {
        //the first child of the note is the text
        this.gui.TextTitle.style.display = 'none';
        
        //the second child is the edit area...
        this.gui.EditArea.style.display = 'block';
        
        //if this is a "new" note, then hide the delete button
        if(this.id <= 0)
            this.gui.DeleteButton.style.display = 'none';
        else
            this.gui.DeleteButton.style.display = 'inline';
        
        // get the textarea and select the text...
        this.HighlightTextbox();
   }
    else
    {
        //the first child of the note is the text
        this.gui.TextTitle.style.display = 'block';
        
        //the second child is the edit area...
        this.gui.EditArea.style.display = 'none';
    }
}

PhotoNote.prototype.HighlightTextbox = function ()
{
    // get the textarea and select the text...
    if(this.gui.EditArea.style.display=='block')
    {
        var textfield = this.gui.TextBox;
        setTimeout(function() {
                try
                {
                    textfield.focus();
                    textfield.select();
                }
                catch(e) {}
            }, 200);
    }

}

PhotoNote.prototype.CreateElements = function()
{
    
    this.gui = new PhotoNoteGUI();

    var newArea = document.createElement('div');
    this.dragresize = new DragResize('dragresize', { allowBlur: false });
    newArea.className = 'fn-area';
    newArea.id = 'fn-area-new';

    var newAreaBlack = document.createElement('div');
    newAreaBlack.className = 'fn-area-blackborder';
    var newAreaWhite = document.createElement('div');
    newAreaWhite.className = 'fn-area-whiteborder';
    
    
    var currentNote = this;


    var newAreaInner = document.createElement('div');
    newAreaInner.className = 'fn-area-inner';
    newAreaWhite.appendChild(newAreaInner);


    //attach mouse events to this element...
    addEvent(newAreaInner, 'mouseover', function() {
            currentNote.ShowNoteText();
        });
    addEvent(newAreaInner, 'mouseout', function() {

            if(!currentNote.selected)
            {
                setTimeout(function () {
                    currentNote.HideNoteText();
                    }, 250);
                    
            }
        });
        
    addEvent(newAreaInner, 'mousedown', function() {
            if(!currentNote.selected)
            {
                //window.status = 'mouseDown2!';
                currentNote.Select();
            }
        });

    
    newAreaBlack.appendChild(newAreaWhite);
    newArea.appendChild(newAreaBlack);
    
    // add the notes area
    var noteArea = document.createElement('div');
    noteArea.className = 'fn-note';
    
    var titleArea = document.createElement('div');
    titleArea.className = 'fn-note-text';
    var t = document.createTextNode(this.text);
    titleArea.appendChild(t);
    noteArea.appendChild(titleArea);
    
    var editArea = document.createElement('div');
    editArea.className = 'fn-note-edit';
    
    var editAreaText = document.createElement('div');
    editAreaText.className = 'fn-note-edit-text';
    
    var newTextbox = document.createElement('textarea');
    newTextbox.value = this.text;
    editAreaText.appendChild(newTextbox);
    editArea.appendChild(editAreaText);
    
    var buttonsDiv = document.createElement('div');
    var newButtonOK = document.createElement('input');
    newButtonOK.type='button';
    newButtonOK.className = 'Butt';
    newButtonOK.value='SAVE';
    newButtonOK.onclick = function() {
            
            
            if(currentNote.onsave) 
            {
                // hack / fix by A. L.
                currentNote.text = newTextbox.value;
                
                var res = currentNote.onsave(currentNote);
                if(res > 0)
                {
                    //window.status = '';
                    currentNote.id = res;
                    currentNote.Save();
                }
                else
                {
                    alert("error saving note");
                    currentNote.Cancel();                        
                }
            }
            else
            {
                alert("onsave must be implemented in order to *actually* save");
                currentNote.Cancel();                        
            }
        
             
        };
    buttonsDiv.appendChild(newButtonOK);
    
    var newButtonCancel = document.createElement('input');
    newButtonCancel.type='button';
    newButtonCancel.className = 'CancelButt';
    newButtonCancel.value='CANCEL';
    newButtonCancel.onclick = function() {
            currentNote.Cancel();            
            
        };
    buttonsDiv.appendChild(newButtonCancel);

    var newButtonDelete = document.createElement('input');
    newButtonDelete.type='button';
    newButtonDelete.className = 'CancelButt';
    newButtonDelete.value='DELETE';
    newButtonDelete.onclick = function() {
            
            if(currentNote.ondelete) 
            {
                var res = currentNote.ondelete(currentNote);
                if(res)
                {
                    currentNote.container.DeleteNote(currentNote);
                }
                else
                {
                    alert("error deleting note");
                }
            }
            else
            {
                alert("ondelete must be implemented in order to *actually* delete");
            }
        };
    buttonsDiv.appendChild(newButtonDelete);

    editArea.appendChild(buttonsDiv);
    noteArea.appendChild(editArea);
    
    

    /********* DRAG & RESIZE EVENTS **********************/
    this.dragresize.isElement = function(elm)
        {
            if(elm.className == 'fn-area')
            {
                this.maxRight = currentNote.container.element.offsetWidth - 30;
                this.maxBottom = currentNote.container.element.offsetHeight - 19;
                return true;
            }
        };
    this.dragresize.isHandle = function(elm)
        {
            if(elm.className == 'fn-area')
                return true;
        };
    this.dragresize.ondragfocus = function()
        {
            currentNote.gui.ElementRect.style.cursor = 'move';
        };
    this.dragresize.ondragblur = function()
        {
            currentNote.gui.ElementRect.style.cursor = 'pointer';
        };
    this.dragresize.ondragstart = function()
        {
            if(currentNote.oldRect == null)
            {
                var r = currentNote.rect;
                currentNote.oldRect = new PhotoNoteRect(r.left,r.top,r.width,r.height);
            }
        };
    this.dragresize.ondragend = function()
        {
            //window.status = 'LKSFDLKJDFSLKJFDLKJ';
            currentNote.HighlightTextbox();
        };
    this.dragresize.ondragmove = function()
        {
            currentNote.rect.left = parseInt(this.element.style.left);
            currentNote.rect.top = parseInt(this.element.style.top);
            currentNote.rect.width = parseInt(this.element.style.width);
            currentNote.rect.height = parseInt(this.element.style.height);
            currentNote.PositionNote();
        };

    this.dragresize.apply(document);
    
    
    
    
    /* setup the GUI object */
    this.gui.ElementRect = newArea;
    this.gui.ElementNote = noteArea;
    this.gui.EditArea = editArea;
    this.gui.TextBox = newTextbox;
    this.gui.TextTitle = titleArea;
    this.gui.DeleteButton = newButtonDelete;
    
    /* position the note text below the note area */
    this.PositionNote();
    
}

PhotoNote.prototype.PositionNote = function()
{
    /* outer most box */
    this.gui.ElementRect.style.left  = this.rect.left + 'px';
    this.gui.ElementRect.style.top  = this.rect.top + 'px';
    this.gui.ElementRect.style.width  = this.rect.width + 'px';
    this.gui.ElementRect.style.height  = this.rect.height + 'px';
    
    // black border
    this.gui.ElementRect.firstChild.style.width  = parseInt(this.gui.ElementRect.style.width) - 2 + 'px';
    this.gui.ElementRect.firstChild.style.height  = parseInt(this.gui.ElementRect.style.height) - 2 + 'px';        
    
    // white border
    this.gui.ElementRect.firstChild.firstChild.style.width  = parseInt(this.gui.ElementRect.style.width) - 4 + 'px';
    this.gui.ElementRect.firstChild.firstChild.style.height  = parseInt(this.gui.ElementRect.style.height) - 4 + 'px';        

    // inner box
    this.gui.ElementRect.firstChild.firstChild.firstChild.style.width  = parseInt(this.gui.ElementRect.style.width) - 6 + 'px';
    this.gui.ElementRect.firstChild.firstChild.firstChild.style.height  = parseInt(this.gui.ElementRect.style.height) - 6 + 'px';        
 
    this.gui.ElementNote.style.left  = this.rect.left + this.XOffset + 'px';
    this.gui.ElementNote.style.top  = this.rect.top + this.YOffset + this.rect.height + 'px';
   
}




/*********************************************************/
/*** Photo Note GUI Object *******************************/
/*********************************************************/
function PhotoNoteGUI()
{
    this.ElementRect = null;
    
    // the note text area...
    this.ElementNote = null;
    this.TextTitle = null;
    this.EditArea = null;
    this.TextBox = null;
    
    // buttons
    this.DeleteButton = null;
}



/*********************************************************/
/*** Rectangle *******************************************/
/*********************************************************/
function PhotoNoteRect(left,top,width,height)
{
    this.left = left;
    this.top = top;
    this.width = width;
    this.height = height;
}

/* for debugging purposes */
PhotoNoteRect.prototype.toString = function()
{
    return 'left: ' + this.left + ', top: ' + this.top + ', width: ' + this.width + ', height: ' + this.height;
}









// *** Common API Code ***
// (c) 2005 Angus Turnbull http://www.twinhelix.come

var aeOL = [];
function addEvent(o, n, f, l)
{
 var a = 'addEventListener', h = 'on'+n, b = '', s = '';
 if (o[a] && !l) return o[a](n, f, false);
 o._c |= 0;
 if (o[h])
 {
  b = '_f' + o._c++;
  o[b] = o[h];
 }
 s = '_f' + o._c++;
 o[s] = f;
 o[h] = function(e)
 {
  e = e || window.event;
  var r = true;
  if (b) r = o[b](e) != false && r;
  r = o[s](e) != false && r;
  return r;
 };
 aeOL[aeOL.length] = { o: o, h: h };
};
addEvent(window, 'unload', function() {
 for (var i = 0; i < aeOL.length; i++) with (aeOL[i])
 {
  o[h] = null;
  for (var c = 0; o['_f' + c]; c++) o['_f' + c] = null;
 }
});

function cancelEvent(e, c)
{
 e.returnValue = false;
 if (e.preventDefault) e.preventDefault();
 if (c)
 {
  e.cancelBubble = true;
  if (e.stopPropagation) e.stopPropagation();
 }
};

function addLoadEvent(func) {
  var oldonload = window.onload;
  if (typeof window.onload != 'function') {
    window.onload = func;
  } else {
    window.onload = function() {
      oldonload();
      func();
    }
  }
}



/* Extend the Array object with some useful features 
   http://www.ditchnet.org/wp/?p=8
*/

Array.prototype.clear = function () {
    this.length = 0;
};

Array.prototype.remove = function (element) {
	var result = false;
	var array = [];
	for (var i = 0; i < this.length; i++) {
		if (this[i] == element) {
			result = true;
		} else {
			array.push(this[i]);
		}
	}
	this.clear();
	for (var i = 0; i < array.length; i++) {
		this.push(array[i]);
	}
	array = null;
	return result;
};






// *** Drag and Resize Library Code ***
// (c) 2005 Angus Turnbull http://www.twinhelix.come


function DragResize(myName, config)
{
    var props = {
        myName: myName,                  // Name of the object.
        enabled: true,                   // Global toggle of drag/resize.
        handles: ['tl', 'tm', 'tr',
        'ml', 'mr', 'bl', 'bm', 'br'], // Array of drag handles: top/mid/.
        isElement: null,                 // Function ref to test for an element.
        isHandle: null,                  // Function ref to test for move handle.
        element: null,                   // The currently selected element.
        dragging: null,                  // Active handle reference of the element.
        minWidth: 10, minHeight: 10,     // Minimum pixel size of elements.
        minLeft: 0, maxRight: 9999,      // Bounding box area.
        minTop: 0, maxBottom: 9999,
        zIndex: 1,                       // The highest Z-Index yet allocated.
        mouseX: 0, mouseY: 0,            // Current mouse position, recorded live.
        lastMouseX: 0, lastMouseY: 0,    // Last processed mouse positions.
        mOffX: 0, mOffY: 0,              // A known offset between position & mouse.
        elmX: 0, elmY: 0,                // Element position.
        elmW: 0, elmH: 0,                // Element size.
        allowBlur: true,                 // Whether to allow automatic blur onclick.
        ondragfocus: null,               // Event handler functions.
        ondragstart: null,
        ondragmove: null,
        ondragend: null,
        ondragblur: null
    };

    for (var p in props)
    {
        this[p] = (typeof config[p] == 'undefined') ? props[p] : config[p];
    }
};


DragResize.prototype.apply = function(node)
{
    // Adds object event handlers to the specified DOM node.

    var obj = this;
    addEvent(node, 'mousedown', function(e) { obj.mouseDown(e) } );
    addEvent(node, 'mousemove', function(e) { obj.mouseMove(e) } );
    addEvent(node, 'mouseup', function(e) { obj.mouseUp(e) } );
};


DragResize.prototype.handleSet = function(elm, show) { with (this)
{
    // A. L.
    if(!elm)
      return;
    
    // Either creates, shows or hides the resize handles within an element.

    // If we're showing them, and no handles have been created, create 4 new ones.
    if (!elm._handle_tr)
    {
        for (var h = 0; h < handles.length; h++)
        {
            // Create 4 news divs, assign each a generic + specific class.
            var hDiv = document.createElement('div');
            hDiv.className = myName + ' ' +  myName + '-' + handles[h];
            elm['_handle_' + handles[h]] = elm.appendChild(hDiv);
        }
    }

    // We now have handles. Find them all and show/hide.
    for (var h = 0; h < handles.length; h++)
    {
        elm['_handle_' + handles[h]].style.visibility = show ? 'inherit' : 'hidden';
    }
}};


DragResize.prototype.select = function(newElement) { with (this)
{

    // A. L.
    if(ImageAnnotations.isEditMode() == false)
      return;
      
    // Selects an element for dragging.

    if (!document.getElementById || !enabled) return;

    // Activate and record our new dragging element.
    if (newElement && (newElement != element) && enabled)
    {
        element = newElement;
        // Elevate it and give it resize handles.
        element.style.zIndex = ++zIndex;
        handleSet(element, true);
        // Record element attributes for mouseMove().
        elmX = parseInt(element.style.left);
        elmY = parseInt(element.style.top);
        elmW = element.offsetWidth;
        elmH = element.offsetHeight;
        if (ondragfocus) this.ondragfocus();
    //window.status = 'start elmX=' + element.className;
        
    }
}};


DragResize.prototype.deselect = function(keepHandles) { with (this)
{
    // Immediately stops dragging an element. If 'keepHandles' is false, this
    // remove the handles from the element and clears the element flag,
    // completely resetting the .

    if (!document.getElementById || !enabled) return;

    if (!keepHandles)
    {
        if (ondragblur) this.ondragblur();
        handleSet(element, false);
        element = null;
    }

    dragging = null;
    mOffX = 0;
    mOffY = 0;
}};


DragResize.prototype.mouseDown = function(e) { with (this)
{
    //window.status = 'mouseDown!';
    // Suitable elements are selected for drag/resize on mousedown.
    // We also initialise the resize boxes, and drag parameters like mouse position etc.
    if (!document.getElementById || !enabled) return true;

    var elm = e.target || e.srcElement,
    newElement = null,
    newHandle = null,
    hRE = new RegExp(myName + '-([trmbl]{2})', '');

    while (elm)
    {
        // Loop up the DOM looking for matching elements. Remember one if found.
        if (elm.className)
        {
        if (!newHandle && (hRE.test(elm.className) || isHandle(elm))) newHandle = elm;
        if (isElement(elm)) { newElement = elm; break }
        }
        elm = elm.parentNode;
    }

    // If this isn't on the last dragged element, call deselect(false),
    // which will hide its handles and clear element.
    if (element && (element != newElement) && allowBlur) deselect(false);

    // If we have a new matching element, call select().
    if (newElement && (!element || (newElement == element)))
    {
        // Stop mouse selections.
        cancelEvent(e);
        select(newElement, newHandle);
        dragging = newHandle;
        if (dragging && ondragstart) this.ondragstart();
    }
}};


DragResize.prototype.mouseMove = function(e) { with (this)
{
    // A. L.
    if(ImageAnnotations.isEditMode() == false)
      return;

    // This continually offsets the dragged element by the difference between the
    // last recorded mouse position (mouseX/Y) and the current mouse position.
    if (!document.getElementById || !enabled) return true;

    // We always record the current mouse position.
    mouseX = e.pageX || e.clientX + document.documentElement.scrollLeft;
    mouseY = e.pageY || e.clientY + document.documentElement.scrollTop;
    // Record the relative mouse movement, in case we're dragging.
    // Add any previously stored&ignored offset to the calculations.
    var diffX = mouseX - lastMouseX + mOffX;
    var diffY = mouseY - lastMouseY + mOffY;
    mOffX = mOffY = 0;
    // Update last processed mouse positions.
    lastMouseX = mouseX;
    lastMouseY = mouseY;

    // That's all we do if we're not dragging anything.
    if (!dragging) return true;

    // Establish which handle is being dragged -- retrieve handle name from className.
    var hClass = dragging && dragging.className &&
    dragging.className.match(new RegExp(myName + '-([tmblr]{2})')) ? RegExp.$1 : '';

    // If the hClass is one of the resize handles, resize one or two dimensions.
    // Bounds checking is the hard bit -- basically for each edge, check that the
    // element doesn't go under minimum size, and doesn't go beyond its boundary.
    var rs = 0, dY = diffY, dX = diffX;
    if (hClass.indexOf('t') >= 0)
    {
        rs = 1;
        if (elmH - dY < minHeight) mOffY = (dY - (diffY = elmH - minHeight));
        else if (elmY + dY < minTop) mOffY = (dY - (diffY = minTop - elmY));
        elmY += diffY;
        elmH -= diffY;
    }
    if (hClass.indexOf('b') >= 0)
    {
        rs = 1;
        if (elmH + dY < minHeight) mOffY = (dY - (diffY = minHeight - elmH));
        else if (elmY + elmH + dY > maxBottom) mOffY = (dY - (diffY = maxBottom - elmY - elmH));
        elmH += diffY;
    }
    if (hClass.indexOf('l') >= 0)
    {
        rs = 1;
        if (elmW - dX < minWidth) mOffX = (dX - (diffX = elmW - minWidth));
        else if (elmX + dX < minLeft) mOffX = (dX - (diffX = minLeft - elmX));
        elmX += diffX;
        elmW -= diffX;
    }
    if (hClass.indexOf('r') >= 0)
    {
        rs = 1;
        if (elmW + dX < minWidth) mOffX = (dX - (diffX = minWidth - elmW));
        else if (elmX + elmW + dX > maxRight) mOffX = (dX - (diffX = maxRight - elmX - elmW));
        elmW += diffX;
        window.status = 'diffX:' + diffX;
    }
    // If 'rs' isn't set, we must be dragging the whole element, so move that.
    if (dragging && !rs)
    {
        // Bounds check left-right...
        if (elmX + dX < minLeft) mOffX = (dX - (diffX = minLeft - elmX));
        else if (elmX + elmW + dX > maxRight) mOffX = (dX - (diffX = maxRight - elmX - elmW));
        // ...and up-down.
        if (elmY + dY < minTop) mOffY = (dY - (diffY = minTop - elmY));
        else if (elmY + elmH + dY > maxBottom) mOffY = (dY - (diffY = maxBottom - elmY - elmH));
        //window.status = 'diffX-' + diffX + ' , elmX-' + elmX;
        elmX += diffX;
        elmY += diffY;
    }
    
    //window.status = 'elmX=' + elmX;
    // Assign new info back to the element, with minimum dimensions.
    with (element.style)
    {
        left =   elmX + 'px';
        width =  elmW + 'px';
        top =    elmY + 'px';
        height = elmH + 'px';
    }

    // Evil, dirty, hackish Opera select-as-you-drag fix.
    if (window.opera && document.documentElement)
    {
        var oDF = document.getElementById('op-drag-fix');
        if (!oDF)
        {
            var oDF = document.createElement('input');
            oDF.id = 'op-drag-fix';
            oDF.style.display = 'none';
            document.body.appendChild(oDF);
        }
        oDF.focus();
    }

    if (ondragmove) this.ondragmove();

    // Stop a normal drag event.
    cancelEvent(e);
}};


DragResize.prototype.mouseUp = function(e) { with (this)
{
    // On mouseup, stop dragging, but don't reset handler visibility.
    if (!document.getElementById || !enabled) return;

    if (ondragend) this.ondragend();
    deselect(true);
}};



/**********************************************************
* utilize PhotoNotes. A. L.
***********************************************************/
/* note format: left, top, width, height, text, uri */
var ImageAnnotations = {
  notesEngine : null,
  container : null,
  addNoteBtn : null,
  imgUrl : "",
  _isEditMode : false,
  // initial function
  init : function(imgUrl, notesDataArr) {
    this.container = document.getElementById('PhotoContainer');
    if(!this.container)
      return;

    this.imgUrl = imgUrl;
    if(this.notesEngine == null)
      this.notesEngine = new PhotoNoteContainer(this.container);
  
    this.addNoteBtn = getChildById(this.container, 'add_note');

    if(typeof notesDataArr != 'undefined' && notesDataArr != null) {
      // append stored notes
      for(var i = 0; i < notesDataArr.length; i++)
        this.addNote(notesDataArr[i]);
     }
  },

  addNote : function(noteData) {
    if(!noteData) {
      noteData = {left:10, top:10, width:50, height:50, text:"note",resId:null};
    }
    var size = new PhotoNoteRect(noteData.left , noteData.top, noteData.width, noteData.height);
    var note = new PhotoNote(noteData.text, 1, size);

    // unique ID of annotation resource
    note.resId = noteData.resId;
    note.onsave = this.onsave;
    note.ondelete = this.ondelete;

    this.notesEngine.AddNote(note);
    //note.SetEditable(true);
    note.DisableNote();
  },
  onTabSelection : function(selectedDiv) {
    if(selectedDiv.id == "div_Edit")
      ImageAnnotations.setEditMode(true);
    else 
      ImageAnnotations.setEditMode(false);
  },
  
  setEditMode : function(isEditMode) {
    this._isEditMode = isEditMode;
    if(isEditMode) {
      this.addNoteBtn.style.visibility = "visible";
    }
    else {
      this.addNoteBtn.style.visibility = "hidden";
      this.notesEngine.switchToViewMode();
    }
  },
  
  onsave : function(note) {
    var url = ImageAnnotations.getServletUrl();
    var rect = note.rect;

    var parameters = "";
    var isNew = (typeof note.resId == 'undefined' || note.resId == null)
    if(isNew)
      parameters += "action=mkResource";
    else
      parameters += "action=update";

    parameters += "&imageUrl=" + ImageAnnotations.imgUrl;
    parameters += "&left=" + rect.left + "&top=" + rect.top;
    parameters += "&width=" + rect.width + "&height=" + rect.height;
    parameters += "&text=" + note.text;
    if(!isNew)
      parameters += "&resId=" + note.resId;

    postRequest(null, url, parameters, null, null, ImageAnnotations.onsaveCallback);
    return 1;
  },
  // a1, a2, a3 - parameters that are not used here
  onsaveCallback : function(a1, a2, a3, responseText) {
    //alert(responseText);
  },
  
  ondelete : function(note) {
    if(typeof note.resId == 'undefined' || note.resId == null) // not stored note
      return true;
    var url = ImageAnnotations.getServletUrl();
    var parameters = "action=delete";
    //parameters += "&imageUrl=" + ImageAnnotations.imgUrl;
    parameters += "&resId=" + note.resId;
    postRequest(null, url, parameters, null, null, ImageAnnotations.ondeleteCallback);
    return true;
  },
  
  ondeleteCallback : function(a1, a2, a3, responseText) {
  
  },
  
  getServletUrl : function () {
    var baseUriO = document.getElementsByTagName('base');
    var baseUri = "";
    if (baseUriO) {
      baseUri = baseUriO[0].href;
      if (baseUri  &&  baseUri.lastIndexOf("/") != baseUri.length - 1)
        baseUri += "/";
    }
    var url = baseUri + "imageAnnotation";
		
		return url;
	},
	
	isEditMode : function() {
	  return this._isEditMode;
	}
}