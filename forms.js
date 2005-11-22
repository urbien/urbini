var textAreas = new Array();
// cross-browser - getCurrentTarget
function getTargetElement(evt) {
  var elem;
  if (evt.target) {
    if (evt.currentTarget && (evt.currentTarget != evt.target))
      elem = evt.currentTarget;
    else
      elem = evt.target;
  }
  else {
    elem = evt.srcElement;
  }
  return elem;
}

function FormField(fieldRef, isModified) {
  this.fieldRef = fieldRef;
  this.isModified = isModified;
  this.modifiedByUser = true;
}

function clearUnModifiedFields(formFields) {
  for (i = 0; i < formFields.length; i++) {
    if (formFields[i].isModified == false) {
      formFields[i].fieldRef.value = '';
    }
  }
}

function onFormFieldClick(fieldProp, fieldRef) {
  fieldProp.modifiedByUser = true;
  if (fieldProp.isModified == true)
    return;
  fieldRef.select();
}

function onFormFieldChange(fieldProp, fieldRef, oldValue) {
  if (fieldProp.modifiedByUser == false)
    return;
  fieldProp.isModified = true;
  newValue = fieldRef.value;
  if (newValue != null && newValue != '')
    newValue = trim(newValue);
  if (newValue == null || newValue == '') {
    fieldRef.value = oldValue;
    fieldProp.isModified = false;
    fieldProp.modifiedByUser = false;
  }
}

function hideShowDivOnClick(divId, imgId){//, plusImg, minusImg) {
  div = document.getElementById(divId);
  img = document.getElementById(imgId);
  if (div.style.display == 'none') {
    div.style.display = 'block';
    img.style.display = 'none';
  }
}

function trim(s) {
  while (s.substring(0,1) == ' ') {
    s = s.substring(1,s.length);
  }
  while (s.substring(s.length-1,s.length) == ' ') {
    s = s.substring(0,s.length-1);
  }
  return s;
}

/* used to show full text in a long text property, like Demand.description */
function displayFullText(div, moreDiv) {
  document.getElementById(div).style.overflow = 'visible';
  document.getElementById(div).style.display = 'inline';
  document.getElementById(moreDiv).style.display = 'none';
}
function setTextHeight(div, divider) {
  if (window.screen) {
    var divRef = document.getElementById(div);
    var spanRef = document.getElementById(div + '_span');
    var moreRef = document.getElementById(div + '_more');
	if(divRef.offsetHeight < 40 && document.all){                        // If the height of the div content is less then 40px,
	  document.getElementById(div).style.height=divRef.offsetHeight;     // then the height of the div is set to the height
	  displayFullText(div, div+"_more");                                 // of the div content and "more>>" link is disabled.
	  return;
	}
    var h = Math.floor(screen.availHeight/divider);
	divRef.style.height = h;
    divRef.style.overflow = "hidden";
    if (spanRef != null && moreRef != null)
      if (spanRef.offsetHeight > divRef.offsetHeight) {
        moreRef.style.display = "block";
      } else { // div must have "minimized view". Then the user clicks on "more>>" link and the style of the div is changed
               // from (overflow:hidden) to (display:inline; overflow:visible). This is done on line #73 (function displayFullText(div, moreDiv))
        //moreRef.style.display = "none";
        divRef.style.height = 40;//spanRef.offsetHeight;
        //divRef.style.overflow = "visible";
      }
  }
}
function setTextHeightAll(divider) {
  for (i = 0; i < textAreas.length; i++) {
    if (textAreas[i] != null)
      setTextHeight(textAreas[i], divider);
  }
}
function textAreaExists(textAreaName) {
  for (i = 0; i < textAreas.length; i++) {
    if (textAreas[i] != null && textAreaName == textAreas[i])
      return true;
  }
  return false;
}

/*************************  Form fields adding/removing *******************/
function addField(form, fieldType, fieldName, fieldValue) {
  if (document.getElementById) {
    var input = document.createElement('INPUT');
      if (document.all) { // what follows should work
                          // with NN6 but doesn't in M14
        input.type = fieldType;
        input.name = fieldName;
        input.value = fieldValue;
      }
      else if (document.getElementById) { // so here is the
                                          // NN6 workaround
        input.setAttribute('type', fieldType);
        input.setAttribute('name', fieldName);
        input.setAttribute('value', fieldValue);
      }
    form.appendChild(input);
  }
}
function getField (form, fieldName) {
  if (!document.all)
    return form[fieldName];
  else  // IE has a bug not adding dynamically created field
        // as named properties so we loop through the elements array
    for (var e = 0; e < form.elements.length; e++)
      if (form.elements[e].name == fieldName)
        return form.elements[e];
  return null;
}
function removeField (form, fieldName) {
  var field = getField (form, fieldName);
  if (field && !field.length)
    field.parentNode.removeChild(field);
}
function toggleField (form, fieldName, value) {
  var field = getField (form, fieldName);
  if (field)
    removeField (form, fieldName);
  else
    addField (form, 'hidden', fieldName, value);
}
  function processCreditCardTracks(inputField) {
    var tracks = inputField.value;
    var form = inputField.form;

    var startIdx = tracks.indexOf('%B');
    if (startIdx == -1) {
      return;
    }
    var endIdx = tracks.indexOf('?>');
    if (endIdx == -1) {
      return;
    }
    tracks = tracks.substring(startIdx + 1, endIdx);

    var middleIdx = tracks.indexOf('?;');
    if (middleIdx == -1) {
      var track1 = tracks;
    } else {
      var track1 = tracks.substring(0, middleIdx);
      var track2 = tracks.substring(middleIdx + 2, tracks.length);
    }

    var splitArray = track1.split('^');

    var accountNumber = splitArray[0].substring(1);
    var name = splitArray[1];
    var names = name.split('/');
    name = names[1] + ' ' + names[0];
    var yearMonth = splitArray[2];
    var year = yearMonth.substring(0, 2);
    var month = yearMonth.substring(2, 4);

    form.elements['nameOnCard'].value = name;
    form.elements['number'].value = accountNumber;
    if (month.indexOf('0') == 0)
      month = month.substring(1);
    form.elements['expirationDate___Month'].selectedIndex = month + 1;
    var years = form.elements['expirationDate___Year'];
    var len = years.length;
    for (var i=0; i<len; i++) {
      if (years.options[i].value.indexOf(year) == 2) {
        years.selectedIndex = i;
        break
      }
    }
    form.track1.value = track1;
    form.track2.value = track2;

   //    form.submit();
  }
