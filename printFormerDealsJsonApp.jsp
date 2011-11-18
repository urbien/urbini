<div>
  <script src="lablzapi1.js" type="text/javascript"></script>
  <div id="lablz_data"></div>
  <script type="text/javascript">
<![CDATA[   
//		calls		 http://www.obval.com/api/v1/Coupon?where=dateExpired%3Ctoday,featured!=null&select=featured
      var queryParams = ['where=dateExpired%3Ctoday,featured!=null,basedOnTemplate=null', 'select=featured'];  // 'featured' is the name of the image property        
      var query = "Coupon?" + queryParams.join('&');
      Lablz.simpleCall(query, "Lablz.printJson");
]]>       
  </script>
</div>