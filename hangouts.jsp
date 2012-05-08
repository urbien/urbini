<div>
<include name="requiredFooter.jsp"/>
<script src="http://hangoutsapi.talkgadget.google.com/talkgadget/apps/gadgets/js/rpc.js"></script>
<script src="http://hangoutsapi.talkgadget.google.com/hangouts/api/hangout.js?v=1.0"></script>

<script type="text/javascript" src="http://www.google.com/jsapi"></script>
<script type="text/javascript">google.load("jquery", "1.7.1");</script>

<script type="text/javascript" src="https://apis.google.com/js/client.js?onload=onClientReady"></script>
<div id="apiStatus"><p>No API Status</p></div>
<div><p>ParticipantsList:</p></div>
<div id="participants"><p>No idea who is in this hangout</p></div>

<p>Auth token is <span id='token'></span></p>
<div id="gd-info">
        <p>Your gd parameter: <span id='gd'></span><br/>
        <i>Note that we are using encodeURIComponent() on this because we have not sanitized it.</i></p>
</div>

<p><input class="button" type="button" action="Make API call" onclick="makeApiCall()" value="Make authenticated REST API call"></input></p>

<div id="info"></div>

<script type="text/javascript">
<![CDATA[

onApiReady = function() {
  var gdParam = getUrlParam(window.location.href, "gd");
  var hangoutUrl = gapi.hangout.getHangoutUrl();
  var callbackUrl = "social/hangout";
  
  $.ajax({
    url: callbackUrl,
    dataType: 'json',
    data: {
      "hangoutUrl": hangoutUrl,
      "topic": gdParam
    }
  }).done( 
      function(data, status, xhr) {
        $('msg').html(data.msg);
  }).fail( 
      function(xhr, status, error) {
        $('msg').html("There was a problem contacting Urbien. Please try again. (" + status + ")");
  });
}

onParticipantsChanged = function(participants) {
  var list = "";
  for (var index in participants) {
    var part = participants[index];

    if (part.person == null) {
      retVal += '<li>An unknown person</li>';
      continue;
    }

    list += stripHTML(part.person.displayName) + ',';
  }

  $.ajax({
    url: callbackUrl,
    dataType: 'json',
    data: {
      "participants": list
    }
  }).done( 
      function(data, status, xhr) {
        $('msg').html(data.msg);
  }).fail( 
      function(xhr, status, error) {
        $('msg').html("There was a problem contacting Urbien. Please try again. (" + status + ")");
  });
}


/** This is where we put status updates. */
var apiStatusDiv = document.getElementById('apiStatus');

/** Updates the list of participants.  We use this to show that our
  * API is ready. */
function updateParticipants() {
  var participantsDiv = document.getElementById('participants');
  var retVal = '<ul>';
  var participants = gapi.hangout.getParticipants();

  for (var index in participants) {
    var part = participants[index];

    if (part.person == null) {
      retVal += '<li>An unknown person</li>';
      continue;
    }

    retVal += '<li>' + stripHTML(part.person.displayName) + '</li>';
  }

  retVal += '</ul>';

  participantsDiv.innerHTML = retVal;
}

/** Make an authenticated Google+ API call using the access token. */
function makeApiCall() {
  gapi.client.load('plus', 'v1', function() {
      var request = gapi.client.plus.people.get({
                                                  'userId': 'me'
                                                });
    request.execute(function(resp) {
      var heading = document.createElement('h4');
      var image = document.createElement('img');

      if (resp.code && resp.code != '200') {
        apiStatusDiv.innerHTML = '<p>' + resp.code 
             + ' occurred getting API call.</p>';
        return;
      }

      // Note that displayName and image URL are already available
      // from the hangout API.  We're just showing that we can get
      // this information using the people/me endpoint with authentication.
      image.src = resp.image.url;
      heading.appendChild(image);
      heading.appendChild(document.createTextNode(resp.displayName));

      document.getElementById('info').appendChild(heading);
    });
  });
}

/** Called when jsclient has fully loaded; sets API key */
function onClientReady() {
  apiStatusDiv.innerHTML = '<p>Client ready</p>';

  // Now wait to see if the API is ready.
  gapi.hangout.onApiReady.add(function(eventObj) {
    if (eventObj.isApiReady) {
      apiStatusDiv.innerHTML = '<p>API is ready</p>';
      window.setTimeout(
          function() {
            onApiReady();
            gapi.auth.setToken(generateToken());
            updateParticipants();
          }, 1);
    }
  });

  gapi.hangout.onParticipantsChanged.add(onParticipantsChanged);

  document.getElementById('gd').innerHTML = encodeURIComponent(getUrlParam(window.location.href, 'gd'));
  document.getElementById('token').innerHTML = getUrlParam(window.location.href, 'token');
}

function generateToken() {
  var theToken = new Object();
  theToken.access_token = getUrlParam(window.location.href, 'token');

  return theToken;
}

function stripHTML(string) {
  var re = /<\S[^><]*>/g
  return string.replace(re, "")
}

]]>
</script>
<script src="https://apis.google.com/js/client.js?onload=onClientReady"></script>
</div>