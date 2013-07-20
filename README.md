Urbini
======
Urbini is a mobile web framework that helps web apps and native apps work together in one network. We call it appnet.

The Appnet
==================
See an [article on Appnet and its goals](https://github.com/urbien/urbini/wiki/Appnet).
Think of Appnet as mashups++. Instead of custom ad hoc code connecting the apps, the Appnet offers a unified method of mapping any web api into a browser-based database. Apps can now use data from multiple sites as if it was one site.

Here are the steps:

1. Use mobile/tablet browser create an App on http://urbien.com. In desktop browser go to http://urbien.com/app/UrbienApp. To start app creation click on App gallery and click on + icon in navbar.

2. Using a browser define backbone model(s) that will be created from a WebAPI.

3. Each model has a property sync. Paste into it an adapter script that will map json returned by site's WebAPI into backbone model objects. See Urbien Groupon app as a sample. To preserve quality and lower the noise, the new App initially shows up in App Ideas. When 3 people install it, it will show up in App Gallery. 

4. Not just the site's owner, but anyone can create an app, models and adapter for someone else's site. And anyone can create IFTTT-like connectors between the apps using simple JavaScript.

App dev for the rest of us
====================
Urbini lifts web apps to the level of native apps and then helps them work together in one network, thus making the mobile app dev field more open. @urbien we set out to build tools for ourselves to produce mobile web apps much faster. Then we realized that others could use the same tools. Thus Urbini was conceived. But we wanted to take Urbini much further. Our vision is to open mobile app dev to non-professional developers. Here is the architecture that we created to make this happen.

Backbone and other MVC framewoks are drastically changing the way we build Web apps, allowing to move app dev from the server, where it traditionally happened, to the browser side. Require.js and other AMD loaders emerged to address the greater weight and complexity of such web apps. UI frameworks, like jQuery Mobile emerged to lift such apps to a decent usability level, and JS libraries, like the masonry (isotope, infinity, etc.), mobiscroll, leaflet, etc. are making writing apps entirely on the client side possible. Push notifications for Chrome, Firefox and Safari, create a parity with the native apps for background operations. And HTML5 webrtc gives web apps Skype-like functionality, which is very hard to achieve in native apps.

While this tech helps, the complexity of putting together all the pieces has gone up 10x times. And the major problem has not been solved. How do we make web apps catch up with native. The first thing we need to achieve is bootstrapping the new much fatter client, the second, we must cache it persistently and do not let browser wipe it out. Then we need to find a way to incrementally upgrade the app, without user noticing. And then the big task comes in, how do we make the app responsive? The answer to this question is - we paint from the local data store, like native apps do. And this leads us to the use of IndexedDB (immature) and WebSQL (mature but deprecated). We need to sync the data between the web site and local db and do it efficiently. We need to upgrade the local db schema gradually and in the way user does not notice it. And we gotta keep away from the UI thread, as much as possible, since Javascript UI is singlethreaded. 

We have been solving all these problems and some more (e.g. MVC models creation and evolution) at Urbien and we wanted to give back to the community. We think of Urbini as a first ever distro for Javascript. A boot loader, a packager, build tools, and web db sync on top. As a distro we made certain choices to pre-integrate certain packages and not their, possibly superior, alternatives. Please bear with us. We will try to add the flexibility to the packaging process to satisfy wider set of needs and tastes. 

Please join us in this amazing journey of making the Web open again.

Gene, Ellen, Jacob, Mark, Simon, Alex and the rest of Urbien team.
Visit <a href="http://urbien.com">Urbien</a> to learn more about us.

Start editing <a href="https://github.com/urbien/urbini/wiki">our wiki</a> to teach newbies how to build mobile web apps really fast. These apps start with just a model that is created in the web browser, even on a smartphone. They offer 100% generated UI which can later be customized, provide full offline support, feature built in social login (to 5+ networks) and automatic social reposting, have profile import and friend invite, e-commerce capabilities, image galleries and a lot more, without newly christened developer lifting a finger. For professional developers these apps are a great starting point to modify our templates, views, and to start experimenting with app networking, without being bogged down with the usual build up of the core app functionality. 
