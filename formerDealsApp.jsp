<div>
  <script src="lablzapi1.js" type="text/javascript"></script>
  <div id="lablz_data"></div>
  <div id="coupon_view"></div>
  <div id="coupon_list"></div>
  <script type="text/javascript">
<![CDATA[   
      Lablz.init("f57c0964f4442fc37597aede2f05681");
        
// 		print former deals. Click on any coupon image to view large image and title
      getFormerDeals("printDeals");
      
//		calls		 http://www.obval.com/api/v1/Coupon?where=dateExpired%3Ctoday,featured!=null&select=featured
      function getFormerDeals(callbackName) {
        var queryParams = ['where=dateExpired%3Ctoday,featured!=null,basedOnTemplate=null', 'select=featured'];  // 'featured' is the name of the image property        
        var query = "Coupon?" + queryParams.join('&');
        Lablz.simpleCall(query, callbackName);
      }

// 		calls  http://www.obval.com/api/v1/{insert coupon uri such as "Coupon/32047"}?select=image,title
      function getCouponInfo(couponUri, callbackName) {
        var query = couponUri + "?select=image,title";        
        Lablz.simpleCall(query, callbackName);
      }
      
// 		print title and large image of coupon. data is sth like {"title":"Buy a house for $1","image":".../Image?url=..."}
      function printCouponInfo(data) {
        var div = document.getElementById('coupon_view');
        div.innerHTML = data.title + "<br /><img src='" + Lablz.getImageUrl(data.image) + "' />";
      }

// 		print the coupon images in a table with cellsPerRow cells per row (default value 4)
// 		the data comes back as a json object {"data" : [array of coupon json objects]}

			var cellsPerRow = 4;
      function printDeals(response) {
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
            cell[j].innerHTML = "<a href=\"javascript:getCouponInfo('" + data[j]._uri + "','printCouponInfo')\"><img src='" + Lablz.getImageUrl(data[j].featured) + "' /></a>";
      
            row[rowNum].appendChild(cell[j]);
          }
          coupons.appendChild(row[rowNum]);
        }
        div.innerHTML = "";
        div.appendChild(coupons);
      }      
]]>       
  </script>
</div>