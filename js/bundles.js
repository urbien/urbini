{
  pre: {
    js: ['lib/jquery', 'jqm-config', 'lib/jquery.mobile-1.3.0-beta.1', 'lib/underscore', 'lib/backbone', 'taskQueue', 'lib/IndexedDBShim', 'lib/jquery-indexeddb', 'lib/queryIndexedDB', 'lib/jquery.masonry', 'lib/jquery.imagesloaded', 'templates', 'utils', 'error', 'events', 'models/Resource', 'collections/ResourceList', 
     'views/BasicView', 'views/HomePage', 'views/ResourceView', 'views/ControlPanel', 'views/Header', 'views/BackButton', 'views/AddButton', 'views/MenuButton', 'views/LoginButtons', 'views/ToggleButton', 'views/AroundMeButton', 'views/ResourceImageView', 'views/MapItButton', 
     'views/ResourceListItemView', 'views/ResourceListView', 'views/ResourceMasonryItemView', 'views/CommentListItemView', 'views/ListPage', 'views/ViewPage',  'vocManager', 'resourceManager', 'router', 'app'],
    css: ['lib/jquery.mobile-1.3.0-beta.1.css', 'lib/jquery.mobile.theme-1.3.0-beta.1.css', 'lib/jquery.mobile.structure-1.3.0-beta.1.css', '../lib/jqm-icon-pack-fa.css', '../styles/styles.css', '../styles/common-template-m.css'],
    html: ['../templates.jsp']
  },
  post: {
    js: ['views/EditPage', 'views/EditView', 'views/MenuPanel', 'views/MapView', 'views/PublishButton', 'lib/leaflet', 'lib/leaflet.markercluster', 'maps', 'lib/mobiscroll-datetime-min', 'mobiscroll-duration'],
    css: ['../styles/leaflet/leaflet.css', '../styles/leaflet/MarkerCluster.Default.css', '../styles/leaflet/leaflet.ie.css', '../styles/leaflet/MarkerCluster.Default.ie.css', '../styles/mobiscroll.datetime.min.css']
  }
}
