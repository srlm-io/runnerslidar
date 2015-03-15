// Declare app level module which depends on views, and components
angular
    .module('myApp', [
        'ui.router',
        'btford.socket-io',
        'myApp.page'
    ])
    .factory('socket', function (socketFactory) {
        console.log('Setting up socket.io');
        return socketFactory();
    })
    .config(function ($urlRouterProvider) {

        // Use $urlRouterProvider to configure any redirects (when) and invalid urls (otherwise).
        $urlRouterProvider.otherwise('/');
    });


