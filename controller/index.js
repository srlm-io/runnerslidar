'use strict';

var broadcastPeriod = 50;
var countdownDefault = 6;
var secondsOfRecording = 5;

//var socket = require('socket.io-client')('http://hackathon.srlm.io/controller');
var socket = require('socket.io-client')('http://localhost:8080/controller');


socket.on('error', function (err) {
    console.log('error: ' + err);
});

socket.on('connect', function () {
    console.log('Connected to server!');
});

socket.on('disconnect', function () {
    console.log('Lost socket connection');
});


function broadcastData() {
    var counter = 0;
    return setInterval(function () {
        // Generate some interesting squiggles
        var value = Math.sin((counter++ + Math.random()) / 10) * 0.75 + (Math.random() / 4) + 0.75;
        console.log('broadcasting...');
        socket.emit('data', {
            time: (new Date()).getTime(),
            speed: value
        });
    }, broadcastPeriod);
}

function record() {
    socket.emit('control', {
        countdown: null,
        active: true
    });

    var broadcast = broadcastData();

    setTimeout(function () {
        clearInterval(broadcast);

        socket.emit('control', {
            countdown: null,
            active: false
        });

    }, secondsOfRecording * 1000);
}

function startRecording() {
    var countdown = countdownDefault;

    var interval = setInterval(function () {
        countdown = countdown - 1;
        if (countdown !== 0) {
            socket.emit('control', {
                countdown: countdown,
                active: false
            });
        } else {
            clearInterval(interval);
            record();
        }
    }, 1000);
}

setTimeout(startRecording, 500);


