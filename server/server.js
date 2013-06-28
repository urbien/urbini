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
    serverUrl = 'http://mark.obval.com/urbien/',
    apiUrl = serverUrl + 'api/v1/',
    statusUpdate = serverUrl + 'push';


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
    return dfd.promise;
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

  utils.get(apiUrl + 'PushEndpoint?' + utils.getQueryString({endpoint: endpoint})).then(function(data) {
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

function isLobbyRoom(name) {
  return /^l_/.test(name);
};

function isPublicRoom(name) {
  return !isPrivateRoom(name) && !isLobbyRoom(name);
};

function getStatus(client) {
  var info = clientInfo[client.id],
      rooms = info && info.uri ? getUserRooms(info.uri) : [],
      privateRooms = _.filter(rooms, isPrivateRoom),
      lobbies = _.filter(rooms, isLobbyRoom);

  if (!rooms || !rooms.length)
    return 'Away';
  else if (privateRooms && privateRooms.length)
    return 'InPrivateRoom';
  else
    return lobbies.length ? 'InLobby' : 'InPublicRoom';
};

function onErrorFunc(type) {
  return function(e) {
    console.log(type, e);
  }
}

var updateStatus = _.debounce(function(client) {
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

    utils.post(apiUrl + 'e/PushEndpoint?' + queryString).then(function(data) {
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
  }, function() {
    var info = clientInfo[client.id];
    if (info && !info.endpoint) {
      utils.post(statusUpdate + '?' + utils.getQueryString({
        fromUri: info.uri,
        appUri: info.appUri,
        status: status
      }));
    }
    else
      onErrorFunc("failed to update client status on app server1")();
  });
}, 3000, true);

function getUserRooms(uri, type) {
  // get the unique set of room names that this client is in, and where he's awake
  var roomNames,
  awake = _.filter(_.values(clientInfo), function(info) {
    return info.uri === uri && info.awake;
  });

  if (!awake.length)
    return [];

  roomNames = _.unique(_.flatten(_.pluck(awake, 'rooms')));

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
    var info = clientInfo[client.id];
    if (info) {
      info.awake = false;
      updateStatus(client);
    }
  });

  client.on('wake', function() {
    var info = clientInfo[client.id];
    if (info) {
      info.awake = true;
      updateStatus(client);
    }
  });

  client.on('join', function (name) {
    var info = clientInfo[client.id];
    if (info) {
      info.awake = true;
      info.rooms = (info && info.rooms) || [];
      info.rooms.push(name);
    }

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
        name = name.slice(1);
        io.sockets.in(name).emit('left', {
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
