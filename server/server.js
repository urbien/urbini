/*global console*/
var config = require('getconfig'),
    uuid = require('node-uuid'),
    _ = require('underscore'),
    utils = require('./utils'),
    io = require('socket.io').listen(config.server.port),
    Q = require('q'),
    //  events = ['message', 'join', 'disconnect', 'leave', 'create'],
    clientInfo = {},
    endpointDeferreds = {
      firefox: {},
      chrome: {}
    },
    apiUrl = 'http://mark.obval.com/urbien/api/v1/';

function updateEndpoint(endpoint) {
  // to ensure the next call to getEndpoint gets the updated one via the new promise
  var dfd = endpointDeferreds[endpoint.browser.toLowerCase()][endpoint.endpoint] = Q.defer();
  dfd.resolve(endpoint);
}

function getEndpoint(client) {
  var info = clientInfo[client.id], 
      browser, 
      endpoint, 
      dfd;

  if (!info) {
    dfd = Q.defer();
    dfd.reject();
    return dfd.promise();
  }

  endpoint = info.endpoint;
  browser = info.browser.toLowerCase();
  dfd = endpointDeferreds[browser][endpoint];
  if (dfd)
    return dfd.promise;

  dfd = endpointDeferreds[browser][endpoint] = Q.defer();   
  if (!endpoint) {
    dfd.reject();
    return dfd.promise;
  }

  utils.get(apiUrl + 'SimplePushNotificationEndpoint?' + utils.getQueryString({endpoint: endpoint})).then(function(data) {
    try {
      var json = JSON.parse(data);
    } catch(err) {
      dfd.reject();
      return;
    }

    if (json.data)
      dfd.resolve(json.data[0]);
    else
      dfd.reject();
  });

  return dfd.promise;
};

function isPrivateRoom(name) {
  return /^p_/.test(name);
};

function isPublicRoom(name) {
  return !isPrivateRoom(name);
};

function getStatus(client) {
  var info = clientInfo[client.id],
      rooms = info && info.uri ? getUserRooms(info.uri) : [],
      privateRooms = _.filter(rooms, isPrivateRoom);

  if (!rooms || !rooms.length)
    return 'Away';
  else if (privateRooms && privateRooms.length)
    return 'InPrivateRoom';
  else
    return 'InPublicRoom';
};

function onErrorFunc(type) {
  return function(e) {
    console.log(type, e);
  }
}

function updateStatus(client) {
  var status = getStatus(client);

  // this gets cached, so it doesn't request it every time
  getEndpoint(client).then(function(endpoint) {
    if (!endpoint || endpoint.status == status)
      return;

    var queryString = utils.getQueryString({
      _uri: endpoint._uri,
      status: status,
      $returnMade: true
    });

    utils.post(apiUrl + 'e/SimplePushNotificationEndpoint?' + queryString).then(function(data) {
      try {
        var json = JSON.parse(data);
      } catch (err) {
        return;
      }

      if (json)
        updateEndpoint(json);
      else
        dfd.reject();
    }, onErrorFunc("failed to update client status on app server1"));
  }, onErrorFunc("failed to update client status on app server2"));
};

function getUserRooms(uri, type) {
  // get the unique set of room names that this client is in, and where he's awake
  var roomNames,
  awake = _.filter(_.values(clientInfo), function(info) {
    return info.uri === uri && info.awake;
  });

  if (!awake.length)
    return [];

  roomNames = _.filter(_.unique(_.flatten(_.pluck(awake, 'rooms'))));

  switch (type) {
  case undefined:
    return roomNames;
  case 'private':
    return _.filter(roomNames, isPrivateRoom);
  case 'public':
    return _.filter(roomNames, isPublicRoom);
  default: 
    throw new Error('unsupported room type ' + type);
  }
};

io.set("origins","*:*");
io.sockets.on('connection', function (client) {
  // pass a message
  client.on('info', function(info) {
    info.isClient = !info.isAgent;
    clientInfo[client.id] = info;
    getEndpoint(client);
  });

  client.on('message', function (details) {
    var otherClient = io.sockets.sockets[details.to];
    if (!otherClient)
      return;

    delete details.to;
    details.from = client.id;
    otherClient.emit('message', details);
  });

  client.on('sleep', function(details) {
    clientInfo[client.id].awake = false;
    updateStatus(client);
  });

  client.on('wake', function() {
    clientInfo[client.id].awake = true;
    updateStatus(client);
  });

  client.on('join', function (name) {
    var info = clientInfo[client.id];
    info.awake = true;
    info.rooms = (info && info.rooms) || [];
    info.rooms.push(name);

    client.join(name);
    io.sockets.in(name).emit('joined', {
      room: name,
      id: client.id
    });

    updateStatus(client);
  });

  function leave() {
    var rooms = io.sockets.manager.roomClients[client.id];  
    for (var name in rooms) {
      if (name) {
        io.sockets.in(name.slice(1)).emit('left', {
          room: name,
          id: client.id
        });

        var info = clientInfo[client.id];
        if (info && info.rooms) {
          var rIdx = info.rooms.indexOf(name);
          if (rIdx >= 0)
            info.rooms.splice(rIdx, 1);
        }
      }
    }

    // for (var i = 0; i < events.length; i++) {
    // client.removeEventListener(events[i]);
    // }

    //client.removeAllListeners();
    //delete io.sockets.sockets[client.id];
    updateStatus(client);
  };

  client.on('disconnect', leave);
  client.on('leave', leave);

  client.on('create', function (name, cb) {
    if (arguments.length == 2) {
      cb = (typeof cb == 'function') ? cb : function () {};
      name = name || uuid();
    } else {
      cb = name;
      name = uuid();
    }
    // check if exists
    if (io.sockets.clients(name).length) {
      cb('taken');
    } else {
      client.join(name);
      if (cb) cb(null, name);
    }
  });
});

if (config.uid) process.setuid(config.uid);
