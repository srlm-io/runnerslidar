'use strict';

console.log('Starting controller');

var broadcastPeriod = 50;
var countdownDefault = 6;
var secondsOfRecording = 5;
//---------------------------------
var recording = false;

var socket = require('socket.io-client')('http://hackathon.srlm.io/controller');
//var socket = require('socket.io-client')('http://localhost:8080/controller');

var mraa = require('mraa');
var _ = require('lodash');

socket.on('error', function (err) {
    console.log('socket error: ' + err);
});

socket.on('connect', function () {
    console.log('Connected to server!');
});

socket.on('disconnect', function () {
    console.log('Lost socket connection');
});

var broadcast = false;

function broadcastSimulatedData() {
    var counter = 0;
    console.log('starting broadcast');
    return setInterval(function () {
        // Generate some interesting squiggles
        var value = Math.sin((counter++ + Math.random()) / 10) * 0.75 + (Math.random() / 4) + 0.75;
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

    broadcast = true;

    var broadcastInterval = broadcastSimulatedData();  // SIMU

    setTimeout(function () {

        broadcast = false;

        clearInterval(broadcastInterval); // SIMU

        socket.emit('control', {
            countdown: null,
            active: false
        });
        recording = false;
        console.log('done with broadcast');

    }, secondsOfRecording * 1000);
}

function startRecording() {
    console.log('starting recording');
    recording = true;
    var countdown = countdownDefault;

    var interval = setInterval(function () {
        countdown = countdown - 1;
        if (countdown !== 0) {
            console.log('countdown ' + countdown);
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

(function () {
    var button = new mraa.Gpio(36); // GP14
    button.dir(mraa.DIR_IN);

    //button.isr(mraa.EDGE_RISING, function () {
    //    console.log('button pressed');
    //    if (recording === false) {
    //        startRecording();
    //    }
    //});

    setInterval(function () {
        if (button.read() === 1 && recording === false) {
            startRecording();
        }
    }, 100);


})();

var spawn = require('child_process').spawn;
var child_process = require('child_process');
var readline = require('readline');
var proc = spawn('../lidar/a.out');
readline.createInterface({
    input: proc.stdout,
    terminal: false
}).on('line', function (line) {
    //console.log(line);
    if (broadcast === true) {
        var data = JSON.parse(line);
        socket.emit('data', data);
    }
});


sensor.stderr.on('data', function (data) {
    console.log(data);
});

sensor.on('close', function (code) {
    console.log('LIDAR sensor closed: ' + code);
});







