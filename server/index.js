'use strict';

var Hapi = require('hapi');
var Good = require('good');

var server = new Hapi.Server();
server.connection({port: 3000});


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
io.sockets.on('connection', function (socket) {
    console.log('got connection!');
    socket.on('action', function (name, cb) {
        console.log('got action!');
    });
});


var counter = 0;

setInterval(function () {

    // Generate some interesting squiggles
    var value = Math.sin((counter++ + Math.random()) / 10) * 0.75 + (Math.random() / 4) + 0.75;

    io.sockets.emit('data', {
        time: (new Date()).getTime(),
        speed: value
    });
}, 50);

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