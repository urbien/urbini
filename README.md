urbini
======
Urbini is a foundation for a new network, network of apps. Mobile apps. Mobile web apps.

Appnet
=======
See an [article on Appnet and its goals](https://github.com/urbien/urbini/wiki/Appnet).
Developers can think of Appnet as mashups++. Instead of custom ad hoc code connecting the apps Appnet offers a unified method of mapping any web api into a browser-based database, so that app dev that uses data from multiple sites is greatly simplified.

Here are the steps:
1. Use mobile/tablet browser create an App on http://Urbien.com. In desktop browser go to http://urbien.com/app/UrbienApp. Then click on App gallery and click on + icon in navbar.
2. Using a browser define backbone model(s) that will be created from a WebAPI.
3. Each model has a property sync. Paste in it an adapter script that will map json returned by WebAPI into backbone model objects. See Urbien Groupon app as a sample.

App dev for the rest of us
======================
There is a great debate raging on the web on whether to build HTML5 or native apps. There is no question in our minds. Web will ultimately win. And we hope Urbini will make this day come sooner. There is a great innovation happening in Javascript land lately. Backbone and other MVC framewoks are drastically changing the way we build Web apps. Require.js and other AMD loaders emerged to address the greater weight and complexity of Web apps. UI frameworks, like jQuery Mobile lift all apps to a decent usability level, JS libraries, like the masonry (isotope, infinity, etc.), mobiscroll, leaflet, etc. help make writing apps entirely on the client side possible. Push notifications for Chrome, Firefox and Safari, create parity with native apps for background operations. And HTML5 webrtc gives web apps Skype-like functionality, which is very hard to make in native apps.

While this tech helps, the complexity of putting together all the pieces has gone up 10x times. And the major problem has not been solved. How do we make web apps catch up with native. The first thing we need to achieve is bootstrapping the new much fatter client, the second, we must cache it persistently and do not let browser wipe it out. Then we need to find a way to incrementally upgrade the app, without user noticing. And then the big task comes in, how do we make the app responsive? The answer to this question is - we paint from the local data store, like native apps do. And this leads us to the use of IndexedDB (immature) and WebSQL (mature but deprecated). We need to sync the data between the web site and local db and do it efficiently. We need to upgrade the local db schema gradually and in the way user does not notice it. And we gotta keep away from the UI thread, as much as possible, since Javascript UI is singlethreaded. 

We have been solving all these problems and some more (e.g. MVC models creation and evolution) at Urbien and we wanted to give back to the community. We think of Urbini as a first ever distro for Javascript. A boot loader, a packager, build tools, and web db sync on top. As a distro we made certain choices to pre-integrate certain packages and not their, possibly superior, alternatives. Please bear with us. We will try to add flexibility to the packaging process to satisfy your needs. 

Please join us in this amazing journey of taking back the Web.

Gene, Ellen, Jacob, Mark, Simon, Alex and the rest of Urbien team.
Visit <a href="http://urbien.com">Urbien</a> to learn more about us.

Start editing <a href="https://github.com/urbien/urbini/wiki">our wiki</a> to teach newbies how to build mobile web apps really fast. These apps will have 100% generated UI, offline support, built in social login and reposting, profile import and friend invite, e-commerce capabilities, image galleries and a lot more, without newly christened developer lifting a finger. For professionals these apps are a great starting point to modify our templates, views, and to start experimenting with app networking, without being bogged down with the usual build up of the core app functionality. 
