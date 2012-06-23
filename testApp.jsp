<html>
<head>
  <!--script src="http://aurora2.lablz.com/jsonUtils.js" type="text/javascript"></script>
  <script src="http://vkontakte.ru/js/api/xd_connection.js?3" type="text/javascript"></script>
  <script src="http://aurora2.lablz.com/lablzapi.js?1" type="text/javascript"></script-->
</head>

<body>
  <div id="lablz_data"></div>
  <div id="userName"></div>   
  <script type="text/javascript">
<![CDATA[   
        
      var apiUrl = "https://mark.obval.com/obval/api/v1/";
      // assuming we got their titles at least
      function printCouponTitlesAndPics(response) {
        var div = document.getElementById('lablz_data');        
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
            cell[j].innerHTML = data[j].title + "<br />" + (data[j].featured ? "<img src='" + getImageUrl(data[j].featured) + "' />" : "");
      
            row[rowNum].appendChild(cell[j]);
          }
          coupons.appendChild(row[rowNum]);
        }
        div.appendChild(coupons);
      }
      
      function scareUser(person) {
        var userName = document.getElementById('userName');
        userName.innerHTML += "Greetings, " + person.firstName + ", " + person.lastName + ", looking good!<br />";
        if (person.photo)
          userName.innerHTML += "<img src='" + getImageUrl(person.photo) + "' /><br />";
        if (person.email)
          userName.innerHTML += "Ready to get spammed at " + person.email + "?";
        userName.appendChild(greetingText);
      }
      
      function getImageUrl(imgUri) {
        return 'http://aurora2.lablz.com/' + imgUri.substring(imgUri.indexOf('url=') + 4);
      }

      function selfContainedExample() {
        if (window.location.hash.length == 0) {
          var appID = "749b5ee823d75a5967b04c594bd560da";
          var path = 'https://aurora2.lablz.com/api/v1/authenticate?';
          var queryParams = ['client_id=' + appID, 'redirect_uri=' + window.location, 'response_type=token']; //, 'state=' + ]; // CSRF protection
          var query = queryParams.join('&');
          var url = path + query;
          window.location = url;
        } 
        else {
          var access_token = window.location.hash.substring(1); // sth like 'access_token=erefkdsnfkldsjflkdsjflsdfs'

          // purchasing history example
//         var path = "https://aurora2.lablz.com/api/v1/me/purchasingHistory?";
//         var queryParams = [access_token, 'callback=printCouponTitlesAndPics', 'select=featured,title'];
//          var queryParams = [access_token, 'callback=printJson', 'select=featured,title,adjustedTotal'];

          // profile example
//          var path = "https://aurora2.lablz.com/api/v1/me?";
//          var queryParams = [access_token, 'callback=scareUser', 'select=firstName,lastName,email,photo'];
//          var queryParams = [access_token, 'callback=printJson', 'select=all'];
//          really this just builds a url:
//          htpp://aurora2.lablz.com/api/v1/me?select=all&callback=printJson&access_token=....

          // list people examples - pick 'path' and one of 'queryParams'
          var path = "https://aurora2.lablz.com/api/v1/Person?";
//          var queryParams = [access_token, 'callback=printNamesAndEmails', 'select=email,firstName,lastName,gender', 'where=' + encodeURIComponent("OR (lastName=null,firstName=null), OR (email='stupid@gmail.com',email IN ('mvayngrib+ab@gmail.com', 'mvayngrib+ac@gmail.com', 'mvayngrib+ad@gmail.com')), OR (gender='Male',gender=null)")];
//          var queryParams = [access_token, 'callback=printNamesAndEmails', 'select=email,firstName,lastName,gender', 'where=' + encodeURIComponent("OR (email='mark.vayngrib@lablz.com',email IN ('mvayngrib+ab@gmail.com', 'mvayngrib+ac@gmail.com', 'mvayngrib+ad@gmail.com'))")];
          var queryParams = [access_token, 'callback=printJson', 'select=email,firstName,lastName,vendor', 'where=' + encodeURIComponent("vendor IN ('uri:Vendor/2','uri:Vendor/34422')")];

          // print json example
//          var path = "https://aurora2.lablz.com/api/v1/me?";
//          var queryParams = [access_token, 'callback=printJson', 'select=all'];

          // make comment example
//          var path = "https://mark.obval.com/obval/api/v1/m/Comment?";
//          var queryParams = [access_token, 'callback=printJson', 'where=' + encodeURIComponent("forum='uri:Coupon/32232',title='the greatest comment in the world, a tribute2'")];
          var path = "https://mark.obval.com/obval/api/v1/e/Comment/3/32232?";
          var queryParams = [access_token, 'callback=printJson', 'where=' + encodeURIComponent("title='the second greatest comment in the world, a tribute'")];
          var query = queryParams.join('&');
          var url = path + query;
   
          // use jsonp to call lablz
          var script = document.createElement('script');
          script.src = url;
          document.body.appendChild(script);        
        }
      }      
      
      function printNamesAndEmails(response) {
        var div = document.getElementById('lablz_data');        
        var data = response.data;
        if (data == null)
          return;
          
        for (var i = 0; i < data.length; i++) {
          div.innerHTML += '<br />' + data[i].firstName + ', ' + data[i].lastName + ', ' + data[i].email + ', ' + data[i].gender;
        }
      }
      
      function printJson(response) {
        var div = document.getElementById('lablz_data');
        var str = JSON.stringify(response, undefined, 2);
        output(str);
      }
      
      function output(inp) {
        toConsole(inp);
        var pre = document.createElement('pre');
        pre.innerHTML = inp;
        document.getElementById('lablz_data').appendChild(pre);
      }
      
//      printAvailableCoupons();
//      printFriends();
//      printProfile();
      selfContainedExample();
]]>       
  </script>
</body>

</html>