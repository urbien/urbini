<div>
  <script src="lablzapi1.js" type="text/javascript"></script>
  <div id="lablz_data"></div>
  <div id="coupon_view"></div>
  <div id="coupon_list"></div>
  <script type="text/javascript">
<![CDATA[   
      var div = document.getElementById('lablz_data');
//      Lablz.init("bb5e644f22cad7f821787f30da36b84");
      
      // create a basketball game
      Lablz.simpleCall("BasketballGame?$orderBy=dateSubmitted&$asc=0&$limit=1", "Lablz.printJson");
]]>       
  </script>
</div>