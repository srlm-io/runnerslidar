'use strict';

var Hapi = require('hapi');
var Good = require('good');

var server = new Hapi.Server();
server.connection({port: 8080});


server.route({
    method: 'GET',
    path: '/',
    handler: {
        file: '../client/app/index.html'
    }
});

server.route({
    method: 'GET',
    path: '/{param*}',
    handler: {
        directory: {
            path: '../client/app'
        }
    }
});


var io = require('socket.io').listen(server.listener, {log: false});

var totalClients = 0;
var clients = io.of('/client');
clients.on('connection', function (socket) {
    totalClients++;
    console.log('/client connected (' + io.engine.clientsCount + '/' + totalClients + ')');
});

io.of('/controller').on('connection', function (socket) {
    console.log('/controller connected');
    socket.on('data', function (data) {
        clients.emit('data', data);
    });

    socket.on('control', function (data) {
        console.log('/controller got control ' + JSON.stringify(data));
        clients.emit('control', data);
    })
});


//var counter = 0;
//
//setInterval(function () {
//
//    // Generate some interesting squiggles
//    var value = Math.sin((counter++ + Math.random()) / 10) * 0.75 + (Math.random() / 4) + 0.75;
//
//    io.sockets.emit('data', {
//        time: (new Date()).getTime(),
//        speed: value
//    });
//}, 50);

server.register({
    register: Good,
    options: {
        reporters: [{
            reporter: require('good-console'),
            args: [{log: '*', response: '*'}]
        }]
    }
}, function (err) {
    if (err) {
        throw err; // something bad happened loading the plugin
    }

    server.start(function () {
        server.log('info', 'Server running at: ' + server.info.uri);
    });
});