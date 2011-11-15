<html>
<head>
  <!--script src="http://mark.obval.com/obval/jsonUtils.js" type="text/javascript"></script>
  <script src="http://vkontakte.ru/js/api/xd_connection.js?3" type="text/javascript"></script>
  <script src="http://mark.obval.com/obval/lablzapi.js?1" type="text/javascript"></script-->
</head>

<body>
  <div id="lablz_data"></div>
  <div id="userName"></div>   
  <script type="text/javascript">
<![CDATA[   
        
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
        return 'http://mark.obval.com/obval/' + imgUri.substring(imgUri.indexOf('url=') + 4);
      }

      function selfContainedExample() {
        if (window.location.hash.length == 0) {
          var appID = "rpt6nb8qfg1foj1s6vh3e6ci5k6tnj";
          var path = 'https://mark.obval.com/obval/api/v1/authenticate?';
          var queryParams = ['client_id=' + appID, 'redirect_uri=' + window.location, 'response_type=token']; //, 'state=' + ]; // CSRF protection
          var query = queryParams.join('&');
          var url = path + query;
          window.location = url;
        } 
        else {
          var access_token = window.location.hash.substring(1); // sth like 'access_token=erefkdsnfkldsjflkdsjflsdfs'

          // purchasing history example
//          var path = "https://mark.obval.com/obval/api/v1/me/purchasingHistory?";
//          var queryParams = [access_token, 'callback=printCouponTitlesAndPics', 'select=featured,title'];

          // profile example
//          var path = "https://mark.obval.com/obval/api/v1/me?";
//          var queryParams = [access_token, 'callback=scareUser', 'select=firstName,lastName,email,photo'];

          // list people examples - pick 'path' and one of 'queryParams'
//          var path = "https://mark.obval.com/obval/api/v1/Person?";
//          var queryParams = [access_token, 'callback=printNamesAndEmails', 'select=email,firstName,lastName,gender', 'where=' + encodeURIComponent("OR (lastName=null,firstName=null), OR (email='stupid@gmail.com',email IN ('mvayngrib+ab@gmail.com', 'mvayngrib+ac@gmail.com', 'mvayngrib+ad@gmail.com')), OR (gender='Male',gender=null)")];
//          var queryParams = [access_token, 'callback=printNamesAndEmails', 'select=email,firstName,lastName,gender', 'where=' + encodeURIComponent("OR (email='mark.vayngrib@lablz.com',email IN ('mvayngrib+ab@gmail.com', 'mvayngrib+ac@gmail.com', 'mvayngrib+ad@gmail.com'))")];
//          var queryParams = [access_token, 'callback=printJson', 'select=email,firstName,lastName,vendor', 'where=' + encodeURIComponent("OR (vendor='uri:Vendor/2',vendor='uri:Vendor/1')")];

          // print json example
//          var path = "https://mark.obval.com/obval/api/v1/me?";
//          var queryParams = [access_token, 'callback=printJson', 'select=all'];

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