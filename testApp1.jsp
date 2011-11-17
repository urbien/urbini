<html>
<head>
</head>

<body>
  <div id="coupon_view"></div>
  <div id="coupon_list"></div>
  <div id="userName"></div>   
  <script type="text/javascript">
<![CDATA[   
        
      var serverName = "mark.obval.com/obval";
      var apiUrl = "https://" + serverName + "/api/v1/";
      function getImageUrl(imgUri) {
        return 'http://' + serverName + '/' + imgUri.substring(imgUri.indexOf('url=') + 4);
      }

      function selfContainedExample() {
        getFormerDeals("printDeals");
      }      

      function getFormerDeals(callbackName) {
        var path = "Coupon?";
        var queryParams = ['where=dateExpired%3C%3Dtoday,featured!%3Dnull', 'select=featured,title'];  // 'featured' is the name of the image property        
        var query = queryParams.join('&');
        var url = path + query;
        makeApiCall(url, callbackName);
      }
      
      function printDeals(response) {
        var div = document.getElementById('coupon_list');        
        var data = response.data;
        var numCells = data.length;
        var cellsPerRow = 4;
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
            cell[j].innerHTML = data[j].title + "<br /><a href=\"javascript:getCouponInfo('" + data[j]._uri + "','printCouponInfo')\"><img src='" + getImageUrl(data[j].featured) + "' /></a>";
      
            row[rowNum].appendChild(cell[j]);
          }
          coupons.appendChild(row[rowNum]);
        }
        div.innerHTML = "";
        div.appendChild(coupons);
      }
      
      function getCouponInfo(uri, callbackName) {
        var queryParams = ['select=image,title'];  // 'featured' is the name of the image property        
        var query = queryParams.join('&');
        var url = uri + "?" + query;        
        makeApiCall(url, callbackName);
      }
      
      function printCouponInfo(data) {
        var div = document.getElementById('coupon_view');
        div.innerHTML = data.title + "<br /><img src='" + getImageUrl(data.image) + "' />";
      }

      // where query is sth like "Coupon?where=...&select=..."      
      function makeApiCall(query, callbackName) {
        var fullUrl = apiUrl + query + "&callback=" + callbackName;
        var script = document.createElement('script');
        script.src = fullUrl;
        document.body.appendChild(script);        
      }
      
      selfContainedExample();
]]>       
  </script>
</body>

</html>