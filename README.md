Urbini
======
Urbini is a mobile web framework that helps web apps and native apps work together in one network. 

First we will describe this network, and then how Urbini lifts web apps to the level of native apps so that they can be equal peers in that network.

Urbini network, or appnet is inspired by IFTTT:

1. Like IFTTT it aspires to connect apps and devices (internet of things)

2. Unlike IFTTT it is mobile, making app and device connections on smartphones and tablets.

3. Unlike IFTTT it is open, all client code is here on github. And unlike IFTTT, channels (maps to existing apps) can be created by anyone.

4. Unlike IFTTT it is more programmable. IFTTT's trigger/action is just one of the ways to connect apps and devices, and in Urbini actions are written in JavaScript. In addition, all connections are unified via [backbone] data models. This allows to add scripts for any user actions.

Physics UI
========
For this new idea to take off, it must be dead gorgeous. In 2013 the design went flat. In 2014 the focus in mobile web apps will be moving to motion, to realistic, fluid, intuitive motion. iOS and native apps serve to us as a shiny beacon. To give web apps an edge here, we integrated a physics engine into Urbini and are working with another physics engine developer to offer you more choices. We started with a very difficult control, an infinite scroll with momentum and edge bounces. It works for a full page vertically or horizontally or as a strip, like still shots in IMDB app. What is cool is that you control the physics, the air drag, the spring stiffness and damping, with more like mass, gravity, friction, magnetic snaps and lego-like constructions to come. We want devs to choose from a gallery of buttery smooth cool movements to drop into their apps. See more on physics later ... 

