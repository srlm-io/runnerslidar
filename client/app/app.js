// Declare app level module which depends on views, and components
angular
    .module('myApp', [
        'ui.router',
        'btford.socket-io',
        'myApp.page'
    ])
    .factory('socket', function ($interval, socketFactory) {
        console.log('Setting up socket.io');
        if (window.io) {
            return socketFactory();
        } else {
            // Return a dummy object for display purposes
            return {
                on: function (key, callback) {
                    var counter = 0;
                    $interval(function () {
                        // Generate some interesting squiggles
                        var value = Math.sin((counter++ + Math.random()) / 10) * 0.75 + (Math.random() / 4) + 0.75;
                        callback({
                            time: (new Date()).getTime(),
                            speed: value
                        });
                    }, 50);
                }
            };
        }
    })
    .config(function ($urlRouterProvider) {

        // Use $urlRouterProvider to configure any redirects (when) and invalid urls (otherwise).
        $urlRouterProvider.otherwise('/');
    });


