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
  fieldRef.value='';
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
function displayFullText(div, text) {
  document.getElementById(div).innerHTML = text;
}

function displayFullText1(div, div1) {
  document.getElementById(div).innerHTML = document.getElementById(div1).innerHTML;
}

function setTextHeight(div, divider) {
  if (window.screen) {
    var h = Math.floor(screen.availHeight/divider);
    document.getElementById(div).style.height = h;
  }
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