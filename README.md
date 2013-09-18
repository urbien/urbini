Urbini
======
Urbini is a mobile web framework that helps web apps and native apps work together in one network. 

Urbini is inspired by IFTTT:

1. Like IFTTT it aspires to connect apps and devices (internet of things)

2. Unlike IFTTT it is mobile, making app and device connections on smartphones and tablets.

3. Unlike IFTTT it is open, all client code is here on github. And unlike IFTTT, channels (maps to existing apps) can be created by anyone.

4. Unlike IFTTT is it more programmable. IFTTT's trigger/action is just one of the ways to connect apps and devices, and in Urbini actions are written in JavaScript. In addition, all connections are unified via [backbone] data models. This allows to add scripts for any user actions.


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

Models drive app dev
=================
Backbone and other MVC framewoks are drastically changing the way we build Web apps, allowing to move app dev from the server, where it traditionally happened, to the browser side. Require.js and other AMD loaders emerged to address the greater weight and complexity of such web apps. UI frameworks, like jQuery Mobile, Bootstrap, Brick emerged to lift such apps to a decent usability level, and the JS libraries, like the masonry (isotope, infinity, packery, etc.), mobiscroll, leaflet, d3, etc. are making writing apps entirely on the client side possible. Push notifications for Chrome, Firefox and Safari establish parity with the native apps for background operations. And HTML5 WebRTC gives web apps Skype-like functionality, something that only a handful of native apps can do.

HTML5 on mobile is 10x more complex
===============================
While this tech helps, the complexity of putting together all the pieces has gone up 10x times. And the major problem has not been solved. How do we make web apps catch up with native? The first thing we need to achieve is bootstrapping the new much fatter client; the second, we must cache it persistently and do not let browser wipe it out. Then we need to find a way to incrementally upgrade the app, without user noticing. And then the big task comes in, how do we make the app responsive and butter smooth? 

The first answer to these questions is - we paint from the local data store, like native apps do. In the HTML5 world that mean we have to use all of the offline storage methods available, as each has its own limitations: IndexedDB/WebSQL/LocalStorage/Appcache/FileSystem. We need to sync the data between the web site and local storage and do it efficiently. We need to upgrade the local db schema gradually and in the way that user does not notice it. And we must at all cost keep away from the main UI thread, as much as possible, since Javascript UI is singlethreaded.

We have been solving all these problems and some more (e.g. UI for MVC models creation) at Urbien and we wanted to give back to the community. We think of Urbini as a first ever distro for Javascript. A boot loader, a packager, build tools, web db sync, and a UI package for apps. As a distro we made choices to pre-integrate certain packages and not their, possibly superior, alternatives. Please bear with us. We will try to add the flexibility to the packaging process to satisfy wider set of needs and tastes. 

Mobile HTML5 performance gap
=========================
Next step. While painting UI from the local database and making app assets available offline is the core of Urbini, this is not enough to make mobile HTML5 buttery smooth. To close the gap with the native apps we had to employ the bag of tricks developed by [LinkedIn](http://engineering.linkedin.com/linkedin-ipad-5-techniques-smooth-infinite-scrolling-html5), [Sencha] (www.sencha.com/blog/the-making-of-fastbook-an-html5-love-story) and [Famo.us] (http://www.slideshare.net/befamous/html5-devconf-oct-2012-tech-talk).

1. Lazy load images. This is a standard technique for image heavy sites even of the desktop. We augmented it with the offline image support. We are saving all images into IndexedDB (Firefox) WebSQL (Safari) or a File System (Chrome), so that we do not need to request them from the server again and so that user could see images offline.

2. DOM on a strict diet. Long lists can only perform well with the sliding window in DOM. We use a slew of techniques developed and graciously shared by the LinkedIn team. Sencha and Famo.us also use similar techniques, but do not provide much details. 

4. App Homepage. App's Homepage has to load fast, letting the rest of the framework and app assets load later. Homepage is stripped of all Urbini dependencies, and uses dataurl images so that it loads faster and can work offline.

5. Show results fast. We do double data fetching, i.e. WebAPI requests for lists of resources from Urbien cloud database are split in two, a small subset of properties is requested initially and the rest is requested later. We also paint a part of the page right away and then paint the rest of it, like user's friend list, a call-in-progress header, etc., later.

6. Web worker pool. A pool of threads is kept to have all xhr requests get sent and processed off of the main JavaScript thread.

7. Image sizes. Images are pregenerated at a multitude of sizes on Urbien server and are served according to the device's screen size and resolution. Expensive image scaling on the device is avoided, when appropriate. 

8. DOM optimizations. Read/write ops batching, documentFragment, innerHtml batching, queuing, and many other tricks are employed. 

9 Prefetching. Data for the next page user is likely to want is prefetched and sometimes even pre-rendered. This applies to the menu items, next page for the infinite scrolling, etc.

10. Instant reaction to user actions. We aim to start transitions right after user actions. This work is in progress. We also process touch events ourselves to avoid unnecessary painting on scroll swipes.

More optimizations are planned:
1. Bundling WebAPI requests.

2. Use of rAF, time accounting and matrix3d transforms.

3. Simple Physics.

Documentation
============
Start editing <a href="https://github.com/urbien/urbini/wiki">our wiki</a> to teach newbies how to build mobile web apps really fast. These apps start with just a model that is created in the web browser, even on a smartphone. They offer 100% generated UI which can later be customized, provide full offline support, feature built in social login (to 5+ networks) and automatic social reposting, have profile import and friend invite, e-commerce capabilities, image galleries and a lot more, without newly christened developer lifting a finger. For professional developers these apps are a great starting point to modify our templates, views, and to start experimenting with app networking, without being bogged down with the usual build up of the core app functionality. 

Please join us in this amazing journey of making the Web open again.

Gene, Ellen, Jacob, Mark, Simon, Alex and the rest of Urbien team.
Visit <a href="http://urbien.com">Urbien</a> to learn more about us.
