<div>
  <script src="lablzapi1.js" type="text/javascript"></script>
  <div id="lablz_msg"></div>
  <div id="lablz_data"></div>
  <div id="coupon_view"></div>
  <div id="coupon_list"></div>
  <script type="text/javascript">
<![CDATA[   
      var gameUri;
      var msg = document.getElementById('lablz_msg');
      var div = document.getElementById('lablz_data');
      Lablz.init("bb5e644f22cad7f821787f30da36b84");
      if (window.location.hash.length == 0)
        Lablz.authenticate();

      var date = new Date(new Date().getTime() + 24 * 3600 * 1000);
      // create a basketball game
      var query = ["organizer=_me",
                   "time=" + encodeURIComponent("{date=" + date.getTime() + "}"),
                   "name=" + encodeURIComponent("'App-Created Ball Game: " + date + "'"),
                   "basketballCourt=" + encodeURIComponent('BasketballCourt/32010'),
                   "comment=" + encodeURIComponent("'All welcome to come, some welcome to play'")].join("&");
      var call = "m/BasketballGame?" + query;
      Lablz.call(call, "afterMadeResource");

      // print the properties of a created resource
      function afterMadeResource(json) {
        gameUri = json._uri;  
        if (gameUri == null)
          div.innerHTML += "failed to make game, " + json.error.code + ": " + json.error.details;
        Lablz.call(json._uri, "Lablz.printJson");
      }

//      editGame("BasketballGame/35181");
//      function editGame(uri) {
//        call = "e/" + uri + "?comment=" + encodeURIComponent("oh alright, everyone is welcome to play");
//        Lablz.call(call, "lookupAndPrint");
//      }

      function lookupAndPrint(json) {
        var gameUri = json._uri;  
        if (gameUri == null)
          div.innerHTML += "failed to make game, " + json.error.code + ": " + json.error.details;
        Lablz.call(json._uri, "printProps");
      }
      
      function printProps(json) {
        Lablz.printJson(json, true);
      }
]]>       
  </script>
</div>