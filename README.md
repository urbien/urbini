urbini
======

Urbien is building a new network, network of apps. Mobile apps. Mobile web apps. 
There is a great debate raging on the web on whether to build HTML5 or native apps. There is not question in our minds. Web will ultimately win. And we hope Urbini will make this day come sooner. There is a great innovation happening in Javascript land lately. Backbone and other MVC framewoks are drastically changing the way we build Web apps. Require.js and other AMD loaders emerged to address the greater weight and complexity of Web apps. And UI frameworks, like Jquery Mobile lift all apps to the decent usability level. These are the major forces, while many amazing plugins exist, like the masonry (isotope, infinity, etc.), mobiscroll, and others. 

While these frameworks help, the complexity of putting together all the pieces has gone up 10x times. And the major problem has not been solved. How do we make web apps catch up with native. The first thing we need to achieve is bootstrapping the new much fatter client, the second, we must cache it persistently and do not let browser wipe it out. Then we need to find a way to incrementally upgrade the app, without user noticing. And then the big task comes in, how do we make the app responsive? The answer to this question is - we paint from the local data store, like native apps do. And this leads us to the use of IndexedDB (immature) and WebSQL (mature but deprecated). We need to sync the data between the web site and local db and do it efficiently. We need to upgrade the local db schema gradually and in the way user does not notice it. And we gotta keep away from the UI thread, as much as possible, since Javascript UI is singlethreaded. 

We have been solving all these problems and some more (e.g. MVC models creation and evolution) at Urbien and we wanted to give back to the community. We think of Urbini as a first ever distro for Javascript. A boot loader, a packager, build tools, and web db sync on top. As every distro we may have offened some people, as we made choices to preintegrate certain packages and not their, possible superior, alternatives. Please bear with us. We will try to add flexibility to the packaging process to satisfy your needs. 

Please join us in this amazing journey of taking back the Web.

Gene, Ellen, Jacob, Mark, Simon and the rest of Urbien team.
