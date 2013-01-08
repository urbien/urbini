{
  pre: {
    js: ['lib/jquery', 'jqm-config', 'lib/jquery.mobile', 'lib/underscore', 'lib/backbone', 'lib/IndexedDBShim', 'lib/queryIndexedDB', 'lib/jquery.masonry', 'lib/jquery.imagesloaded', 'templates', 'utils', 'error', 'events', 'models/Resource', 'collections/ResourceList', 
     'views/HomePage', 'views/ResourceView', 'views/ControlPanel', 'views/Header', 'views/BackButton', 'views/MenuButton', 'views/LoginButtons', 'views/ToggleButton', 'views/AroundMeButton', 'views/ResourceImageView', 'views/MapItButton', 
     'views/ResourceListItemView', 'views/ResourceListView', 'views/ListPage', 'views/ViewPage', 'vocManager', 'resourceManager', 'router', 'app'],
    css: ['../lib/jquery.mobile.css', '../lib/jquery.mobile.theme.css', '../lib/jquery.mobile.structure.css', '../lib/jqm-icon-pack-fa.css', '../styles/styles.css', '../styles/common-template-m.css'],
    html: ['../templates.jsp']
  },
  post: {
    js: ['views/ResourceMasonryItemView', 'views/CommentListItemView', 'views/MenuPage', 'views/EditPage', 'views/EditView', 'views/MapView', 'lib/leaflet', 'lib/leaflet.markercluster', 'maps'],
    css: ['../styles/leaflet/leaflet.css', '../styles/leaflet/MarkerCluster.Default.css', '../styles/leaflet/leaflet.ie.css', '../styles/leaflet/MarkerCluster.Default.ie.css']
  }
}
