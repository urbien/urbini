urbini
======
Urbini is a foundation for a new network, network of apps. Mobile apps. Mobile web apps.

Appnet
=======
Since the birth of the Web there existed a rip in its fabric. A fault, that fuels the drive to aggregate things in one place, against the very nature of the Web.

It is certainly much easier to create an amazing user experience with all the data under your app's control. What if websites and apps could have their independent existence, yet could meet other apps in one homogeneous, secure and neutral environment. 

Before the Internet, computers were isolated and weak. This is the state of the apps today. There are a million apps and about 10,000 of them offer APIs. It is as if 0.1% of computers could connect and each had its own unique protocol.

Urbini is a way to universally connect any and all apps. Much like Facebook, Urbini provides an open data graph for all apps to tap into. The difference is that the graph, and the inter-app connectivity based on it, are on your own device, not in the datacenter. You control access to your own data instead of a faceless company that government agencies have a way to tap into.

Urbini loads the graph using Web APIs provided by the apps and synchronizes the new data back to the respective web sites. Synchronization works automatically and in real-time. In a tribute to the Internet, we call it Appnet.

Graph is a local datastore on the device, and thus allows developers to create responsive and rich user experiences, both in online and an offline mode. And this power grows exponentially as apps join into the Appnet around the graph. This way Urbini offers web apps a major advantage over native apps, yet it is open and inclusive. It allows any app that has Web API to join the Appnet.

Appnet is a new app dev paradigm. The best part of it is that it allows the kind of app dev automation that was not possible before, thus opening the doors to the kind of creative people who were scratching their itch with IFTTT, but never quenched their thirst.

App dev for the rest of us
======================
There is a great debate raging on the web on whether to build HTML5 or native apps. There is no question in our minds. Web will ultimately win. And we hope Urbini will make this day come sooner. There is a great innovation happening in Javascript land lately. Backbone and other MVC framewoks are drastically changing the way we build Web apps. Require.js and other AMD loaders emerged to address the greater weight and complexity of Web apps. UI frameworks, like jQuery Mobile lift all apps to a decent usability level, JS libraries, like the masonry (isotope, infinity, etc.), mobiscroll, leaflet, etc. help make writing apps entirely on the client side possible. Push notifications for Chrome, Firefox and Safari, create parity with native apps for background operations. And HTML5 webrtc gives web apps Skype-like functionality, which is very hard to make in native apps.

While this tech helps, the complexity of putting together all the pieces has gone up 10x times. And the major problem has not been solved. How do we make web apps catch up with native. The first thing we need to achieve is bootstrapping the new much fatter client, the second, we must cache it persistently and do not let browser wipe it out. Then we need to find a way to incrementally upgrade the app, without user noticing. And then the big task comes in, how do we make the app responsive? The answer to this question is - we paint from the local data store, like native apps do. And this leads us to the use of IndexedDB (immature) and WebSQL (mature but deprecated). We need to sync the data between the web site and local db and do it efficiently. We need to upgrade the local db schema gradually and in the way user does not notice it. And we gotta keep away from the UI thread, as much as possible, since Javascript UI is singlethreaded. 

We have been solving all these problems and some more (e.g. MVC models creation and evolution) at Urbien and we wanted to give back to the community. We think of Urbini as a first ever distro for Javascript. A boot loader, a packager, build tools, and web db sync on top. As a distro we made certain choices to pre-integrate certain packages and not their, possibly superior, alternatives. Please bear with us. We will try to add flexibility to the packaging process to satisfy your needs. 

Please join us in this amazing journey of taking back the Web.

Gene, Ellen, Jacob, Mark, Simon, Alex and the rest of Urbien team.
Visit <a href="http://urbien.com">Urbien</a> to learn more about us.

Start editing <a href="https://github.com/urbien/urbini/wiki">our wiki</a> to teach newbies how to build mobile web apps really fast. These apps will have 100% generated UI, offline support, built in social login and reposting, profile import and friend invite, e-commerce capabilities, image galleries and a lot more, without newly christened developer lifting a finger. For professionals these apps are a great starting point to modify our templates, views, and to start experimenting with app networking, without being bogged down with the usual build up of the core app functionality. 
