/*
 * Taken from: http://www.nsftools.com/misc/SearchAndHighlight.htm
 * This is the function that actually highlights a text string by
 * adding HTML tags before and after all occurrences of the search
 * term. You can pass your own tags if you'd like, or if the
 * highlightStartTag or highlightEndTag parameters are omitted or
 * are empty strings then the default <font> tags will be used.
 */
function doHighlight(bodyText, searchTerm, highlightStartTag, highlightEndTag) {
  // the highlightStartTag and highlightEndTag parameters are optional
  if ((!highlightStartTag) || (!highlightEndTag)) {
    highlightStartTag = "<span style='color:blue; background-color:yellow;'>";
    highlightEndTag = "</span>";
  }
  
  // find all occurences of the search term in the given text,
  // and add some "highlight" tags to them (we're not using a
  // regular expression search, because we want to filter out
  // matches that occur within HTML tags and script blocks, so
  // we have to do a little extra validation)
  var newText = "";
  var i = -1;
  var lcSearchTerm = searchTerm.toLowerCase();
  var lcBodyText = bodyText.toLowerCase();
    
  while (bodyText.length > 0) {
    i = lcBodyText.indexOf(lcSearchTerm, i+1);
    if (i < 0) {
      newText += bodyText;
      bodyText = "";
    } 
    else {
      // skip anything inside an HTML tag
      if (bodyText.lastIndexOf(">", i) >= bodyText.lastIndexOf("<", i)) {
        // skip anything inside a <script> block
        if (lcBodyText.lastIndexOf("/script>", i) >= lcBodyText.lastIndexOf("<script", i)) {
          newText += bodyText.substring(0, i) + highlightStartTag + bodyText.substr(i, searchTerm.length) + highlightEndTag;
          bodyText = bodyText.substr(i + searchTerm.length);
          lcBodyText = bodyText.toLowerCase();
          i = -1;
        }
      }
    }
  }
  
  return newText;
}

function searchHighlighting() {
  var url = document.location.href;
  var start = url.indexOf('&-q=');
  if (start == -1)
    return;
  var r = url.indexOf('readOnlyProperties.html');
  if (r == -1)
    return; 
  start +=4;  
  var end = url.indexOf('&', start);
  var q;
  if (end != -1)
    q = url.substring(start, end);
  else
    q = url.substring(start);
  var tokens = q.split(' ');
  var treatAsPhrase = false;
  highlightSearchTerms(q, treatAsPhrase);  
}  

/*
 * This is sort of a wrapper function to the doHighlight function.
 * It takes the searchText that you pass, optionally splits it into
 * separate words, and transforms the text on the current web page.
 * Only the "searchText" parameter is required; all other parameters
 * are optional and can be omitted.
 */
function highlightSearchTerms(searchText, treatAsPhrase, highlightStartTag, highlightEndTag) {
  // if the treatAsPhrase parameter is true, then we should search for 
  // the entire phrase that was entered; otherwise, we will split the
  // search string so that each word is searched for and highlighted
  // individually
  if (treatAsPhrase) {
    searchArray = [searchText];
  } else {
    searchArray = searchText.split(" ");
  }
  
  if (typeof(document.body.innerHTML) == "undefined")
    return false;
  var body;
  body = document.getElementById("allowSearchHighlighting1");
  if (body)
    Hilite.hiliteElement(body, searchText);
  
  body = document.getElementById("allowSearchHighlighting2");
  if (body) {
    alert("searchText: " + searchText);
    Hilite.hiliteElement(body, searchText);
  }  
  
  /*
  var bodyText = body.innerHTML;
  for (var i = 0; i < searchArray.length; i++) {
    bodyText = doHighlight(bodyText, searchArray[i], highlightStartTag, highlightEndTag);
  }

  
  //setInnerHtml(body, bodyText);
  var nBefore = history.length;
  //body.innerHTML = '';
  body.innerHTML = bodyText;
  var nAfter = history.length;
  if (nBefore - nAfter > 0) {
    alert(nBefore - nAfter);
    history.go(nBefore - nAfter);
  }  

  //var page = body.parentNode;
  //page.replaceChild(bodyText, body);
   */ 
  return true;
}

function nextTextNode(node) {
  var next;
  while ((next = nextNode(node)).nodeType != 3);
  return next;
}

// return next node in document order
function nextNode(node) {
    if (!node) return null;
    if (node.firstChild){
        return node.firstChild;
    } else {
        return nextWide(node);
    }
}
// helper function for nextNode()
function nextWide(node) {
    if (!node) return null;
    if (node.nextSibling) {
        return node.nextSibling;
    } else {
        return nextWide(node.parentNode);
    }
}

// Configuration:
Hilite = {
    /**
     * Whether to automatically hilite a section of the HTML document, by
     * binding the "Hilite.hilite()" to window.onload() event. If this
     * attribute is set to false, you can still manually trigger the hilite by
     * calling Hilite.hilite() in Javascript after document has been fully
     * loaded.
     */
    onload: true,

    /**
     * Name of the style to be used. Default to 'hilite'.
     */
    style_name: 'hilite',
    
    /**
     * Whether to use different style names for different search keywords by
     * appending a number starting from 1, i.e. hilite1, hilite2, etc.
     */
    style_name_suffix: true,

    /**
     * Set it to override the document.referrer string. Used for debugging
     * only.
     */
    debug_referrer: ''
};

/**
 * Highlight a HTML string with a list of keywords.
 */
Hilite.hiliteHTML = function(html, query) {
    var re = new Array();
    for (var i = 0; i < query.length; i ++) {
      if (query[i]) {
        var classname = Hilite.style_name;
        if (Hilite.style_name_suffix)
          classname += (re.length+1);
        re.push([new RegExp('('+query[i]+')', "gi"), classname]);
      }
    }

    var last = 0;
    var tag = '<';
    var skip = false;
    var skipre = new RegExp('^(script|style|textarea)', 'gi');
    var part = null;
    var result = '';

    while (last >= 0) {
      var pos = html.indexOf(tag, last);
      if (pos < 0) {
        part = html.substring(last);
        last = -1;
      } 
      else {
        part = html.substring(last, pos);
        last = pos+1;
      }

      if (tag == '<') {
        if (!skip) {
          for (var j = 0; j < re.length; j ++)
            part = part.replace(re[j][0], '<span class="'+re[j][1]+ '">$1</span>');
        } 
        else
          skip = false;
      } 
      else if (part.match(skipre)) {
        skip = true;
      }

      result += part + (pos < 0 ? '' : tag);
      tag = tag == '<' ? '>' : '<';
    }

    return result;
};

/**
 * Highlight a DOM element with a list of keywords.
 */
Hilite.hiliteElement = function(elm, query) {
  if (!query)
    return;

  elm.innerHTML = Hilite.hiliteHTML(elm.innerHTML, query);
};

