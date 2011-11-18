<div>
  <script src="http://mark.obval.com/obval/lablzapi1.js" type="text/javascript"></script>
  <div id="lablz_data"></div>
  <div id="coupon_view"></div>
  <div id="coupon_list"></div>
  <script type="text/javascript">
<![CDATA[   
      Lablz.init("34bfac842674d2ef11b6b1cfb26fdee");
        
			// print former/current deals. Click on any coupon image to view large image and title
      function couponExample() {
//        getCurrentDeals("printDeals");
//        getFormerDeals("printDeals");
//        oauthExample("printDeals");
      }      

//getFormerDeals("Lablz.printJson");
      Lablz.call("me/purchasingHistory?select=title,adjustedTotal", "Lablz.printJson");
//      Lablz.call("Vendor?select=email", "Lablz.printJson");
//      Lablz.call("Vendor?where=" + encodeURIComponent('city=Moscow') + "&select=name", "Lablz.printJson");
//      Lablz.call("Vendor/2/coupons?select=title", "Lablz.printJson");
      
			// make api call to url: serverName/api/v1/Coupon?where=dateExpired%3E%3Dtoday,featured!=null&select=featured,title
			//			   http://aurora2.lablz.com/api/v1/Coupon?where=dateExpired%3E%3Dtoday,featured!=null&select=featured,title
			// api call: fetch me all Coupon resources whose dateExpired <= today and who have a thumbnail picture ("featured" property)
			// feed data received to the function with name = callbackName     
      function getCurrentDeals(callbackName) {
        var queryParams = ['where=dateExpired%3E%3Dtoday,featured!=null', 'select=featured,title'];  // 'featured' is the name of the image property        
        var query = "Coupon?" + queryParams.join('&');
        Lablz.simpleCall(query, callbackName);
      }
      
			// make api call to url: serverName/api/v1/Coupon?where=dateExpired%3Ctoday,featured!=null&select=featured,title
			//			   http://aurora2.lablz.com/api/v1/Coupon?where=dateExpired%3Ctoday,featured!=null&select=featured,title
			// api call: fetch me all Coupon resources whose dateExpired <= today and who have a thumbnail picture ("featured" property)
			// feed data received to the function with name = callbackName     
      function getFormerDeals(callbackName) {
        var queryParams = ['where=dateExpired%3Ctoday,featured!=null', 'select=featured,title', 'limit=10', 'asc=y', 'orderBy=couponBuysCount'];  // 'featured' is the name of the image property        
        var query = "Coupon?" + queryParams.join('&');
        Lablz.simpleCall(query, callbackName);
      }

			// print the coupon images in a table with cellsPerRow cells per row (default value 4)
			// the data comes back as a json object {"data" : [array of coupon json objects]
		  var cellsPerRow = 4;
      function printDeals(response) {
        if (response.error) {
          Lablz.printJson(response);
          return;
        }
      
        var div = document.getElementById('coupon_list');        
        var data = response.data;
        var numCells = data.length;
        var numRows = numCells / cellsPerRow;
        var coupons = document.createElement('table');
        coupons.width = "100%";
        var row = new Array();
        var cell = new Array();
        for (i = 0; i < numCells; i+=cellsPerRow) {
          var rowNum = i / cellsPerRow;
          if (i % cellsPerRow == 0) {
            row[rowNum] = document.createElement('tr');
          }

          cellNum = i;
          for (j = i; j < numCells && j < i + cellsPerRow; j++) {
            cell[j] = document.createElement('td');
//            cell[j].innerHTML = data[j].title + "<br /><a href=\"javascript:getCouponInfo('" + data[j]._uri + "','printCouponInfo')\"><img src='" + Lablz.getImageUrl(data[j].featured) + "' /></a>";
            cell[j].innerHTML = "<a href=\"javascript:getCouponInfo('" + data[j]._uri + "','Lablz.printJson')\"><img src='" + Lablz.getImageUrl(data[j].featured) + "' /></a>";
      
            row[rowNum].appendChild(cell[j]);
          }
          coupons.appendChild(row[rowNum]);
        }
        div.innerHTML = "";
        div.appendChild(coupons);
      }
      
			// make api call to url: serverName/api/v1/Coupon/{uri}?select=featured,title
			// For example, if uri = "Coupon/32047",  call  http://aurora2.lablz.com/api/v1/Coupon/32047?select=image,title
			// api call: fetch me the large image (property "image") and title of Coupon with uri "uri" 
			// feed data received to the function with name = callbackName
      function getCouponInfo(couponUri, callbackName) {
        var query = couponUri + "?select=image,title";        
        Lablz.simpleCall(query, callbackName);
      }
      
      // print large image of coupon. data is sth like {"title":"Buy a house for $1","image":".../Image?url=..."}
      function printCouponInfo(data) {
        var div = document.getElementById('coupon_view');
        div.innerHTML = data.title + "<br /><img src='" + Lablz.getImageUrl(data.image) + "' />";
      }
      
      couponExample();
]]>       
  </script>
</div>