The Appnet
==================
See an [article on Appnet and its goals](https://github.com/urbien/urbini/wiki/Appnet).
Now back to architecture for a bit. Think of Appnet as mashups++. Instead of custom ad hoc code connecting the apps, the Appnet offers a unified method of mapping any web api into a browser-based database. Apps can now use data from multiple sites as if it was one site.

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

The first answer to these questions is - we paint from the local data store, like native apps do. In the HTML5 world that means we have to use all of the offline storage methods available, as each has its own limitations: IndexedDB/WebSQL/LocalStorage/Appcache/FileSystem. We need to sync the data between the web site and local storage and do it efficiently. We need to upgrade the local db schema gradually and in the way that user does not notice it. And we must at all cost keep away from the main UI thread, as much as possible, since Javascript UI is singlethreaded.

We have been solving all these problems and some more (e.g. UI for MVC models creation) at Urbien and we wanted to give back to the community. We think of Urbini as a first ever distro for Javascript. A boot loader, a packager, build tools, web db sync, and a UI package for apps. As a distro we made choices to pre-integrate certain packages and not their, possibly superior, alternatives. Please bear with us. We will try to add the flexibility to the packaging process to satisfy wider set of needs and tastes. 

Mobile HTML5 performance gap
=========================
Painting UI from the local database and making app assets available offline is the core of Urbini, but this is not enough to make mobile HTML5 buttery smooth. To close the gap with the native apps we had to employ the bag of tricks developed by [LinkedIn](http://engineering.linkedin.com/linkedin-ipad-5-techniques-smooth-infinite-scrolling-html5), [Sencha] (http://www.sencha.com/blog/the-making-of-fastbook-an-html5-love-story) and [Famo.us] (http://www.slideshare.net/befamous/html5-devconf-oct-2012-tech-talk).

1. Lazy load images. This is a standard technique for image heavy sites even of the desktop. We augmented it with the offline image support. We are saving all images into IndexedDB so that we do not need to request them from the server again and so that users could see images offline. (IndexedDB in Firefox,  an IndexedDB shim on top of WebSQL in Safari, and using a File System in Chrome, as it's  IndexedDB does not support Blobs yet).

2. DOM on a strict diet. As the number of DOM elements grows DOM manipulation becomes extremely slow. [LinkedIn team graciously shared](http://engineering.linkedin.com/linkedin-ipad-5-techniques-smooth-infinite-scrolling-html5) their layered sliding window method. Sencha and Famo.us also use sliding window, but do not provide much details (In all fairness one could read their code, but is not small). Our sliding window algorithm adapts to the direction (vertical or horizontal), the capabilities of the device (low end or older phones and tablets with 256M ram) and the speed of user's actions.

3. Show results ASAP. When Sencha developers analyzed the Facebook HTML5 app, which Facebook abandoned for for performance reasons, they were shocked to see that every WebAPI request was bringing 20K+ data, see [Bonus Points paragraph in Fastbook article](http://www.sencha.com/blog/the-making-of-fastbook-an-html5-love-story). Thus Urbini requests data for resource lists from Urbien cloud database in two steps: a small subset of properties is requested initially and the rest is requested later. In a similar fashion, when painting user's profile we show a part of the page right away and then paint the rest of it later, e.g. user's friend list, a call-in-progress header, etc. (When Urbini app is based on third-party WebAPIs, this optimization technique is not used).

4. App Homepage. This is a continuation of a previous theme. App's Homepage has to load fast, letting the rest of the framework and app assets load later. Homepage is stripped of all Urbini dependencies, and uses dataurl images so that it loads faster and can work offline.

5. Avoid long runs. It is critical to not keep main JS thread busy with long tasks. As one measure, we use a pool of JS threads to do [some processing off-main-thread](http://net.tutsplus.com/tutorials/javascript-ajax/getting-started-with-web-workers/). For example, Urbini executes all xhr requests on web workers. This a simple and commonly used technique. Sencha introduced a greatly more complex technique - to chunk up all the work into small tasks and queue them up for execution at the appropriate time (queue is driven by rAF, introduced below).

6. Smooth animations. rAF feature in modern browsers is a key to the most sophisticated performance solutions, so it pays to grok it.  Browser calls our rAF callback to let us paint a frame. rAF callback is called with the frequency of a refresh rate of your monitor (usually 60hz) , so if we manage to fit into the time slot allotted to us by rAF, then DOM manipulation, transitions, etc. will look smoother to the user. So debouncing is a simple technique where you only make a record of what needs to be done in various event handlers that process user actions, such as touchstart, mouseover, click, etc. and DO NOT manipulate DOM there, [only manipulate it in the rAF callback](http://www.html5rocks.com/en/tutorials/speed/animations/). In that sense rAF is like a conveyor belt, you have limited time to do your small operation and you can not delay, as you will stop the whole belt.

7. Responsive images. The problem is that mobile devices have a whole slew of sizes and resolutions. The other problem is user's network can be fast and unlimited or slow and metered. Thus [we can not serve the same high DPI image](http://css-tricks.com/on-responsive-images/) to iPad with retina screen and to FirefoxOS ZTE Open. Images are pregenerated at a multitude of sizes on Urbien server and are served according to the device's screen size and resolution. Expensive image scaling on the device is avoided, when appropriate. 

8. DOM optimizations. [DOM elements reuse](http://jsperf.com/re-using-dom-objects-vs-creating-new-ones), [Read/write ops batching](https://github.com/wilsonpage/fastdom), off-DOM painting using documentFragment, innerHtml batching (concatenate a string and insert the result with one innerHtml), [reflow avoidance](http://gent.ilcore.com/2011/03/how-not-to-trigger-layout-in-webkit.html), and many other tricks are employed by Urbini. 

9. Pre-fetching. Data for the next page user is likely to want is pre-fetched and sometimes even pre-rendered. This applies to the menu items, next page for the infinite scrolling, etc. The key is to queue these tasks with the lower priority so that they execute when [user is idle](https://wiki.mozilla.org/WebAPI/IdleAPI) and [browser is idle](https://github.com/StrictlySkyler/timeywimey) and drop these tasks from the queue if user moved to a different screen.

10. Instant reaction to user actions. We aim to start transitions right after user actions. This work is in progress. We also process touch events ourselves to avoid unnecessary painting on scroll swipes (like hover highlighting) and to determine user gestures, like taps, vertical and horizontal flicks and a lot more gestures in the future.

More optimizations are planned:

1. Bundling/batching WebAPI requests. Sometimes we issue a set of WebAPI requests in the row. Most our WebAPI requests can be delayed, as pages are painted from the local DB, so we could debounce async requests and issue one batch request to the Urbien cloud server. If app has its backend on a third-party cloud server, we would continue to issue WebAPI requests one by one.

2. Simple Physics. iOS's delightful momentum scrolling, scroll end bounce are examples of mimicking real-life forces to give user's subconscious the cues on [what is going on and what to expect next] (http://www.ui-transitions.com/#categories). But may be the biggest advantage of using the Physics engine is its power of illusion. Apparently [when screen movements match what our brains got wired to perceive in the real world] (http://acko.net/blog/animate-your-way-to-glory/) the jittery movements will look silky smooth to the user. CSS transform provides built-in animation easing, but it is arrow prone to derailing by sudden wind blows. As JS's sudden Garbage Collection, background apps and user actions often throw us those unexpected blows, the Physics engine helps us make recalculate our next move in-flight and on every frame. We use matrix3D CSS transforms for that.

Documentation
============
Help us edit <a href="https://github.com/urbien/urbini/wiki">a wiki</a> to teach newbies how to build mobile web apps really fast. These apps start with just a model that is created in the web browser, even on a smartphone. They offer 100% generated UI which can later be customized, provide full offline support, feature built in social login (to 5+ networks) and automatic social reposting, have profile import and friend invite, e-commerce capabilities, image galleries and a lot more, without newly christened developer lifting a finger. For professional developers these apps are a great starting point to modify our templates, views, and to start experimenting with app networking, without being bogged down with the usual build up of the core app functionality. 

Please join us in this amazing journey of making the Web open again.

Gene, Ellen, Jacob, Mark, Simon, Alex and the rest of Urbien team.
Visit <a href="http://urbien.com">Urbien</a> to learn more about us.

License 
======
Urbini is licensed under <a href="http://www.gnu.org/licenses/lgpl.html">LGPL</a>. This means you can use it to build upon it both open source and commercial apps. You are welcome to fork Urbini and we would love you to submit Github pull requests to the team and/or open issues with requests for improvements.
