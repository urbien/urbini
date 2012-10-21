<!DOCTYPE HTML>
<html>
<head>
  <title>Backbone Cellar</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, minimum-scale=1.0, maximum-scale=1.0"></meta>
  <link rel="stylesheet" href="lib/kitchensink/jq.ui.frosty.css" />   
  <link rel="stylesheet" href="lib/jquery.mobile-1.2.0.css" />   
</head>
<body>
	<file />

<!-- JavaScript -->
<script src="lib/jquery-1.7.2.js"></script>
<script src="lib/jquery.mobile-1.2.0.js"></script>
<!--script src="lib/jq.ui.js"></script-->
<script src="lib/underscore.js"></script>

<script> 
 _.templateSettings = {
        interpolate : /\{\{([\s\S]+?)\}\}/g
   };
</script>

<!-- script>
replaced with solution from here: http://stackoverflow.com/questions/10597480/boolean-checks-in-underscore-templates   
_.templateSettings = {
        evaluate:    /\{\{(.+?)\}\}/g,          
        interpolate : /\{\{([\s\S]+?)\}\}/g,
        escape: /\{\{-(.+?)\}\}/g
    };
</script -->

<script src="lib/backbone.js"></script>
<!-- script src="lib/jquery-1.7.2.js"></script -->
<!--script src="lib/mustache.js"></script-->   
<script src="lib/IndexedDBShim.min.js"></script>   
<!-- script src="js/jqsetup.js"></script -->   
<script src="js/utils.js"></script>   
<script src="js/base.js"></script>   
<!-- backboneModels / -->
<script src="js/models.js"></script>   
<script src="js/views.js"></script>   
<script src="js/main.js"></script>   

</body>
</html>
